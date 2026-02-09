using System.Security.Cryptography;
using System.Text;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IA2AService
{
    Task<AgentCard> RegisterAgentAsync(string ownerId, string agentKey, string name, string? description, string? inputSchema, string? outputSchema, string? scopes);
    Task<List<AgentCard>> GetAgentsAsync(string? ownerId = null);
    Task<AgentCard?> GetAgentByKeyAsync(string agentKey);
    Task<A2AConsent> GrantConsentAsync(string userId, int fromAgentId, int toAgentId, string scopes, DateTime? expiresAt = null);
    Task RevokeConsentAsync(string userId, int consentId);
    Task<List<A2AConsent>> GetConsentsAsync(string userId);
    Task<A2ATask> CreateTaskAsync(string userId, int fromAgentId, int toAgentId, string artifactType, string dataJson);
    Task<A2ATask> UpdateTaskStatusAsync(int taskId, A2ATaskStatus status, string? errorMessage = null);
    Task<A2AArtifact> AddArtifactAsync(int taskId, string artifactType, string dataJson, string direction = "response");
    Task<A2ATask?> GetTaskAsync(string taskUid);
    Task<List<A2ATask>> GetTasksAsync(string userId, int page = 1, int pageSize = 20);
    Task<List<A2AArtifact>> GetArtifactsAsync(int taskId);
    Task<string> GenerateClientCredentialsAsync(int agentId);
    Task<AgentCard?> ValidateClientCredentialsAsync(string clientId, string clientSecret);
}

public class A2AService : IA2AService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<A2AService> _logger;

    public A2AService(AiDevRequestDbContext context, ILogger<A2AService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<AgentCard> RegisterAgentAsync(
        string ownerId, string agentKey, string name, string? description,
        string? inputSchema, string? outputSchema, string? scopes)
    {
        var existing = await _context.AgentCards.FirstOrDefaultAsync(a => a.AgentKey == agentKey);
        if (existing != null)
            throw new InvalidOperationException($"Agent key '{agentKey}' is already registered.");

        var clientId = $"a2a_{agentKey}_{Guid.NewGuid():N}"[..40];

        var agent = new AgentCard
        {
            AgentKey = agentKey,
            Name = name,
            Description = description,
            OwnerId = ownerId,
            InputSchemaJson = inputSchema,
            OutputSchemaJson = outputSchema,
            Scopes = scopes,
            ClientId = clientId,
        };

        _context.AgentCards.Add(agent);

        _context.A2AAuditLogs.Add(new A2AAuditLog
        {
            Action = "agent_registered",
            UserId = ownerId,
            DetailJson = System.Text.Json.JsonSerializer.Serialize(new { agentKey, name }),
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("Agent registered: {AgentKey} by {OwnerId}", agentKey, ownerId);
        return agent;
    }

    public async Task<List<AgentCard>> GetAgentsAsync(string? ownerId = null)
    {
        var query = _context.AgentCards.Where(a => a.IsActive);
        if (ownerId != null)
            query = query.Where(a => a.OwnerId == ownerId);
        return await query.OrderBy(a => a.Name).ToListAsync();
    }

    public async Task<AgentCard?> GetAgentByKeyAsync(string agentKey)
    {
        return await _context.AgentCards.FirstOrDefaultAsync(a => a.AgentKey == agentKey && a.IsActive);
    }

    public async Task<A2AConsent> GrantConsentAsync(
        string userId, int fromAgentId, int toAgentId, string scopes, DateTime? expiresAt = null)
    {
        // Verify both agents exist
        var fromAgent = await _context.AgentCards.FindAsync(fromAgentId)
            ?? throw new InvalidOperationException("Source agent not found.");
        var toAgent = await _context.AgentCards.FindAsync(toAgentId)
            ?? throw new InvalidOperationException("Target agent not found.");

        // Revoke any existing consent for this pair
        var existing = await _context.A2AConsents
            .FirstOrDefaultAsync(c => c.UserId == userId && c.FromAgentId == fromAgentId && c.ToAgentId == toAgentId && c.IsGranted);

        if (existing != null)
        {
            existing.IsGranted = false;
            existing.RevokedAt = DateTime.UtcNow;
        }

        var consent = new A2AConsent
        {
            UserId = userId,
            FromAgentId = fromAgentId,
            ToAgentId = toAgentId,
            Scopes = scopes,
            IsGranted = true,
            ExpiresAt = expiresAt,
        };

        _context.A2AConsents.Add(consent);

        _context.A2AAuditLogs.Add(new A2AAuditLog
        {
            FromAgentId = fromAgentId,
            ToAgentId = toAgentId,
            UserId = userId,
            Action = "consent_granted",
            DetailJson = System.Text.Json.JsonSerializer.Serialize(new { scopes, fromAgent = fromAgent.AgentKey, toAgent = toAgent.AgentKey }),
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("Consent granted: {From} → {To} for user {UserId}",
            fromAgent.AgentKey, toAgent.AgentKey, userId);
        return consent;
    }

    public async Task RevokeConsentAsync(string userId, int consentId)
    {
        var consent = await _context.A2AConsents.FindAsync(consentId)
            ?? throw new InvalidOperationException("Consent not found.");

        if (consent.UserId != userId)
            throw new InvalidOperationException("Not authorized to revoke this consent.");

        consent.IsGranted = false;
        consent.RevokedAt = DateTime.UtcNow;

        _context.A2AAuditLogs.Add(new A2AAuditLog
        {
            FromAgentId = consent.FromAgentId,
            ToAgentId = consent.ToAgentId,
            UserId = userId,
            Action = "consent_revoked",
        });

        await _context.SaveChangesAsync();
    }

    public async Task<List<A2AConsent>> GetConsentsAsync(string userId)
    {
        return await _context.A2AConsents
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.GrantedAt)
            .ToListAsync();
    }

    public async Task<A2ATask> CreateTaskAsync(
        string userId, int fromAgentId, int toAgentId, string artifactType, string dataJson)
    {
        // Verify consent
        var consent = await _context.A2AConsents
            .FirstOrDefaultAsync(c => c.UserId == userId
                && c.FromAgentId == fromAgentId
                && c.ToAgentId == toAgentId
                && c.IsGranted
                && (c.ExpiresAt == null || c.ExpiresAt > DateTime.UtcNow));

        if (consent == null)
            throw new InvalidOperationException("No valid consent found for this agent pair. User must grant consent first.");

        var taskUid = Guid.NewGuid().ToString();

        var task = new A2ATask
        {
            TaskUid = taskUid,
            FromAgentId = fromAgentId,
            ToAgentId = toAgentId,
            UserId = userId,
            ConsentId = consent.Id,
            Status = A2ATaskStatus.Submitted,
        };

        _context.A2ATasks.Add(task);
        await _context.SaveChangesAsync();

        // Add request artifact
        var artifact = new A2AArtifact
        {
            TaskId = task.Id,
            ArtifactType = artifactType,
            DataJson = dataJson,
            Direction = "request",
        };

        _context.A2AArtifacts.Add(artifact);

        _context.A2AAuditLogs.Add(new A2AAuditLog
        {
            TaskId = task.Id,
            FromAgentId = fromAgentId,
            ToAgentId = toAgentId,
            UserId = userId,
            Action = "task_created",
            DetailJson = System.Text.Json.JsonSerializer.Serialize(new { taskUid, artifactType }),
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("A2A task created: {TaskUid} from agent {From} to agent {To}",
            taskUid, fromAgentId, toAgentId);
        return task;
    }

    public async Task<A2ATask> UpdateTaskStatusAsync(int taskId, A2ATaskStatus status, string? errorMessage = null)
    {
        var task = await _context.A2ATasks.FindAsync(taskId)
            ?? throw new InvalidOperationException("Task not found.");

        task.Status = status;
        task.UpdatedAt = DateTime.UtcNow;
        task.ErrorMessage = errorMessage;

        if (status is A2ATaskStatus.Completed or A2ATaskStatus.Failed)
            task.CompletedAt = DateTime.UtcNow;

        _context.A2AAuditLogs.Add(new A2AAuditLog
        {
            TaskId = taskId,
            FromAgentId = task.FromAgentId,
            ToAgentId = task.ToAgentId,
            UserId = task.UserId,
            Action = $"task_{status.ToString().ToLower()}",
        });

        await _context.SaveChangesAsync();
        return task;
    }

    public async Task<A2AArtifact> AddArtifactAsync(
        int taskId, string artifactType, string dataJson, string direction = "response")
    {
        var task = await _context.A2ATasks.FindAsync(taskId)
            ?? throw new InvalidOperationException("Task not found.");

        var artifact = new A2AArtifact
        {
            TaskId = taskId,
            ArtifactType = artifactType,
            DataJson = dataJson,
            Direction = direction,
        };

        _context.A2AArtifacts.Add(artifact);
        await _context.SaveChangesAsync();
        return artifact;
    }

    public async Task<A2ATask?> GetTaskAsync(string taskUid)
    {
        return await _context.A2ATasks.FirstOrDefaultAsync(t => t.TaskUid == taskUid);
    }

    public async Task<List<A2ATask>> GetTasksAsync(string userId, int page = 1, int pageSize = 20)
    {
        return await _context.A2ATasks
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<A2AArtifact>> GetArtifactsAsync(int taskId)
    {
        return await _context.A2AArtifacts
            .Where(a => a.TaskId == taskId)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<string> GenerateClientCredentialsAsync(int agentId)
    {
        var agent = await _context.AgentCards.FindAsync(agentId)
            ?? throw new InvalidOperationException("Agent not found.");

        var secret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var hash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(secret)));

        agent.ClientSecretHash = hash;
        agent.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return secret;
    }

    public async Task<AgentCard?> ValidateClientCredentialsAsync(string clientId, string clientSecret)
    {
        var agent = await _context.AgentCards.FirstOrDefaultAsync(a => a.ClientId == clientId && a.IsActive);
        if (agent?.ClientSecretHash == null) return null;

        var hash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(clientSecret)));
        return hash == agent.ClientSecretHash ? agent : null;
    }
}

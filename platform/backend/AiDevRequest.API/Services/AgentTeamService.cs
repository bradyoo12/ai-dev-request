using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AiDevRequest.API.Services;

public interface IAgentTeamService
{
    Task<List<AgentTeam>> GetUserTeamsAsync(string userId);
    Task<AgentTeam?> GetByIdAsync(Guid id);
    Task<AgentTeam> CreateAsync(AgentTeam team);
    Task<AgentTeam?> UpdateAsync(Guid id, AgentTeam update);
    Task<bool> DeleteAsync(Guid id);
    Task<AgentTeam> CreateFromTemplateAsync(string template, string userId);
    Task<AgentTeam?> SpawnExecutionAsync(Guid teamId, Guid devRequestId);
    Task<List<AgentTeam>> GetPublicTeamsAsync(string? search);
    Task<AgentTeam?> ForkTeamAsync(Guid id, string userId);
}

public class AgentTeamService : IAgentTeamService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<AgentTeamService> _logger;

    public AgentTeamService(AiDevRequestDbContext context, ILogger<AgentTeamService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<AgentTeam>> GetUserTeamsAsync(string userId)
    {
        return await _context.AgentTeams
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();
    }

    public async Task<AgentTeam?> GetByIdAsync(Guid id)
    {
        return await _context.AgentTeams.FindAsync(id);
    }

    public async Task<AgentTeam> CreateAsync(AgentTeam team)
    {
        team.Id = Guid.NewGuid();
        team.CreatedAt = DateTime.UtcNow;
        team.UpdatedAt = DateTime.UtcNow;

        _context.AgentTeams.Add(team);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Agent team created: {Name} by user {UserId}", team.Name, team.UserId);
        return team;
    }

    public async Task<AgentTeam?> UpdateAsync(Guid id, AgentTeam update)
    {
        var existing = await _context.AgentTeams.FindAsync(id);
        if (existing == null) return null;

        existing.Name = update.Name;
        existing.Description = update.Description;
        existing.Strategy = update.Strategy;
        existing.MembersJson = update.MembersJson;
        existing.Template = update.Template;
        existing.IsPublic = update.IsPublic;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Agent team updated: {Id} - {Name}", id, existing.Name);
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var team = await _context.AgentTeams.FindAsync(id);
        if (team == null) return false;

        _context.AgentTeams.Remove(team);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Agent team deleted: {Id} - {Name}", id, team.Name);
        return true;
    }

    public async Task<AgentTeam> CreateFromTemplateAsync(string template, string userId)
    {
        var (name, description, members, strategy) = template switch
        {
            "full-stack" => (
                "Full-Stack Team",
                "Frontend + Backend + Testing agents working in parallel",
                JsonSerializer.Serialize(new object[]
                {
                    new Dictionary<string, string> { ["role"] = "frontend", ["skillType"] = "frontend", ["framework"] = "react" },
                    new Dictionary<string, string> { ["role"] = "backend", ["skillType"] = "backend", ["framework"] = "dotnet" },
                    new Dictionary<string, string> { ["role"] = "testing", ["skillType"] = "test", ["testType"] = "unit+e2e" },
                }),
                "parallel"
            ),
            "frontend-only" => (
                "Frontend Team",
                "UI + Styling + Testing agents for frontend work",
                JsonSerializer.Serialize(new object[]
                {
                    new Dictionary<string, string> { ["role"] = "ui-developer", ["skillType"] = "frontend", ["framework"] = "react" },
                    new Dictionary<string, string> { ["role"] = "testing", ["skillType"] = "test", ["testType"] = "unit" },
                    new Dictionary<string, string> { ["role"] = "reviewer", ["skillType"] = "review", ["reviewType"] = "code-review" },
                }),
                "pipeline"
            ),
            "api-only" => (
                "API Team",
                "Backend API + Database + Testing agents",
                JsonSerializer.Serialize(new object[]
                {
                    new Dictionary<string, string> { ["role"] = "api-developer", ["skillType"] = "backend", ["framework"] = "dotnet" },
                    new Dictionary<string, string> { ["role"] = "testing", ["skillType"] = "test", ["testType"] = "integration" },
                    new Dictionary<string, string> { ["role"] = "docs", ["skillType"] = "docs", ["docType"] = "openapi" },
                }),
                "sequential"
            ),
            "review-team" => (
                "Review Team",
                "Multi-agent code review with security, quality, and performance checks",
                JsonSerializer.Serialize(new object[]
                {
                    new Dictionary<string, string> { ["role"] = "security-reviewer", ["skillType"] = "review", ["reviewType"] = "security" },
                    new Dictionary<string, string> { ["role"] = "quality-reviewer", ["skillType"] = "review", ["reviewType"] = "quality" },
                    new Dictionary<string, string> { ["role"] = "performance-reviewer", ["skillType"] = "review", ["reviewType"] = "performance" },
                }),
                "parallel"
            ),
            _ => (
                "Custom Team",
                "Custom agent team",
                "[]",
                "parallel"
            ),
        };

        var team = new AgentTeam
        {
            UserId = userId,
            Name = name,
            Description = description,
            Strategy = strategy,
            MembersJson = members,
            Template = template,
        };

        return await CreateAsync(team);
    }

    public async Task<AgentTeam?> SpawnExecutionAsync(Guid teamId, Guid devRequestId)
    {
        var team = await _context.AgentTeams.FindAsync(teamId);
        if (team == null) return null;

        team.Status = "running";
        team.ExecutionCount++;
        team.UpdatedAt = DateTime.UtcNow;

        // Create a parallel orchestration for this team execution
        var orchestration = new ParallelOrchestration
        {
            DevRequestId = devRequestId,
            Status = "running",
            StartedAt = DateTime.UtcNow,
        };

        // Parse members and create subagent tasks
        try
        {
            using var doc = JsonDocument.Parse(team.MembersJson);
            var members = doc.RootElement.EnumerateArray().ToList();
            orchestration.TotalTasks = members.Count;

            _context.ParallelOrchestrations.Add(orchestration);
            await _context.SaveChangesAsync();

            foreach (var member in members)
            {
                var role = member.TryGetProperty("role", out var r) ? r.GetString() ?? "agent" : "agent";
                var skillType = member.TryGetProperty("skillType", out var st) ? st.GetString() ?? "general" : "general";

                var task = new SubagentTask
                {
                    DevRequestId = devRequestId,
                    ParentOrchestrationId = orchestration.Id,
                    TaskType = skillType,
                    Name = $"{role} agent",
                    Description = $"Team member: {role} ({skillType})",
                    ContextJson = member.GetRawText(),
                    Status = "pending",
                };

                _context.SubagentTasks.Add(task);
            }

            team.LastExecutionJson = JsonSerializer.Serialize(new
            {
                orchestrationId = orchestration.Id,
                devRequestId,
                totalTasks = orchestration.TotalTasks,
                completedTasks = 0,
                failedTasks = 0,
                startedAt = DateTime.UtcNow,
            });

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to spawn team execution for team {TeamId}", teamId);
            team.Status = "failed";
            await _context.SaveChangesAsync();
        }

        return team;
    }

    public async Task<List<AgentTeam>> GetPublicTeamsAsync(string? search)
    {
        var query = _context.AgentTeams.Where(t => t.IsPublic);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(searchLower) ||
                (t.Description != null && t.Description.ToLower().Contains(searchLower)));
        }

        return await query
            .OrderByDescending(t => t.ExecutionCount)
            .ToListAsync();
    }

    public async Task<AgentTeam?> ForkTeamAsync(Guid id, string userId)
    {
        var source = await _context.AgentTeams.FindAsync(id);
        if (source == null) return null;

        var forked = new AgentTeam
        {
            UserId = userId,
            Name = source.Name + " (fork)",
            Description = source.Description,
            Strategy = source.Strategy,
            MembersJson = source.MembersJson,
            Template = source.Template,
            IsPublic = false,
        };

        return await CreateAsync(forked);
    }
}

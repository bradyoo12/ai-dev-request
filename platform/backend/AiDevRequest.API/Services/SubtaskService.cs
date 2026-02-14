using System.Text.Json;
using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISubtaskService
{
    Task<List<SubtaskDto>> GetSubtasksAsync(Guid requestId);
    Task<SubtaskDto> CreateSubtaskAsync(Guid requestId, string userId, CreateSubtaskDto dto);
    Task<List<SubtaskDto>> CreateSubtasksAsync(Guid requestId, string userId, List<CreateSubtaskDto> dtos);
    Task<SubtaskDto?> UpdateSubtaskAsync(Guid requestId, Guid subtaskId, UpdateSubtaskDto dto);
    Task<bool> DeleteSubtaskAsync(Guid requestId, Guid subtaskId);
    Task<int> ApproveAllSubtasksAsync(Guid requestId);
    Task<List<SubtaskDto>> GenerateSubtasksAsync(Guid requestId, string userId);
}

public class SubtaskService : ISubtaskService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<SubtaskService> _logger;

    public SubtaskService(AiDevRequestDbContext db, ILogger<SubtaskService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<SubtaskDto>> GetSubtasksAsync(Guid requestId)
    {
        return await _db.Subtasks
            .Where(s => s.DevRequestId == requestId)
            .OrderBy(s => s.OrderIndex)
            .Select(s => s.ToDto())
            .ToListAsync();
    }

    public async Task<SubtaskDto> CreateSubtaskAsync(Guid requestId, string userId, CreateSubtaskDto dto)
    {
        var maxOrder = await _db.Subtasks
            .Where(s => s.DevRequestId == requestId)
            .MaxAsync(s => (int?)s.OrderIndex) ?? -1;

        var subtask = new Subtask
        {
            DevRequestId = requestId,
            ParentSubtaskId = dto.ParentSubtaskId,
            UserId = userId,
            OrderIndex = dto.OrderIndex >= 0 ? dto.OrderIndex : maxOrder + 1,
            Priority = dto.Priority,
            Title = dto.Title,
            Description = dto.Description,
            EstimatedHours = dto.EstimatedHours,
            DependsOnSubtaskIdsJson = dto.DependencyIds != null
                ? string.Join(",", dto.DependencyIds)
                : null
        };

        _db.Subtasks.Add(subtask);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Subtask created: {SubtaskId} for request {RequestId}", subtask.Id, requestId);

        return subtask.ToDto();
    }

    public async Task<List<SubtaskDto>> CreateSubtasksAsync(Guid requestId, string userId, List<CreateSubtaskDto> dtos)
    {
        var maxOrder = await _db.Subtasks
            .Where(s => s.DevRequestId == requestId)
            .MaxAsync(s => (int?)s.OrderIndex) ?? -1;

        var subtasks = new List<Subtask>();
        for (var i = 0; i < dtos.Count; i++)
        {
            var dto = dtos[i];
            subtasks.Add(new Subtask
            {
                DevRequestId = requestId,
                ParentSubtaskId = dto.ParentSubtaskId,
                UserId = userId,
                OrderIndex = dto.OrderIndex >= 0 ? dto.OrderIndex : maxOrder + i + 1,
                Priority = dto.Priority,
                Title = dto.Title,
                Description = dto.Description,
                EstimatedHours = dto.EstimatedHours,
                DependsOnSubtaskIdsJson = dto.DependencyIds != null
                    ? string.Join(",", dto.DependencyIds)
                    : null
            });
        }

        _db.Subtasks.AddRange(subtasks);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Batch created {Count} subtasks for request {RequestId}", subtasks.Count, requestId);

        return subtasks.Select(s => s.ToDto()).ToList();
    }

    public async Task<SubtaskDto?> UpdateSubtaskAsync(Guid requestId, Guid subtaskId, UpdateSubtaskDto dto)
    {
        var subtask = await _db.Subtasks.FindAsync(subtaskId);
        if (subtask == null || subtask.DevRequestId != requestId)
            return null;

        if (dto.Title != null) subtask.Title = dto.Title;
        if (dto.Description != null) subtask.Description = dto.Description;
        if (dto.EstimatedHours.HasValue) subtask.EstimatedHours = dto.EstimatedHours.Value;
        if (dto.OrderIndex.HasValue) subtask.OrderIndex = dto.OrderIndex.Value;
        if (dto.Priority.HasValue) subtask.Priority = dto.Priority.Value;
        if (dto.Status.HasValue) subtask.Status = dto.Status.Value;
        if (dto.ParentSubtaskId.HasValue) subtask.ParentSubtaskId = dto.ParentSubtaskId.Value;
        if (dto.DependencyIds != null)
            subtask.DependsOnSubtaskIdsJson = string.Join(",", dto.DependencyIds);

        subtask.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Subtask updated: {SubtaskId}", subtaskId);

        return subtask.ToDto();
    }

    public async Task<bool> DeleteSubtaskAsync(Guid requestId, Guid subtaskId)
    {
        var subtask = await _db.Subtasks.FindAsync(subtaskId);
        if (subtask == null || subtask.DevRequestId != requestId)
            return false;

        _db.Subtasks.Remove(subtask);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Subtask deleted: {SubtaskId}", subtaskId);

        return true;
    }

    public async Task<int> ApproveAllSubtasksAsync(Guid requestId)
    {
        var pendingSubtasks = await _db.Subtasks
            .Where(s => s.DevRequestId == requestId && s.Status == SubtaskStatus.Pending)
            .ToListAsync();

        foreach (var subtask in pendingSubtasks)
        {
            subtask.Status = SubtaskStatus.Approved;
            subtask.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return pendingSubtasks.Count;
    }

    public async Task<List<SubtaskDto>> GenerateSubtasksAsync(Guid requestId, string userId)
    {
        var request = await _db.DevRequests.FindAsync(requestId);
        if (request == null)
            throw new InvalidOperationException("Request not found.");

        if (string.IsNullOrEmpty(request.AnalysisResultJson))
            throw new InvalidOperationException("Request has not been analyzed yet.");

        // Parse analysis result to extract requirements for subtask generation
        var analysisData = JsonSerializer.Deserialize<JsonElement>(request.AnalysisResultJson);

        // Generate subtasks based on the analysis requirements
        var subtasksToCreate = new List<Subtask>();
        var requirements = new List<string>();

        // Try to extract requirements from analysis JSON
        if (analysisData.TryGetProperty("requirements", out var reqProp))
        {
            if (reqProp.TryGetProperty("functional", out var funcReqs) && funcReqs.ValueKind == JsonValueKind.Array)
            {
                foreach (var req in funcReqs.EnumerateArray())
                {
                    requirements.Add(req.GetString() ?? "");
                }
            }
        }

        // If no structured requirements, create subtasks from description breakdown
        if (requirements.Count == 0)
        {
            // Create a default set of subtasks based on common development phases
            requirements.AddRange([
                "Setup project scaffolding and configuration",
                "Implement core data models and database schema",
                "Build API endpoints and business logic",
                "Create frontend UI components",
                "Add authentication and authorization",
                "Write tests and validate functionality",
                "Deploy to staging environment"
            ]);
        }

        // Remove existing subtasks for this request before generating new ones
        var existing = await _db.Subtasks
            .Where(s => s.DevRequestId == requestId)
            .ToListAsync();
        if (existing.Count > 0)
        {
            _db.Subtasks.RemoveRange(existing);
        }

        for (var i = 0; i < requirements.Count; i++)
        {
            var req = requirements[i];
            if (string.IsNullOrWhiteSpace(req)) continue;

            subtasksToCreate.Add(new Subtask
            {
                DevRequestId = requestId,
                UserId = userId,
                OrderIndex = i,
                Priority = i,
                Title = req.Length > 500 ? req[..500] : req,
                Description = $"Subtask generated from analysis requirement: {req}",
                EstimatedHours = EstimateHoursForRequirement(req),
                Status = SubtaskStatus.Pending,
                DependsOnSubtaskIdsJson = i > 0
                    ? subtasksToCreate[i - 1].Id.ToString()
                    : null
            });
        }

        _db.Subtasks.AddRange(subtasksToCreate);
        await _db.SaveChangesAsync();

        return subtasksToCreate.Select(s => s.ToDto()).ToList();
    }

    private static decimal EstimateHoursForRequirement(string requirement)
    {
        var lower = requirement.ToLowerInvariant();
        if (lower.Contains("setup") || lower.Contains("config"))
            return 2;
        if (lower.Contains("test") || lower.Contains("validate"))
            return 4;
        if (lower.Contains("deploy") || lower.Contains("staging"))
            return 2;
        if (lower.Contains("auth"))
            return 8;
        if (lower.Contains("api") || lower.Contains("endpoint"))
            return 8;
        if (lower.Contains("ui") || lower.Contains("frontend") || lower.Contains("component"))
            return 8;
        if (lower.Contains("database") || lower.Contains("schema") || lower.Contains("model"))
            return 4;
        return 4; // Default estimate
    }
}

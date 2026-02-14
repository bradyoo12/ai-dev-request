using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IVisualWorkflowService
{
    Task<List<WorkflowAutomation>> GetWorkflowsAsync(string userId);
    Task<WorkflowAutomation?> GetWorkflowByIdAsync(Guid id, string userId);
    Task<WorkflowAutomation> CreateWorkflowAsync(string userId, CreateVisualWorkflowDto dto);
    Task<WorkflowAutomation> UpdateWorkflowAsync(Guid id, string userId, UpdateVisualWorkflowDto dto);
    Task DeleteWorkflowAsync(Guid id, string userId);
    Task<WorkflowAutomation> GenerateFromNaturalLanguageAsync(string userId, string prompt);
    Task<WorkflowAutomationRun> ExecuteWorkflowAsync(Guid workflowId, string userId);
    Task<WorkflowAutomationRun?> GetRunStatusAsync(Guid workflowId, string userId);
}

public class CreateVisualWorkflowDto
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? NodesJson { get; set; }
    public string? EdgesJson { get; set; }
    public string? TriggerType { get; set; }
    public string? TriggerConfigJson { get; set; }
    public string? NaturalLanguagePrompt { get; set; }
}

public class UpdateVisualWorkflowDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? NodesJson { get; set; }
    public string? EdgesJson { get; set; }
    public string? TriggerType { get; set; }
    public string? TriggerConfigJson { get; set; }
    public string? Status { get; set; }
}

public class VisualWorkflowService : IVisualWorkflowService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<VisualWorkflowService> _logger;

    public VisualWorkflowService(AiDevRequestDbContext db, ILogger<VisualWorkflowService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<WorkflowAutomation>> GetWorkflowsAsync(string userId)
    {
        return await _db.WorkflowAutomations
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.UpdatedAt)
            .ToListAsync();
    }

    public async Task<WorkflowAutomation?> GetWorkflowByIdAsync(Guid id, string userId)
    {
        return await _db.WorkflowAutomations
            .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
    }

    public async Task<WorkflowAutomation> CreateWorkflowAsync(string userId, CreateVisualWorkflowDto dto)
    {
        var workflow = new WorkflowAutomation
        {
            UserId = userId,
            Name = dto.Name,
            Description = dto.Description,
            NodesJson = dto.NodesJson ?? "[]",
            EdgesJson = dto.EdgesJson ?? "[]",
            TriggerType = dto.TriggerType ?? "manual",
            TriggerConfigJson = dto.TriggerConfigJson,
            NaturalLanguagePrompt = dto.NaturalLanguagePrompt,
        };

        _db.WorkflowAutomations.Add(workflow);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Workflow created: {WorkflowId} by user {UserId}", workflow.Id, userId);
        return workflow;
    }

    public async Task<WorkflowAutomation> UpdateWorkflowAsync(Guid id, string userId, UpdateVisualWorkflowDto dto)
    {
        var workflow = await _db.WorkflowAutomations.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId)
            ?? throw new InvalidOperationException("Workflow not found.");

        if (dto.Name != null) workflow.Name = dto.Name;
        if (dto.Description != null) workflow.Description = dto.Description;
        if (dto.NodesJson != null) workflow.NodesJson = dto.NodesJson;
        if (dto.EdgesJson != null) workflow.EdgesJson = dto.EdgesJson;
        if (dto.TriggerType != null) workflow.TriggerType = dto.TriggerType;
        if (dto.TriggerConfigJson != null) workflow.TriggerConfigJson = dto.TriggerConfigJson;
        if (dto.Status != null && Enum.TryParse<WorkflowAutomationStatus>(dto.Status, true, out var status))
            workflow.Status = status;

        workflow.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Workflow updated: {WorkflowId}", id);
        return workflow;
    }

    public async Task DeleteWorkflowAsync(Guid id, string userId)
    {
        var workflow = await _db.WorkflowAutomations.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId)
            ?? throw new InvalidOperationException("Workflow not found.");

        _db.WorkflowAutomations.Remove(workflow);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Workflow deleted: {WorkflowId}", id);
    }

    public async Task<WorkflowAutomation> GenerateFromNaturalLanguageAsync(string userId, string prompt)
    {
        _logger.LogInformation("Generating workflow from natural language for user {UserId}", userId);

        // Parse the natural language prompt into workflow nodes and edges
        var nodes = GenerateNodesFromPrompt(prompt);
        var edges = GenerateEdgesFromNodes(nodes);

        var workflow = new WorkflowAutomation
        {
            UserId = userId,
            Name = GenerateWorkflowName(prompt),
            Description = prompt,
            NodesJson = JsonSerializer.Serialize(nodes),
            EdgesJson = JsonSerializer.Serialize(edges),
            TriggerType = DetectTriggerType(prompt),
            NaturalLanguagePrompt = prompt,
        };

        _db.WorkflowAutomations.Add(workflow);
        await _db.SaveChangesAsync();

        _logger.LogInformation("AI-generated workflow created: {WorkflowId}", workflow.Id);
        return workflow;
    }

    public async Task<WorkflowAutomationRun> ExecuteWorkflowAsync(Guid workflowId, string userId)
    {
        var workflow = await _db.WorkflowAutomations.FirstOrDefaultAsync(w => w.Id == workflowId && w.UserId == userId)
            ?? throw new InvalidOperationException("Workflow not found.");

        if (workflow.Status != WorkflowAutomationStatus.Active && workflow.Status != WorkflowAutomationStatus.Draft)
            throw new InvalidOperationException("Workflow must be active or draft to execute.");

        var run = new WorkflowAutomationRun
        {
            WorkflowAutomationId = workflowId,
            UserId = userId,
            Status = WorkflowRunStatus.Running,
            NodesSnapshotJson = workflow.NodesJson,
        };

        _db.WorkflowAutomationRuns.Add(run);
        await _db.SaveChangesAsync();

        // Simulate node execution asynchronously
        _ = Task.Run(async () =>
        {
            try
            {
                var nodes = JsonSerializer.Deserialize<List<WorkflowNodeDto>>(workflow.NodesJson) ?? [];
                var results = new Dictionary<string, object>();

                foreach (var node in nodes)
                {
                    run.CurrentNodeId = node.Id;
                    results[node.Id] = new { status = "running", startedAt = DateTime.UtcNow };
                    run.NodeResultsJson = JsonSerializer.Serialize(results);
                    await _db.SaveChangesAsync();

                    // Simulate processing delay
                    await Task.Delay(500);

                    results[node.Id] = new { status = "completed", startedAt = DateTime.UtcNow, completedAt = DateTime.UtcNow, output = $"Node '{node.Label}' executed successfully" };
                    run.NodeResultsJson = JsonSerializer.Serialize(results);
                    await _db.SaveChangesAsync();
                }

                run.Status = WorkflowRunStatus.Completed;
                run.CompletedAt = DateTime.UtcNow;
                run.CurrentNodeId = null;
                await _db.SaveChangesAsync();

                _logger.LogInformation("Workflow run completed: {RunId}", run.Id);
            }
            catch (Exception ex)
            {
                run.Status = WorkflowRunStatus.Failed;
                run.Error = ex.Message;
                run.CompletedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                _logger.LogError(ex, "Workflow run failed: {RunId}", run.Id);
            }
        });

        return run;
    }

    public async Task<WorkflowAutomationRun?> GetRunStatusAsync(Guid workflowId, string userId)
    {
        return await _db.WorkflowAutomationRuns
            .Where(r => r.WorkflowAutomationId == workflowId && r.UserId == userId)
            .OrderByDescending(r => r.StartedAt)
            .FirstOrDefaultAsync();
    }

    // --- AI Workflow Generation Helpers ---

    private static string GenerateWorkflowName(string prompt)
    {
        var words = prompt.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(5);
        var name = string.Join(" ", words);
        return name.Length > 60 ? name[..60] + "..." : name;
    }

    private static string DetectTriggerType(string prompt)
    {
        var lower = prompt.ToLowerInvariant();
        if (lower.Contains("schedule") || lower.Contains("every") || lower.Contains("cron") || lower.Contains("daily") || lower.Contains("weekly"))
            return "schedule";
        if (lower.Contains("webhook") || lower.Contains("api call") || lower.Contains("http"))
            return "webhook";
        if (lower.Contains("when") || lower.Contains("event") || lower.Contains("trigger") || lower.Contains("submit"))
            return "event";
        return "manual";
    }

    private static List<WorkflowNodeDto> GenerateNodesFromPrompt(string prompt)
    {
        var nodes = new List<WorkflowNodeDto>();
        var lower = prompt.ToLowerInvariant();
        int x = 100, y = 100;

        // Start/trigger node
        nodes.Add(new WorkflowNodeDto { Id = "trigger-1", Type = "trigger", Label = "Start", PositionX = x, PositionY = y, ConfigJson = "{}" });
        y += 120;

        // Detect action keywords
        var actions = new List<(string type, string label)>();

        if (lower.Contains("form") || lower.Contains("submit") || lower.Contains("input"))
            actions.Add(("input", "Receive Form Input"));
        if (lower.Contains("email") || lower.Contains("send") || lower.Contains("notify"))
            actions.Add(("action", "Send Email Notification"));
        if (lower.Contains("database") || lower.Contains("update") || lower.Contains("save") || lower.Contains("store"))
            actions.Add(("action", "Update Database"));
        if (lower.Contains("api") || lower.Contains("external") || lower.Contains("call") || lower.Contains("http") || lower.Contains("webhook"))
            actions.Add(("action", "Call External API"));
        if (lower.Contains("approv") || lower.Contains("review"))
            actions.Add(("approval", "Approval Step"));
        if (lower.Contains("condition") || lower.Contains("if") || lower.Contains("check"))
            actions.Add(("condition", "Check Condition"));
        if (lower.Contains("transform") || lower.Contains("convert") || lower.Contains("map"))
            actions.Add(("transform", "Transform Data"));
        if (lower.Contains("delay") || lower.Contains("wait"))
            actions.Add(("delay", "Wait / Delay"));
        if (lower.Contains("log") || lower.Contains("record"))
            actions.Add(("action", "Log Activity"));

        // If no actions detected, create default steps
        if (actions.Count == 0)
        {
            actions.Add(("action", "Process Request"));
            actions.Add(("action", "Execute Action"));
        }

        int idx = 1;
        foreach (var (type, label) in actions)
        {
            nodes.Add(new WorkflowNodeDto { Id = $"node-{idx}", Type = type, Label = label, PositionX = x, PositionY = y, ConfigJson = "{}" });
            y += 120;
            idx++;
        }

        // End node
        nodes.Add(new WorkflowNodeDto { Id = "end-1", Type = "end", Label = "Complete", PositionX = x, PositionY = y, ConfigJson = "{}" });

        return nodes;
    }

    private static List<WorkflowEdgeDto> GenerateEdgesFromNodes(List<WorkflowNodeDto> nodes)
    {
        var edges = new List<WorkflowEdgeDto>();
        for (int i = 0; i < nodes.Count - 1; i++)
        {
            edges.Add(new WorkflowEdgeDto
            {
                Id = $"edge-{i + 1}",
                Source = nodes[i].Id,
                Target = nodes[i + 1].Id,
                Label = "",
            });
        }
        return edges;
    }
}

// DTOs used internally by the service for JSON serialization
public class WorkflowNodeDto
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "action";
    public string Label { get; set; } = "";
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public string ConfigJson { get; set; } = "{}";
}

public class WorkflowEdgeDto
{
    public string Id { get; set; } = "";
    public string Source { get; set; } = "";
    public string Target { get; set; } = "";
    public string Label { get; set; } = "";
}

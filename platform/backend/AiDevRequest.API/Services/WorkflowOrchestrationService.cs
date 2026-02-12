using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IWorkflowOrchestrationService
{
    Task<WorkflowExecution> StartWorkflowAsync(Guid requestId, string workflowType);
    Task<WorkflowExecution?> GetWorkflowStatusAsync(int executionId);
    Task<WorkflowExecution> RetryStepAsync(int executionId, string stepName);
    Task<WorkflowExecution> CancelWorkflowAsync(int executionId);
    Task<List<WorkflowExecution>> ListWorkflowsAsync(Guid? requestId = null);
    Task<WorkflowMetrics> GetWorkflowMetricsAsync();
}

public class WorkflowStep
{
    public string Name { get; set; } = "";
    public string Status { get; set; } = "pending";
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Error { get; set; }
}

public class WorkflowMetrics
{
    public int TotalWorkflows { get; set; }
    public int CompletedWorkflows { get; set; }
    public int FailedWorkflows { get; set; }
    public int RunningWorkflows { get; set; }
    public double SuccessRate { get; set; }
    public double AvgDurationSeconds { get; set; }
    public List<StepFailureRate> StepFailureRates { get; set; } = new();
}

public class StepFailureRate
{
    public string StepName { get; set; } = "";
    public int FailureCount { get; set; }
    public double FailureRate { get; set; }
}

public class WorkflowOrchestrationService : IWorkflowOrchestrationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<WorkflowOrchestrationService> _logger;

    private static readonly string[] DefaultPipelineSteps =
        ["analysis", "proposal", "generation", "validation", "deployment"];

    public WorkflowOrchestrationService(AiDevRequestDbContext context, ILogger<WorkflowOrchestrationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<WorkflowExecution> StartWorkflowAsync(Guid requestId, string workflowType)
    {
        var steps = DefaultPipelineSteps.Select(name => new WorkflowStep { Name = name }).ToList();

        // Mark the first step as running
        steps[0].Status = "running";
        steps[0].StartedAt = DateTime.UtcNow;

        var execution = new WorkflowExecution
        {
            DevRequestId = requestId,
            WorkflowType = workflowType,
            Status = WorkflowStatus.Running,
            StepsJson = JsonSerializer.Serialize(steps),
        };

        _context.WorkflowExecutions.Add(execution);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Workflow started: {Id} for request {RequestId}, type {Type}",
            execution.Id, requestId, workflowType);

        return execution;
    }

    public async Task<WorkflowExecution?> GetWorkflowStatusAsync(int executionId)
    {
        return await _context.WorkflowExecutions.FindAsync(executionId);
    }

    public async Task<WorkflowExecution> RetryStepAsync(int executionId, string stepName)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(executionId)
            ?? throw new InvalidOperationException("Workflow execution not found.");

        if (execution.Status == WorkflowStatus.Cancelled)
            throw new InvalidOperationException("Cannot retry a cancelled workflow.");

        var steps = JsonSerializer.Deserialize<List<WorkflowStep>>(execution.StepsJson) ?? [];
        var step = steps.FirstOrDefault(s => s.Name == stepName)
            ?? throw new InvalidOperationException($"Step '{stepName}' not found in workflow.");

        if (step.Status != "failed")
            throw new InvalidOperationException($"Step '{stepName}' is not in a failed state.");

        step.Status = "running";
        step.StartedAt = DateTime.UtcNow;
        step.CompletedAt = null;
        step.Error = null;

        execution.Status = WorkflowStatus.Running;
        execution.RetryCount++;
        execution.StepsJson = JsonSerializer.Serialize(steps);
        execution.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Workflow {Id} step '{Step}' retried (retry #{Count})",
            executionId, stepName, execution.RetryCount);

        return execution;
    }

    public async Task<WorkflowExecution> CancelWorkflowAsync(int executionId)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(executionId)
            ?? throw new InvalidOperationException("Workflow execution not found.");

        if (execution.Status is WorkflowStatus.Completed or WorkflowStatus.Cancelled)
            throw new InvalidOperationException("Workflow is already completed or cancelled.");

        var steps = JsonSerializer.Deserialize<List<WorkflowStep>>(execution.StepsJson) ?? [];
        foreach (var step in steps.Where(s => s.Status == "running"))
        {
            step.Status = "cancelled";
            step.CompletedAt = DateTime.UtcNow;
        }

        execution.Status = WorkflowStatus.Cancelled;
        execution.StepsJson = JsonSerializer.Serialize(steps);
        execution.UpdatedAt = DateTime.UtcNow;
        execution.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Workflow {Id} cancelled", executionId);

        return execution;
    }

    public async Task<List<WorkflowExecution>> ListWorkflowsAsync(Guid? requestId = null)
    {
        var query = _context.WorkflowExecutions.AsQueryable();

        if (requestId.HasValue)
            query = query.Where(w => w.DevRequestId == requestId.Value);

        return await query.OrderByDescending(w => w.CreatedAt).Take(100).ToListAsync();
    }

    public async Task<WorkflowMetrics> GetWorkflowMetricsAsync()
    {
        var workflows = await _context.WorkflowExecutions.ToListAsync();

        var total = workflows.Count;
        var completed = workflows.Count(w => w.Status == WorkflowStatus.Completed);
        var failed = workflows.Count(w => w.Status == WorkflowStatus.Failed);
        var running = workflows.Count(w => w.Status == WorkflowStatus.Running);

        var completedWorkflows = workflows.Where(w => w.CompletedAt.HasValue).ToList();
        var avgDuration = completedWorkflows.Count > 0
            ? completedWorkflows.Average(w => (w.CompletedAt!.Value - w.CreatedAt).TotalSeconds)
            : 0;

        // Compute per-step failure rates
        var allSteps = workflows
            .SelectMany(w =>
            {
                var steps = JsonSerializer.Deserialize<List<WorkflowStep>>(w.StepsJson);
                return steps ?? [];
            })
            .ToList();

        var stepFailureRates = allSteps
            .GroupBy(s => s.Name)
            .Select(g => new StepFailureRate
            {
                StepName = g.Key,
                FailureCount = g.Count(s => s.Status == "failed"),
                FailureRate = g.Count() > 0 ? (double)g.Count(s => s.Status == "failed") / g.Count() * 100 : 0
            })
            .OrderByDescending(s => s.FailureCount)
            .ToList();

        return new WorkflowMetrics
        {
            TotalWorkflows = total,
            CompletedWorkflows = completed,
            FailedWorkflows = failed,
            RunningWorkflows = running,
            SuccessRate = total > 0 ? (double)completed / total * 100 : 0,
            AvgDurationSeconds = avgDuration,
            StepFailureRates = stepFailureRates
        };
    }
}

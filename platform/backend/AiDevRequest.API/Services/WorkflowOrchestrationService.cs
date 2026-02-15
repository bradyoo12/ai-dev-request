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
    Task<WorkflowExecution> ExecutePreviewDeploymentStepAsync(int executionId);
    Task<WorkflowExecution> ExecuteAutonomousTestingStepAsync(int executionId);
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
    private readonly IPreviewDeploymentService _previewDeploymentService;
    private readonly ISandboxExecutionService _sandboxExecutionService;
    private readonly ILogStreamService _logStreamService;
    private readonly IAutonomousTestingService _autonomousTestingService;

    private static readonly string[] DefaultPipelineSteps =
        ["analysis", "proposal", "generation", "validation", "preview_deployment", "autonomous_testing_loop", "deployment"];

    public WorkflowOrchestrationService(
        AiDevRequestDbContext context,
        ILogger<WorkflowOrchestrationService> logger,
        IPreviewDeploymentService previewDeploymentService,
        ISandboxExecutionService sandboxExecutionService,
        ILogStreamService logStreamService,
        IAutonomousTestingService autonomousTestingService)
    {
        _context = context;
        _logger = logger;
        _previewDeploymentService = previewDeploymentService;
        _sandboxExecutionService = sandboxExecutionService;
        _logStreamService = logStreamService;
        _autonomousTestingService = autonomousTestingService;
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

    public async Task<WorkflowExecution> ExecutePreviewDeploymentStepAsync(int executionId)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(executionId)
            ?? throw new InvalidOperationException("Workflow execution not found.");

        var steps = JsonSerializer.Deserialize<List<WorkflowStep>>(execution.StepsJson) ?? [];
        var step = steps.FirstOrDefault(s => s.Name == "preview_deployment")
            ?? throw new InvalidOperationException("preview_deployment step not found in workflow.");

        try
        {
            step.Status = "running";
            step.StartedAt = DateTime.UtcNow;
            execution.StepsJson = JsonSerializer.Serialize(steps);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Executing preview deployment step for workflow {ExecutionId}", executionId);

            // Get the dev request
            var devRequest = await _context.DevRequests
                .FirstOrDefaultAsync(r => r.Id == execution.DevRequestId)
                ?? throw new InvalidOperationException($"Dev request {execution.DevRequestId} not found");

            // Step 1: Create preview deployment
            var preview = await _previewDeploymentService.DeployPreviewAsync(
                execution.DevRequestId,
                devRequest.UserId);

            _logger.LogInformation(
                "Preview deployed for workflow {ExecutionId}: {PreviewUrl}",
                executionId, preview.PreviewUrl);

            // Step 2: Start sandbox execution
            var sandbox = await _sandboxExecutionService.ExecuteInSandbox(
                execution.DevRequestId,
                "preview",
                "npm run build && npm run preview",
                "container");

            _logger.LogInformation(
                "Sandbox execution started for workflow {ExecutionId}: {SandboxId}",
                executionId, sandbox.Id);

            // Step 3: Stream logs (fire-and-forget)
            _ = Task.Run(() => _logStreamService.StreamLogsAsync(
                sandbox.Id.ToString(),
                preview.Id,
                CancellationToken.None));

            // Mark step as completed
            step.Status = "completed";
            step.CompletedAt = DateTime.UtcNow;
            execution.StepsJson = JsonSerializer.Serialize(steps);
            execution.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Preview deployment step completed for workflow {ExecutionId}",
                executionId);

            return execution;
        }
        catch (Exception ex)
        {
            step.Status = "failed";
            step.Error = ex.Message;
            step.CompletedAt = DateTime.UtcNow;
            execution.Status = WorkflowStatus.Failed;
            execution.StepsJson = JsonSerializer.Serialize(steps);
            execution.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogError(ex,
                "Preview deployment step failed for workflow {ExecutionId}",
                executionId);

            throw;
        }
    }

    public async Task<WorkflowExecution> ExecuteAutonomousTestingStepAsync(int executionId)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(executionId)
            ?? throw new InvalidOperationException("Workflow execution not found.");

        var steps = JsonSerializer.Deserialize<List<WorkflowStep>>(execution.StepsJson) ?? [];
        var step = steps.FirstOrDefault(s => s.Name == "autonomous_testing_loop")
            ?? throw new InvalidOperationException("autonomous_testing_loop step not found in workflow.");

        try
        {
            step.Status = "running";
            step.StartedAt = DateTime.UtcNow;
            execution.StepsJson = JsonSerializer.Serialize(steps);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Executing autonomous testing loop step for workflow {ExecutionId}",
                executionId);

            // Get the latest preview deployment for this dev request
            var preview = await _context.PreviewDeployments
                .Where(p => p.DevRequestId == execution.DevRequestId && p.Status == PreviewDeploymentStatus.Deployed)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync()
                ?? throw new InvalidOperationException(
                    $"No deployed preview found for dev request {execution.DevRequestId}");

            // Start autonomous testing loop (fire-and-forget with max 3 iterations)
            _ = Task.Run(async () =>
            {
                try
                {
                    var testExecution = await _autonomousTestingService.StartBrowserTestingLoopAsync(
                        preview.UserId,
                        execution.DevRequestId,
                        preview.PreviewUrl ?? $"https://preview-{execution.DevRequestId}",
                        null,
                        "chromium",
                        3);

                    // Update step status based on test results
                    var updatedSteps = JsonSerializer.Deserialize<List<WorkflowStep>>(execution.StepsJson) ?? [];
                    var updatedStep = updatedSteps.FirstOrDefault(s => s.Name == "autonomous_testing_loop");

                    if (updatedStep != null)
                    {
                        if (testExecution.TestsPassed)
                        {
                            updatedStep.Status = "completed";
                            updatedStep.CompletedAt = DateTime.UtcNow;
                            _logger.LogInformation(
                                "Autonomous testing passed for workflow {ExecutionId}",
                                executionId);
                        }
                        else
                        {
                            updatedStep.Status = "failed";
                            updatedStep.Error = testExecution.FinalTestResult ?? "Tests failed after max iterations";
                            updatedStep.CompletedAt = DateTime.UtcNow;
                            execution.Status = WorkflowStatus.Failed;
                            _logger.LogWarning(
                                "Autonomous testing failed for workflow {ExecutionId}: {Error}",
                                executionId, updatedStep.Error);
                        }

                        execution.StepsJson = JsonSerializer.Serialize(updatedSteps);
                        execution.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Error in autonomous testing loop for workflow {ExecutionId}",
                        executionId);

                    var updatedSteps = JsonSerializer.Deserialize<List<WorkflowStep>>(execution.StepsJson) ?? [];
                    var updatedStep = updatedSteps.FirstOrDefault(s => s.Name == "autonomous_testing_loop");

                    if (updatedStep != null)
                    {
                        updatedStep.Status = "failed";
                        updatedStep.Error = ex.Message;
                        updatedStep.CompletedAt = DateTime.UtcNow;
                        execution.Status = WorkflowStatus.Failed;
                        execution.StepsJson = JsonSerializer.Serialize(updatedSteps);
                        execution.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }
            });

            // Return immediately (async processing)
            _logger.LogInformation(
                "Autonomous testing loop started for workflow {ExecutionId}",
                executionId);

            return execution;
        }
        catch (Exception ex)
        {
            step.Status = "failed";
            step.Error = ex.Message;
            step.CompletedAt = DateTime.UtcNow;
            execution.Status = WorkflowStatus.Failed;
            execution.StepsJson = JsonSerializer.Serialize(steps);
            execution.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogError(ex,
                "Autonomous testing step failed for workflow {ExecutionId}",
                executionId);

            throw;
        }
    }
}

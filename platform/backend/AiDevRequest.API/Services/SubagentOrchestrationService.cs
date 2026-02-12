using System.Runtime.CompilerServices;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISubagentOrchestrationService
{
    Task<ParallelOrchestration> StartOrchestrationAsync(Guid devRequestId);
    Task<ParallelOrchestration?> GetOrchestrationStatusAsync(int orchestrationId);
    Task<List<SubagentTask>> GetTasksAsync(int orchestrationId);
    Task CancelOrchestrationAsync(int orchestrationId);
    Task ExecuteTaskAsync(int taskId);
    IAsyncEnumerable<OrchestrationEvent> StreamOrchestrationAsync(int orchestrationId, CancellationToken cancellationToken);
}

public class SubagentOrchestrationService : ISubagentOrchestrationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ITaskDecompositionService _decompositionService;
    private readonly AnthropicClient _client;
    private readonly ILogger<SubagentOrchestrationService> _logger;
    private readonly SemaphoreSlim _concurrencySemaphore;
    private const int MaxConcurrentTasks = 3;

    public SubagentOrchestrationService(
        AiDevRequestDbContext context,
        ITaskDecompositionService decompositionService,
        IConfiguration configuration,
        ILogger<SubagentOrchestrationService> logger)
    {
        _context = context;
        _decompositionService = decompositionService;
        _logger = logger;
        _concurrencySemaphore = new SemaphoreSlim(MaxConcurrentTasks, MaxConcurrentTasks);

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<ParallelOrchestration> StartOrchestrationAsync(Guid devRequestId)
    {
        _logger.LogInformation("Starting parallel orchestration for dev request {DevRequestId}", devRequestId);

        var devRequest = await _context.DevRequests.FindAsync(devRequestId)
            ?? throw new InvalidOperationException($"DevRequest {devRequestId} not found");

        // Decompose request into tasks
        var tasks = await _decompositionService.DecomposeRequestAsync(devRequestId);

        // Build dependency graph
        var dependencyGraph = await _decompositionService.BuildDependencyGraphAsync(tasks);

        // Create orchestration record
        var orchestration = new ParallelOrchestration
        {
            DevRequestId = devRequestId,
            Status = "pending",
            TotalTasks = tasks.Count,
            CompletedTasks = 0,
            FailedTasks = 0,
            DependencyGraphJson = JsonSerializer.Serialize(dependencyGraph),
            CreatedAt = DateTime.UtcNow
        };

        _context.ParallelOrchestrations.Add(orchestration);
        await _context.SaveChangesAsync();

        // Update tasks to reference the orchestration
        foreach (var task in tasks)
        {
            task.ParentOrchestrationId = orchestration.Id;
        }
        await _context.SaveChangesAsync();

        // Start execution asynchronously (fire and forget)
        _ = Task.Run(async () => await ExecuteOrchestrationAsync(orchestration.Id));

        _logger.LogInformation("Created orchestration {OrchestrationId} with {TaskCount} tasks",
            orchestration.Id, tasks.Count);

        return orchestration;
    }

    private async Task ExecuteOrchestrationAsync(int orchestrationId)
    {
        try
        {
            var orchestration = await _context.ParallelOrchestrations
                .Include(o => o.Tasks)
                .FirstOrDefaultAsync(o => o.Id == orchestrationId);

            if (orchestration == null)
            {
                _logger.LogError("Orchestration {OrchestrationId} not found", orchestrationId);
                return;
            }

            orchestration.Status = "running";
            orchestration.StartedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Executing orchestration {OrchestrationId}", orchestrationId);

            // Parse dependency graph
            var dependencyGraph = JsonSerializer.Deserialize<Dictionary<int, List<int>>>(
                orchestration.DependencyGraphJson) ?? new Dictionary<int, List<int>>();

            // Execute tasks respecting dependencies
            await ExecuteTasksWithDependenciesAsync(orchestration.Tasks, dependencyGraph);

            // Update orchestration status
            orchestration = await _context.ParallelOrchestrations
                .Include(o => o.Tasks)
                .FirstAsync(o => o.Id == orchestrationId);

            var completedCount = orchestration.Tasks.Count(t => t.Status == "completed");
            var failedCount = orchestration.Tasks.Count(t => t.Status == "failed");

            orchestration.CompletedTasks = completedCount;
            orchestration.FailedTasks = failedCount;
            orchestration.CompletedAt = DateTime.UtcNow;
            orchestration.TotalDurationMs = (int)(orchestration.CompletedAt.Value - orchestration.StartedAt!.Value).TotalMilliseconds;
            orchestration.Status = failedCount > 0 ? "failed" : "completed";

            await _context.SaveChangesAsync();

            _logger.LogInformation("Orchestration {OrchestrationId} completed with {CompletedCount}/{TotalCount} tasks successful",
                orchestrationId, completedCount, orchestration.TotalTasks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error in orchestration {OrchestrationId}", orchestrationId);

            var orchestration = await _context.ParallelOrchestrations.FindAsync(orchestrationId);
            if (orchestration != null)
            {
                orchestration.Status = "failed";
                orchestration.CompletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }

    private async Task ExecuteTasksWithDependenciesAsync(List<SubagentTask> tasks, Dictionary<int, List<int>> dependencyGraph)
    {
        var executingTasks = new List<Task>();
        var completedTaskIds = new HashSet<int>();

        while (completedTaskIds.Count < tasks.Count)
        {
            // Find tasks that are ready to execute (dependencies met, not yet started)
            var readyTasks = tasks.Where(t =>
                t.Status == "pending" &&
                (!dependencyGraph.ContainsKey(t.Id) ||
                 dependencyGraph[t.Id].All(depId => completedTaskIds.Contains(depId)))
            ).ToList();

            if (readyTasks.Count == 0 && executingTasks.Count == 0)
            {
                // No tasks ready and none executing - might be stuck due to failed dependencies
                _logger.LogWarning("No tasks ready to execute. Remaining tasks: {RemainingCount}",
                    tasks.Count - completedTaskIds.Count);
                break;
            }

            // Start ready tasks (up to concurrency limit)
            foreach (var task in readyTasks)
            {
                var executeTask = Task.Run(async () =>
                {
                    await ExecuteTaskAsync(task.Id);
                    completedTaskIds.Add(task.Id);
                });

                executingTasks.Add(executeTask);
            }

            // Wait for at least one task to complete before continuing
            if (executingTasks.Count > 0)
            {
                var completedTask = await Task.WhenAny(executingTasks);
                executingTasks.Remove(completedTask);

                try
                {
                    await completedTask; // Propagate exceptions
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Task execution failed");
                }
            }
        }

        // Wait for all remaining tasks
        await Task.WhenAll(executingTasks);
    }

    public async Task ExecuteTaskAsync(int taskId)
    {
        await _concurrencySemaphore.WaitAsync();

        try
        {
            var task = await _context.SubagentTasks
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                _logger.LogWarning("Task {TaskId} not found", taskId);
                return;
            }

            _logger.LogInformation("Executing task {TaskId}: {TaskName} ({TaskType})",
                task.Id, task.Name, task.TaskType);

            task.Status = "running";
            task.StartedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            try
            {
                // Fetch DevRequest manually since navigation property was removed
                var devRequest = await _context.DevRequests.FindAsync(task.DevRequestId);
                if (devRequest == null)
                {
                    throw new InvalidOperationException($"DevRequest {task.DevRequestId} not found");
                }

                // Generate specialized context for this agent
                var context = await _decompositionService.GenerateAgentContextAsync(task, devRequest);

                // Call Claude API with specialized prompt
                var messages = new List<Message>
                {
                    new Message(RoleType.User, context)
                };

                var parameters = new MessageParameters
                {
                    Messages = messages,
                    MaxTokens = 8192,
                    Model = "claude-sonnet-4-20250514", // Use Sonnet for balanced performance
                    Stream = false,
                    Temperature = 0.7m
                };

                var response = await _client.Messages.GetClaudeMessageAsync(parameters);
                var generatedCode = response.Content.FirstOrDefault()?.ToString() ?? "";

                // Parse output and extract generated files
                var output = new CodeGenerationOutput
                {
                    GeneratedFiles = ExtractGeneratedFiles(generatedCode),
                    RawOutput = generatedCode,
                    TokenCount = response.Usage?.InputTokens + response.Usage?.OutputTokens ?? 0
                };

                task.Status = "completed";
                task.CompletedAt = DateTime.UtcNow;
                task.DurationMs = (int)(task.CompletedAt.Value - task.StartedAt!.Value).TotalMilliseconds;
                task.OutputJson = JsonSerializer.Serialize(output);
                task.TokensUsed = output.TokenCount;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Task {TaskId} completed successfully in {DurationMs}ms using {TokenCount} tokens",
                    task.Id, task.DurationMs, task.TokensUsed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Task {TaskId} failed", task.Id);

                task.Status = "failed";
                task.ErrorMessage = ex.Message;
                task.CompletedAt = DateTime.UtcNow;
                task.DurationMs = (int)(task.CompletedAt.Value - task.StartedAt!.Value).TotalMilliseconds;

                await _context.SaveChangesAsync();
            }
        }
        finally
        {
            _concurrencySemaphore.Release();
        }
    }

    private List<SubagentGeneratedFile> ExtractGeneratedFiles(string claudeOutput)
    {
        var files = new List<SubagentGeneratedFile>();

        // Simple extraction: look for code blocks with file paths
        // Format: ### path/to/file.ext
        // ```language
        // code here
        // ```

        var lines = claudeOutput.Split('\n');
        string? currentFilePath = null;
        string? currentLanguage = null;
        var currentCode = new List<string>();
        bool inCodeBlock = false;

        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i];

            if (line.StartsWith("###"))
            {
                // File header
                currentFilePath = line.Replace("###", "").Trim();
            }
            else if (line.StartsWith("```"))
            {
                if (!inCodeBlock)
                {
                    // Start of code block
                    inCodeBlock = true;
                    currentLanguage = line.Replace("```", "").Trim();
                    currentCode.Clear();
                }
                else
                {
                    // End of code block
                    inCodeBlock = false;

                    if (!string.IsNullOrEmpty(currentFilePath))
                    {
                        files.Add(new SubagentGeneratedFile
                        {
                            Path = currentFilePath,
                            Content = string.Join("\n", currentCode),
                            Language = currentLanguage ?? "text"
                        });
                    }

                    currentFilePath = null;
                    currentLanguage = null;
                    currentCode.Clear();
                }
            }
            else if (inCodeBlock)
            {
                currentCode.Add(line);
            }
        }

        return files;
    }

    public async Task<ParallelOrchestration?> GetOrchestrationStatusAsync(int orchestrationId)
    {
        return await _context.ParallelOrchestrations
            .Include(o => o.Tasks)
            .FirstOrDefaultAsync(o => o.Id == orchestrationId);
    }

    public async Task<List<SubagentTask>> GetTasksAsync(int orchestrationId)
    {
        return await _context.SubagentTasks
            .Where(t => t.ParentOrchestrationId == orchestrationId)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task CancelOrchestrationAsync(int orchestrationId)
    {
        var orchestration = await _context.ParallelOrchestrations.FindAsync(orchestrationId);
        if (orchestration == null) return;

        orchestration.Status = "cancelled";
        orchestration.CompletedAt = DateTime.UtcNow;

        // Cancel pending tasks
        var pendingTasks = await _context.SubagentTasks
            .Where(t => t.ParentOrchestrationId == orchestrationId && t.Status == "pending")
            .ToListAsync();

        foreach (var task in pendingTasks)
        {
            task.Status = "cancelled";
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cancelled orchestration {OrchestrationId}", orchestrationId);
    }

    public async IAsyncEnumerable<OrchestrationEvent> StreamOrchestrationAsync(
        int orchestrationId,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting SSE stream for orchestration {OrchestrationId}", orchestrationId);

        var lastEventTime = DateTime.UtcNow;

        while (!cancellationToken.IsCancellationRequested)
        {
            var orchestration = await _context.ParallelOrchestrations
                .Include(o => o.Tasks)
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == orchestrationId, cancellationToken);

            if (orchestration == null)
            {
                yield return new OrchestrationEvent
                {
                    Type = "error",
                    Message = "Orchestration not found"
                };
                yield break;
            }

            // Send status update
            yield return new OrchestrationEvent
            {
                Type = "status",
                OrchestrationId = orchestrationId,
                Status = orchestration.Status,
                CompletedTasks = orchestration.CompletedTasks,
                TotalTasks = orchestration.TotalTasks,
                FailedTasks = orchestration.FailedTasks
            };

            // Send task updates for recently changed tasks
            var recentTasks = orchestration.Tasks
                .Where(t => t.CreatedAt > lastEventTime || (t.CompletedAt.HasValue && t.CompletedAt.Value > lastEventTime))
                .ToList();

            foreach (var task in recentTasks)
            {
                yield return new OrchestrationEvent
                {
                    Type = "task_update",
                    TaskId = task.Id,
                    TaskName = task.Name,
                    TaskType = task.TaskType,
                    TaskStatus = task.Status,
                    DurationMs = task.DurationMs
                };
            }

            lastEventTime = DateTime.UtcNow;

            // Stop if orchestration is complete
            if (orchestration.Status == "completed" || orchestration.Status == "failed" || orchestration.Status == "cancelled")
            {
                yield return new OrchestrationEvent
                {
                    Type = "complete",
                    Status = orchestration.Status,
                    Message = $"Orchestration {orchestration.Status}"
                };
                yield break;
            }

            // Wait before next update
            await Task.Delay(1000, cancellationToken);
        }
    }
}

// DTOs
public class OrchestrationEvent
{
    public string Type { get; set; } = ""; // status, task_update, error, complete
    public int? OrchestrationId { get; set; }
    public int? TaskId { get; set; }
    public string? TaskName { get; set; }
    public string? TaskType { get; set; }
    public string? TaskStatus { get; set; }
    public string? Status { get; set; }
    public int? CompletedTasks { get; set; }
    public int? TotalTasks { get; set; }
    public int? FailedTasks { get; set; }
    public int? DurationMs { get; set; }
    public string? Message { get; set; }
}

public class CodeGenerationOutput
{
    public List<SubagentGeneratedFile> GeneratedFiles { get; set; } = new();
    public string RawOutput { get; set; } = "";
    public int TokenCount { get; set; }
}

public class SubagentGeneratedFile
{
    public string Path { get; set; } = "";
    public string Content { get; set; } = "";
    public string Language { get; set; } = "";
}

using System.Diagnostics;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISandboxExecutionService
{
    Task<SandboxExecution> ExecuteInSandbox(Guid devRequestId, string executionType, string command, string isolationLevel);
    Task<SandboxExecution?> GetLatestExecution(Guid devRequestId);
    Task<List<SandboxExecution>> GetExecutionHistory(Guid devRequestId);
    Task<SandboxExecution?> GetExecutionById(Guid executionId);
}

public class SandboxExecutionService : ISandboxExecutionService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SandboxExecutionService> _logger;
    private readonly IDockerExecutionService _dockerService;
    private readonly IContainerLogStreamService _logStreamService;

    // Docker images for different execution types
    private static readonly Dictionary<string, string> ExecutionTypeImages = new()
    {
        { "build", "node:20-alpine" },
        { "test", "node:20-alpine" },
        { "preview", "node:20-alpine" },
    };

    public SandboxExecutionService(
        AiDevRequestDbContext context,
        ILogger<SandboxExecutionService> logger,
        IDockerExecutionService dockerService,
        IContainerLogStreamService logStreamService)
    {
        _context = context;
        _logger = logger;
        _dockerService = dockerService;
        _logStreamService = logStreamService;
    }

    public async Task<SandboxExecution> ExecuteInSandbox(Guid devRequestId, string executionType, string command, string isolationLevel)
    {
        var execution = new SandboxExecution
        {
            DevRequestId = devRequestId,
            Status = "running",
            ExecutionType = executionType,
            IsolationLevel = isolationLevel,
            Command = command,
            StartedAt = DateTime.UtcNow,
        };

        _context.SandboxExecutions.Add(execution);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Started sandbox execution {ExecutionId} for dev request {DevRequestId}: type={Type}, isolation={Isolation}, command={Command}",
            execution.Id, devRequestId, executionType, isolationLevel, command);

        string? containerId = null;

        try
        {
            // Get appropriate Docker image for execution type
            if (!ExecutionTypeImages.TryGetValue(executionType, out var imageName))
            {
                imageName = "node:20-alpine"; // Default to Node.js
            }

            var stopwatch = Stopwatch.StartNew();

            // Pull Docker image
            _logger.LogInformation("Pulling Docker image: {ImageName}", imageName);
            await _dockerService.PullImageAsync(imageName);

            // Prepare command for container
            var containerCommand = PrepareContainerCommand(executionType, command);

            // Create container
            _logger.LogInformation("Creating Docker container for execution {ExecutionId}", execution.Id);
            containerId = await _dockerService.CreateContainerAsync(imageName, containerCommand);

            // Start container
            _logger.LogInformation("Starting Docker container {ContainerId} for execution {ExecutionId}", containerId, execution.Id);
            await _dockerService.StartContainerAsync(containerId);

            // Wait for container to complete
            var (exitCode, finishedAt) = await _dockerService.WaitForContainerAsync(containerId);

            stopwatch.Stop();

            // Collect logs
            _logger.LogInformation("Collecting logs from container {ContainerId}", containerId);
            var (stdout, stderr) = await _logStreamService.GetLogsAsync(containerId);

            // Detect errors
            var errors = await _logStreamService.DetectErrorsAsync(containerId);

            // Get container stats for resource usage
            var inspect = await _dockerService.InspectContainerAsync(containerId);
            var resourceUsage = new ResourceUsageInfo
            {
                CpuPercent = 0, // Docker stats would require separate API call
                MemoryMb = (int)(inspect.HostConfig.Memory / (1024 * 1024)), // Configured limit
                DurationMs = (int)stopwatch.ElapsedMilliseconds,
            };

            // Update execution record
            execution.OutputLog = stdout;
            execution.ErrorLog = stderr;
            execution.ExitCode = exitCode;
            execution.ResourceUsage = JsonSerializer.Serialize(resourceUsage);
            execution.SecurityViolationsJson = errors.Count > 0
                ? JsonSerializer.Serialize(errors)
                : null;

            execution.Status = exitCode == 0 ? "completed" : "failed";
            execution.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Sandbox execution {ExecutionId} completed with exit code {ExitCode} for dev request {DevRequestId}",
                execution.Id, execution.ExitCode, devRequestId);

            return execution;
        }
        catch (Exception ex)
        {
            execution.Status = "failed";
            execution.ErrorLog = ex.Message;
            execution.ExitCode = 1;
            execution.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Sandbox execution {ExecutionId} failed for dev request {DevRequestId}",
                execution.Id, devRequestId);
            throw;
        }
        finally
        {
            // Cleanup: Remove container
            if (containerId != null)
            {
                try
                {
                    _logger.LogInformation("Cleaning up container {ContainerId}", containerId);
                    await _dockerService.StopContainerAsync(containerId, TimeSpan.FromSeconds(5));
                    await _dockerService.RemoveContainerAsync(containerId, force: true);
                    _logger.LogInformation("Successfully cleaned up container {ContainerId}", containerId);
                }
                catch (Exception cleanupEx)
                {
                    _logger.LogWarning(cleanupEx, "Failed to cleanup container {ContainerId}", containerId);
                }
            }
        }
    }

    public async Task<SandboxExecution?> GetLatestExecution(Guid devRequestId)
    {
        return await _context.SandboxExecutions
            .Where(e => e.DevRequestId == devRequestId)
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<SandboxExecution>> GetExecutionHistory(Guid devRequestId)
    {
        return await _context.SandboxExecutions
            .Where(e => e.DevRequestId == devRequestId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<SandboxExecution?> GetExecutionById(Guid executionId)
    {
        return await _context.SandboxExecutions
            .FirstOrDefaultAsync(e => e.Id == executionId);
    }

    private static string[] PrepareContainerCommand(string executionType, string command)
    {
        return executionType switch
        {
            "build" => new[] { "sh", "-c", command.Length > 0 ? command : "npm install && npm run build" },
            "test" => new[] { "sh", "-c", command.Length > 0 ? command : "npm test" },
            "preview" => new[] { "sh", "-c", command.Length > 0 ? command : "npm run dev" },
            _ => new[] { "sh", "-c", command },
        };
    }
}

public class ResourceUsageInfo
{
    public double CpuPercent { get; set; }
    public int MemoryMb { get; set; }
    public int DurationMs { get; set; }
}

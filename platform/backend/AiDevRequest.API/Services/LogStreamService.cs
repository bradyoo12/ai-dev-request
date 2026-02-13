using System.Text;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using LogLevel = AiDevRequest.API.Entities.LogLevel;

namespace AiDevRequest.API.Services;

public interface ILogStreamService
{
    Task StreamLogsAsync(string containerId, Guid previewId, CancellationToken cancellationToken);
    Task<List<LogEntry>> GetLogsAsync(Guid previewId);
    Task<List<ProjectLogEntry>> GetProjectLogsAsync(Guid projectId, LogQueryParams? queryParams = null);
    Task AddProjectLogAsync(Guid projectId, Entities.LogLevel level, string source, string message);
}

public class LogStreamService : ILogStreamService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<LogStreamService> _logger;

    public LogStreamService(
        AiDevRequestDbContext context,
        ILogger<LogStreamService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task StreamLogsAsync(string containerId, Guid previewId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Started log streaming for container {ContainerId}, preview {PreviewId}", containerId, previewId);

        try
        {
            // Simulate streaming logs from container
            // In a real implementation, this would connect to Docker/Container runtime API
            await SimulateLogStreamingAsync(previewId, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Log streaming cancelled for container {ContainerId}", containerId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming logs for container {ContainerId}", containerId);
        }
    }

    public async Task<List<LogEntry>> GetLogsAsync(Guid previewId)
    {
        // In a real implementation, this would query a logs database or aggregation service
        // For now, return simulated log entries
        return await Task.FromResult(new List<LogEntry>
        {
            new() { Timestamp = DateTime.UtcNow.AddSeconds(-10), Level = "info", Message = "Container started" },
            new() { Timestamp = DateTime.UtcNow.AddSeconds(-8), Level = "info", Message = "Installing dependencies..." },
            new() { Timestamp = DateTime.UtcNow.AddSeconds(-5), Level = "info", Message = "Starting development server..." },
            new() { Timestamp = DateTime.UtcNow.AddSeconds(-2), Level = "info", Message = "Server listening on port 3000" },
        });
    }

    private async Task SimulateLogStreamingAsync(Guid previewId, CancellationToken cancellationToken)
    {
        var logMessages = new[]
        {
            "[container] Starting sandbox environment...",
            "[container] Initializing preview deployment...",
            "[npm] Installing dependencies...",
            "[npm] added 847 packages in 8.2s",
            "[vite] Starting development server...",
            "[vite] VITE v5.4.0 ready in 1247ms",
            "[vite] Local: http://localhost:3000/",
            "[preview] Preview URL: https://preview-{slug}.azurestaticapps.net",
            "[sandbox] Health check passed",
            "[sandbox] Container ready"
        };

        foreach (var message in logMessages)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            var formattedMessage = message.Replace("{slug}", previewId.ToString()[..8]);
            _logger.LogInformation("[Preview {PreviewId}] {Message}", previewId, formattedMessage);

            // Simulate realistic log streaming delay
            await Task.Delay(TimeSpan.FromSeconds(new Random().NextDouble() * 2 + 0.5), cancellationToken);
        }

        _logger.LogInformation("Log streaming completed for preview {PreviewId}", previewId);
    }

    public async Task<List<ProjectLogEntry>> GetProjectLogsAsync(Guid projectId, LogQueryParams? queryParams = null)
    {
        var query = _context.ProjectLogs
            .Where(l => l.ProjectId == projectId)
            .AsQueryable();

        // Apply filters
        if (queryParams != null)
        {
            if (queryParams.Level.HasValue)
            {
                query = query.Where(l => l.Level == queryParams.Level.Value);
            }

            if (!string.IsNullOrEmpty(queryParams.Source))
            {
                query = query.Where(l => l.Source == queryParams.Source);
            }

            if (!string.IsNullOrEmpty(queryParams.Search))
            {
                query = query.Where(l => l.Message.Contains(queryParams.Search));
            }

            if (queryParams.From.HasValue)
            {
                query = query.Where(l => l.Timestamp >= queryParams.From.Value);
            }

            if (queryParams.To.HasValue)
            {
                query = query.Where(l => l.Timestamp <= queryParams.To.Value);
            }
        }

        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Take(queryParams?.Limit ?? 100)
            .ToListAsync();

        return logs.Select(l => new ProjectLogEntry
        {
            Id = l.Id,
            ProjectId = l.ProjectId,
            Level = l.Level.ToString().ToLower(),
            Source = l.Source,
            Message = l.Message,
            Timestamp = l.Timestamp
        }).ToList();
    }

    public async Task AddProjectLogAsync(Guid projectId, Entities.LogLevel level, string source, string message)
    {
        var log = new ProjectLog
        {
            ProjectId = projectId,
            Level = level,
            Source = source,
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        _context.ProjectLogs.Add(log);
        await _context.SaveChangesAsync();

        _logger.LogDebug("Added project log: {ProjectId} [{Level}] {Source}: {Message}",
            projectId, level, source, message);
    }
}

public class LogEntry
{
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = "info";
    public string Message { get; set; } = "";
}

public class ProjectLogEntry
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Level { get; set; } = "";
    public string Source { get; set; } = "";
    public string Message { get; set; } = "";
    public DateTime Timestamp { get; set; }
}

public class LogQueryParams
{
    public Entities.LogLevel? Level { get; set; }
    public string? Source { get; set; }
    public string? Search { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int Limit { get; set; } = 100;
}

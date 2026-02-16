using System.Text.Json;
using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IAutonomousTestingService
{
    Task<AutonomousTestExecution> StartBrowserTestingLoopAsync(string userId, Guid devRequestId, string targetUrl, string? projectName, string browserType, int maxIterations);
    Task<List<AutonomousTestExecution>> GetUserExecutionsAsync(string userId);
    Task<AutonomousTestExecution?> GetExecutionByIdAsync(Guid id);
    Task<AutonomousTestExecution> CancelExecutionAsync(Guid id);
    Task<List<object>> GetScreenshotsAsync(Guid executionId);
    Task<object> AnalyzeScreenshotAsync(string screenshotBase64, string? pageUrl, string? context);
    Task<AutonomousTestStats> GetStatsAsync(string userId);
}

public class AutonomousTestingService : IAutonomousTestingService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<AutonomousTestingService> _logger;
    private readonly ILiveBrowserTestRunner _liveBrowserTestRunner;

    public AutonomousTestingService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<AutonomousTestingService> logger,
        ILiveBrowserTestRunner liveBrowserTestRunner)
    {
        _context = context;
        _logger = logger;
        _liveBrowserTestRunner = liveBrowserTestRunner;

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<AutonomousTestExecution> StartBrowserTestingLoopAsync(
        string userId,
        Guid devRequestId,
        string targetUrl,
        string? projectName,
        string browserType,
        int maxIterations)
    {
        var execution = new AutonomousTestExecution
        {
            UserId = userId,
            DevRequestId = devRequestId,
            TargetUrl = targetUrl,
            ProjectName = projectName,
            BrowserType = browserType,
            Status = "running",
            MaxIterations = maxIterations,
            CurrentIteration = 0,
        };

        _context.AutonomousTestExecutions.Add(execution);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Started browser testing loop {ExecutionId} for URL {TargetUrl}, max {MaxIterations} iterations",
            execution.Id, targetUrl, maxIterations);

        _ = Task.Run(async () =>
        {
            try
            {
                await RunTestingLoopAsync(execution.Id, targetUrl, maxIterations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background testing loop failed for execution {ExecutionId}", execution.Id);
            }
        });

        return execution;
    }

    private async Task RunTestingLoopAsync(Guid executionId, string targetUrl, int maxIterations)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            for (int i = 0; i < maxIterations; i++)
            {
                var execution = await _context.AutonomousTestExecutions.FindAsync(executionId);
                if (execution == null || execution.Status == "cancelled") return;

                execution.CurrentIteration = i + 1;
                execution.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var session = await _liveBrowserTestRunner.RunVisionTestAsync(executionId, targetUrl, i + 1);

                execution.VisionAnalysisCount++;
                execution.IssuesDetected += session.IssuesFound;
                execution.IssuesFixed += session.IssuesResolved;

                var existingIssues = !string.IsNullOrEmpty(execution.IssuesFoundJson)
                    ? JsonSerializer.Deserialize<List<object>>(execution.IssuesFoundJson) ?? new()
                    : new List<object>();
                if (!string.IsNullOrEmpty(session.IssuesJson))
                {
                    var sessionIssues = JsonSerializer.Deserialize<List<object>>(session.IssuesJson) ?? new();
                    existingIssues.AddRange(sessionIssues);
                }
                execution.IssuesFoundJson = JsonSerializer.Serialize(existingIssues);

                if (!string.IsNullOrEmpty(session.FixesJson))
                {
                    var existingFixes = !string.IsNullOrEmpty(execution.FixesAppliedJson)
                        ? JsonSerializer.Deserialize<List<object>>(execution.FixesAppliedJson) ?? new()
                        : new List<object>();
                    var sessionFixes = JsonSerializer.Deserialize<List<object>>(session.FixesJson) ?? new();
                    existingFixes.AddRange(sessionFixes);
                    execution.FixesAppliedJson = JsonSerializer.Serialize(existingFixes);
                }

                if (session.IssuesFound == 0)
                {
                    execution.Status = "completed";
                    execution.TestsPassed = true;
                    execution.FinalTestResult = $"All checks passed on iteration {i + 1}";
                    stopwatch.Stop();
                    execution.TotalDurationMs = stopwatch.ElapsedMilliseconds;
                    execution.CompletedAt = DateTime.UtcNow;
                    execution.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    return;
                }

                execution.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            var finalExecution = await _context.AutonomousTestExecutions.FindAsync(executionId);
            if (finalExecution != null)
            {
                finalExecution.Status = "failed";
                finalExecution.TestsPassed = false;
                finalExecution.FinalTestResult = $"Issues remain after {maxIterations} iterations";
                stopwatch.Stop();
                finalExecution.TotalDurationMs = stopwatch.ElapsedMilliseconds;
                finalExecution.CompletedAt = DateTime.UtcNow;
                finalExecution.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            var execution = await _context.AutonomousTestExecutions.FindAsync(executionId);
            if (execution != null)
            {
                execution.Status = "error";
                execution.FinalTestResult = $"Error: {ex.Message}";
                stopwatch.Stop();
                execution.TotalDurationMs = stopwatch.ElapsedMilliseconds;
                execution.CompletedAt = DateTime.UtcNow;
                execution.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            _logger.LogError(ex, "Testing loop failed for execution {ExecutionId}", executionId);
        }
    }

    public async Task<List<AutonomousTestExecution>> GetUserExecutionsAsync(string userId)
    {
        return await _context.AutonomousTestExecutions
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task<AutonomousTestExecution?> GetExecutionByIdAsync(Guid id)
    {
        return await _context.AutonomousTestExecutions.FindAsync(id);
    }

    public async Task<AutonomousTestExecution> CancelExecutionAsync(Guid id)
    {
        var execution = await _context.AutonomousTestExecutions.FindAsync(id)
            ?? throw new InvalidOperationException($"Execution {id} not found");

        if (execution.Status is "completed" or "failed" or "error" or "cancelled")
            throw new InvalidOperationException($"Cannot cancel execution in '{execution.Status}' state");

        execution.Status = "cancelled";
        execution.CompletedAt = DateTime.UtcNow;
        execution.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cancelled execution {ExecutionId}", id);
        return execution;
    }

    public async Task<List<object>> GetScreenshotsAsync(Guid executionId)
    {
        var execution = await _context.AutonomousTestExecutions.FindAsync(executionId);
        if (execution?.ScreenshotsJson == null) return new List<object>();
        return JsonSerializer.Deserialize<List<object>>(execution.ScreenshotsJson) ?? new List<object>();
    }

    public async Task<object> AnalyzeScreenshotAsync(string screenshotBase64, string? pageUrl, string? context)
    {
        var analysis = await _liveBrowserTestRunner.AnalyzeScreenshotAsync(
            screenshotBase64, pageUrl ?? "unknown", context);

        return new
        {
            pageUrl,
            issues = analysis.Issues.Select(i => new { i.Severity, i.Category, i.Description, i.Location, i.SuggestedFix, i.Confidence }),
            totalIssues = analysis.Issues.Count,
            summary = analysis.Summary,
            overallScore = analysis.OverallScore
        };
    }

    public async Task<AutonomousTestStats> GetStatsAsync(string userId)
    {
        var executions = await _context.AutonomousTestExecutions
            .Where(e => e.UserId == userId)
            .ToListAsync();

        var completed = executions.Where(e => e.Status == "completed").ToList();
        var failed = executions.Where(e => e.Status == "failed").ToList();
        var cancelled = executions.Where(e => e.Status == "cancelled").ToList();

        return new AutonomousTestStats
        {
            TotalExecutions = executions.Count,
            CompletedExecutions = completed.Count,
            FailedExecutions = failed.Count,
            CancelledExecutions = cancelled.Count,
            PassRate = executions.Count > 0 ? (double)completed.Count / executions.Count * 100 : 0,
            AvgIterations = executions.Count > 0 ? executions.Average(e => e.CurrentIteration) : 0,
            TotalIssuesDetected = executions.Sum(e => e.IssuesDetected),
            TotalIssuesFixed = executions.Sum(e => e.IssuesFixed),
            HealRate = executions.Sum(e => e.IssuesDetected) > 0
                ? (double)executions.Sum(e => e.IssuesFixed) / executions.Sum(e => e.IssuesDetected) * 100 : 0,
            TotalVisionAnalyses = executions.Sum(e => e.VisionAnalysisCount),
            AvgDurationMs = executions.Count > 0 ? (long)executions.Average(e => e.TotalDurationMs) : 0,
            ByBrowser = executions.GroupBy(e => e.BrowserType).ToDictionary(g => g.Key, g => g.Count()),
            ByStatus = executions.GroupBy(e => e.Status).ToDictionary(g => g.Key, g => g.Count()),
        };
    }
}

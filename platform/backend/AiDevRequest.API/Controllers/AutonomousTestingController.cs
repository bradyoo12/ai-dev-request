using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/autonomous-testing")]
public class AutonomousTestingController : ControllerBase
{
    private readonly IAutonomousTestingService _service;
    private readonly ILogger<AutonomousTestingController> _logger;

    public AutonomousTestingController(IAutonomousTestingService service, ILogger<AutonomousTestingController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartTestingLoop([FromBody] StartAutonomousTestRequest request)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value ?? "";
        try
        {
            var execution = await _service.StartBrowserTestingLoopAsync(
                userId,
                request.DevRequestId,
                request.TargetUrl,
                request.ProjectName,
                request.BrowserType ?? "chromium",
                request.MaxIterations);
            return Ok(MapExecutionDto(execution));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("executions")]
    public async Task<IActionResult> GetExecutions()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value ?? "";
        var executions = await _service.GetUserExecutionsAsync(userId);
        return Ok(executions.Select(MapExecutionDto));
    }

    [HttpGet("executions/{id:guid}")]
    public async Task<IActionResult> GetExecution(Guid id)
    {
        var execution = await _service.GetExecutionByIdAsync(id);
        if (execution == null) return NotFound();
        return Ok(MapExecutionDto(execution));
    }

    [HttpPost("executions/{id:guid}/cancel")]
    public async Task<IActionResult> CancelExecution(Guid id)
    {
        try
        {
            var execution = await _service.CancelExecutionAsync(id);
            return Ok(MapExecutionDto(execution));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("executions/{id:guid}/screenshots")]
    public async Task<IActionResult> GetScreenshots(Guid id)
    {
        var screenshots = await _service.GetScreenshotsAsync(id);
        return Ok(screenshots);
    }

    [HttpPost("analyze-screenshot")]
    public async Task<IActionResult> AnalyzeScreenshot([FromBody] AnalyzeScreenshotRequest request)
    {
        try
        {
            var analysis = await _service.AnalyzeScreenshotAsync(request.ScreenshotBase64, request.PageUrl, request.Context);
            return Ok(analysis);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value ?? "";
        var stats = await _service.GetStatsAsync(userId);
        return Ok(stats);
    }

    [HttpGet("browsers")]
    [AllowAnonymous]
    public IActionResult GetBrowsers()
    {
        var browsers = new[]
        {
            new { id = "chromium", name = "Chromium", color = "#4285F4" },
            new { id = "firefox", name = "Firefox", color = "#FF7139" },
            new { id = "webkit", name = "WebKit", color = "#006CFF" },
        };
        return Ok(browsers);
    }

    private static AutonomousTestExecutionDto MapExecutionDto(Entities.AutonomousTestExecution e) => new()
    {
        Id = e.Id,
        UserId = e.UserId,
        DevRequestId = e.DevRequestId,
        PreviewDeploymentId = e.PreviewDeploymentId,
        ProjectName = e.ProjectName,
        TargetUrl = e.TargetUrl,
        BrowserType = e.BrowserType,
        Status = e.Status,
        MaxIterations = e.MaxIterations,
        CurrentIteration = e.CurrentIteration,
        TestsPassed = e.TestsPassed,
        FinalTestResult = e.FinalTestResult,
        ScreenshotsJson = e.ScreenshotsJson,
        IssuesFoundJson = e.IssuesFoundJson,
        FixesAppliedJson = e.FixesAppliedJson,
        VisionAnalysisCount = e.VisionAnalysisCount,
        IssuesDetected = e.IssuesDetected,
        IssuesFixed = e.IssuesFixed,
        TotalDurationMs = e.TotalDurationMs,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
        CompletedAt = e.CompletedAt,
    };
}

public record StartAutonomousTestRequest
{
    public Guid DevRequestId { get; init; }
    public string TargetUrl { get; init; } = "";
    public string? ProjectName { get; init; }
    public string? BrowserType { get; init; }
    public int MaxIterations { get; init; } = 5;
}

public record AnalyzeScreenshotRequest
{
    public string ScreenshotBase64 { get; init; } = "";
    public string? PageUrl { get; init; }
    public string? Context { get; init; }
}

public record AutonomousTestExecutionDto
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = "";
    public Guid DevRequestId { get; init; }
    public Guid PreviewDeploymentId { get; init; }
    public string? ProjectName { get; init; }
    public string? TargetUrl { get; init; }
    public string BrowserType { get; init; } = "";
    public string Status { get; init; } = "";
    public int MaxIterations { get; init; }
    public int CurrentIteration { get; init; }
    public bool TestsPassed { get; init; }
    public string? FinalTestResult { get; init; }
    public string? ScreenshotsJson { get; init; }
    public string? IssuesFoundJson { get; init; }
    public string? FixesAppliedJson { get; init; }
    public int VisionAnalysisCount { get; init; }
    public int IssuesDetected { get; init; }
    public int IssuesFixed { get; init; }
    public long TotalDurationMs { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public record AutonomousTestStats
{
    public int TotalExecutions { get; init; }
    public int CompletedExecutions { get; init; }
    public int FailedExecutions { get; init; }
    public int CancelledExecutions { get; init; }
    public double PassRate { get; init; }
    public double AvgIterations { get; init; }
    public int TotalIssuesDetected { get; init; }
    public int TotalIssuesFixed { get; init; }
    public double HealRate { get; init; }
    public int TotalVisionAnalyses { get; init; }
    public long AvgDurationMs { get; init; }
    public Dictionary<string, int> ByBrowser { get; init; } = new();
    public Dictionary<string, int> ByStatus { get; init; } = new();
}

public record ScreenshotAnalysis
{
    public string PageUrl { get; init; } = "";
    public List<VisionIssue> Issues { get; init; } = new();
    public int TotalIssues { get; init; }
    public string Summary { get; init; } = "";
    public double OverallScore { get; init; }
}

public record VisionIssue
{
    public string Category { get; init; } = ""; // layout, accessibility, styling, ux, functionality
    public string Severity { get; init; } = ""; // critical, major, minor, info
    public string Description { get; init; } = "";
    public string? Location { get; init; }
    public string? SuggestedFix { get; init; }
    public int Confidence { get; init; }
}

using System.Security.Claims;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/performance")]
[Authorize]
public class PerformanceController : ControllerBase
{
    private readonly IPerformanceProfileService _service;

    public PerformanceController(IPerformanceProfileService service)
    {
        _service = service;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpPost("profile")]
    public async Task<IActionResult> Profile(Guid projectId)
    {
        var userId = GetUserId();
        var result = await _service.ProfileAsync(projectId, userId);
        return Ok(ToDto(result));
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetResults(Guid projectId)
    {
        var userId = GetUserId();
        var result = await _service.GetLatestAsync(projectId, userId);
        if (result == null) return NotFound();
        return Ok(ToDto(result));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(Guid projectId)
    {
        var userId = GetUserId();
        var results = await _service.GetHistoryAsync(projectId, userId);
        return Ok(results.Select(ToDto));
    }

    [HttpPost("optimize")]
    public async Task<IActionResult> Optimize(Guid projectId, [FromBody] OptimizeRequest request)
    {
        var userId = GetUserId();
        var result = await _service.OptimizeAsync(request.ProfileId, userId, request.SuggestionIds);
        return Ok(ToDto(result));
    }

    private static PerformanceProfileDto ToDto(PerformanceProfile p) => new(
        p.Id, p.ProjectId, p.BundleScore, p.RenderingScore, p.DataLoadingScore,
        p.AccessibilityScore, p.SeoScore, p.OverallScore, p.EstimatedBundleSizeKb,
        p.SuggestionCount, p.OptimizationsApplied, p.SuggestionsJson, p.MetricsJson,
        p.Status, p.CreatedAt, p.OptimizedAt
    );
}

public record OptimizeRequest(Guid ProfileId, List<string> SuggestionIds);

public record PerformanceProfileDto(
    Guid Id, Guid ProjectId, int BundleScore, int RenderingScore, int DataLoadingScore,
    int AccessibilityScore, int SeoScore, int OverallScore, int EstimatedBundleSizeKb,
    int SuggestionCount, int OptimizationsApplied, string SuggestionsJson, string MetricsJson,
    string Status, DateTime CreatedAt, DateTime? OptimizedAt
);

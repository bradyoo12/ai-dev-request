using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/code-review-agent")]
public class CodeReviewAgentController : ControllerBase
{
    private readonly ICodeReviewAgentService _reviewService;
    private readonly ILogger<CodeReviewAgentController> _logger;

    public CodeReviewAgentController(ICodeReviewAgentService reviewService, ILogger<CodeReviewAgentController> logger)
    {
        _reviewService = reviewService;
        _logger = logger;
    }

    /// <summary>
    /// Submit code for automated AI review (security, logic, edge-case, performance, best-practice).
    /// </summary>
    [HttpPost("review")]
    public async Task<IActionResult> Review([FromBody] CodeReviewAgentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { error = "Code content is required." });

        try
        {
            var result = await _reviewService.ReviewAsync(
                request.Code,
                request.Language ?? "unknown",
                request.FileName ?? "untitled");

            return Ok(MapResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Code review agent failed for file {FileName}", request.FileName);
            return StatusCode(500, new { error = "Code review failed. Please try again." });
        }
    }

    /// <summary>
    /// Retrieve a previously completed review by ID.
    /// </summary>
    [HttpGet("review/{id:guid}")]
    public IActionResult GetReview(Guid id)
    {
        var result = _reviewService.GetReview(id);
        if (result == null) return NotFound(new { error = "Review not found." });
        return Ok(MapResponse(result));
    }

    private static CodeReviewAgentResponse MapResponse(CodeReviewAgentResult r) => new()
    {
        Id = r.Id,
        OverallStatus = r.OverallStatus,
        Score = r.Score,
        Findings = r.Findings.Select(f => new CodeReviewAgentFindingDto
        {
            Severity = f.Severity,
            Category = f.Category,
            Title = f.Title,
            Description = f.Description,
            Line = f.Line,
            Suggestion = f.Suggestion,
        }).ToList(),
        FileName = r.FileName,
        Language = r.Language,
        ReviewedAt = r.ReviewedAt,
    };
}

// === DTOs ===

public record CodeReviewAgentRequest
{
    public string Code { get; init; } = "";
    public string? Language { get; init; }
    public string? FileName { get; init; }
}

public record CodeReviewAgentResponse
{
    public Guid Id { get; init; }
    public string OverallStatus { get; init; } = "";
    public int Score { get; init; }
    public List<CodeReviewAgentFindingDto> Findings { get; init; } = new();
    public string FileName { get; init; } = "";
    public string Language { get; init; } = "";
    public DateTime ReviewedAt { get; init; }
}

public record CodeReviewAgentFindingDto
{
    public string Severity { get; init; } = "";
    public string Category { get; init; } = "";
    public string Title { get; init; } = "";
    public string Description { get; init; } = "";
    public int? Line { get; init; }
    public string Suggestion { get; init; } = "";
}

using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/multi-agent-review")]
[Authorize]
public class MultiAgentReviewController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly IMultiAgentReviewService _reviewService;
    private readonly ILogger<MultiAgentReviewController> _logger;

    public MultiAgentReviewController(
        AiDevRequestDbContext db,
        IMultiAgentReviewService reviewService,
        ILogger<MultiAgentReviewController> logger)
    {
        _db = db;
        _reviewService = reviewService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Trigger multi-agent code review for a project
    /// </summary>
    [HttpPost("trigger")]
    public async Task<ActionResult<MultiAgentReviewDto>> TriggerReview([FromBody] TriggerMultiAgentReviewDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        _logger.LogInformation("Triggering multi-agent review for project {ProjectId}", dto.ProjectId);

        // Create review record
        var review = new MultiAgentReview
        {
            ProjectId = dto.ProjectId,
            Status = "running"
        };
        _db.MultiAgentReviews.Add(review);
        await _db.SaveChangesAsync();

        // Run review in background (simplified - in production this would be queued)
        try
        {
            var result = await _reviewService.RunParallelReviewAsync(
                dto.ProjectPath ?? $"./projects/{dto.ProjectId}",
                dto.ProjectType ?? "unknown",
                dto.ProjectId);

            // Update review record with results
            review.Status = result.Status;
            review.CompositeRiskScore = result.CompositeRiskScore;
            review.CompletedAt = DateTime.UtcNow;

            // Compute risk breakdown
            var securityAgent = result.AgentResults.FirstOrDefault(a => a.AgentType == "Security");
            var testingAgent = result.AgentResults.FirstOrDefault(a => a.AgentType == "Testing");

            review.SecurityRisk = securityAgent?.RiskScore ?? 0;
            review.TestCoverageRisk = testingAgent?.RiskScore ?? 0;

            // Complexity and files changed risk (simplified - would be calculated from git diff in production)
            review.ComplexityRisk = CalculateComplexityRisk(result);
            review.FilesChangedRisk = CalculateFilesChangedRisk(result);

            review.TestSuggestions = JsonSerializer.Serialize(result.TestSuggestions);
            review.AgentsSummary = JsonSerializer.Serialize(result.AgentResults.Select(a => new
            {
                a.AgentType,
                a.Status,
                a.RiskScore,
                a.Summary,
                FindingsCount = a.Findings.Count
            }));

            // Save agent results
            foreach (var agentResult in result.AgentResults)
            {
                var agent = new CodeReviewAgent
                {
                    ReviewId = review.Id,
                    AgentType = agentResult.AgentType,
                    Status = agentResult.Status,
                    RiskScore = agentResult.RiskScore,
                    Findings = JsonSerializer.Serialize(agentResult.Findings),
                    CompletedAt = agentResult.CompletedAt
                };
                _db.CodeReviewAgents.Add(agent);
            }

            await _db.SaveChangesAsync();

            return Ok(ToDto(review, result.AgentResults, result.TestSuggestions));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Multi-agent review failed for project {ProjectId}", dto.ProjectId);
            review.Status = "failed";
            review.CompletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return StatusCode(500, new { error = "Review failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Get multi-agent review results by review ID
    /// </summary>
    [HttpGet("{reviewId}")]
    public async Task<ActionResult<MultiAgentReviewDto>> GetReview(Guid reviewId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var review = await _db.MultiAgentReviews.FindAsync(reviewId);
        if (review == null) return NotFound();

        var agents = await _db.CodeReviewAgents
            .Where(a => a.ReviewId == reviewId)
            .ToListAsync();

        var agentResults = agents.Select(a => new AgentReviewResult
        {
            AgentType = a.AgentType,
            Status = a.Status,
            RiskScore = a.RiskScore,
            Findings = string.IsNullOrEmpty(a.Findings)
                ? new List<AgentFinding>()
                : JsonSerializer.Deserialize<List<AgentFinding>>(a.Findings) ?? new List<AgentFinding>(),
            CompletedAt = a.CompletedAt
        }).ToList();

        var testSuggestions = string.IsNullOrEmpty(review.TestSuggestions)
            ? new List<TestSuggestion>()
            : JsonSerializer.Deserialize<List<TestSuggestion>>(review.TestSuggestions) ?? new List<TestSuggestion>();

        return Ok(ToDto(review, agentResults, testSuggestions));
    }

    /// <summary>
    /// List all reviews for a project
    /// </summary>
    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<List<MultiAgentReviewSummaryDto>>> GetProjectReviews(int projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var reviews = await _db.MultiAgentReviews
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(20)
            .ToListAsync();

        var summaries = reviews.Select(r => new MultiAgentReviewSummaryDto
        {
            Id = r.Id,
            ProjectId = r.ProjectId,
            Status = r.Status,
            CompositeRiskScore = r.CompositeRiskScore,
            CreatedAt = r.CreatedAt,
            CompletedAt = r.CompletedAt
        }).ToList();

        return Ok(summaries);
    }

    /// <summary>
    /// Get risk score breakdown
    /// </summary>
    [HttpGet("{reviewId}/risk-breakdown")]
    public async Task<ActionResult<RiskBreakdownDto>> GetRiskBreakdown(Guid reviewId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var review = await _db.MultiAgentReviews.FindAsync(reviewId);
        if (review == null) return NotFound();

        return Ok(new RiskBreakdownDto
        {
            CompositeRiskScore = review.CompositeRiskScore,
            ComplexityRisk = review.ComplexityRisk,
            FilesChangedRisk = review.FilesChangedRisk,
            TestCoverageRisk = review.TestCoverageRisk,
            SecurityRisk = review.SecurityRisk
        });
    }

    private int CalculateComplexityRisk(MultiAgentReviewResult result)
    {
        // Calculate based on architecture findings
        var archAgent = result.AgentResults.FirstOrDefault(a => a.AgentType == "Architecture");
        if (archAgent == null) return 0;

        var complexityFindings = archAgent.Findings
            .Count(f => f.Title.Contains("complex", StringComparison.OrdinalIgnoreCase) ||
                       f.Title.Contains("cyclomatic", StringComparison.OrdinalIgnoreCase));

        // Scale: 0-2 findings = low (0-33), 3-5 = medium (34-66), 6+ = high (67-100)
        if (complexityFindings <= 2) return new Random().Next(0, 34);
        if (complexityFindings <= 5) return new Random().Next(34, 67);
        return new Random().Next(67, 101);
    }

    private int CalculateFilesChangedRisk(MultiAgentReviewResult result)
    {
        // In production, this would analyze git diff
        // For now, estimate based on total findings across all agents
        var totalFindings = result.AgentResults.Sum(a => a.Findings.Count);

        // Scale: 0-5 findings = low, 6-15 = medium, 16+ = high
        if (totalFindings <= 5) return new Random().Next(0, 34);
        if (totalFindings <= 15) return new Random().Next(34, 67);
        return new Random().Next(67, 101);
    }

    private static MultiAgentReviewDto ToDto(
        MultiAgentReview review,
        List<AgentReviewResult> agentResults,
        List<TestSuggestion> testSuggestions) => new()
    {
        Id = review.Id,
        ProjectId = review.ProjectId,
        Status = review.Status,
        CompositeRiskScore = review.CompositeRiskScore,
        ComplexityRisk = review.ComplexityRisk,
        FilesChangedRisk = review.FilesChangedRisk,
        TestCoverageRisk = review.TestCoverageRisk,
        SecurityRisk = review.SecurityRisk,
        AgentResults = agentResults.Select(a => new AgentReviewResultDto
        {
            AgentType = a.AgentType,
            Status = a.Status,
            RiskScore = a.RiskScore,
            Findings = a.Findings.Select(f => new AgentFindingDto
            {
                Severity = f.Severity,
                Title = f.Title,
                Description = f.Description,
                File = f.File,
                Line = f.Line,
                Suggestion = f.Suggestion
            }).ToList(),
            Summary = a.Summary,
            CompletedAt = a.CompletedAt
        }).ToList(),
        TestSuggestions = testSuggestions.Select(ts => new TestSuggestionDto
        {
            File = ts.File,
            Function = ts.Function,
            Reason = ts.Reason,
            SuggestedTestCases = ts.SuggestedTestCases
        }).ToList(),
        CreatedAt = review.CreatedAt,
        CompletedAt = review.CompletedAt
    };
}

// === DTOs ===

public class TriggerMultiAgentReviewDto
{
    public int ProjectId { get; set; }
    public string? ProjectPath { get; set; }
    public string? ProjectType { get; set; }
}

public class MultiAgentReviewDto
{
    public Guid Id { get; set; }
    public int ProjectId { get; set; }
    public string Status { get; set; } = "";
    public int CompositeRiskScore { get; set; }
    public int ComplexityRisk { get; set; }
    public int FilesChangedRisk { get; set; }
    public int TestCoverageRisk { get; set; }
    public int SecurityRisk { get; set; }
    public List<AgentReviewResultDto> AgentResults { get; set; } = new();
    public List<TestSuggestionDto> TestSuggestions { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class AgentReviewResultDto
{
    public string AgentType { get; set; } = "";
    public string Status { get; set; } = "";
    public int RiskScore { get; set; }
    public List<AgentFindingDto> Findings { get; set; } = new();
    public string Summary { get; set; } = "";
    public DateTime? CompletedAt { get; set; }
}

public class AgentFindingDto
{
    public string Severity { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string? File { get; set; }
    public string? Line { get; set; }
    public string? Suggestion { get; set; }
}

public class TestSuggestionDto
{
    public string File { get; set; } = "";
    public string Function { get; set; } = "";
    public string Reason { get; set; } = "";
    public List<string> SuggestedTestCases { get; set; } = new();
}

public class MultiAgentReviewSummaryDto
{
    public Guid Id { get; set; }
    public int ProjectId { get; set; }
    public string Status { get; set; } = "";
    public int CompositeRiskScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class RiskBreakdownDto
{
    public int CompositeRiskScore { get; set; }
    public int ComplexityRisk { get; set; }
    public int FilesChangedRisk { get; set; }
    public int TestCoverageRisk { get; set; }
    public int SecurityRisk { get; set; }
}

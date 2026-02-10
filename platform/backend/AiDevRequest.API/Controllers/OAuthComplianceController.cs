using System.Security.Claims;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{requestId:guid}/oauth")]
public class OAuthComplianceController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly IOAuthComplianceService _oauthComplianceService;
    private readonly ILogger<OAuthComplianceController> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public OAuthComplianceController(
        AiDevRequestDbContext context,
        IOAuthComplianceService oauthComplianceService,
        ILogger<OAuthComplianceController> logger)
    {
        _context = context;
        _oauthComplianceService = oauthComplianceService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Trigger OAuth scope analysis for a project
    /// </summary>
    [HttpPost("analyze")]
    [ProducesResponseType(typeof(OAuthAnalysisResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OAuthAnalysisResponse>> AnalyzeScopes(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        if (string.IsNullOrEmpty(entity.ProjectPath))
            return BadRequest(new { error = "Project has not been built yet." });

        _logger.LogInformation("Triggering OAuth scope analysis for request {RequestId}", requestId);

        try
        {
            var report = await _oauthComplianceService.AnalyzeScopesAsync(requestId, entity.ProjectPath);

            return Ok(new OAuthAnalysisResponse
            {
                ReportId = report.Id,
                TotalScopesDetected = report.TotalScopesDetected,
                OverPermissionedCount = report.OverPermissionedCount,
                Status = report.Status,
                CreatedAt = report.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OAuth scope analysis failed for request {RequestId}", requestId);
            return StatusCode(500, new { error = "OAuth scope analysis failed." });
        }
    }

    /// <summary>
    /// Get OAuth compliance report for a project
    /// </summary>
    [HttpGet("report")]
    [ProducesResponseType(typeof(OAuthComplianceReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OAuthComplianceReportResponse>> GetReport(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var report = await _oauthComplianceService.GetComplianceReportAsync(requestId);
        if (report == null)
            return NotFound(new { error = "No OAuth compliance report found. Run scope analysis first." });

        return Ok(new OAuthComplianceReportResponse
        {
            Id = report.Id,
            TotalScopesDetected = report.TotalScopesDetected,
            OverPermissionedCount = report.OverPermissionedCount,
            ScopesAnalyzedJson = report.ScopesAnalyzedJson,
            RecommendationsJson = report.RecommendationsJson,
            ComplianceDocsJson = report.ComplianceDocsJson,
            Status = report.Status,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt
        });
    }

    /// <summary>
    /// Generate compliance documentation for a project
    /// </summary>
    [HttpPost("compliance-docs")]
    [ProducesResponseType(typeof(OAuthComplianceReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OAuthComplianceReportResponse>> GenerateComplianceDocs(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        _logger.LogInformation("Generating OAuth compliance docs for request {RequestId}", requestId);

        try
        {
            var report = await _oauthComplianceService.GenerateComplianceDocAsync(requestId);

            return Ok(new OAuthComplianceReportResponse
            {
                Id = report.Id,
                TotalScopesDetected = report.TotalScopesDetected,
                OverPermissionedCount = report.OverPermissionedCount,
                ScopesAnalyzedJson = report.ScopesAnalyzedJson,
                RecommendationsJson = report.RecommendationsJson,
                ComplianceDocsJson = report.ComplianceDocsJson,
                Status = report.Status,
                CreatedAt = report.CreatedAt,
                UpdatedAt = report.UpdatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Compliance doc generation failed for request {RequestId}", requestId);
            return StatusCode(500, new { error = "Compliance document generation failed." });
        }
    }

    /// <summary>
    /// Get generated compliance documentation
    /// </summary>
    [HttpGet("compliance-docs")]
    [ProducesResponseType(typeof(ComplianceDocumentation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ComplianceDocumentation>> GetComplianceDocs(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var report = await _oauthComplianceService.GetComplianceReportAsync(requestId);
        if (report == null || string.IsNullOrEmpty(report.ComplianceDocsJson))
            return NotFound(new { error = "No compliance docs found. Generate them first." });

        var docs = JsonSerializer.Deserialize<ComplianceDocumentation>(report.ComplianceDocsJson, JsonOptions);
        if (docs == null)
            return NotFound(new { error = "Failed to parse compliance documentation." });

        return Ok(docs);
    }

    /// <summary>
    /// List OAuth scopes with justifications
    /// </summary>
    [HttpGet("scopes")]
    [ProducesResponseType(typeof(List<OAuthScopeDetail>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<OAuthScopeDetail>>> GetScopes(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var scopes = await _oauthComplianceService.GetScopesWithJustificationsAsync(requestId);
        return Ok(scopes);
    }
}

#region Response DTOs

public record OAuthAnalysisResponse
{
    public Guid ReportId { get; init; }
    public int TotalScopesDetected { get; init; }
    public int OverPermissionedCount { get; init; }
    public string Status { get; init; } = "";
    public DateTime CreatedAt { get; init; }
}

public record OAuthComplianceReportResponse
{
    public Guid Id { get; init; }
    public int TotalScopesDetected { get; init; }
    public int OverPermissionedCount { get; init; }
    public string ScopesAnalyzedJson { get; init; } = "[]";
    public string RecommendationsJson { get; init; } = "[]";
    public string? ComplianceDocsJson { get; init; }
    public string Status { get; init; } = "";
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

#endregion

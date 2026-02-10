using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/requests/{requestId:guid}/security")]
public class SecurityController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ISecurityService _securityService;
    private readonly ILogger<SecurityController> _logger;

    public SecurityController(
        AiDevRequestDbContext context,
        ISecurityService securityService,
        ILogger<SecurityController> logger)
    {
        _context = context;
        _securityService = securityService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Trigger SBOM generation and vulnerability scan for a project
    /// </summary>
    [HttpPost("scan")]
    [ProducesResponseType(typeof(SecurityScanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SecurityScanResponse>> TriggerScan(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        if (string.IsNullOrEmpty(entity.ProjectPath))
            return BadRequest(new { error = "Project has not been built yet." });

        _logger.LogInformation("Triggering security scan for request {RequestId}", requestId);

        try
        {
            var projectType = "web"; // default
            var sbomReport = await _securityService.GenerateSbomAsync(requestId, entity.ProjectPath, projectType);
            var vulnerabilities = await _securityService.ScanVulnerabilitiesAsync(sbomReport.Id);

            var criticalCount = vulnerabilities.Count(v => v.Severity == "critical");
            var highCount = vulnerabilities.Count(v => v.Severity == "high");
            var mediumCount = vulnerabilities.Count(v => v.Severity == "medium");
            var lowCount = vulnerabilities.Count(v => v.Severity == "low");

            return Ok(new SecurityScanResponse
            {
                SbomReportId = sbomReport.Id,
                DependencyCount = sbomReport.DependencyCount,
                VulnerabilityCount = vulnerabilities.Count,
                CriticalCount = criticalCount,
                HighCount = highCount,
                MediumCount = mediumCount,
                LowCount = lowCount,
                GeneratedAt = sbomReport.GeneratedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Security scan failed for request {RequestId}", requestId);
            return StatusCode(500, new { error = "Security scan failed." });
        }
    }

    /// <summary>
    /// Get SBOM report for a project
    /// </summary>
    [HttpGet("sbom")]
    [ProducesResponseType(typeof(SbomReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SbomReportResponse>> GetSbom(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var report = await _context.SbomReports
            .Where(r => r.DevRequestId == requestId)
            .OrderByDescending(r => r.GeneratedAt)
            .FirstOrDefaultAsync();

        if (report == null)
            return NotFound(new { error = "No SBOM report found. Run a security scan first." });

        return Ok(new SbomReportResponse
        {
            Id = report.Id,
            Format = report.Format,
            ComponentsJson = report.ComponentsJson,
            DependencyCount = report.DependencyCount,
            LicensesSummaryJson = report.LicensesSummaryJson,
            GeneratedAt = report.GeneratedAt
        });
    }

    /// <summary>
    /// Get vulnerability results for a project
    /// </summary>
    [HttpGet("vulnerabilities")]
    [ProducesResponseType(typeof(List<VulnerabilityResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<VulnerabilityResponse>>> GetVulnerabilities(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var report = await _context.SbomReports
            .Where(r => r.DevRequestId == requestId)
            .OrderByDescending(r => r.GeneratedAt)
            .FirstOrDefaultAsync();

        if (report == null)
            return NotFound(new { error = "No SBOM report found. Run a security scan first." });

        var results = await _context.VulnerabilityResults
            .Where(v => v.SbomReportId == report.Id)
            .OrderByDescending(v => v.Severity == "critical" ? 0 :
                                    v.Severity == "high" ? 1 :
                                    v.Severity == "medium" ? 2 :
                                    v.Severity == "low" ? 3 : 4)
            .Select(v => new VulnerabilityResponse
            {
                Id = v.Id,
                PackageName = v.PackageName,
                PackageVersion = v.PackageVersion,
                Ecosystem = v.Ecosystem,
                VulnerabilityId = v.VulnerabilityId,
                Severity = v.Severity,
                Summary = v.Summary,
                FixedVersion = v.FixedVersion,
                ScannedAt = v.ScannedAt
            })
            .ToListAsync();

        return Ok(results);
    }

    /// <summary>
    /// Get license analysis for a project
    /// </summary>
    [HttpGet("licenses")]
    [ProducesResponseType(typeof(LicenseAnalysis), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LicenseAnalysis>> GetLicenses(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var report = await _context.SbomReports
            .Where(r => r.DevRequestId == requestId)
            .OrderByDescending(r => r.GeneratedAt)
            .FirstOrDefaultAsync();

        if (report == null)
            return NotFound(new { error = "No SBOM report found. Run a security scan first." });

        var analysis = await _securityService.GetLicenseAnalysisAsync(report.Id);
        return Ok(analysis);
    }

    /// <summary>
    /// Export SBOM in CycloneDX or SPDX format
    /// </summary>
    [HttpGet("sbom/export/{format}")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportSbom(Guid requestId, string format)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var report = await _context.SbomReports
            .Where(r => r.DevRequestId == requestId)
            .OrderByDescending(r => r.GeneratedAt)
            .FirstOrDefaultAsync();

        if (report == null)
            return NotFound(new { error = "No SBOM report found. Run a security scan first." });

        if (!format.Equals("cyclonedx", StringComparison.OrdinalIgnoreCase) &&
            !format.Equals("spdx", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "Unsupported format. Use 'cyclonedx' or 'spdx'." });
        }

        var bytes = await _securityService.ExportSbomAsync(report.Id, format);
        var fileName = $"sbom-{requestId:N}.{format.ToLowerInvariant()}.json";

        return File(bytes, "application/json", fileName);
    }
}

#region Response DTOs

public record SecurityScanResponse
{
    public Guid SbomReportId { get; init; }
    public int DependencyCount { get; init; }
    public int VulnerabilityCount { get; init; }
    public int CriticalCount { get; init; }
    public int HighCount { get; init; }
    public int MediumCount { get; init; }
    public int LowCount { get; init; }
    public DateTime GeneratedAt { get; init; }
}

public record SbomReportResponse
{
    public Guid Id { get; init; }
    public string Format { get; init; } = "";
    public string ComponentsJson { get; init; } = "[]";
    public int DependencyCount { get; init; }
    public string? LicensesSummaryJson { get; init; }
    public DateTime GeneratedAt { get; init; }
}

public record VulnerabilityResponse
{
    public Guid Id { get; init; }
    public string PackageName { get; init; } = "";
    public string PackageVersion { get; init; } = "";
    public string Ecosystem { get; init; } = "";
    public string VulnerabilityId { get; init; } = "";
    public string Severity { get; init; } = "";
    public string Summary { get; init; } = "";
    public string? FixedVersion { get; init; }
    public DateTime ScannedAt { get; init; }
}

#endregion

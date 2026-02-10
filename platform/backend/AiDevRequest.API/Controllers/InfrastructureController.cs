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
[Route("api/projects/{projectId:guid}/infrastructure")]
public class InfrastructureController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly IInfrastructureService _infrastructureService;
    private readonly ILogger<InfrastructureController> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public InfrastructureController(
        AiDevRequestDbContext context,
        IInfrastructureService infrastructureService,
        ILogger<InfrastructureController> logger)
    {
        _context = context;
        _infrastructureService = infrastructureService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Analyze project requirements and suggest infrastructure
    /// </summary>
    [HttpPost("analyze")]
    [ProducesResponseType(typeof(InfrastructureConfigResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InfrastructureConfigResponse>> AnalyzeRequirements(Guid projectId)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        _logger.LogInformation("Analyzing infrastructure for project {ProjectId}", projectId);

        try
        {
            var config = await _infrastructureService.AnalyzeRequirementsAsync(projectId);
            return Ok(MapToResponse(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Infrastructure analysis failed for project {ProjectId}", projectId);
            return StatusCode(500, new { error = "Infrastructure analysis failed." });
        }
    }

    /// <summary>
    /// Get current infrastructure configuration
    /// </summary>
    [HttpGet("config")]
    [ProducesResponseType(typeof(InfrastructureConfigResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InfrastructureConfigResponse>> GetConfig(Guid projectId)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var config = await _infrastructureService.GetConfigAsync(projectId);
        if (config == null)
            return NotFound(new { error = "No infrastructure config found. Run analysis first." });

        return Ok(MapToResponse(config));
    }

    /// <summary>
    /// Update infrastructure configuration (user selections)
    /// </summary>
    [HttpPut("config")]
    [ProducesResponseType(typeof(InfrastructureConfigResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InfrastructureConfigResponse>> UpdateConfig(
        Guid projectId,
        [FromBody] UpdateInfrastructureConfigRequest request)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        try
        {
            var config = await _infrastructureService.UpdateConfigAsync(
                projectId, request.SelectedServices, request.Tier);
            return Ok(MapToResponse(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update infrastructure config for project {ProjectId}", projectId);
            return StatusCode(500, new { error = "Failed to update configuration." });
        }
    }

    /// <summary>
    /// Generate Bicep templates from current configuration
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(InfrastructureConfigResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InfrastructureConfigResponse>> GenerateBicep(Guid projectId)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        try
        {
            var config = await _infrastructureService.GenerateBicepAsync(projectId);
            return Ok(MapToResponse(config));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bicep generation failed for project {ProjectId}", projectId);
            return StatusCode(500, new { error = "Bicep generation failed." });
        }
    }

    /// <summary>
    /// Get cost estimation for selected services
    /// </summary>
    [HttpGet("cost")]
    [ProducesResponseType(typeof(CostEstimation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CostEstimation>> GetCostEstimation(Guid projectId)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var config = await _infrastructureService.GetConfigAsync(projectId);
        if (config == null)
            return NotFound(new { error = "No infrastructure config found. Run analysis first." });

        var services = JsonSerializer.Deserialize<List<string>>(config.SelectedServicesJson, JsonOptions)
            ?? new List<string>();

        var estimation = await _infrastructureService.EstimateCostAsync(services, config.Tier);
        return Ok(estimation);
    }

    /// <summary>
    /// Download generated Bicep templates as ZIP
    /// </summary>
    [HttpGet("templates")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadTemplates(Guid projectId)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        try
        {
            var bytes = await _infrastructureService.ExportTemplatesAsync(projectId);
            return File(bytes, "application/zip", $"infrastructure-{projectId:N}.zip");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Template export failed for project {ProjectId}", projectId);
            return StatusCode(500, new { error = "Template export failed." });
        }
    }

    private static InfrastructureConfigResponse MapToResponse(Entities.InfrastructureConfig config)
    {
        var services = JsonSerializer.Deserialize<List<string>>(config.SelectedServicesJson, JsonOptions)
            ?? new List<string>();

        return new InfrastructureConfigResponse
        {
            Id = config.Id,
            DevRequestId = config.DevRequestId,
            SelectedServices = services,
            Tier = config.Tier,
            EstimatedMonthlyCostUsd = config.EstimatedMonthlyCostUsd,
            GeneratedBicepMain = config.GeneratedBicepMain,
            GeneratedBicepParameters = config.GeneratedBicepParameters,
            AnalysisSummary = config.AnalysisSummary,
            CreatedAt = config.CreatedAt,
            UpdatedAt = config.UpdatedAt
        };
    }
}

#region Request/Response DTOs

public record UpdateInfrastructureConfigRequest
{
    public List<string> SelectedServices { get; init; } = new();
    public string Tier { get; init; } = "Basic";
}

public record InfrastructureConfigResponse
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public List<string> SelectedServices { get; init; } = new();
    public string Tier { get; init; } = "Basic";
    public decimal EstimatedMonthlyCostUsd { get; init; }
    public string? GeneratedBicepMain { get; init; }
    public string? GeneratedBicepParameters { get; init; }
    public string? AnalysisSummary { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

#endregion

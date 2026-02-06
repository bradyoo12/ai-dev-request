using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SitesController : ControllerBase
{
    private readonly IDeploymentService _deploymentService;
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SitesController> _logger;

    public SitesController(
        IDeploymentService deploymentService,
        AiDevRequestDbContext context,
        ILogger<SitesController> logger)
    {
        _deploymentService = deploymentService;
        _context = context;
        _logger = logger;
    }

    private string GetUserId()
    {
        return Request.Headers["X-User-Id"].FirstOrDefault() ?? "anonymous";
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<SiteResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SiteResponseDto>>> GetSites()
    {
        var userId = GetUserId();
        var deployments = await _deploymentService.GetUserDeploymentsAsync(userId);

        var sites = deployments.Select(d => new SiteResponseDto
        {
            Id = d.Id,
            DevRequestId = d.DevRequestId,
            SiteName = d.SiteName,
            ResourceGroupName = d.ResourceGroupName,
            Status = d.Status.ToString(),
            PreviewUrl = d.PreviewUrl,
            ContainerAppName = d.ContainerAppName,
            Region = d.Region,
            ProjectType = d.ProjectType,
            CreatedAt = d.CreatedAt,
            DeployedAt = d.DeployedAt,
            UpdatedAt = d.UpdatedAt
        }).ToList();

        return Ok(sites);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SiteDetailResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SiteDetailResponseDto>> GetSite(Guid id)
    {
        var deployment = await _deploymentService.GetDeploymentAsync(id);
        if (deployment == null)
            return NotFound();

        var userId = GetUserId();
        if (deployment.UserId != userId)
            return NotFound();

        var logs = await _deploymentService.GetLogsAsync(id);

        return Ok(new SiteDetailResponseDto
        {
            Id = deployment.Id,
            DevRequestId = deployment.DevRequestId,
            SiteName = deployment.SiteName,
            ResourceGroupName = deployment.ResourceGroupName,
            Status = deployment.Status.ToString(),
            PreviewUrl = deployment.PreviewUrl,
            ContainerAppName = deployment.ContainerAppName,
            ContainerImageTag = deployment.ContainerImageTag,
            Region = deployment.Region,
            ProjectType = deployment.ProjectType,
            CreatedAt = deployment.CreatedAt,
            DeployedAt = deployment.DeployedAt,
            UpdatedAt = deployment.UpdatedAt,
            Logs = logs.Select(l => new DeploymentLogDto
            {
                Timestamp = l.Timestamp,
                Message = l.Message,
                Level = l.Level
            }).ToList()
        });
    }

    [HttpPost]
    [ProducesResponseType(typeof(SiteResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SiteResponseDto>> CreateSite([FromBody] CreateSiteDto dto)
    {
        var userId = GetUserId();

        // Validate DevRequest exists and belongs to user
        var devRequest = await _context.DevRequests.FindAsync(dto.DevRequestId);
        if (devRequest == null)
            return BadRequest(new { error = "Development request not found." });

        if (devRequest.Status != RequestStatus.Staging && devRequest.Status != RequestStatus.Completed)
            return BadRequest(new { error = "Project must be built before deploying." });

        // Check if deployment already exists for this request
        var existing = await _context.Deployments
            .FirstOrDefaultAsync(d => d.DevRequestId == dto.DevRequestId && d.UserId == userId && d.Status != DeploymentStatus.Deleted);
        if (existing != null)
            return BadRequest(new { error = "A deployment already exists for this request.", existingDeploymentId = existing.Id });

        var deployment = await _deploymentService.CreateDeploymentAsync(
            dto.DevRequestId,
            userId,
            dto.SiteName,
            devRequest.Category.ToString(),
            devRequest.ProjectPath
        );

        _logger.LogInformation("Site created: {SiteId} for user {UserId}", deployment.Id, userId);

        // Start deployment in background
        _ = Task.Run(async () =>
        {
            try
            {
                await _deploymentService.DeployAsync(deployment.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background deployment failed for {DeploymentId}", deployment.Id);
            }
        });

        var response = new SiteResponseDto
        {
            Id = deployment.Id,
            DevRequestId = deployment.DevRequestId,
            SiteName = deployment.SiteName,
            ResourceGroupName = deployment.ResourceGroupName,
            Status = deployment.Status.ToString(),
            PreviewUrl = deployment.PreviewUrl,
            ContainerAppName = deployment.ContainerAppName,
            Region = deployment.Region,
            ProjectType = deployment.ProjectType,
            CreatedAt = deployment.CreatedAt,
            DeployedAt = deployment.DeployedAt,
            UpdatedAt = deployment.UpdatedAt
        };

        return CreatedAtAction(nameof(GetSite), new { id = deployment.Id }, response);
    }

    [HttpPost("{id:guid}/redeploy")]
    [ProducesResponseType(typeof(SiteResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SiteResponseDto>> RedeploySite(Guid id)
    {
        var deployment = await _deploymentService.GetDeploymentAsync(id);
        if (deployment == null)
            return NotFound();

        var userId = GetUserId();
        if (deployment.UserId != userId)
            return NotFound();

        if (deployment.Status != DeploymentStatus.Failed)
            return BadRequest(new { error = "Only failed deployments can be redeployed." });

        _logger.LogInformation("Redeploying site {SiteId}", id);

        // Start redeployment in background
        _ = Task.Run(async () =>
        {
            try
            {
                await _deploymentService.RedeployAsync(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background redeployment failed for {DeploymentId}", id);
            }
        });

        return Ok(new SiteResponseDto
        {
            Id = deployment.Id,
            DevRequestId = deployment.DevRequestId,
            SiteName = deployment.SiteName,
            ResourceGroupName = deployment.ResourceGroupName,
            Status = DeploymentStatus.Pending.ToString(),
            PreviewUrl = deployment.PreviewUrl,
            ContainerAppName = deployment.ContainerAppName,
            Region = deployment.Region,
            ProjectType = deployment.ProjectType,
            CreatedAt = deployment.CreatedAt,
            DeployedAt = deployment.DeployedAt,
            UpdatedAt = DateTime.UtcNow
        });
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSite(Guid id)
    {
        var deployment = await _deploymentService.GetDeploymentAsync(id);
        if (deployment == null)
            return NotFound();

        var userId = GetUserId();
        if (deployment.UserId != userId)
            return NotFound();

        _logger.LogInformation("Deleting site {SiteId} for user {UserId}", id, userId);
        await _deploymentService.DeleteDeploymentAsync(id);

        return NoContent();
    }

    [HttpGet("{id:guid}/logs")]
    [ProducesResponseType(typeof(List<DeploymentLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<DeploymentLogDto>>> GetLogs(Guid id)
    {
        var deployment = await _deploymentService.GetDeploymentAsync(id);
        if (deployment == null)
            return NotFound();

        var userId = GetUserId();
        if (deployment.UserId != userId)
            return NotFound();

        var logs = await _deploymentService.GetLogsAsync(id);
        return Ok(logs.Select(l => new DeploymentLogDto
        {
            Timestamp = l.Timestamp,
            Message = l.Message,
            Level = l.Level
        }).ToList());
    }
}

public record CreateSiteDto
{
    public Guid DevRequestId { get; init; }
    public required string SiteName { get; init; }
}

public record SiteResponseDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string SiteName { get; init; } = "";
    public string? ResourceGroupName { get; init; }
    public string Status { get; init; } = "";
    public string? PreviewUrl { get; init; }
    public string? ContainerAppName { get; init; }
    public string Region { get; init; } = "";
    public string? ProjectType { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? DeployedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record SiteDetailResponseDto : SiteResponseDto
{
    public string? ContainerImageTag { get; init; }
    public List<DeploymentLogDto> Logs { get; init; } = [];
}

public record DeploymentLogDto
{
    public DateTime Timestamp { get; init; }
    public string Message { get; init; } = "";
    public string Level { get; init; } = "info";
}

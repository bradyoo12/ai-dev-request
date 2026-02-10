using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{id}/containers")]
public class ContainerizationController : ControllerBase
{
    private readonly IContainerizationService _containerizationService;
    private readonly ILogger<ContainerizationController> _logger;

    public ContainerizationController(IContainerizationService containerizationService, ILogger<ContainerizationController> logger)
    {
        _containerizationService = containerizationService;
        _logger = logger;
    }

    /// <summary>Generate Dockerfile and docker-compose for a project</summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(ContainerConfigDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ContainerConfigDto>> GenerateDockerfile(int id)
    {
        try
        {
            var config = await _containerizationService.GenerateDockerfileAsync(id);
            return Ok(MapToDto(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Dockerfile for project {ProjectId}", id);
            return BadRequest(new { error = "Failed to generate Dockerfile" });
        }
    }

    /// <summary>Get container configuration for a project</summary>
    [HttpGet("config")]
    [ProducesResponseType(typeof(ContainerConfigDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContainerConfigDto>> GetConfig(int id)
    {
        var config = await _containerizationService.GetConfigAsync(id);
        if (config == null)
            return NotFound(new { error = "Container configuration not found" });

        return Ok(MapToDto(config));
    }

    /// <summary>Trigger container build for a project</summary>
    [HttpPost("build")]
    [ProducesResponseType(typeof(ContainerConfigDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContainerConfigDto>> TriggerBuild(int id)
    {
        try
        {
            var config = await _containerizationService.TriggerBuildAsync(id);
            if (config == null)
                return NotFound(new { error = "Container configuration not found. Generate a Dockerfile first." });

            return Ok(MapToDto(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to trigger build for project {ProjectId}", id);
            return BadRequest(new { error = "Failed to trigger build" });
        }
    }

    /// <summary>Get build status for a project</summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(ContainerBuildStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContainerBuildStatusDto>> GetBuildStatus(int id)
    {
        var status = await _containerizationService.GetBuildStatusAsync(id);
        if (status == null)
            return NotFound(new { error = "Container configuration not found" });

        return Ok(new ContainerBuildStatusDto
        {
            ProjectId = status.ProjectId,
            Status = status.Status,
            ImageName = status.ImageName,
            ImageTag = status.ImageTag,
            BuildDurationMs = status.BuildDurationMs,
            ErrorMessage = status.ErrorMessage,
            BuiltAt = status.BuiltAt,
            DeployedAt = status.DeployedAt,
        });
    }

    /// <summary>Get build logs for a project</summary>
    [HttpGet("logs")]
    [ProducesResponseType(typeof(ContainerBuildLogsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContainerBuildLogsDto>> GetBuildLogs(int id)
    {
        var logs = await _containerizationService.GetBuildLogsAsync(id);
        if (logs == null)
            return NotFound(new { error = "Container configuration not found" });

        return Ok(new ContainerBuildLogsDto
        {
            ProjectId = logs.ProjectId,
            Status = logs.Status,
            Logs = logs.Logs,
        });
    }

    /// <summary>Deploy container for a project</summary>
    [HttpPost("deploy")]
    [ProducesResponseType(typeof(ContainerConfigDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContainerConfigDto>> Deploy(int id)
    {
        try
        {
            var config = await _containerizationService.DeployAsync(id);
            if (config == null)
                return NotFound(new { error = "Container configuration not found" });

            return Ok(MapToDto(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deploy container for project {ProjectId}", id);
            return BadRequest(new { error = "Failed to deploy container" });
        }
    }

    /// <summary>Generate Kubernetes manifest for a project</summary>
    [HttpPost("k8s")]
    [ProducesResponseType(typeof(ContainerConfigDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContainerConfigDto>> GenerateK8sManifest(int id)
    {
        try
        {
            var config = await _containerizationService.GenerateK8sManifestAsync(id);
            if (config == null)
                return NotFound(new { error = "Container configuration not found. Generate a Dockerfile first." });

            return Ok(MapToDto(config));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate K8s manifest for project {ProjectId}", id);
            return BadRequest(new { error = "Failed to generate K8s manifest" });
        }
    }

    private static ContainerConfigDto MapToDto(Entities.ContainerConfig c) => new()
    {
        Id = c.Id,
        ProjectId = c.ProjectId,
        DetectedStack = c.DetectedStack,
        Dockerfile = c.Dockerfile,
        ComposeFile = c.ComposeFile,
        K8sManifest = c.K8sManifest,
        RegistryUrl = c.RegistryUrl,
        ImageName = c.ImageName,
        ImageTag = c.ImageTag,
        BuildStatus = c.BuildStatus,
        BuildLogs = c.BuildLogs,
        ErrorMessage = c.ErrorMessage,
        BuildDurationMs = c.BuildDurationMs,
        CreatedAt = c.CreatedAt,
        BuiltAt = c.BuiltAt,
        DeployedAt = c.DeployedAt,
    };
}

// === DTOs ===

public record ContainerConfigDto
{
    public Guid Id { get; init; }
    public int ProjectId { get; init; }
    public string DetectedStack { get; init; } = "";
    public string Dockerfile { get; init; } = "";
    public string? ComposeFile { get; init; }
    public string? K8sManifest { get; init; }
    public string? RegistryUrl { get; init; }
    public string ImageName { get; init; } = "";
    public string ImageTag { get; init; } = "";
    public string BuildStatus { get; init; } = "";
    public string? BuildLogs { get; init; }
    public string? ErrorMessage { get; init; }
    public int BuildDurationMs { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? BuiltAt { get; init; }
    public DateTime? DeployedAt { get; init; }
}

public record ContainerBuildStatusDto
{
    public int ProjectId { get; init; }
    public string Status { get; init; } = "";
    public string ImageName { get; init; } = "";
    public string ImageTag { get; init; } = "";
    public int BuildDurationMs { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime? BuiltAt { get; init; }
    public DateTime? DeployedAt { get; init; }
}

public record ContainerBuildLogsDto
{
    public int ProjectId { get; init; }
    public string Status { get; init; } = "";
    public string Logs { get; init; } = "[]";
}

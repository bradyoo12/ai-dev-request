using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/projects/{projectId}")]
public class PreviewController : ControllerBase
{
    private readonly IPreviewDeploymentService _previewService;

    public PreviewController(IPreviewDeploymentService previewService)
    {
        _previewService = previewService;
    }

    [HttpPost("preview/deploy")]
    [ProducesResponseType(typeof(PreviewDeploymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PreviewDeploymentDto>> DeployPreview(Guid projectId)
    {
        var userId = User.FindFirst("sub")?.Value ?? "anonymous";
        var preview = await _previewService.DeployPreviewAsync(projectId, userId);
        return Ok(ToDto(preview));
    }

    [HttpGet("preview/status")]
    [ProducesResponseType(typeof(PreviewDeploymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PreviewDeploymentDto>> GetPreviewStatus(Guid projectId)
    {
        var preview = await _previewService.GetPreviewStatusAsync(projectId);
        if (preview == null) return NotFound();
        return Ok(ToDto(preview));
    }

    [HttpGet("preview/url")]
    [ProducesResponseType(typeof(PreviewUrlDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PreviewUrlDto>> GetPreviewUrl(Guid projectId)
    {
        var url = await _previewService.GetPreviewUrlAsync(projectId);
        if (url == null) return NotFound();
        return Ok(new PreviewUrlDto { PreviewUrl = url });
    }

    [HttpDelete("preview")]
    [ProducesResponseType(typeof(PreviewDeploymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PreviewDeploymentDto>> ExpirePreview(Guid projectId)
    {
        try
        {
            var preview = await _previewService.ExpirePreviewAsync(projectId);
            return Ok(ToDto(preview));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("previews")]
    [ProducesResponseType(typeof(List<PreviewDeploymentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PreviewDeploymentDto>>> ListPreviews(Guid projectId)
    {
        var previews = await _previewService.ListPreviewsAsync(projectId);
        return Ok(previews.Select(ToDto).ToList());
    }

    private static PreviewDeploymentDto ToDto(Entities.PreviewDeployment p) => new()
    {
        Id = p.Id,
        DevRequestId = p.DevRequestId,
        Status = p.Status.ToString(),
        PreviewUrl = p.PreviewUrl,
        Provider = p.Provider,
        DeployedAt = p.DeployedAt,
        ExpiresAt = p.ExpiresAt,
        CreatedAt = p.CreatedAt,
    };
}

public record PreviewDeploymentDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string Status { get; init; } = "";
    public string? PreviewUrl { get; init; }
    public string Provider { get; init; } = "";
    public DateTime? DeployedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record PreviewUrlDto
{
    public string PreviewUrl { get; init; } = "";
}

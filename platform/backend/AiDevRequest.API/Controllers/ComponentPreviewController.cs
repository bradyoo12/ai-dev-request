using System.Security.Claims;
using System.Text.Json;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/component-preview")]
public class ComponentPreviewController : ControllerBase
{
    private readonly IComponentPreviewService _previewService;

    public ComponentPreviewController(IComponentPreviewService previewService)
    {
        _previewService = previewService;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    [HttpGet]
    public async Task<ActionResult<List<ComponentPreviewDto>>> GetPreviews()
    {
        var previews = await _previewService.GetUserPreviewsAsync(GetUserId());
        return Ok(previews.Select(MapToDto).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ComponentPreviewDto>> GetPreview(Guid id)
    {
        var preview = await _previewService.GetPreviewAsync(id, GetUserId());
        if (preview == null) return NotFound(new { error = "Preview not found" });
        return Ok(MapToDto(preview));
    }

    [HttpPost]
    public async Task<ActionResult<ComponentPreviewDto>> CreatePreview([FromBody] CreatePreviewRequest request)
    {
        var preview = await _previewService.CreatePreviewAsync(GetUserId(), request.ComponentName, request.Prompt);
        return Ok(MapToDto(preview));
    }

    [HttpPost("{id:guid}/iterate")]
    public async Task<ActionResult<ComponentPreviewDto>> Iterate(Guid id, [FromBody] IterateRequest request)
    {
        try
        {
            var preview = await _previewService.IterateAsync(id, GetUserId(), request.Message);
            return Ok(MapToDto(preview));
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { error = "Preview not found" });
        }
    }

    [HttpPost("{id:guid}/export")]
    public async Task<ActionResult<ComponentPreviewDto>> Export(Guid id)
    {
        var preview = await _previewService.ExportAsync(id, GetUserId());
        if (preview == null) return NotFound(new { error = "Preview not found" });
        return Ok(MapToDto(preview));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var deleted = await _previewService.DeleteAsync(id, GetUserId());
        if (!deleted) return NotFound(new { error = "Preview not found" });
        return NoContent();
    }

    private static ComponentPreviewDto MapToDto(Entities.ComponentPreview p) => new()
    {
        Id = p.Id.ToString(),
        ComponentName = p.ComponentName,
        Code = p.Code,
        ChatHistory = JsonSerializer.Deserialize<List<JsonElement>>(p.ChatHistoryJson) ?? new(),
        IterationCount = p.IterationCount,
        Status = p.Status,
        DesignTokens = p.DesignTokensJson,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
    };
}

public record CreatePreviewRequest
{
    public string ComponentName { get; init; } = "Untitled Component";
    public string Prompt { get; init; } = "";
}

public record IterateRequest
{
    public string Message { get; init; } = "";
}

public record ComponentPreviewDto
{
    public string Id { get; init; } = "";
    public string ComponentName { get; init; } = "";
    public string Code { get; init; } = "";
    public List<System.Text.Json.JsonElement> ChatHistory { get; init; } = new();
    public int IterationCount { get; init; }
    public string Status { get; init; } = "";
    public string? DesignTokens { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

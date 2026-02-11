using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/requests/{requestId:guid}/variants")]
public class VariantController : ControllerBase
{
    private readonly IVariantGenerationService _variantService;

    public VariantController(IVariantGenerationService variantService)
    {
        _variantService = variantService;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new InvalidOperationException("User not authenticated.");

    [HttpPost("generate")]
    public async Task<ActionResult<List<VariantDto>>> GenerateVariants(
        Guid requestId,
        [FromBody] GenerateVariantsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest(new { error = "Description is required" });

        var variants = await _variantService.GenerateVariantsAsync(requestId, GetUserId(), request.Description);
        return Ok(variants.Select(MapToDto).ToList());
    }

    [HttpGet]
    public async Task<ActionResult<List<VariantDto>>> GetVariants(Guid requestId)
    {
        var variants = await _variantService.GetVariantsAsync(requestId, GetUserId());
        return Ok(variants.Select(MapToDto).ToList());
    }

    [HttpGet("{variantId:guid}")]
    public async Task<ActionResult<VariantDto>> GetVariant(Guid requestId, Guid variantId)
    {
        var variant = await _variantService.GetVariantAsync(requestId, variantId, GetUserId());
        if (variant == null) return NotFound(new { error = "Variant not found" });
        return Ok(MapToDto(variant));
    }

    [HttpPost("{variantId:guid}/select")]
    public async Task<ActionResult<VariantDto>> SelectVariant(Guid requestId, Guid variantId)
    {
        var variant = await _variantService.SelectVariantAsync(requestId, variantId, GetUserId());
        if (variant == null) return NotFound(new { error = "Variant not found" });
        return Ok(MapToDto(variant));
    }

    [HttpPost("{variantId:guid}/rate")]
    public async Task<ActionResult<VariantDto>> RateVariant(
        Guid requestId,
        Guid variantId,
        [FromBody] RateVariantRequest request)
    {
        if (request.Rating < 1 || request.Rating > 5)
            return BadRequest(new { error = "Rating must be between 1 and 5" });

        var variant = await _variantService.RateVariantAsync(requestId, variantId, GetUserId(), request.Rating);
        if (variant == null) return NotFound(new { error = "Variant not found" });
        return Ok(MapToDto(variant));
    }

    [HttpDelete]
    public async Task<ActionResult> DeleteVariants(Guid requestId)
    {
        var deleted = await _variantService.DeleteVariantsAsync(requestId, GetUserId());
        if (!deleted) return NotFound(new { error = "No variants found" });
        return NoContent();
    }

    private static VariantDto MapToDto(Entities.GenerationVariant v) => new()
    {
        Id = v.Id.ToString(),
        DevRequestId = v.DevRequestId.ToString(),
        VariantNumber = v.VariantNumber,
        Approach = v.Approach,
        Description = v.Description,
        FilesJson = v.FilesJson,
        FileCount = v.FileCount,
        LinesOfCode = v.LinesOfCode,
        DependencyCount = v.DependencyCount,
        EstimatedBundleSizeKb = v.EstimatedBundleSizeKb,
        ModelTier = v.ModelTier,
        TokensUsed = v.TokensUsed,
        Rating = v.Rating,
        IsSelected = v.IsSelected,
        Status = v.Status,
        CreatedAt = v.CreatedAt,
    };
}

public record GenerateVariantsRequest
{
    public string Description { get; init; } = "";
}

public record RateVariantRequest
{
    public int Rating { get; init; }
}

public record VariantDto
{
    public string Id { get; init; } = "";
    public string DevRequestId { get; init; } = "";
    public int VariantNumber { get; init; }
    public string Approach { get; init; } = "";
    public string Description { get; init; } = "";
    public string FilesJson { get; init; } = "[]";
    public int FileCount { get; init; }
    public int LinesOfCode { get; init; }
    public int DependencyCount { get; init; }
    public int EstimatedBundleSizeKb { get; init; }
    public string ModelTier { get; init; } = "";
    public int TokensUsed { get; init; }
    public int Rating { get; init; }
    public bool IsSelected { get; init; }
    public string Status { get; init; } = "";
    public DateTime CreatedAt { get; init; }
}

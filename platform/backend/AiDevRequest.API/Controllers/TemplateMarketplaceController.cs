using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/marketplace")]
public class TemplateMarketplaceController : ControllerBase
{
    private readonly ITemplateMarketplaceService _marketplaceService;
    private readonly ILogger<TemplateMarketplaceController> _logger;

    public TemplateMarketplaceController(ITemplateMarketplaceService marketplaceService, ILogger<TemplateMarketplaceController> logger)
    {
        _marketplaceService = marketplaceService;
        _logger = logger;
    }

    /// <summary>Browse marketplace templates with filters</summary>
    [HttpGet("templates")]
    [ProducesResponseType(typeof(MarketplaceBrowseResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MarketplaceBrowseResultDto>> BrowseTemplates(
        [FromQuery] string? category = null,
        [FromQuery] string? techStack = null,
        [FromQuery] string? search = null,
        [FromQuery] string sortBy = "popular")
    {
        var result = await _marketplaceService.BrowseTemplatesAsync(category, techStack, search, sortBy);
        return Ok(new MarketplaceBrowseResultDto
        {
            Templates = result.Templates.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
        });
    }

    /// <summary>Get template details by ID</summary>
    [HttpGet("templates/{id}")]
    [ProducesResponseType(typeof(MarketplaceTemplateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MarketplaceTemplateDto>> GetTemplate(Guid id)
    {
        var template = await _marketplaceService.GetTemplateAsync(id);
        if (template == null)
            return NotFound(new { error = "Template not found" });

        return Ok(MapToDto(template));
    }

    /// <summary>Submit a new template</summary>
    [HttpPost("templates")]
    [ProducesResponseType(typeof(MarketplaceTemplateDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MarketplaceTemplateDto>> SubmitTemplate([FromBody] SubmitMarketplaceTemplateDto dto)
    {
        try
        {
            var template = new MarketplaceTemplate
            {
                AuthorId = dto.AuthorId,
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                TechStack = dto.TechStack,
                Tags = dto.Tags,
                TemplateData = dto.TemplateData ?? "{}",
                PreviewImageUrl = dto.PreviewImageUrl,
            };

            var created = await _marketplaceService.SubmitTemplateAsync(template);
            return Created($"/api/marketplace/templates/{created.Id}", MapToDto(created));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to submit marketplace template");
            return BadRequest(new { error = "Failed to submit template" });
        }
    }

    /// <summary>Update an existing template</summary>
    [HttpPut("templates/{id}")]
    [ProducesResponseType(typeof(MarketplaceTemplateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MarketplaceTemplateDto>> UpdateTemplate(Guid id, [FromBody] UpdateMarketplaceTemplateDto dto)
    {
        try
        {
            var update = new MarketplaceTemplate
            {
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                TechStack = dto.TechStack,
                Tags = dto.Tags,
                TemplateData = dto.TemplateData ?? "{}",
                PreviewImageUrl = dto.PreviewImageUrl,
                Status = dto.Status ?? "draft",
            };

            var updated = await _marketplaceService.UpdateTemplateAsync(id, update);
            if (updated == null)
                return NotFound(new { error = "Template not found" });

            return Ok(MapToDto(updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update marketplace template {Id}", id);
            return BadRequest(new { error = "Failed to update template" });
        }
    }

    /// <summary>Import a template to create a new dev request</summary>
    [HttpPost("templates/{id}/import")]
    [ProducesResponseType(typeof(MarketplaceImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MarketplaceImportResultDto>> ImportTemplate(Guid id, [FromBody] ImportTemplateDto dto)
    {
        var result = await _marketplaceService.ImportTemplateAsync(id, dto.UserId);
        if (!result.Success)
            return NotFound(new { error = result.Error });

        return Ok(new MarketplaceImportResultDto
        {
            Success = result.Success,
            TemplateId = result.TemplateId,
            TemplateName = result.TemplateName,
            TemplateData = result.TemplateData,
        });
    }

    /// <summary>Rate a template (1-5)</summary>
    [HttpPost("templates/{id}/rate")]
    [ProducesResponseType(typeof(MarketplaceRateResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MarketplaceRateResultDto>> RateTemplate(Guid id, [FromBody] RateTemplateDto dto)
    {
        var result = await _marketplaceService.RateTemplateAsync(id, dto.UserId, dto.Rating);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return Ok(new MarketplaceRateResultDto
        {
            Success = result.Success,
            NewRating = result.NewRating,
            NewRatingCount = result.NewRatingCount,
        });
    }

    /// <summary>Get categories with template counts</summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(List<MarketplaceCategoryCountDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MarketplaceCategoryCountDto>>> GetCategories()
    {
        var categories = await _marketplaceService.GetCategoriesAsync();
        return Ok(categories.Select(c => new MarketplaceCategoryCountDto
        {
            Category = c.Category,
            Count = c.Count,
        }).ToList());
    }

    /// <summary>Get popular templates</summary>
    [HttpGet("templates/popular")]
    [ProducesResponseType(typeof(List<MarketplaceTemplateDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MarketplaceTemplateDto>>> GetPopular([FromQuery] int limit = 10)
    {
        var templates = await _marketplaceService.GetPopularAsync(limit);
        return Ok(templates.Select(MapToDto).ToList());
    }

    private static MarketplaceTemplateDto MapToDto(MarketplaceTemplate t) => new()
    {
        Id = t.Id,
        AuthorId = t.AuthorId,
        Name = t.Name,
        Description = t.Description,
        Category = t.Category,
        TechStack = t.TechStack,
        Tags = t.Tags,
        TemplateData = t.TemplateData,
        PreviewImageUrl = t.PreviewImageUrl,
        Rating = t.Rating,
        RatingCount = t.RatingCount,
        DownloadCount = t.DownloadCount,
        Status = t.Status,
        IsOfficial = t.IsOfficial,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt,
    };
}

// === DTOs ===

public record MarketplaceTemplateDto
{
    public Guid Id { get; init; }
    public int AuthorId { get; init; }
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Category { get; init; } = "";
    public string TechStack { get; init; } = "";
    public string? Tags { get; init; }
    public string TemplateData { get; init; } = "{}";
    public string? PreviewImageUrl { get; init; }
    public double Rating { get; init; }
    public int RatingCount { get; init; }
    public int DownloadCount { get; init; }
    public string Status { get; init; } = "";
    public bool IsOfficial { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record MarketplaceBrowseResultDto
{
    public List<MarketplaceTemplateDto> Templates { get; init; } = [];
    public int TotalCount { get; init; }
}

public record SubmitMarketplaceTemplateDto
{
    public int AuthorId { get; init; }
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Category { get; init; } = "";
    public string TechStack { get; init; } = "";
    public string? Tags { get; init; }
    public string? TemplateData { get; init; }
    public string? PreviewImageUrl { get; init; }
}

public record UpdateMarketplaceTemplateDto
{
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Category { get; init; } = "";
    public string TechStack { get; init; } = "";
    public string? Tags { get; init; }
    public string? TemplateData { get; init; }
    public string? PreviewImageUrl { get; init; }
    public string? Status { get; init; }
}

public record ImportTemplateDto
{
    public int UserId { get; init; }
}

public record RateTemplateDto
{
    public int UserId { get; init; }
    public int Rating { get; init; }
}

public record MarketplaceImportResultDto
{
    public bool Success { get; init; }
    public Guid? TemplateId { get; init; }
    public string? TemplateName { get; init; }
    public string? TemplateData { get; init; }
}

public record MarketplaceRateResultDto
{
    public bool Success { get; init; }
    public double NewRating { get; init; }
    public int NewRatingCount { get; init; }
}

public record MarketplaceCategoryCountDto
{
    public string Category { get; init; } = "";
    public int Count { get; init; }
}

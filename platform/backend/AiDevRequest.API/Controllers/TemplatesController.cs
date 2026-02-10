using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemplatesController : ControllerBase
{
    private readonly ITemplateService _templateService;
    private readonly ILogger<TemplatesController> _logger;

    public TemplatesController(ITemplateService templateService, ILogger<TemplatesController> logger)
    {
        _templateService = templateService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<TemplateDto>>> GetTemplates(
        [FromQuery] string? category = null,
        [FromQuery] string? framework = null)
    {
        try
        {
            var templates = await _templateService.GetTemplatesAsync(category, framework);
            return Ok(templates.Select(t => new TemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Category = t.Category,
                Framework = t.Framework,
                Tags = t.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
                PromptTemplate = t.PromptTemplate,
                UsageCount = t.UsageCount,
                CreatedBy = t.CreatedBy
            }).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load templates");
            return Ok(new List<TemplateDto>());
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TemplateDto>> GetTemplate(Guid id)
    {
        var template = await _templateService.GetTemplateAsync(id);
        if (template == null) return NotFound();

        return Ok(new TemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            Category = template.Category,
            Framework = template.Framework,
            Tags = template.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            PromptTemplate = template.PromptTemplate,
            UsageCount = template.UsageCount,
            CreatedBy = template.CreatedBy
        });
    }
}

public class TemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public string Framework { get; set; } = "";
    public string[] Tags { get; set; } = [];
    public string PromptTemplate { get; set; } = "";
    public int UsageCount { get; set; }
    public string CreatedBy { get; set; } = "";
}

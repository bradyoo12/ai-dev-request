using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/agent-builder")]
public class AgentBuilderController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly IAgentBuilderService _builderService;
    private readonly ILogger<AgentBuilderController> _logger;

    public AgentBuilderController(
        AiDevRequestDbContext db,
        IAgentBuilderService builderService,
        ILogger<AgentBuilderController> logger)
    {
        _db = db;
        _builderService = builderService;
        _logger = logger;
    }

    [HttpPost("analyze")]
    [ProducesResponseType(typeof(AgentAnalysisResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AnalyzeDescription([FromBody] AnalyzeDescriptionRequest request)
    {
        try
        {
            var result = await _builderService.AnalyzeDescriptionAsync(request.Description, request.AgentType);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze description");
            return BadRequest(new { error = "Failed to analyze description", details = ex.Message });
        }
    }

    [HttpPost("blueprints")]
    [ProducesResponseType(typeof(BlueprintDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBlueprint([FromBody] CreateBlueprintRequest request)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "anonymous";

            var blueprint = new AgentBlueprint
            {
                UserId = userId,
                Name = request.Name,
                Description = request.Description,
                AgentType = request.AgentType,
                CapabilitiesJson = request.CapabilitiesJson,
                IntegrationsJson = request.IntegrationsJson,
                Status = "Draft"
            };

            _db.AgentBlueprints.Add(blueprint);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBlueprint), new { id = blueprint.Id }, MapToDto(blueprint));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create blueprint");
            return BadRequest(new { error = "Failed to create blueprint", details = ex.Message });
        }
    }

    [HttpGet("blueprints")]
    [ProducesResponseType(typeof(List<BlueprintDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBlueprints()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "anonymous";
        var blueprints = await _db.AgentBlueprints
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.UpdatedAt)
            .ToListAsync();

        return Ok(blueprints.Select(MapToDto));
    }

    [HttpGet("blueprints/{id}")]
    [ProducesResponseType(typeof(BlueprintDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBlueprint(Guid id)
    {
        var blueprint = await _db.AgentBlueprints
            .Include(b => b.GeneratedSkill)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (blueprint == null)
        {
            return NotFound(new { error = "Blueprint not found" });
        }

        return Ok(MapToDto(blueprint));
    }

    [HttpPut("blueprints/{id}")]
    [ProducesResponseType(typeof(BlueprintDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBlueprint(Guid id, [FromBody] UpdateBlueprintRequest request)
    {
        var blueprint = await _db.AgentBlueprints.FindAsync(id);
        if (blueprint == null)
        {
            return NotFound(new { error = "Blueprint not found" });
        }

        if (request.Name != null) blueprint.Name = request.Name;
        if (request.Description != null) blueprint.Description = request.Description;
        if (request.CapabilitiesJson != null) blueprint.CapabilitiesJson = request.CapabilitiesJson;
        if (request.IntegrationsJson != null) blueprint.IntegrationsJson = request.IntegrationsJson;

        blueprint.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(MapToDto(blueprint));
    }

    [HttpDelete("blueprints/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBlueprint(Guid id)
    {
        var blueprint = await _db.AgentBlueprints.FindAsync(id);
        if (blueprint == null)
        {
            return NotFound(new { error = "Blueprint not found" });
        }

        _db.AgentBlueprints.Remove(blueprint);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("blueprints/{id}/generate")]
    [ProducesResponseType(typeof(BlueprintDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GenerateAgent(Guid id)
    {
        try
        {
            var blueprint = await _builderService.GenerateAgentAsync(id);
            return Ok(MapToDto(blueprint));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate agent for blueprint {BlueprintId}", id);
            return BadRequest(new { error = "Failed to generate agent", details = ex.Message });
        }
    }

    [HttpGet("blueprints/{id}/status")]
    [ProducesResponseType(typeof(StatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGenerationStatus(Guid id)
    {
        var blueprint = await _db.AgentBlueprints.FindAsync(id);
        if (blueprint == null)
        {
            return NotFound(new { error = "Blueprint not found" });
        }

        return Ok(new StatusResponse
        {
            Status = blueprint.Status,
            ErrorMessage = blueprint.ErrorMessage,
            UpdatedAt = blueprint.UpdatedAt
        });
    }

    [HttpPost("blueprints/{id}/convert-to-skill")]
    [ProducesResponseType(typeof(AgentSkillDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConvertToSkill(Guid id)
    {
        try
        {
            var skill = await _builderService.ConvertToSkillAsync(id);
            return Ok(new AgentSkillDto
            {
                Id = skill.Id,
                UserId = skill.UserId,
                Name = skill.Name,
                Description = skill.Description,
                Category = skill.Category,
                InstructionContent = skill.InstructionContent,
                ResourcesJson = skill.ResourcesJson,
                TagsJson = skill.TagsJson,
                IsBuiltIn = skill.IsBuiltIn,
                IsPublic = skill.IsPublic,
                DownloadCount = skill.DownloadCount,
                Version = skill.Version,
                Author = skill.Author,
                CreatedAt = skill.CreatedAt,
                UpdatedAt = skill.UpdatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to convert blueprint {BlueprintId} to skill", id);
            return BadRequest(new { error = "Failed to convert to skill", details = ex.Message });
        }
    }

    [HttpGet("templates")]
    [ProducesResponseType(typeof(List<AgentTemplate>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _builderService.GetTemplatesAsync();
        return Ok(templates);
    }

    [HttpPost("blueprints/{id}/export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportToMarketplace(Guid id)
    {
        var blueprint = await _db.AgentBlueprints
            .Include(b => b.GeneratedSkill)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (blueprint == null)
        {
            return NotFound(new { error = "Blueprint not found" });
        }

        if (blueprint.GeneratedSkill == null)
        {
            return BadRequest(new { error = "Blueprint must be converted to skill first" });
        }

        // Set skill as public
        blueprint.GeneratedSkill.IsPublic = true;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Agent exported to marketplace", skillId = blueprint.GeneratedSkill.Id });
    }

    private static BlueprintDto MapToDto(AgentBlueprint b) => new()
    {
        Id = b.Id,
        UserId = b.UserId,
        Name = b.Name,
        Description = b.Description,
        AgentType = b.AgentType,
        CapabilitiesJson = b.CapabilitiesJson,
        IntegrationsJson = b.IntegrationsJson,
        ConfigurationJson = b.ConfigurationJson,
        GeneratedCode = b.GeneratedCode,
        Status = b.Status,
        ErrorMessage = b.ErrorMessage,
        GeneratedSkillId = b.GeneratedSkillId,
        CreatedAt = b.CreatedAt,
        UpdatedAt = b.UpdatedAt
    };
}

// Request/Response DTOs
public record AnalyzeDescriptionRequest
{
    public required string Description { get; init; }
    public required string AgentType { get; init; }
}

public record CreateBlueprintRequest
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required string AgentType { get; init; }
    public string? CapabilitiesJson { get; init; }
    public string? IntegrationsJson { get; init; }
}

public record UpdateBlueprintRequest
{
    public string? Name { get; init; }
    public string? Description { get; init; }
    public string? CapabilitiesJson { get; init; }
    public string? IntegrationsJson { get; init; }
}

public record BlueprintDto
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = "";
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string AgentType { get; init; } = "";
    public string? CapabilitiesJson { get; init; }
    public string? IntegrationsJson { get; init; }
    public string? ConfigurationJson { get; init; }
    public string? GeneratedCode { get; init; }
    public string Status { get; init; } = "";
    public string? ErrorMessage { get; init; }
    public Guid? GeneratedSkillId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record StatusResponse
{
    public required string Status { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime UpdatedAt { get; init; }
}

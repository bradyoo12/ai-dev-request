using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/agent-builder")]
public class AgentBuilderController : ControllerBase
{
    private readonly IAgentBuilderService _builderService;
    private readonly ILogger<AgentBuilderController> _logger;

    public AgentBuilderController(
        IAgentBuilderService builderService,
        ILogger<AgentBuilderController> logger)
    {
        _builderService = builderService;
        _logger = logger;
    }

    [HttpPost("generate")]
    [ProducesResponseType(typeof(AgentSkillDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AgentSkillDto>> GenerateAgent([FromBody] GenerateAgentRequest request)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "anonymous";
            var skill = await _builderService.GenerateAgentFromSpecAsync(request.Specification, userId);
            return Ok(MapToAgentSkillDto(skill));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate agent from specification");
            return BadRequest(new { error = "Failed to generate agent. Please check your specification." });
        }
    }

    [HttpPost("preview")]
    [ProducesResponseType(typeof(AgentPreviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AgentPreviewResponse>> PreviewAgent([FromBody] PreviewAgentRequest request)
    {
        try
        {
            var skill = await _builderService.PreviewAgentAsync(request.Specification);
            return Ok(new AgentPreviewResponse
            {
                Name = skill.Name,
                Description = skill.Description,
                Category = skill.Category,
                InstructionContent = skill.InstructionContent,
                ScriptsJson = skill.ScriptsJson,
                ResourcesJson = skill.ResourcesJson,
                TagsJson = skill.TagsJson,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to preview agent from specification");
            return BadRequest(new { error = "Failed to preview agent. Please check your specification." });
        }
    }

    [HttpGet("templates")]
    [ProducesResponseType(typeof(List<AgentTemplateDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AgentTemplateDto>>> GetTemplates()
    {
        var templates = await _builderService.GetAgentTemplatesAsync();
        return Ok(templates.Select(t => new AgentTemplateDto
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            Category = t.Category,
            Platform = t.Platform,
            IconUrl = t.IconUrl,
            TemplateSpec = t.TemplateSpec,
        }).ToList());
    }

    [HttpPost("deploy")]
    [ProducesResponseType(typeof(AgentDeploymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgentDeploymentDto>> DeployAgent([FromBody] DeployAgentRequest request)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "anonymous";
            var deployment = await _builderService.DeployAgentAsync(
                request.AgentSkillId,
                request.Platform,
                request.ConfigJson ?? "{}",
                userId);

            return Ok(MapToDeploymentDto(deployment));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { error = "Not authorized to deploy this agent" });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deploy agent");
            return BadRequest(new { error = "Failed to deploy agent" });
        }
    }

    [HttpGet("deployments")]
    [ProducesResponseType(typeof(List<AgentDeploymentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AgentDeploymentDto>>> GetDeployments()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "anonymous";
        var deployments = await _builderService.GetDeploymentsAsync(userId);
        return Ok(deployments.Select(MapToDeploymentDto).ToList());
    }

    [HttpDelete("deployments/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UndeployAgent(Guid id)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "anonymous";
        var result = await _builderService.UndeployAgentAsync(id, userId);
        if (!result)
        {
            return NotFound(new { error = "Deployment not found" });
        }
        return NoContent();
    }

    private static AgentSkillDto MapToAgentSkillDto(AgentSkill s) => new()
    {
        Id = s.Id,
        UserId = s.UserId,
        Name = s.Name,
        Description = s.Description,
        Category = s.Category,
        InstructionContent = s.InstructionContent,
        ScriptsJson = s.ScriptsJson,
        ResourcesJson = s.ResourcesJson,
        TagsJson = s.TagsJson,
        IsBuiltIn = s.IsBuiltIn,
        IsPublic = s.IsPublic,
        DownloadCount = s.DownloadCount,
        Version = s.Version,
        Author = s.Author,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
    };

    private static AgentDeploymentDto MapToDeploymentDto(AgentDeployment d) => new()
    {
        Id = d.Id,
        UserId = d.UserId,
        AgentSkillId = d.AgentSkillId,
        Platform = d.Platform,
        Status = d.Status,
        ConfigJson = d.ConfigJson,
        MetricsJson = d.MetricsJson,
        DeployedAt = d.DeployedAt,
        LastActiveAt = d.LastActiveAt,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt,
    };
}

public record GenerateAgentRequest
{
    public string Specification { get; init; } = "";
}

public record PreviewAgentRequest
{
    public string Specification { get; init; } = "";
}

public record AgentPreviewResponse
{
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string? Category { get; init; }
    public string? InstructionContent { get; init; }
    public string? ScriptsJson { get; init; }
    public string? ResourcesJson { get; init; }
    public string? TagsJson { get; init; }
}

public record DeployAgentRequest
{
    public Guid AgentSkillId { get; init; }
    public string Platform { get; init; } = "";
    public string? ConfigJson { get; init; }
}

public record AgentDeploymentDto
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = "";
    public Guid AgentSkillId { get; init; }
    public string Platform { get; init; } = "";
    public string Status { get; init; } = "";
    public string? ConfigJson { get; init; }
    public string? MetricsJson { get; init; }
    public DateTime DeployedAt { get; init; }
    public DateTime? LastActiveAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record AgentTemplateDto
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Category { get; init; } = "";
    public string Platform { get; init; } = "";
    public string IconUrl { get; init; } = "";
    public string TemplateSpec { get; init; } = "";
}

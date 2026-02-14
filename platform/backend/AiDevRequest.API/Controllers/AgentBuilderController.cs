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

    public AgentBuilderController(IAgentBuilderService builderService, ILogger<AgentBuilderController> logger)
    {
        _builderService = builderService;
        _logger = logger;
    }

    /// <summary>
    /// Generate an AI agent skill from natural language description.
    /// Uses Claude AI to interpret the description and create a structured agent skill.
    /// </summary>
    /// <param name="dto">Natural language description of the desired agent</param>
    /// <returns>Generated agent skill JSON for preview/editing</returns>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(GenerateAgentResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GenerateAgentResultDto>> GenerateAgent([FromBody] GenerateAgentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            return BadRequest(new { error = "Description is required" });
        }

        try
        {
            _logger.LogInformation("Generating agent from description for user {UserId}", dto.UserId ?? "anonymous");

            var result = await _builderService.GenerateAgentFromDescriptionAsync(
                dto.Description,
                dto.UserId ?? "anonymous",
                dto.ModelId ?? "claude-sonnet-4-5-20250929");

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for agent generation");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate agent from description");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { error = "Failed to generate agent. Please try again." });
        }
    }

    /// <summary>
    /// Refine an existing generated agent based on user feedback.
    /// </summary>
    /// <param name="dto">Current agent JSON and refinement instructions</param>
    /// <returns>Refined agent skill JSON</returns>
    [HttpPost("refine")]
    [ProducesResponseType(typeof(GenerateAgentResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<GenerateAgentResultDto>> RefineAgent([FromBody] RefineAgentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CurrentAgentJson))
        {
            return BadRequest(new { error = "Current agent JSON is required" });
        }

        if (string.IsNullOrWhiteSpace(dto.RefinementInstructions))
        {
            return BadRequest(new { error = "Refinement instructions are required" });
        }

        try
        {
            _logger.LogInformation("Refining agent for user {UserId}", dto.UserId ?? "anonymous");

            var result = await _builderService.RefineAgentAsync(
                dto.CurrentAgentJson,
                dto.RefinementInstructions,
                dto.UserId ?? "anonymous",
                dto.ModelId ?? "claude-sonnet-4-5-20250929");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refine agent");
            return BadRequest(new { error = "Failed to refine agent. Please try again." });
        }
    }

    /// <summary>
    /// Get example agent templates to inspire users.
    /// </summary>
    /// <returns>List of example agent descriptions and use cases</returns>
    [HttpGet("examples")]
    [ProducesResponseType(typeof(List<AgentExampleDto>), StatusCodes.Status200OK)]
    public ActionResult<List<AgentExampleDto>> GetExamples()
    {
        var examples = _builderService.GetExampleAgents();
        return Ok(examples);
    }
}

public record GenerateAgentDto
{
    public string Description { get; init; } = "";
    public string? UserId { get; init; }
    public string? ModelId { get; init; }
}

public record RefineAgentDto
{
    public string CurrentAgentJson { get; init; } = "";
    public string RefinementInstructions { get; init; } = "";
    public string? UserId { get; init; }
    public string? ModelId { get; init; }
}

public record GenerateAgentResultDto
{
    public string AgentJson { get; init; } = "";
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Category { get; init; } = "";
    public List<string> SuggestedTags { get; init; } = new();
}

public record AgentExampleDto
{
    public string Title { get; init; } = "";
    public string Description { get; init; } = "";
    public string Category { get; init; } = "";
    public string ExamplePrompt { get; init; } = "";
}

using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/agent-skills")]
public class AgentSkillController : ControllerBase
{
    private readonly IAgentSkillService _skillService;
    private readonly ILogger<AgentSkillController> _logger;

    public AgentSkillController(IAgentSkillService skillService, ILogger<AgentSkillController> logger)
    {
        _skillService = skillService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<AgentSkillDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AgentSkillDto>>> GetUserSkills([FromQuery] string userId = "anonymous")
    {
        var skills = await _skillService.GetUserSkillsAsync(userId);
        return Ok(skills.Select(MapToDto).ToList());
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AgentSkillDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgentSkillDto>> GetSkill(Guid id)
    {
        var skill = await _skillService.GetByIdAsync(id);
        if (skill == null) return NotFound(new { error = "Skill not found" });
        return Ok(MapToDto(skill));
    }

    [HttpPost]
    [ProducesResponseType(typeof(AgentSkillDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AgentSkillDto>> CreateSkill([FromBody] CreateAgentSkillDto dto)
    {
        try
        {
            var skill = new AgentSkill
            {
                UserId = dto.UserId ?? "anonymous",
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                InstructionContent = dto.InstructionContent,
                ScriptsJson = dto.ScriptsJson,
                ResourcesJson = dto.ResourcesJson,
                TagsJson = dto.TagsJson,
                IsPublic = dto.IsPublic,
                Version = dto.Version,
                Author = dto.Author,
            };
            var created = await _skillService.CreateAsync(skill);
            return Created("/api/agent-skills/" + created.Id, MapToDto(created));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create agent skill");
            return BadRequest(new { error = "Failed to create skill" });
        }
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AgentSkillDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgentSkillDto>> UpdateSkill(Guid id, [FromBody] UpdateAgentSkillDto dto)
    {
        try
        {
            var update = new AgentSkill
            {
                UserId = dto.UserId ?? "anonymous",
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                InstructionContent = dto.InstructionContent,
                ScriptsJson = dto.ScriptsJson,
                ResourcesJson = dto.ResourcesJson,
                TagsJson = dto.TagsJson,
                IsPublic = dto.IsPublic,
                Version = dto.Version,
                Author = dto.Author,
            };
            var updated = await _skillService.UpdateAsync(id, update);
            if (updated == null) return NotFound(new { error = "Skill not found" });
            return Ok(MapToDto(updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update agent skill {Id}", id);
            return BadRequest(new { error = "Failed to update skill" });
        }
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSkill(Guid id)
    {
        var deleted = await _skillService.DeleteAsync(id);
        if (!deleted) return NotFound(new { error = "Skill not found" });
        return NoContent();
    }

    [HttpGet("public")]
    [ProducesResponseType(typeof(List<AgentSkillDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AgentSkillDto>>> GetPublicSkills([FromQuery] string? search = null, [FromQuery] string? category = null)
    {
        var skills = await _skillService.GetPublicSkillsAsync(search, category);
        return Ok(skills.Select(MapToDto).ToList());
    }

    [HttpGet("built-in")]
    [ProducesResponseType(typeof(List<AgentSkillDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AgentSkillDto>>> GetBuiltInSkills()
    {
        var skills = await _skillService.GetBuiltInSkillsAsync();
        return Ok(skills.Select(MapToDto).ToList());
    }

    [HttpPost("detect")]
    [ProducesResponseType(typeof(List<AgentSkillDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AgentSkillDto>>> DetectSkills([FromBody] DetectSkillsDto dto)
    {
        var skills = await _skillService.DetectRelevantSkillsAsync(dto.RequestText);
        return Ok(skills.Select(MapToDto).ToList());
    }

    [HttpPost("{id}/export")]
    [ProducesResponseType(typeof(ExportSkillResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExportSkillResultDto>> ExportSkill(Guid id)
    {
        var skill = await _skillService.GetByIdAsync(id);
        if (skill == null) return NotFound(new { error = "Skill not found" });
        var json = await _skillService.ExportSkillAsync(id);
        return Ok(new ExportSkillResultDto { Json = json });
    }

    [HttpPost("import")]
    [ProducesResponseType(typeof(AgentSkillDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AgentSkillDto>> ImportSkill([FromBody] ImportSkillDto dto)
    {
        try
        {
            var skill = await _skillService.ImportSkillAsync(dto.Json, dto.UserId ?? "anonymous");
            return Created("/api/agent-skills/" + skill.Id, MapToDto(skill));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to import agent skill");
            return BadRequest(new { error = "Failed to import skill. Invalid JSON format." });
        }
    }

    [HttpPost("{id}/fork")]
    [ProducesResponseType(typeof(AgentSkillDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgentSkillDto>> ForkSkill(Guid id, [FromBody] ForkSkillDto dto)
    {
        var forked = await _skillService.ForkSkillAsync(id, dto.UserId ?? "anonymous");
        if (forked == null) return NotFound(new { error = "Skill not found" });
        return Created("/api/agent-skills/" + forked.Id, MapToDto(forked));
    }

    private static AgentSkillDto MapToDto(AgentSkill s) => new()
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
}

public record AgentSkillDto
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = "";
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string? Category { get; init; }
    public string? InstructionContent { get; init; }
    public string? ScriptsJson { get; init; }
    public string? ResourcesJson { get; init; }
    public string? TagsJson { get; init; }
    public bool IsBuiltIn { get; init; }
    public bool IsPublic { get; init; }
    public int DownloadCount { get; init; }
    public string? Version { get; init; }
    public string? Author { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record CreateAgentSkillDto
{
    public string? UserId { get; init; }
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string? Category { get; init; }
    public string? InstructionContent { get; init; }
    public string? ScriptsJson { get; init; }
    public string? ResourcesJson { get; init; }
    public string? TagsJson { get; init; }
    public bool IsPublic { get; init; }
    public string? Version { get; init; }
    public string? Author { get; init; }
}

public record UpdateAgentSkillDto
{
    public string? UserId { get; init; }
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string? Category { get; init; }
    public string? InstructionContent { get; init; }
    public string? ScriptsJson { get; init; }
    public string? ResourcesJson { get; init; }
    public string? TagsJson { get; init; }
    public bool IsPublic { get; init; }
    public string? Version { get; init; }
    public string? Author { get; init; }
}

public record DetectSkillsDto
{
    public string RequestText { get; init; } = "";
}

public record ExportSkillResultDto
{
    public string Json { get; init; } = "";
}

public record ImportSkillDto
{
    public string? UserId { get; init; }
    public string Json { get; init; } = "";
}

public record ForkSkillDto
{
    public string? UserId { get; init; }
}

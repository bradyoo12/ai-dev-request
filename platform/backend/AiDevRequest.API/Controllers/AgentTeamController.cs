using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/agent-teams")]
public class AgentTeamController : ControllerBase
{
    private readonly IAgentTeamService _teamService;
    private readonly ILogger<AgentTeamController> _logger;

    public AgentTeamController(IAgentTeamService teamService, ILogger<AgentTeamController> logger)
    {
        _teamService = teamService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<AgentTeamDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AgentTeamDto>>> GetUserTeams([FromQuery] string userId = "anonymous")
    {
        var teams = await _teamService.GetUserTeamsAsync(userId);
        return Ok(teams.Select(MapToDto).ToList());
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AgentTeamDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgentTeamDto>> GetTeam(Guid id)
    {
        var team = await _teamService.GetByIdAsync(id);
        if (team == null) return NotFound(new { error = "Team not found" });
        return Ok(MapToDto(team));
    }

    [HttpPost]
    [ProducesResponseType(typeof(AgentTeamDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AgentTeamDto>> CreateTeam([FromBody] CreateAgentTeamDto dto)
    {
        try
        {
            var team = new AgentTeam
            {
                UserId = dto.UserId ?? "anonymous",
                Name = dto.Name,
                Description = dto.Description,
                Strategy = dto.Strategy ?? "parallel",
                MembersJson = dto.MembersJson ?? "[]",
                Template = dto.Template,
                IsPublic = dto.IsPublic,
            };
            var created = await _teamService.CreateAsync(team);
            return Created("/api/agent-teams/" + created.Id, MapToDto(created));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create agent team");
            return BadRequest(new { error = "Failed to create team" });
        }
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AgentTeamDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgentTeamDto>> UpdateTeam(Guid id, [FromBody] UpdateAgentTeamDto dto)
    {
        try
        {
            var update = new AgentTeam
            {
                UserId = dto.UserId ?? "anonymous",
                Name = dto.Name,
                Description = dto.Description,
                Strategy = dto.Strategy ?? "parallel",
                MembersJson = dto.MembersJson ?? "[]",
                Template = dto.Template,
                IsPublic = dto.IsPublic,
            };
            var updated = await _teamService.UpdateAsync(id, update);
            if (updated == null) return NotFound(new { error = "Team not found" });
            return Ok(MapToDto(updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update agent team {Id}", id);
            return BadRequest(new { error = "Failed to update team" });
        }
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTeam(Guid id)
    {
        var deleted = await _teamService.DeleteAsync(id);
        if (!deleted) return NotFound(new { error = "Team not found" });
        return NoContent();
    }

    [HttpPost("from-template")]
    [ProducesResponseType(typeof(AgentTeamDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<AgentTeamDto>> CreateFromTemplate([FromBody] CreateFromTemplateDto dto)
    {
        var team = await _teamService.CreateFromTemplateAsync(dto.Template, dto.UserId ?? "anonymous");
        return Created("/api/agent-teams/" + team.Id, MapToDto(team));
    }

    [HttpPost("{id}/spawn")]
    [ProducesResponseType(typeof(AgentTeamDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgentTeamDto>> SpawnExecution(Guid id, [FromBody] SpawnExecutionDto dto)
    {
        var team = await _teamService.SpawnExecutionAsync(id, dto.DevRequestId);
        if (team == null) return NotFound(new { error = "Team not found" });
        return Ok(MapToDto(team));
    }

    [HttpGet("public")]
    [ProducesResponseType(typeof(List<AgentTeamDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AgentTeamDto>>> GetPublicTeams([FromQuery] string? search = null)
    {
        var teams = await _teamService.GetPublicTeamsAsync(search);
        return Ok(teams.Select(MapToDto).ToList());
    }

    [HttpPost("{id}/fork")]
    [ProducesResponseType(typeof(AgentTeamDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgentTeamDto>> ForkTeam(Guid id, [FromBody] ForkTeamDto dto)
    {
        var forked = await _teamService.ForkTeamAsync(id, dto.UserId ?? "anonymous");
        if (forked == null) return NotFound(new { error = "Team not found" });
        return Created("/api/agent-teams/" + forked.Id, MapToDto(forked));
    }

    private static AgentTeamDto MapToDto(AgentTeam t) => new()
    {
        Id = t.Id,
        UserId = t.UserId,
        Name = t.Name,
        Description = t.Description,
        Strategy = t.Strategy,
        MembersJson = t.MembersJson,
        Template = t.Template,
        Status = t.Status,
        LastExecutionJson = t.LastExecutionJson,
        IsPublic = t.IsPublic,
        ExecutionCount = t.ExecutionCount,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt,
    };
}

public record AgentTeamDto
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = "";
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string Strategy { get; init; } = "parallel";
    public string MembersJson { get; init; } = "[]";
    public string? Template { get; init; }
    public string Status { get; init; } = "idle";
    public string? LastExecutionJson { get; init; }
    public bool IsPublic { get; init; }
    public int ExecutionCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record CreateAgentTeamDto
{
    public string? UserId { get; init; }
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string? Strategy { get; init; }
    public string? MembersJson { get; init; }
    public string? Template { get; init; }
    public bool IsPublic { get; init; }
}

public record UpdateAgentTeamDto
{
    public string? UserId { get; init; }
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string? Strategy { get; init; }
    public string? MembersJson { get; init; }
    public string? Template { get; init; }
    public bool IsPublic { get; init; }
}

public record CreateFromTemplateDto
{
    public string? UserId { get; init; }
    public string Template { get; init; } = "full-stack";
}

public record SpawnExecutionDto
{
    public Guid DevRequestId { get; init; }
}

public record ForkTeamDto
{
    public string? UserId { get; init; }
}

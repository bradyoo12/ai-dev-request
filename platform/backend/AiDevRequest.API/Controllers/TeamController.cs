using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/teams")]
[Authorize]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    // GET /api/teams
    [HttpGet]
    public async Task<IActionResult> GetTeams()
    {
        var userId = GetUserId();
        var teams = await _teamService.GetUserTeamsAsync(userId);
        return Ok(teams.Select(t => new TeamDto
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            OwnerId = t.OwnerId,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
        }));
    }

    // POST /api/teams
    [HttpPost]
    public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto dto)
    {
        var userId = GetUserId();
        var team = await _teamService.CreateTeamAsync(userId, dto.Name, dto.Description);
        return Ok(new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            OwnerId = team.OwnerId,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
        });
    }

    // GET /api/teams/{teamId}
    [HttpGet("{teamId}")]
    public async Task<IActionResult> GetTeam(int teamId)
    {
        var userId = GetUserId();
        var team = await _teamService.GetTeamAsync(teamId, userId);
        if (team == null) return NotFound(new { error = "Team not found." });
        return Ok(new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            OwnerId = team.OwnerId,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
        });
    }

    // PUT /api/teams/{teamId}
    [HttpPut("{teamId}")]
    public async Task<IActionResult> UpdateTeam(int teamId, [FromBody] CreateTeamDto dto)
    {
        var userId = GetUserId();
        var team = await _teamService.UpdateTeamAsync(teamId, userId, dto.Name, dto.Description);
        if (team == null) return NotFound(new { error = "Team not found or unauthorized." });
        return Ok(new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            OwnerId = team.OwnerId,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
        });
    }

    // DELETE /api/teams/{teamId}
    [HttpDelete("{teamId}")]
    public async Task<IActionResult> DeleteTeam(int teamId)
    {
        var userId = GetUserId();
        var result = await _teamService.DeleteTeamAsync(teamId, userId);
        if (!result) return NotFound(new { error = "Team not found or unauthorized." });
        return Ok(new { success = true });
    }

    // GET /api/teams/{teamId}/members
    [HttpGet("{teamId}/members")]
    public async Task<IActionResult> GetMembers(int teamId)
    {
        var userId = GetUserId();
        var members = await _teamService.GetMembersAsync(teamId, userId);
        return Ok(members.Select(m => new TeamMemberDto
        {
            Id = m.Id,
            TeamId = m.TeamId,
            UserId = m.UserId,
            Role = m.Role,
            JoinedAt = m.JoinedAt,
        }));
    }

    // POST /api/teams/{teamId}/members
    [HttpPost("{teamId}/members")]
    public async Task<IActionResult> AddMember(int teamId, [FromBody] AddMemberDto dto)
    {
        var userId = GetUserId();
        var member = await _teamService.AddMemberAsync(teamId, userId, dto.Email, dto.Role);
        if (member == null) return BadRequest(new { error = "User not found or already a member." });
        return Ok(new TeamMemberDto
        {
            Id = member.Id,
            TeamId = member.TeamId,
            UserId = member.UserId,
            Role = member.Role,
            JoinedAt = member.JoinedAt,
        });
    }

    // PATCH /api/teams/{teamId}/members/{memberId}/role
    [HttpPatch("{teamId}/members/{memberId}/role")]
    public async Task<IActionResult> UpdateMemberRole(int teamId, int memberId, [FromBody] UpdateRoleDto dto)
    {
        var userId = GetUserId();
        var member = await _teamService.UpdateMemberRoleAsync(teamId, userId, memberId, dto.Role);
        if (member == null) return NotFound(new { error = "Member not found or unauthorized." });
        return Ok(new TeamMemberDto
        {
            Id = member.Id,
            TeamId = member.TeamId,
            UserId = member.UserId,
            Role = member.Role,
            JoinedAt = member.JoinedAt,
        });
    }

    // DELETE /api/teams/{teamId}/members/{memberId}
    [HttpDelete("{teamId}/members/{memberId}")]
    public async Task<IActionResult> RemoveMember(int teamId, int memberId)
    {
        var userId = GetUserId();
        var result = await _teamService.RemoveMemberAsync(teamId, userId, memberId);
        if (!result) return NotFound(new { error = "Member not found or unauthorized." });
        return Ok(new { success = true });
    }

    // GET /api/teams/{teamId}/activities
    [HttpGet("{teamId}/activities")]
    public async Task<IActionResult> GetActivities(int teamId, [FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var activities = await _teamService.GetActivitiesAsync(teamId, userId, limit);
        return Ok(activities.Select(a => new TeamActivityDto
        {
            Id = a.Id,
            UserId = a.UserId,
            Action = a.Action,
            TargetUserId = a.TargetUserId,
            Detail = a.Detail,
            CreatedAt = a.CreatedAt,
        }));
    }

    // GET /api/teams/{teamId}/projects
    [HttpGet("{teamId}/projects")]
    public async Task<IActionResult> GetProjects(int teamId)
    {
        var userId = GetUserId();
        var projects = await _teamService.GetTeamProjectsAsync(teamId, userId);
        return Ok(projects.Select(p => new TeamProjectDto
        {
            Id = p.Id,
            TeamId = p.TeamId,
            DevRequestId = p.DevRequestId,
            SharedByUserId = p.SharedByUserId,
            SharedAt = p.SharedAt,
        }));
    }

    // POST /api/teams/{teamId}/projects
    [HttpPost("{teamId}/projects")]
    public async Task<IActionResult> ShareProject(int teamId, [FromBody] ShareProjectDto dto)
    {
        var userId = GetUserId();
        var tp = await _teamService.ShareProjectAsync(teamId, userId, dto.DevRequestId);
        if (tp == null) return BadRequest(new { error = "Project not found or unauthorized." });
        return Ok(new TeamProjectDto
        {
            Id = tp.Id,
            TeamId = tp.TeamId,
            DevRequestId = tp.DevRequestId,
            SharedByUserId = tp.SharedByUserId,
            SharedAt = tp.SharedAt,
        });
    }

    // DELETE /api/teams/{teamId}/projects/{projectId}
    [HttpDelete("{teamId}/projects/{projectId}")]
    public async Task<IActionResult> UnshareProject(int teamId, int projectId)
    {
        var userId = GetUserId();
        var result = await _teamService.UnshareProjectAsync(teamId, userId, projectId);
        if (!result) return NotFound(new { error = "Project not found or unauthorized." });
        return Ok(new { success = true });
    }
}

// DTOs
public record TeamDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required string OwnerId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record TeamMemberDto
{
    public int Id { get; init; }
    public int TeamId { get; init; }
    public required string UserId { get; init; }
    public required string Role { get; init; }
    public DateTime JoinedAt { get; init; }
}

public record TeamActivityDto
{
    public int Id { get; init; }
    public required string UserId { get; init; }
    public required string Action { get; init; }
    public string? TargetUserId { get; init; }
    public string? Detail { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record TeamProjectDto
{
    public int Id { get; init; }
    public int TeamId { get; init; }
    public Guid DevRequestId { get; init; }
    public required string SharedByUserId { get; init; }
    public DateTime SharedAt { get; init; }
}

public record CreateTeamDto
{
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public record AddMemberDto
{
    public required string Email { get; init; }
    public string Role { get; init; } = "editor";
}

public record UpdateRoleDto
{
    public required string Role { get; init; }
}

public record ShareProjectDto
{
    public Guid DevRequestId { get; init; }
}

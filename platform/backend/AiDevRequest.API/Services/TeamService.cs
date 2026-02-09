using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ITeamService
{
    Task<List<TeamWorkspace>> GetUserTeamsAsync(string userId);
    Task<TeamWorkspace> CreateTeamAsync(string userId, string name, string? description);
    Task<TeamWorkspace?> GetTeamAsync(int teamId, string userId);
    Task<TeamWorkspace?> UpdateTeamAsync(int teamId, string userId, string name, string? description);
    Task<bool> DeleteTeamAsync(int teamId, string userId);
    Task<List<TeamMember>> GetMembersAsync(int teamId, string userId);
    Task<TeamMember?> AddMemberAsync(int teamId, string userId, string memberEmail, string role);
    Task<TeamMember?> UpdateMemberRoleAsync(int teamId, string userId, int memberId, string role);
    Task<bool> RemoveMemberAsync(int teamId, string userId, int memberId);
    Task<List<TeamActivity>> GetActivitiesAsync(int teamId, string userId, int limit = 50);
    Task<List<TeamProject>> GetTeamProjectsAsync(int teamId, string userId);
    Task<TeamProject?> ShareProjectAsync(int teamId, string userId, Guid devRequestId);
    Task<bool> UnshareProjectAsync(int teamId, string userId, int teamProjectId);
}

public class TeamService : ITeamService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<TeamService> _logger;

    public TeamService(AiDevRequestDbContext db, ILogger<TeamService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<TeamWorkspace>> GetUserTeamsAsync(string userId)
    {
        var teamIds = await _db.TeamMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.TeamId)
            .ToListAsync();

        return await _db.TeamWorkspaces
            .Where(t => teamIds.Contains(t.Id))
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();
    }

    public async Task<TeamWorkspace> CreateTeamAsync(string userId, string name, string? description)
    {
        var team = new TeamWorkspace
        {
            Name = name,
            Description = description,
            OwnerId = userId,
        };
        _db.TeamWorkspaces.Add(team);
        await _db.SaveChangesAsync();

        _db.TeamMembers.Add(new TeamMember
        {
            TeamId = team.Id,
            UserId = userId,
            Role = "owner",
        });

        _db.TeamActivities.Add(new TeamActivity
        {
            TeamId = team.Id,
            UserId = userId,
            Action = "created",
            Detail = $"Team '{name}' created",
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation("User {UserId} created team {TeamId}: {Name}", userId, team.Id, name);
        return team;
    }

    public async Task<TeamWorkspace?> GetTeamAsync(int teamId, string userId)
    {
        if (!await IsMemberAsync(teamId, userId)) return null;
        return await _db.TeamWorkspaces.FindAsync(teamId);
    }

    public async Task<TeamWorkspace?> UpdateTeamAsync(int teamId, string userId, string name, string? description)
    {
        if (!await IsOwnerOrEditorAsync(teamId, userId)) return null;
        var team = await _db.TeamWorkspaces.FindAsync(teamId);
        if (team == null) return null;

        team.Name = name;
        team.Description = description;
        team.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return team;
    }

    public async Task<bool> DeleteTeamAsync(int teamId, string userId)
    {
        var team = await _db.TeamWorkspaces.FindAsync(teamId);
        if (team == null || team.OwnerId != userId) return false;

        var members = await _db.TeamMembers.Where(m => m.TeamId == teamId).ToListAsync();
        var activities = await _db.TeamActivities.Where(a => a.TeamId == teamId).ToListAsync();
        var projects = await _db.TeamProjects.Where(p => p.TeamId == teamId).ToListAsync();

        _db.TeamProjects.RemoveRange(projects);
        _db.TeamActivities.RemoveRange(activities);
        _db.TeamMembers.RemoveRange(members);
        _db.TeamWorkspaces.Remove(team);
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {UserId} deleted team {TeamId}", userId, teamId);
        return true;
    }

    public async Task<List<TeamMember>> GetMembersAsync(int teamId, string userId)
    {
        if (!await IsMemberAsync(teamId, userId)) return [];
        return await _db.TeamMembers
            .Where(m => m.TeamId == teamId)
            .OrderBy(m => m.JoinedAt)
            .ToListAsync();
    }

    public async Task<TeamMember?> AddMemberAsync(int teamId, string userId, string memberEmail, string role)
    {
        if (!await IsOwnerOrEditorAsync(teamId, userId)) return null;

        var targetUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == memberEmail);
        if (targetUser == null) return null;

        var existing = await _db.TeamMembers.FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == targetUser.Id);
        if (existing != null) return existing;

        var member = new TeamMember
        {
            TeamId = teamId,
            UserId = targetUser.Id,
            Role = role,
        };
        _db.TeamMembers.Add(member);

        _db.TeamActivities.Add(new TeamActivity
        {
            TeamId = teamId,
            UserId = userId,
            Action = "member_added",
            TargetUserId = targetUser.Id,
            Detail = $"Added {targetUser.Email} as {role}",
        });

        var team = await _db.TeamWorkspaces.FindAsync(teamId);
        if (team != null) team.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Added member {MemberEmail} to team {TeamId} as {Role}", memberEmail, teamId, role);
        return member;
    }

    public async Task<TeamMember?> UpdateMemberRoleAsync(int teamId, string userId, int memberId, string role)
    {
        var team = await _db.TeamWorkspaces.FindAsync(teamId);
        if (team == null || team.OwnerId != userId) return null;

        var member = await _db.TeamMembers.FindAsync(memberId);
        if (member == null || member.TeamId != teamId) return null;
        if (member.Role == "owner") return null; // Can't change owner role

        member.Role = role;

        _db.TeamActivities.Add(new TeamActivity
        {
            TeamId = teamId,
            UserId = userId,
            Action = "role_changed",
            TargetUserId = member.UserId,
            Detail = $"Changed role to {role}",
        });

        await _db.SaveChangesAsync();
        return member;
    }

    public async Task<bool> RemoveMemberAsync(int teamId, string userId, int memberId)
    {
        if (!await IsOwnerOrEditorAsync(teamId, userId)) return false;

        var member = await _db.TeamMembers.FindAsync(memberId);
        if (member == null || member.TeamId != teamId) return false;
        if (member.Role == "owner") return false; // Can't remove owner

        _db.TeamActivities.Add(new TeamActivity
        {
            TeamId = teamId,
            UserId = userId,
            Action = "member_removed",
            TargetUserId = member.UserId,
        });

        _db.TeamMembers.Remove(member);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Removed member {MemberId} from team {TeamId}", memberId, teamId);
        return true;
    }

    public async Task<List<TeamActivity>> GetActivitiesAsync(int teamId, string userId, int limit = 50)
    {
        if (!await IsMemberAsync(teamId, userId)) return [];
        return await _db.TeamActivities
            .Where(a => a.TeamId == teamId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<TeamProject>> GetTeamProjectsAsync(int teamId, string userId)
    {
        if (!await IsMemberAsync(teamId, userId)) return [];
        return await _db.TeamProjects
            .Where(p => p.TeamId == teamId)
            .OrderByDescending(p => p.SharedAt)
            .ToListAsync();
    }

    public async Task<TeamProject?> ShareProjectAsync(int teamId, string userId, Guid devRequestId)
    {
        if (!await IsOwnerOrEditorAsync(teamId, userId)) return null;

        var devReq = await _db.DevRequests.FindAsync(devRequestId);
        if (devReq == null || devReq.UserId != userId) return null;

        var existing = await _db.TeamProjects.FirstOrDefaultAsync(p => p.TeamId == teamId && p.DevRequestId == devRequestId);
        if (existing != null) return existing;

        var tp = new TeamProject
        {
            TeamId = teamId,
            DevRequestId = devRequestId,
            SharedByUserId = userId,
        };
        _db.TeamProjects.Add(tp);

        _db.TeamActivities.Add(new TeamActivity
        {
            TeamId = teamId,
            UserId = userId,
            Action = "project_shared",
            Detail = $"Shared project #{devRequestId}",
        });

        await _db.SaveChangesAsync();
        return tp;
    }

    public async Task<bool> UnshareProjectAsync(int teamId, string userId, int teamProjectId)
    {
        if (!await IsOwnerOrEditorAsync(teamId, userId)) return false;

        var tp = await _db.TeamProjects.FindAsync(teamProjectId);
        if (tp == null || tp.TeamId != teamId) return false;

        _db.TeamProjects.Remove(tp);
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<bool> IsMemberAsync(int teamId, string userId)
    {
        return await _db.TeamMembers.AnyAsync(m => m.TeamId == teamId && m.UserId == userId);
    }

    private async Task<bool> IsOwnerOrEditorAsync(int teamId, string userId)
    {
        return await _db.TeamMembers.AnyAsync(m =>
            m.TeamId == teamId && m.UserId == userId && (m.Role == "owner" || m.Role == "editor"));
    }
}

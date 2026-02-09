namespace AiDevRequest.API.Entities;

public class TeamWorkspace
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class TeamMember
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public required string UserId { get; set; }
    public required string Role { get; set; } // owner, editor, viewer
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class TeamActivity
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public required string UserId { get; set; }
    public required string Action { get; set; } // created, member_added, member_removed, role_changed, project_shared, comment
    public string? TargetUserId { get; set; }
    public string? Detail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TeamProject
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public Guid DevRequestId { get; set; }
    public required string SharedByUserId { get; set; }
    public DateTime SharedAt { get; set; } = DateTime.UtcNow;
}

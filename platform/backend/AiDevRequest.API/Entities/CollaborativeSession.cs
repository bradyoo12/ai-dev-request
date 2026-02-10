namespace AiDevRequest.API.Entities;

public class CollaborativeSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int ProjectId { get; set; }
    public string Status { get; set; } = "active"; // active, ended
    public string SessionName { get; set; } = "";

    // Participants (JSON array of { userId, displayName, color, joinedAt })
    public string ParticipantsJson { get; set; } = "[]";
    public int ParticipantCount { get; set; }

    // Document state
    public string? DocumentContent { get; set; }
    public int DocumentVersion { get; set; } = 1;

    // Activity feed (JSON array of { userId, action, detail, timestamp })
    public string ActivityFeedJson { get; set; } = "[]";

    // Metadata
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;
}

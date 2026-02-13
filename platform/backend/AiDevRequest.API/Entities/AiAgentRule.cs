namespace AiDevRequest.API.Entities;

public class AiAgentRule
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Scope { get; set; } = "user"; // project, user, org
    public string Category { get; set; } = string.Empty; // architecture, coding-standards, tech-stack, security, testing, deployment
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 50; // 0-100, higher = applied first
    public int TimesApplied { get; set; }
    public int? DevRequestId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

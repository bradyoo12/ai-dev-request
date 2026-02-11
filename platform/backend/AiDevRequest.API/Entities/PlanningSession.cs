namespace AiDevRequest.API.Entities;

public class PlanningSession
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid? DevRequestId { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public string Mode { get; set; } = "brainstorm";
    public string MessagesJson { get; set; } = "[]";
    public string PlanOutputJson { get; set; } = "{}";
    public int TotalMessages { get; set; }
    public int UserMessages { get; set; }
    public int AiMessages { get; set; }
    public int TokensUsed { get; set; }
    public decimal EstimatedSavings { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

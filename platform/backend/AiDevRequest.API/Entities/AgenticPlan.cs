namespace AiDevRequest.API.Entities;

public class AgenticPlan
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string UserPrompt { get; set; } = string.Empty;
    public string StepsJson { get; set; } = "[]";
    public string Status { get; set; } = "draft";
    public int TotalSteps { get; set; }
    public int CompletedSteps { get; set; }
    public int FailedSteps { get; set; }
    public int RetryCount { get; set; }
    public int TotalTokensUsed { get; set; }
    public int TotalTimeMs { get; set; }
    public bool RequiresApproval { get; set; } = true;
    public bool IsApproved { get; set; }
    public string ExecutionLogJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

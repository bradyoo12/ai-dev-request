namespace AiDevRequest.API.Entities;

public class AgentTrace
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string AuthorType { get; set; } = "ai"; // ai, human, mixed
    public int StartLine { get; set; }
    public int EndLine { get; set; }
    public int TotalLines { get; set; }
    public int AiGeneratedLines { get; set; }
    public int HumanEditedLines { get; set; }
    public double AiPercentage { get; set; }
    public string ModelUsed { get; set; } = string.Empty; // claude-opus-4-6, etc.
    public string ConversationId { get; set; } = string.Empty;
    public string PromptSummary { get; set; } = string.Empty;
    public string TraceFormat { get; set; } = "agent-trace-v1"; // agent-trace-v1
    public string TraceMetadata { get; set; } = string.Empty; // JSON
    public string ComplianceStatus { get; set; } = "compliant"; // compliant, review-needed, non-compliant
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

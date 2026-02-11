namespace AiDevRequest.API.Entities;

public class ArenaComparison
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string PromptText { get; set; } = string.Empty;
    public string TaskCategory { get; set; } = string.Empty; // code-generation, bug-fixing, architecture, etc.
    public string ModelOutputsJson { get; set; } = "[]"; // JSON array of {model, output, latencyMs, tokenCount, cost}
    public string? SelectedModel { get; set; }
    public string? SelectionReason { get; set; }
    public int ModelCount { get; set; }
    public decimal TotalCost { get; set; }
    public int TotalTokens { get; set; }
    public long TotalLatencyMs { get; set; }
    public string Status { get; set; } = "pending"; // pending, completed, winner_selected
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

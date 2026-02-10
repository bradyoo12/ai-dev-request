namespace AiDevRequest.API.Entities;

public class ObservabilityTrace
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public Guid? DevRequestId { get; set; }
    public required string TraceId { get; set; }
    public int TotalTokens { get; set; }
    public decimal TotalCost { get; set; }
    public long LatencyMs { get; set; }
    public string? Model { get; set; }
    public required string Status { get; set; } = "running";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public class ObservabilitySpan
{
    public int Id { get; set; }
    public int TraceId { get; set; }
    public required string SpanName { get; set; }
    public string? Model { get; set; }
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public int TotalTokens { get; set; }
    public decimal Cost { get; set; }
    public long LatencyMs { get; set; }
    public required string Status { get; set; } = "running";
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

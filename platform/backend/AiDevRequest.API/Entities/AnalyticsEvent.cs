namespace AiDevRequest.API.Entities;

public class AnalyticsEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int? UserId { get; set; }
    public string EventType { get; set; } = string.Empty; // page_view, request_created, analysis_completed, proposal_viewed, build_started, build_completed, preview_deployed
    public string? EventData { get; set; } // JSON with event-specific payload
    public string? SessionId { get; set; }
    public string? Page { get; set; }
    public string? Referrer { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

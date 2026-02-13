namespace AiDevRequest.API.Entities;

public class AgentMessage
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string MessageType { get; set; } = string.Empty; // task-delegation, resource-lock, progress-update, conflict-resolution, heartbeat
    public string FromAgent { get; set; } = string.Empty;
    public string ToAgent { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty; // JSON payload
    public string Priority { get; set; } = "normal"; // low, normal, high, critical
    public string DeliveryStatus { get; set; } = "sent"; // sent, delivered, acknowledged, failed
    public double LatencyMs { get; set; }
    public bool RequiresAck { get; set; }
    public bool Acknowledged { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public int RetryCount { get; set; }
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

namespace AiDevRequest.API.Entities;

public class PlaywrightMcpConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int ProjectId { get; set; }
    public string ServerUrl { get; set; } = "";
    public string Transport { get; set; } = "sse"; // sse, stdio
    public string Status { get; set; } = "disconnected"; // disconnected, connecting, connected, error
    public string? AuthType { get; set; } // none, bearer, api-key
    public string? AuthToken { get; set; }
    public bool AutoHealEnabled { get; set; } = true;
    public int HealingConfidenceThreshold { get; set; } = 70;
    public string? CapabilitiesJson { get; set; } // JSON array of discovered capabilities
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastConnectedAt { get; set; }
}

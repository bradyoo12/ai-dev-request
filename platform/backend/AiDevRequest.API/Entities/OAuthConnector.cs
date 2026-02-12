namespace AiDevRequest.API.Entities;

public class OAuthConnector
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = "disconnected"; // connected, disconnected, expired
    public string Scopes { get; set; } = string.Empty;
    public string AccessTokenHash { get; set; } = string.Empty;
    public string RefreshTokenHash { get; set; } = string.Empty;
    public DateTime? TokenExpiresAt { get; set; }
    public DateTime? ConnectedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public int TotalApiCalls { get; set; }
    public int FailedApiCalls { get; set; }
    public string IconUrl { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // payments, productivity, communication, development, database
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

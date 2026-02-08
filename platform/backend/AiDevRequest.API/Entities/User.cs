namespace AiDevRequest.API.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string Email { get; set; }

    public string? PasswordHash { get; set; }

    public string? DisplayName { get; set; }

    public string? ProfileImageUrl { get; set; }

    public string? AnonymousUserId { get; set; }

    // Social provider IDs
    public string? GoogleId { get; set; }
    public string? AppleId { get; set; }
    public string? LineId { get; set; }
    public string? KakaoId { get; set; }

    public string? CountryCode { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }
}

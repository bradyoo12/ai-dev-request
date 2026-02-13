using System.ComponentModel.DataAnnotations;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.DTOs;

public record CreateDevRequestDto
{
    [Required]
    [MinLength(10, ErrorMessage = "요청 내용은 최소 10자 이상이어야 합니다.")]
    [MaxLength(10000, ErrorMessage = "요청 내용은 최대 10000자까지 가능합니다.")]
    public required string Description { get; init; }

    [EmailAddress(ErrorMessage = "유효한 이메일 주소를 입력해주세요.")]
    public string? ContactEmail { get; init; }

    [Phone(ErrorMessage = "유효한 전화번호를 입력해주세요.")]
    public string? ContactPhone { get; init; }

    public string? ScreenshotBase64 { get; init; }

    public string? ScreenshotMediaType { get; init; }

    /// <summary>
    /// Preferred framework: react, vue, svelte, nextjs, nuxt, angular (default: auto-detect)
    /// </summary>
    public string? Framework { get; init; }

    /// <summary>
    /// AI power level: standard, extended, high_power (default: standard)
    /// </summary>
    public string? PowerLevel { get; init; }

    /// <summary>
    /// Preferred AI model: claude:claude-opus-4-6, claude:claude-sonnet-4-5-20250929, claude:claude-haiku-4-5-20251001 (default: user config)
    /// </summary>
    public string? PreferredModel { get; init; }
}

public record DevRequestResponseDto
{
    public Guid Id { get; init; }
    public required string Description { get; init; }
    public string? ContactEmail { get; init; }
    public bool HasScreenshot { get; init; }
    public RequestCategory Category { get; init; }
    public RequestComplexity Complexity { get; init; }
    public RequestStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? AnalyzedAt { get; init; }
    public DateTime? ProposedAt { get; init; }
    public string? ProjectId { get; init; }
}

public record DevRequestListItemDto
{
    public Guid Id { get; init; }
    public required string DescriptionPreview { get; init; }
    public RequestCategory Category { get; init; }
    public RequestComplexity Complexity { get; init; }
    public RequestStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
}

public static class DevRequestMappings
{
    public static DevRequestResponseDto ToResponseDto(this DevRequest entity)
    {
        return new DevRequestResponseDto
        {
            Id = entity.Id,
            Description = entity.Description,
            ContactEmail = entity.ContactEmail,
            HasScreenshot = !string.IsNullOrEmpty(entity.ScreenshotBase64),
            Category = entity.Category,
            Complexity = entity.Complexity,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt,
            AnalyzedAt = entity.AnalyzedAt,
            ProposedAt = entity.ProposedAt,
            ProjectId = entity.ProjectId
        };
    }

    public static DevRequestListItemDto ToListItemDto(this DevRequest entity)
    {
        return new DevRequestListItemDto
        {
            Id = entity.Id,
            DescriptionPreview = entity.Description.Length > 100
                ? entity.Description[..100] + "..."
                : entity.Description,
            Category = entity.Category,
            Complexity = entity.Complexity,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt
        };
    }

    public static DevRequest ToEntity(this CreateDevRequestDto dto, string userId)
    {
        var powerLevel = dto.PowerLevel?.ToLowerInvariant() switch
        {
            "extended" => Entities.PowerLevel.Extended,
            "high_power" => Entities.PowerLevel.HighPower,
            _ => Entities.PowerLevel.Standard
        };

        return new DevRequest
        {
            UserId = userId,
            Description = dto.Description,
            ContactEmail = dto.ContactEmail,
            ContactPhone = dto.ContactPhone,
            ScreenshotBase64 = dto.ScreenshotBase64,
            ScreenshotMediaType = dto.ScreenshotMediaType,
            Framework = dto.Framework,
            PowerLevel = powerLevel,
            PreferredModel = dto.PreferredModel
        };
    }
}

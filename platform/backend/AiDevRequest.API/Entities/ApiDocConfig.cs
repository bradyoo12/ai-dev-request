using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ApiDocConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string ProjectName { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// JSON array of endpoint metadata extracted from the generated project
    /// </summary>
    [Required]
    public required string EndpointsJson { get; set; }

    /// <summary>
    /// The generated OpenAPI 3.1 spec in JSON format
    /// </summary>
    public string? OpenApiSpecJson { get; set; }

    /// <summary>
    /// Comma-separated list of SDK languages to generate (e.g. "typescript,python,csharp")
    /// </summary>
    [MaxLength(200)]
    public string? SdkLanguages { get; set; }

    public ApiDocStatus Status { get; set; } = ApiDocStatus.Draft;

    /// <summary>
    /// Associated dev request ID (if generated from a dev request)
    /// </summary>
    public Guid? DevRequestId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum ApiDocStatus
{
    Draft,
    Generated,
    Published,
}

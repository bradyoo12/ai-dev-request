using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class Translation
{
    public int Id { get; set; }

    [Required]
    [MaxLength(10)]
    public required string LanguageCode { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Namespace { get; set; }

    [Required]
    [MaxLength(255)]
    public required string Key { get; set; }

    [Required]
    public required string Value { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

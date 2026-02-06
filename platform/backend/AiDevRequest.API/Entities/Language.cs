using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class Language
{
    public int Id { get; set; }

    [Required]
    [MaxLength(10)]
    public required string Code { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(100)]
    public required string NativeName { get; set; }

    public bool IsDefault { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

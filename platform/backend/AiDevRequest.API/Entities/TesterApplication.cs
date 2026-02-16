using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class TesterApplication
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(255)]
    public required string Email { get; set; }

    [Required]
    [MaxLength(5000)]
    public required string Motivation { get; set; }

    [Required]
    [MaxLength(50)]
    public string ExperienceLevel { get; set; } = "Beginner"; // Beginner, Intermediate, Expert

    [MaxLength(500)]
    public string? InterestedAreas { get; set; } // comma-separated

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, approved, rejected

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

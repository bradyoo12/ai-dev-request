using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ProjectLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProjectId { get; set; }

    public LogLevel Level { get; set; } = LogLevel.Info;

    [Required]
    [MaxLength(100)]
    public required string Source { get; set; }

    [Required]
    public required string Message { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Project? Project { get; set; }
}

public enum LogLevel
{
    Debug,
    Info,
    Warning,
    Error
}

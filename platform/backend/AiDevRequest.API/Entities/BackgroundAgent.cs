using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class BackgroundAgent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public Guid DevRequestId { get; set; }

    [MaxLength(200)]
    public string AgentName { get; set; } = "";

    [MaxLength(500)]
    public string? TaskDescription { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "idle";

    [MaxLength(200)]
    public string? BranchName { get; set; }

    [MaxLength(20)]
    public string AgentType { get; set; } = "general";

    [MaxLength(20)]
    public string Priority { get; set; } = "normal";

    public int TotalSteps { get; set; } = 0;
    public int CompletedSteps { get; set; } = 0;
    public double ProgressPercent { get; set; } = 0;

    public int FilesCreated { get; set; } = 0;
    public int FilesModified { get; set; } = 0;
    public int TestsPassed { get; set; } = 0;
    public int TestsFailed { get; set; } = 0;
    public int ErrorCount { get; set; } = 0;
    public int SelfHealAttempts { get; set; } = 0;

    public double CpuUsagePercent { get; set; } = 0;
    public double MemoryUsageMb { get; set; } = 0;
    public double TokensUsed { get; set; } = 0;
    public double EstimatedCost { get; set; } = 0;
    public int ElapsedSeconds { get; set; } = 0;
    public int EstimatedRemainingSeconds { get; set; } = 0;

    [MaxLength(500)]
    public string? PullRequestUrl { get; set; }

    [MaxLength(20)]
    public string? PullRequestStatus { get; set; }

    public string? LogEntriesJson { get; set; }
    public string? StepsJson { get; set; }
    public string? InstalledPackagesJson { get; set; }

    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

namespace AiDevRequest.API.Entities;

public class DevelopmentSpec
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int DevRequestId { get; set; }
    public string Phase { get; set; } = "requirements"; // requirements, design, implementation
    public string Status { get; set; } = "pending"; // pending, generating, review, approved, rejected

    // Requirements phase
    public string? UserStories { get; set; } // JSON array of user stories
    public string? AcceptanceCriteria { get; set; } // JSON array
    public string? EdgeCases { get; set; } // JSON array

    // Design phase
    public string? ArchitectureDecisions { get; set; } // JSON
    public string? ApiContracts { get; set; } // JSON
    public string? DataModels { get; set; } // JSON
    public string? ComponentBreakdown { get; set; } // JSON

    // Implementation phase
    public string? TaskList { get; set; } // JSON array of file-level tasks
    public string? DependencyOrder { get; set; } // JSON array
    public string? EstimatedFiles { get; set; } // JSON array of file paths

    // Traceability
    public string? TraceabilityLinks { get; set; } // JSON mapping tasks to requirements

    // Rejection feedback
    public string? RejectionFeedback { get; set; }

    // Metadata
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

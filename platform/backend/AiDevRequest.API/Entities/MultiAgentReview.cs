namespace AiDevRequest.API.Entities;

public class MultiAgentReview
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int ProjectId { get; set; }
    public string Status { get; set; } = "pending"; // pending, running, completed, failed

    // Composite risk score (0-100) aggregated from all agents
    public int CompositeRiskScore { get; set; }

    // Risk breakdown
    public int ComplexityRisk { get; set; }
    public int FilesChangedRisk { get; set; }
    public int TestCoverageRisk { get; set; }
    public int SecurityRisk { get; set; }

    // Test suggestions (JSON array)
    public string? TestSuggestions { get; set; }

    // Agent results summary (JSON)
    public string? AgentsSummary { get; set; }

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

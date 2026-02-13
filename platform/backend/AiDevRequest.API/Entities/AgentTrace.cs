namespace AiDevRequest.API.Entities;

public class AgentTrace
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DevRequestId { get; set; }
    public string Status { get; set; } = "pending"; // pending, recording, completed, failed

    // Attribution summary
    public int TotalFiles { get; set; }
    public int AiGeneratedFiles { get; set; }
    public int HumanEditedFiles { get; set; }
    public int MixedFiles { get; set; }
    public decimal AiContributionPercentage { get; set; }

    // Agent Trace spec JSON (array of file-level attribution records)
    public string? TraceDataJson { get; set; } // JSON: [{ filePath, ranges: [{ startLine, endLine, source, conversationId, agentId, timestamp }] }]

    // Export metadata
    public string? ExportFormat { get; set; } // "agent-trace-v1"
    public string? ExportedAt { get; set; }

    // Metadata
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

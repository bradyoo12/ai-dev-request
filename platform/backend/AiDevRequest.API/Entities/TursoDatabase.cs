namespace AiDevRequest.API.Entities;

public class TursoDatabase
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ProjectName { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;          // primary region: us-east, eu-west, ap-southeast, etc.
    public int ReplicaCount { get; set; }
    public string[] ReplicaRegions { get; set; } = [];
    public long SizeBytes { get; set; }
    public int TableCount { get; set; }
    public bool VectorSearchEnabled { get; set; }
    public int VectorDimensions { get; set; }
    public bool SchemaBranchingEnabled { get; set; }
    public int ActiveBranches { get; set; }
    public bool EmbeddedReplicaEnabled { get; set; }
    public double ReadLatencyMs { get; set; }
    public double WriteLatencyMs { get; set; }
    public long TotalReads { get; set; }
    public long TotalWrites { get; set; }
    public string SyncMode { get; set; } = "automatic";        // automatic, manual, scheduled
    public string Status { get; set; } = "active";             // active, syncing, branched, archived
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

namespace AiDevRequest.API.Entities;

public class VectorSearchConfig
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string IndexName { get; set; } = string.Empty;
    public string Provider { get; set; } = "qdrant"; // qdrant, pinecone, weaviate, pgvector
    public string SearchMode { get; set; } = "hybrid"; // vector-only, keyword-only, hybrid
    public string FusionAlgorithm { get; set; } = "rrf"; // rrf, linear, weighted
    public double VectorWeight { get; set; } = 0.7;
    public double KeywordWeight { get; set; } = 0.3;
    public int TopK { get; set; } = 10;
    public double SimilarityThreshold { get; set; } = 0.7;
    public bool QueryExpansion { get; set; } = true;
    public bool MetadataFiltering { get; set; } = true;
    public int VectorDimension { get; set; } = 1536;
    public long TotalVectors { get; set; }
    public double AvgQueryLatencyMs { get; set; }
    public long TotalQueries { get; set; }
    public string Status { get; set; } = "active"; // active, indexing, error
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

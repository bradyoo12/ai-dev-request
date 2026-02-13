namespace AiDevRequest.API.Services;

/// <summary>
/// Service for retrieving relevant organizational memories for AI context.
/// Combines vector search with filtering and ranking to provide the most relevant memories.
/// </summary>
public interface IMemoryRetrievalService
{
    /// <summary>
    /// Retrieve relevant memories for a given query/context.
    /// </summary>
    /// <param name="query">Query text to search for</param>
    /// <param name="userId">User ID to filter memories</param>
    /// <param name="limit">Maximum number of memories to retrieve</param>
    /// <returns>Formatted memory context string</returns>
    Task<string> RetrieveMemoryContextAsync(string query, string userId, int limit = 10);

    /// <summary>
    /// Retrieve memories and return as structured data.
    /// </summary>
    Task<List<RetrievedMemory>> RetrieveMemoriesAsync(string query, string userId, int limit = 10);

    /// <summary>
    /// Store a new memory with automatic embedding generation.
    /// </summary>
    Task StoreMemoryAsync(string userId, string content, string category, Dictionary<string, object>? metadata = null);
}

public class RetrievedMemory
{
    public Guid Id { get; set; }
    public required string Content { get; set; }
    public float Similarity { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public class MemoryRetrievalService : IMemoryRetrievalService
{
    private readonly IEfCoreVectorSearchService _vectorSearchService;
    private readonly IEmbeddingService _embeddingService;
    private readonly ILogger<MemoryRetrievalService> _logger;

    public MemoryRetrievalService(
        IEfCoreVectorSearchService vectorSearchService,
        IEmbeddingService embeddingService,
        ILogger<MemoryRetrievalService> logger)
    {
        _vectorSearchService = vectorSearchService;
        _embeddingService = embeddingService;
        _logger = logger;
    }

    public async Task<string> RetrieveMemoryContextAsync(string query, string userId, int limit = 10)
    {
        var memories = await RetrieveMemoriesAsync(query, userId, limit);

        if (memories.Count == 0)
        {
            return string.Empty;
        }

        var lines = new List<string>
        {
            "## Organizational Memory Context",
            "",
            "Relevant memories from previous interactions:",
            ""
        };

        foreach (var memory in memories)
        {
            lines.Add($"- {memory.Content} (similarity: {memory.Similarity:F2})");
        }

        var context = string.Join("\n", lines);
        _logger.LogInformation("Retrieved {Count} memories for user {UserId}", memories.Count, userId);

        return context;
    }

    public async Task<List<RetrievedMemory>> RetrieveMemoriesAsync(string query, string userId, int limit = 10)
    {
        // Generate embedding for the query
        var queryVector = await _embeddingService.GenerateEmbeddingAsync(query);

        // Perform vector similarity search
        var similarMemories = await _vectorSearchService.SearchSimilarAsync(queryVector, userId, limit);

        // Convert to retrieved memory format
        var retrieved = similarMemories.Select(m => new RetrievedMemory
        {
            Id = m.Id,
            Content = m.Content,
            Similarity = 0.95f, // Placeholder - actual similarity would be calculated during search
            Metadata = ParseMetadata(m.MetadataJson)
        }).ToList();

        return retrieved;
    }

    public async Task StoreMemoryAsync(
        string userId, string content, string category, Dictionary<string, object>? metadata = null)
    {
        // Generate embedding for the content
        var embedding = await _embeddingService.GenerateEmbeddingAsync(content);

        // Add category to metadata
        var fullMetadata = metadata ?? new Dictionary<string, object>();
        fullMetadata["category"] = category;

        // Store in vector database
        await _vectorSearchService.AddMemoryAsync(userId, content, embedding, fullMetadata);

        _logger.LogInformation("Stored memory for user {UserId} in category {Category}", userId, category);
    }

    private static Dictionary<string, object>? ParseMetadata(string? metadataJson)
    {
        if (string.IsNullOrEmpty(metadataJson))
        {
            return null;
        }

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(metadataJson);
        }
        catch
        {
            return null;
        }
    }
}

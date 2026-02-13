namespace AiDevRequest.API.Services;

/// <summary>
/// Service for generating text embeddings for vector search.
/// This is a stub implementation - can be integrated with OpenAI/Anthropic/local models later.
/// </summary>
public interface IEmbeddingService
{
    /// <summary>
    /// Generate embedding vector for text content.
    /// </summary>
    /// <param name="text">Text to embed</param>
    /// <returns>Embedding vector (1536-dimensional for OpenAI compatibility)</returns>
    Task<float[]> GenerateEmbeddingAsync(string text);

    /// <summary>
    /// Generate embeddings for multiple texts in batch.
    /// </summary>
    Task<List<float[]>> GenerateEmbeddingsAsync(List<string> texts);
}

public class EmbeddingService : IEmbeddingService
{
    private readonly ILogger<EmbeddingService> _logger;

    public EmbeddingService(ILogger<EmbeddingService> logger)
    {
        _logger = logger;
    }

    public Task<float[]> GenerateEmbeddingAsync(string text)
    {
        // Stub implementation: Generate a simple hash-based embedding
        // In production, integrate with OpenAI embeddings API or Anthropic's embedding service
        _logger.LogWarning("Using stub embedding generation. Integrate with OpenAI/Anthropic for production.");

        var embedding = GenerateStubEmbedding(text);
        return Task.FromResult(embedding);
    }

    public Task<List<float[]>> GenerateEmbeddingsAsync(List<string> texts)
    {
        var embeddings = texts.Select(GenerateStubEmbedding).ToList();
        return Task.FromResult(embeddings);
    }

    private static float[] GenerateStubEmbedding(string text)
    {
        // Generate a deterministic 1536-dimensional vector based on text hash
        // This is NOT suitable for production - use actual embedding models
        const int dimensions = 1536;
        var embedding = new float[dimensions];
        var hash = text.GetHashCode();
        var random = new Random(hash);

        for (int i = 0; i < dimensions; i++)
        {
            embedding[i] = (float)(random.NextDouble() * 2 - 1); // Range: -1 to 1
        }

        // Normalize the vector
        var magnitude = (float)Math.Sqrt(embedding.Sum(x => x * x));
        for (int i = 0; i < dimensions; i++)
        {
            embedding[i] /= magnitude;
        }

        return embedding;
    }
}

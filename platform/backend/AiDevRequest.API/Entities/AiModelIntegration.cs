namespace AiDevRequest.API.Entities;

public class AiModelIntegration
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty; // openai, anthropic, google, huggingface, openrouter
    public string ModelId { get; set; } = string.Empty; // gpt-4o, claude-opus-4-6, gemini-2.5-pro, etc.
    public string Capability { get; set; } = string.Empty; // chat, image-gen, embeddings, speech, classification
    public string IntegrationStatus { get; set; } = "pending"; // pending, configured, active, error
    public bool CredentialSecured { get; set; }
    public string ConfigJson { get; set; } = string.Empty; // JSON config
    public double EstimatedCostPerRequest { get; set; }
    public int TotalRequests { get; set; }
    public string GeneratedCodeSnippet { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

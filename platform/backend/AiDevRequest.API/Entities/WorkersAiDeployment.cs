namespace AiDevRequest.API.Entities;

public class WorkersAiDeployment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ProjectName { get; set; } = string.Empty;
    public string ModelId { get; set; } = string.Empty;        // e.g. @cf/meta/llama-3-8b-instruct
    public string ModelCategory { get; set; } = string.Empty;  // text-generation, image-classification, embeddings, speech-to-text, translation
    public string EdgeRegion { get; set; } = string.Empty;     // auto, us, eu, ap
    public int EdgeLocations { get; set; }
    public double InferenceLatencyMs { get; set; }
    public long TotalInferences { get; set; }
    public long TokensProcessed { get; set; }
    public double CostUsd { get; set; }
    public bool CustomModel { get; set; }
    public string CustomModelSource { get; set; } = string.Empty; // huggingface, upload, none
    public bool ZeroColdStart { get; set; }
    public double SuccessRate { get; set; }
    public string Status { get; set; } = "active";              // active, deploying, error, archived
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

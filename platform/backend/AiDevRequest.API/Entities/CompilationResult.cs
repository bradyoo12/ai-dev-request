namespace AiDevRequest.API.Entities;

public class CompilationResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DevRequestId { get; set; }
    public string Language { get; set; } = "";
    public bool Success { get; set; }
    public string ErrorsJson { get; set; } = "[]";
    public string WarningsJson { get; set; } = "[]";
    public int RetryCount { get; set; }
    public DateTime CompiledAt { get; set; } = DateTime.UtcNow;
}

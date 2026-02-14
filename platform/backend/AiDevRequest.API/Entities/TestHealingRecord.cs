namespace AiDevRequest.API.Entities;

public class TestHealingRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TestConfigId { get; set; }

    public string OriginalLocator { get; set; } = "";
    public string UpdatedLocator { get; set; } = "";
    public string FailureReason { get; set; } = "";
    public string HealingStrategy { get; set; } = "";
    public bool Success { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

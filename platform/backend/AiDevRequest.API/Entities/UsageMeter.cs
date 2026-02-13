namespace AiDevRequest.API.Entities;

public class UsageMeter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = "";
    public Guid? DevRequestId { get; set; }
    public string MeterType { get; set; } = "ai_compute"; // ai_compute, build_minutes, test_runs, preview_deploys
    public decimal Units { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public string Status { get; set; } = "pending"; // pending, billed, credited
    public string Outcome { get; set; } = "success"; // success, failed, partial
    public string? MetadataJson { get; set; } // JSON with model, tokens, duration details
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? BilledAt { get; set; }
}

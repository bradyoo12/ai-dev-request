namespace AiDevRequest.API.Entities;

public class PatentInnovation
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // "Tier 1", "Tier 2", "Tier 3"
    public string PatentAngle { get; set; } = string.Empty;
    public string Innovation { get; set; } = string.Empty;
    public string Uniqueness { get; set; } = string.Empty;
    public string PriorArt { get; set; } = string.Empty;
    public string RelatedFiles { get; set; } = string.Empty; // comma-separated
    public string Status { get; set; } = "Identified"; // Identified, Drafted, Filed, Granted
    public int NoveltyScore { get; set; }
    public int NonObviousnessScore { get; set; }
    public int UtilityScore { get; set; }
    public int CommercialValueScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

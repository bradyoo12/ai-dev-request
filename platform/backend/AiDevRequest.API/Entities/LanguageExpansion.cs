namespace AiDevRequest.API.Entities;

public class LanguageExpansion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ProjectName { get; set; } = string.Empty;
    public string SourceLanguage { get; set; } = "en";
    public string TargetLanguage { get; set; } = string.Empty;
    public int KeysTranslated { get; set; }
    public int TotalKeys { get; set; }
    public double CoveragePercent { get; set; }
    public double QualityScore { get; set; }
    public bool MachineTranslated { get; set; }
    public bool HumanReviewed { get; set; }
    public int MissingKeys { get; set; }
    public int PluralizationRules { get; set; }
    public bool RtlSupport { get; set; }
    public double TranslationTimeMs { get; set; }
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

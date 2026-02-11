using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class FrameworkConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = "";

    public string SelectedFramework { get; set; } = "react-vite";
    public string SelectedBackend { get; set; } = "none";
    public string SelectedDatabase { get; set; } = "none";
    public string SelectedStyling { get; set; } = "tailwind";

    public int ProjectsGenerated { get; set; } = 0;
    public string LastGeneratedProjectId { get; set; } = "";
    public string FavoriteFrameworks { get; set; } = "";

    public string CustomTemplateJson { get; set; } = "{}";
    public string FrameworkHistoryJson { get; set; } = "[]";

    public bool AutoDetectStack { get; set; } = true;
    public bool IncludeDocker { get; set; } = false;
    public bool IncludeCI { get; set; } = false;
    public bool IncludeTests { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

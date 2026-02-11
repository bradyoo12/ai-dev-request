namespace AiDevRequest.API.Entities;

public class ViewTransitionConfig
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string TransitionPreset { get; set; } = "fade";
    public int TransitionDurationMs { get; set; } = 300;
    public string EasingFunction { get; set; } = "ease-in-out";
    public bool EnableViewTransitions { get; set; } = true;
    public bool EnableFramerMotion { get; set; } = false;
    public bool EnablePageTransitions { get; set; } = true;
    public bool EnableComponentAnimations { get; set; } = true;
    public bool EnableLoadingAnimations { get; set; } = true;
    public string CustomCssJson { get; set; } = "{}";
    public string PresetHistoryJson { get; set; } = "[]";
    public int ProjectsWithTransitions { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

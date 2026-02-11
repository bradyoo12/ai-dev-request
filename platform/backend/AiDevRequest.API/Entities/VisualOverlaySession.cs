namespace AiDevRequest.API.Entities;

public class VisualOverlaySession
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid? DevRequestId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? SelectedElementPath { get; set; } // CSS selector path of selected element
    public string ModificationsJson { get; set; } = "[]"; // JSON array of {elementPath, property, oldValue, newValue}
    public string ComponentTreeJson { get; set; } = "[]"; // JSON component hierarchy
    public string Status { get; set; } = "active"; // active, paused, completed
    public int TotalEdits { get; set; }
    public int UndoCount { get; set; }
    public int RedoCount { get; set; }
    public int ViewportWidth { get; set; } = 1280;
    public int ViewportHeight { get; set; } = 720;
    public string? PreviewUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

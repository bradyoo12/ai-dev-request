namespace AiDevRequest.API.Entities;

public class VisionToCodeResult
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ImageName { get; set; } = string.Empty;
    public string ImageType { get; set; } = string.Empty; // screenshot, mockup, sketch, wireframe
    public int ComponentsGenerated { get; set; }
    public int LinesOfCode { get; set; }
    public string Framework { get; set; } = "react"; // react, vue, html
    public string StylingEngine { get; set; } = "tailwind"; // tailwind, css-modules, styled-components
    public double StyleMatchScore { get; set; } // 0.0 - 1.0
    public double LayoutAccuracy { get; set; } // 0.0 - 1.0
    public double ColorAccuracy { get; set; } // 0.0 - 1.0
    public double TypographyAccuracy { get; set; } // 0.0 - 1.0
    public int ProcessingMs { get; set; }
    public int Refinements { get; set; }
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

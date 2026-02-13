namespace AiDevRequest.API.Entities;

public class CodebaseGraph
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public int TotalNodes { get; set; }
    public int TotalEdges { get; set; }
    public int Components { get; set; }
    public int Pages { get; set; }
    public int Services { get; set; }
    public int Utilities { get; set; }
    public int MaxDepth { get; set; }
    public double AvgConnections { get; set; }
    public int CircularDeps { get; set; }
    public double CouplingScore { get; set; }
    public double CohesionScore { get; set; }
    public double ComplexityScore { get; set; }
    public string AnalysisMode { get; set; } = "full"; // full, dependencies-only, impact-only
    public string Status { get; set; } = "completed"; // pending, analyzing, completed, failed
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

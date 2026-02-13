namespace AiDevRequest.API.Entities;

public class ReplTestSession
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string TestMode { get; set; } = "repl"; // repl, browser, hybrid
    public string Runtime { get; set; } = "node"; // node, deno, bun, python
    public int TotalTests { get; set; }
    public int PassedTests { get; set; }
    public int FailedTests { get; set; }
    public int PotemkinDetections { get; set; }
    public int DbStateChecks { get; set; }
    public int LogsCaptured { get; set; }
    public double AvgLatencyMs { get; set; }
    public double SpeedupFactor { get; set; } = 3.0;
    public double CostReduction { get; set; } = 10.0;
    public string Status { get; set; } = "idle"; // idle, running, completed, failed
    public string ResultSummary { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

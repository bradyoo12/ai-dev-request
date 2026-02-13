namespace AiDevRequest.API.Entities;

public class CodeLintResult
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Language { get; set; } = "typescript"; // typescript, csharp, python, go, rust
    public string Severity { get; set; } = "warning"; // info, warning, error, critical
    public string Category { get; set; } = "code-smell"; // bug, vulnerability, code-smell, security, performance, maintainability
    public string RuleId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public int LineNumber { get; set; }
    public string Snippet { get; set; } = string.Empty;
    public string SuggestedFix { get; set; } = string.Empty;
    public string AutofixStatus { get; set; } = "pending"; // pending, applied, dismissed, pr-created
    public string PullRequestUrl { get; set; } = string.Empty;
    public bool IsResolved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

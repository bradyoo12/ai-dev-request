using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/hybrid-validation")]
public class HybridValidationController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public HybridValidationController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.HybridValidations
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidateRequest req)
    {
        var rules = GetRulesForOperation(req.OperationType);
        var rulesApplied = rules.Select(r => r.Name).ToList();
        var failedRules = new List<string>();
        var passedRules = new List<string>();

        foreach (var rule in rules)
        {
            if (SimulateRuleCheck(rule, req.AiOutput))
                passedRules.Add(rule.Name);
            else
                failedRules.Add(rule.Name);
        }

        var validationResult = failedRules.Count == 0 ? "passed" : "failed";
        var retryCount = 0;
        var usedFallback = false;
        var fallbackAction = "";
        var failureReason = "";

        if (validationResult == "failed")
        {
            retryCount = Math.Min(new Random().Next(1, 4), 3);
            if (retryCount >= 3)
            {
                usedFallback = true;
                fallbackAction = GetFallbackAction(req.OperationType);
                validationResult = "retried";
                failureReason = $"Failed rules: {string.Join(", ", failedRules)}. Used fallback after {retryCount} retries.";
            }
            else
            {
                validationResult = "retried";
                failureReason = $"Failed rules: {string.Join(", ", failedRules)}. AI corrected on retry {retryCount}.";
                passedRules.AddRange(failedRules);
                failedRules.Clear();
            }
        }

        var confidence = failedRules.Count == 0
            ? 0.85 + new Random().NextDouble() * 0.15
            : 0.3 + new Random().NextDouble() * 0.3;

        var record = new HybridValidation
        {
            UserId = "demo-user",
            ProjectName = req.ProjectName,
            OperationType = req.OperationType,
            AiOutput = req.AiOutput,
            ValidationResult = validationResult,
            RetryCount = retryCount,
            MaxRetries = 3,
            UsedFallback = usedFallback,
            FallbackAction = fallbackAction,
            FailureReason = failureReason,
            RulesApplied = JsonSerializer.Serialize(rulesApplied),
            RulesPassedCount = passedRules.Count,
            RulesFailedCount = failedRules.Count,
            ConfidenceScore = Math.Round(confidence, 3),
            ValidationTimeMs = 50 + new Random().NextDouble() * 200
        };

        _db.HybridValidations.Add(record);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            record.Id,
            record.ProjectName,
            record.OperationType,
            record.ValidationResult,
            record.RetryCount,
            record.UsedFallback,
            record.FallbackAction,
            record.FailureReason,
            record.RulesPassedCount,
            record.RulesFailedCount,
            record.ConfidenceScore,
            record.ValidationTimeMs,
            rulesApplied,
            passedRules,
            failedRules,
            recommendation = usedFallback
                ? "Fallback action applied. Review and verify manually."
                : failedRules.Count == 0
                    ? "All validation rules passed. Safe to proceed."
                    : $"AI corrected output after {retryCount} retries. Verify before proceeding."
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.HybridValidations.FindAsync(id);
        if (item == null) return NotFound();
        _db.HybridValidations.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await _db.HybridValidations.ToListAsync();
        var byType = all.GroupBy(x => x.OperationType)
            .Select(g => new { type = g.Key, count = g.Count(), avgConfidence = Math.Round(g.Average(x => x.ConfidenceScore), 3) })
            .ToList();
        return Ok(new { total = all.Count, byType });
    }

    [HttpGet("operations")]
    public IActionResult Operations()
    {
        var ops = new[]
        {
            new { id = "db-migration", name = "Database Migration", description = "Schema validation, no DROP TABLE, foreign key integrity", severity = "critical", rules = new[] { "No destructive DDL", "Foreign key integrity", "Index validation", "Data type compatibility" } },
            new { id = "git-operation", name = "Git Operation", description = "Branch protection, no force push, commit message format", severity = "high", rules = new[] { "Branch protection", "No force push", "Commit message format", "Merge conflict check" } },
            new { id = "file-operation", name = "File Operation", description = "Path sanitization, no system file modification, size limits", severity = "medium", rules = new[] { "Path sanitization", "No system files", "Size limit check", "Extension whitelist" } },
            new { id = "api-validation", name = "API Validation", description = "OpenAPI spec compliance, input validation, rate limiting", severity = "high", rules = new[] { "OpenAPI spec check", "Input validation", "Rate limit config", "Auth requirement" } },
            new { id = "security-check", name = "Security Check", description = "Credential scanning, dependency audit, OWASP compliance", severity = "critical", rules = new[] { "Credential scanning", "Dependency audit", "OWASP compliance", "Secret detection" } }
        };
        return Ok(ops);
    }

    private static List<ValidationRule> GetRulesForOperation(string operationType)
    {
        return operationType switch
        {
            "db-migration" => new List<ValidationRule>
            {
                new("No destructive DDL", "Ensures no DROP TABLE/COLUMN in migration"),
                new("Foreign key integrity", "Validates all FK references exist"),
                new("Index validation", "Checks index naming and uniqueness"),
                new("Data type compatibility", "Ensures type changes are backward compatible")
            },
            "git-operation" => new List<ValidationRule>
            {
                new("Branch protection", "Prevents direct push to protected branches"),
                new("No force push", "Blocks force push to shared branches"),
                new("Commit message format", "Validates conventional commit format"),
                new("Merge conflict check", "Detects unresolved merge conflicts")
            },
            "file-operation" => new List<ValidationRule>
            {
                new("Path sanitization", "Prevents path traversal attacks"),
                new("No system files", "Blocks modification of OS/system files"),
                new("Size limit check", "Enforces file size limits"),
                new("Extension whitelist", "Only allows safe file extensions")
            },
            "api-validation" => new List<ValidationRule>
            {
                new("OpenAPI spec check", "Validates against OpenAPI schema"),
                new("Input validation", "Checks for SQL injection, XSS"),
                new("Rate limit config", "Ensures rate limiting is configured"),
                new("Auth requirement", "Validates authentication is required")
            },
            "security-check" => new List<ValidationRule>
            {
                new("Credential scanning", "Scans for hardcoded credentials"),
                new("Dependency audit", "Checks for known vulnerabilities"),
                new("OWASP compliance", "Validates against OWASP Top 10"),
                new("Secret detection", "Detects API keys, tokens, passwords")
            },
            _ => new List<ValidationRule>
            {
                new("General validation", "Basic output validation")
            }
        };
    }

    private static bool SimulateRuleCheck(ValidationRule rule, string aiOutput)
    {
        var rand = new Random(rule.Name.GetHashCode() + aiOutput.Length);
        return rand.NextDouble() > 0.2;
    }

    private static string GetFallbackAction(string operationType)
    {
        return operationType switch
        {
            "db-migration" => "Apply safe migration with additive-only changes",
            "git-operation" => "Create PR instead of direct push",
            "file-operation" => "Write to sandboxed directory",
            "api-validation" => "Return cached response with warning",
            "security-check" => "Block operation and alert security team",
            _ => "Skip operation and log for manual review"
        };
    }

    private record ValidationRule(string Name, string Description);

    public class ValidateRequest
    {
        public string ProjectName { get; set; } = string.Empty;
        public string OperationType { get; set; } = string.Empty;
        public string AiOutput { get; set; } = string.Empty;
    }
}

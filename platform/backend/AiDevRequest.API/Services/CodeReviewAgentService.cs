using System.Text.RegularExpressions;

namespace AiDevRequest.API.Services;

public interface ICodeReviewAgentService
{
    Task<CodeReviewAgentResult> ReviewAsync(string code, string language, string fileName);
    CodeReviewAgentResult? GetReview(Guid id);
}

public class CodeReviewAgentService : ICodeReviewAgentService
{
    private readonly ILogger<CodeReviewAgentService> _logger;
    private static readonly Dictionary<Guid, CodeReviewAgentResult> _reviewCache = new();

    public CodeReviewAgentService(ILogger<CodeReviewAgentService> logger)
    {
        _logger = logger;
    }

    public Task<CodeReviewAgentResult> ReviewAsync(string code, string language, string fileName)
    {
        _logger.LogInformation("Starting code review agent for file {FileName} ({Language})", fileName, language);

        var findings = new List<CodeReviewAgentFinding>();
        var lines = code.Split('\n');

        // Check for hardcoded secrets
        findings.AddRange(CheckHardcodedSecrets(lines));

        // Check for SQL injection patterns
        findings.AddRange(CheckSqlInjection(lines, language));

        // Check for XSS patterns
        findings.AddRange(CheckXssPatterns(lines, language));

        // Check for missing error handling
        findings.AddRange(CheckMissingErrorHandling(lines, language));

        // Check for console.log statements
        findings.AddRange(CheckConsoleLogStatements(lines, language));

        // Check for additional best practice issues
        findings.AddRange(CheckBestPractices(lines, language));

        // Calculate score
        var criticalCount = findings.Count(f => f.Severity == "critical");
        var warningCount = findings.Count(f => f.Severity == "warning");
        var infoCount = findings.Count(f => f.Severity == "info");

        var penalty = criticalCount * 20 + warningCount * 10 + infoCount * 3;
        var score = Math.Max(0, Math.Min(100, 100 - penalty));

        var overallStatus = criticalCount > 0 ? "fail"
            : warningCount > 0 ? "warning"
            : "pass";

        var result = new CodeReviewAgentResult
        {
            Id = Guid.NewGuid(),
            OverallStatus = overallStatus,
            Score = score,
            Findings = findings,
            FileName = fileName,
            Language = language,
            ReviewedAt = DateTime.UtcNow,
        };

        _reviewCache[result.Id] = result;

        _logger.LogInformation(
            "Code review completed for {FileName}: status={Status}, score={Score}, findings={Count}",
            fileName, overallStatus, score, findings.Count);

        return Task.FromResult(result);
    }

    public CodeReviewAgentResult? GetReview(Guid id)
    {
        return _reviewCache.TryGetValue(id, out var result) ? result : null;
    }

    private static List<CodeReviewAgentFinding> CheckHardcodedSecrets(string[] lines)
    {
        var findings = new List<CodeReviewAgentFinding>();

        var secretPatterns = new[]
        {
            (Pattern: new Regex(@"(password|passwd|pwd)\s*[:=]\s*[""'][^""']+[""']", RegexOptions.IgnoreCase), Title: "Hardcoded password detected"),
            (Pattern: new Regex(@"(api[_-]?key|apikey)\s*[:=]\s*[""'][^""']+[""']", RegexOptions.IgnoreCase), Title: "Hardcoded API key detected"),
            (Pattern: new Regex(@"(secret|token)\s*[:=]\s*[""'][A-Za-z0-9+/=]{16,}[""']", RegexOptions.IgnoreCase), Title: "Hardcoded secret/token detected"),
            (Pattern: new Regex(@"(aws_access_key_id|aws_secret_access_key)\s*[:=]\s*[""'][^""']+[""']", RegexOptions.IgnoreCase), Title: "Hardcoded AWS credentials detected"),
            (Pattern: new Regex(@"(PRIVATE[_\s]?KEY|BEGIN RSA)", RegexOptions.IgnoreCase), Title: "Private key found in source code"),
        };

        for (var i = 0; i < lines.Length; i++)
        {
            foreach (var (pattern, title) in secretPatterns)
            {
                if (pattern.IsMatch(lines[i]))
                {
                    findings.Add(new CodeReviewAgentFinding
                    {
                        Severity = "critical",
                        Category = "security",
                        Title = title,
                        Description = "Hardcoded secrets in source code can be extracted by attackers. Use environment variables or a secrets manager instead.",
                        Line = i + 1,
                        Suggestion = "Move the secret to an environment variable or a dedicated secrets manager (e.g., Azure Key Vault, AWS Secrets Manager).",
                    });
                }
            }
        }

        return findings;
    }

    private static List<CodeReviewAgentFinding> CheckSqlInjection(string[] lines, string language)
    {
        var findings = new List<CodeReviewAgentFinding>();

        var sqlPatterns = new[]
        {
            new Regex(@"(""SELECT|""INSERT|""UPDATE|""DELETE|""DROP).*\+\s*\w+", RegexOptions.IgnoreCase),
            new Regex(@"(`SELECT|`INSERT|`UPDATE|`DELETE|`DROP).*\$\{", RegexOptions.IgnoreCase),
            new Regex(@"(""SELECT|""INSERT|""UPDATE|""DELETE).*string\.Format", RegexOptions.IgnoreCase),
            new Regex(@"(""SELECT|""INSERT|""UPDATE|""DELETE).*\$""", RegexOptions.IgnoreCase),
            new Regex(@"\.query\(\s*[""'`].*\+\s*\w+", RegexOptions.IgnoreCase),
            new Regex(@"\.ExecuteSqlRaw\(\s*\$""", RegexOptions.IgnoreCase),
        };

        for (var i = 0; i < lines.Length; i++)
        {
            foreach (var pattern in sqlPatterns)
            {
                if (pattern.IsMatch(lines[i]))
                {
                    findings.Add(new CodeReviewAgentFinding
                    {
                        Severity = "critical",
                        Category = "security",
                        Title = "Potential SQL injection vulnerability",
                        Description = "String concatenation in SQL queries can lead to SQL injection attacks. An attacker could manipulate query parameters to access or modify unauthorized data.",
                        Line = i + 1,
                        Suggestion = "Use parameterized queries or an ORM with proper parameter binding instead of string concatenation.",
                    });
                    break;
                }
            }
        }

        return findings;
    }

    private static List<CodeReviewAgentFinding> CheckXssPatterns(string[] lines, string language)
    {
        var findings = new List<CodeReviewAgentFinding>();

        var xssPatterns = new[]
        {
            (Pattern: new Regex(@"\.innerHTML\s*=", RegexOptions.IgnoreCase), Title: "Direct innerHTML assignment", Desc: "Setting innerHTML directly can lead to XSS if the content is user-controlled."),
            (Pattern: new Regex(@"dangerouslySetInnerHTML", RegexOptions.IgnoreCase), Title: "dangerouslySetInnerHTML usage", Desc: "dangerouslySetInnerHTML bypasses React's XSS protection. Ensure content is properly sanitized."),
            (Pattern: new Regex(@"document\.write\s*\(", RegexOptions.IgnoreCase), Title: "document.write usage", Desc: "document.write can introduce XSS vulnerabilities and blocks page rendering."),
            (Pattern: new Regex(@"eval\s*\(", RegexOptions.IgnoreCase), Title: "eval() usage detected", Desc: "eval() executes arbitrary code and can be exploited for XSS and code injection."),
        };

        var jsLangs = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "javascript", "typescript", "jsx", "tsx", "js", "ts"
        };

        if (!jsLangs.Contains(language) && language?.ToLower() != "html") return findings;

        for (var i = 0; i < lines.Length; i++)
        {
            foreach (var (pattern, title, desc) in xssPatterns)
            {
                if (pattern.IsMatch(lines[i]))
                {
                    findings.Add(new CodeReviewAgentFinding
                    {
                        Severity = "critical",
                        Category = "security",
                        Title = title,
                        Description = desc,
                        Line = i + 1,
                        Suggestion = "Use safe DOM manipulation methods or sanitize content with a library like DOMPurify before rendering.",
                    });
                }
            }
        }

        return findings;
    }

    private static List<CodeReviewAgentFinding> CheckMissingErrorHandling(string[] lines, string language)
    {
        var findings = new List<CodeReviewAgentFinding>();

        var jsLangs = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "javascript", "typescript", "jsx", "tsx", "js", "ts"
        };

        var csLangs = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "csharp", "cs", "c#"
        };

        // Check for async functions without try/catch
        if (jsLangs.Contains(language))
        {
            var hasAwait = false;
            var hasTryCatch = false;
            for (var i = 0; i < lines.Length; i++)
            {
                if (Regex.IsMatch(lines[i], @"\bawait\b")) hasAwait = true;
                if (Regex.IsMatch(lines[i], @"\btry\s*\{") || Regex.IsMatch(lines[i], @"\bcatch\s*\(")) hasTryCatch = true;
            }

            if (hasAwait && !hasTryCatch)
            {
                findings.Add(new CodeReviewAgentFinding
                {
                    Severity = "warning",
                    Category = "edge-case",
                    Title = "Async code without error handling",
                    Description = "Async/await code without try/catch blocks may result in unhandled promise rejections that crash the application.",
                    Line = null,
                    Suggestion = "Wrap async operations in try/catch blocks and handle errors appropriately.",
                });
            }

            // Check for fetch without error handling
            for (var i = 0; i < lines.Length; i++)
            {
                if (Regex.IsMatch(lines[i], @"\bfetch\s*\(") && !ContainsNearby(lines, i, 5, @"\.ok\b|\.status\b|\.catch\b|response\.ok"))
                {
                    findings.Add(new CodeReviewAgentFinding
                    {
                        Severity = "warning",
                        Category = "edge-case",
                        Title = "Fetch call without response status check",
                        Description = "HTTP fetch calls should check the response status. A non-2xx response will not throw by default.",
                        Line = i + 1,
                        Suggestion = "Check response.ok or response.status before parsing the response body, and handle error responses.",
                    });
                }
            }
        }

        // Check for null reference patterns in C#
        if (csLangs.Contains(language))
        {
            for (var i = 0; i < lines.Length; i++)
            {
                if (Regex.IsMatch(lines[i], @"\.Result\b") && !Regex.IsMatch(lines[i], @"\bawait\b"))
                {
                    findings.Add(new CodeReviewAgentFinding
                    {
                        Severity = "warning",
                        Category = "performance",
                        Title = "Blocking .Result call on async task",
                        Description = "Using .Result on a Task blocks the calling thread and can lead to deadlocks in ASP.NET. Use await instead.",
                        Line = i + 1,
                        Suggestion = "Replace .Result with await and make the calling method async.",
                    });
                }
            }
        }

        return findings;
    }

    private static List<CodeReviewAgentFinding> CheckConsoleLogStatements(string[] lines, string language)
    {
        var findings = new List<CodeReviewAgentFinding>();

        var jsLangs = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "javascript", "typescript", "jsx", "tsx", "js", "ts"
        };

        if (!jsLangs.Contains(language)) return findings;

        for (var i = 0; i < lines.Length; i++)
        {
            if (Regex.IsMatch(lines[i], @"\bconsole\.(log|debug|warn|error)\s*\("))
            {
                findings.Add(new CodeReviewAgentFinding
                {
                    Severity = "info",
                    Category = "best-practice",
                    Title = "console.log statement found",
                    Description = "Console statements should be removed from production code. They can leak sensitive information and affect performance.",
                    Line = i + 1,
                    Suggestion = "Remove console.log statements or replace with a proper logging framework.",
                });
            }
        }

        return findings;
    }

    private static List<CodeReviewAgentFinding> CheckBestPractices(string[] lines, string language)
    {
        var findings = new List<CodeReviewAgentFinding>();

        // Check for TODO/FIXME comments
        for (var i = 0; i < lines.Length; i++)
        {
            if (Regex.IsMatch(lines[i], @"//\s*(TODO|FIXME|HACK|XXX)\b", RegexOptions.IgnoreCase))
            {
                findings.Add(new CodeReviewAgentFinding
                {
                    Severity = "info",
                    Category = "best-practice",
                    Title = "TODO/FIXME comment found",
                    Description = "Unresolved TODO or FIXME comments indicate incomplete work that should be addressed before deployment.",
                    Line = i + 1,
                    Suggestion = "Resolve the TODO/FIXME item or create a tracking issue for it.",
                });
            }
        }

        // Check for magic numbers
        var jsLangs = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "javascript", "typescript", "jsx", "tsx", "js", "ts", "csharp", "cs", "c#"
        };

        if (jsLangs.Contains(language))
        {
            for (var i = 0; i < lines.Length; i++)
            {
                // Look for numeric comparisons with magic numbers (excluding 0, 1, -1, 100)
                if (Regex.IsMatch(lines[i], @"[><=!]+\s*\d{3,}") && !Regex.IsMatch(lines[i], @"(const|let|var|readonly|static)\s"))
                {
                    findings.Add(new CodeReviewAgentFinding
                    {
                        Severity = "info",
                        Category = "best-practice",
                        Title = "Magic number in comparison",
                        Description = "Magic numbers reduce code readability and make maintenance harder. Use named constants instead.",
                        Line = i + 1,
                        Suggestion = "Extract the numeric value into a named constant with a descriptive name.",
                    });
                }
            }
        }

        return findings;
    }

    private static bool ContainsNearby(string[] lines, int currentLine, int range, string pattern)
    {
        var start = Math.Max(0, currentLine - range);
        var end = Math.Min(lines.Length - 1, currentLine + range);
        for (var i = start; i <= end; i++)
        {
            if (Regex.IsMatch(lines[i], pattern)) return true;
        }
        return false;
    }
}

public class CodeReviewAgentResult
{
    public Guid Id { get; set; }
    public string OverallStatus { get; set; } = "";
    public int Score { get; set; }
    public List<CodeReviewAgentFinding> Findings { get; set; } = new();
    public string FileName { get; set; } = "";
    public string Language { get; set; } = "";
    public DateTime ReviewedAt { get; set; }
}

public class CodeReviewAgentFinding
{
    public string Severity { get; set; } = "";
    public string Category { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public int? Line { get; set; }
    public string Suggestion { get; set; } = "";
}

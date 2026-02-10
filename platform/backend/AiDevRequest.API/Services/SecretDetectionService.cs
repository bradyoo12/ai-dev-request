using System.Text.Json;
using System.Text.RegularExpressions;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISecretDetectionService
{
    Task<List<SecretFinding>> ScanPromptAsync(string text);
    Task<SecretScanResult> ScanCodeAsync(Guid devRequestId, string projectPath);
    List<SecretPattern> GetPatterns();
}

public class SecretDetectionService : ISecretDetectionService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SecretDetectionService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static readonly List<SecretPattern> SecretPatterns = new()
    {
        new SecretPattern
        {
            Id = "aws-access-key",
            Name = "AWS Access Key ID",
            Pattern = @"(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}",
            Severity = "critical",
            Description = "AWS Access Key ID that could grant access to AWS services"
        },
        new SecretPattern
        {
            Id = "aws-secret-key",
            Name = "AWS Secret Access Key",
            Pattern = @"(?i)aws[_\-]?secret[_\-]?access[_\-]?key\s*[=:]\s*[""']?[A-Za-z0-9/+=]{40}",
            Severity = "critical",
            Description = "AWS Secret Access Key for authenticating API requests"
        },
        new SecretPattern
        {
            Id = "stripe-secret-key",
            Name = "Stripe Secret Key",
            Pattern = @"sk_(?:live|test)_[0-9a-zA-Z]{24,}",
            Severity = "critical",
            Description = "Stripe secret API key for payment processing"
        },
        new SecretPattern
        {
            Id = "stripe-publishable-key",
            Name = "Stripe Publishable Key",
            Pattern = @"pk_(?:live|test)_[0-9a-zA-Z]{24,}",
            Severity = "medium",
            Description = "Stripe publishable key (lower risk but should not be hardcoded)"
        },
        new SecretPattern
        {
            Id = "openai-api-key",
            Name = "OpenAI API Key",
            Pattern = @"sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}",
            Severity = "critical",
            Description = "OpenAI API key for accessing AI models"
        },
        new SecretPattern
        {
            Id = "anthropic-api-key",
            Name = "Anthropic API Key",
            Pattern = @"sk-ant-[a-zA-Z0-9\-_]{80,}",
            Severity = "critical",
            Description = "Anthropic API key for accessing Claude models"
        },
        new SecretPattern
        {
            Id = "jwt-token",
            Name = "JWT Token",
            Pattern = @"eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}",
            Severity = "high",
            Description = "JSON Web Token that may contain authentication claims"
        },
        new SecretPattern
        {
            Id = "database-connection-string",
            Name = "Database Connection String",
            Pattern = @"(?i)(?:Server|Host|Data Source)\s*=\s*[^;]+;\s*(?:Database|Initial Catalog)\s*=\s*[^;]+;\s*(?:User Id?|Uid)\s*=\s*[^;]+;\s*(?:Password|Pwd)\s*=\s*[^;]+",
            Severity = "critical",
            Description = "Database connection string with embedded credentials"
        },
        new SecretPattern
        {
            Id = "postgres-url",
            Name = "PostgreSQL Connection URL",
            Pattern = @"postgres(?:ql)?://[^\s:]+:[^\s@]+@[^\s/]+",
            Severity = "critical",
            Description = "PostgreSQL connection URL with embedded password"
        },
        new SecretPattern
        {
            Id = "private-key",
            Name = "Private Key",
            Pattern = @"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
            Severity = "critical",
            Description = "Private cryptographic key"
        },
        new SecretPattern
        {
            Id = "github-token",
            Name = "GitHub Token",
            Pattern = @"(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}",
            Severity = "critical",
            Description = "GitHub personal access token or OAuth token"
        },
        new SecretPattern
        {
            Id = "generic-api-key",
            Name = "Generic API Key Assignment",
            Pattern = @"(?i)(?:api[_\-]?key|apikey|api[_\-]?secret)\s*[=:]\s*[""'][A-Za-z0-9\-_]{16,}[""']",
            Severity = "high",
            Description = "Generic API key assignment detected in code"
        },
        new SecretPattern
        {
            Id = "generic-password",
            Name = "Hardcoded Password",
            Pattern = @"(?i)(?:password|passwd|pwd)\s*[=:]\s*[""'][^\s""']{8,}[""']",
            Severity = "high",
            Description = "Hardcoded password value detected"
        },
        new SecretPattern
        {
            Id = "generic-secret",
            Name = "Hardcoded Secret",
            Pattern = @"(?i)(?:secret|token|credential)\s*[=:]\s*[""'][A-Za-z0-9\-_/+=]{16,}[""']",
            Severity = "high",
            Description = "Hardcoded secret or token value detected"
        },
    };

    public SecretDetectionService(
        AiDevRequestDbContext context,
        ILogger<SecretDetectionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public Task<List<SecretFinding>> ScanPromptAsync(string text)
    {
        var findings = new List<SecretFinding>();

        foreach (var pattern in SecretPatterns)
        {
            var regex = new Regex(pattern.Pattern, RegexOptions.Compiled, TimeSpan.FromSeconds(5));
            var matches = regex.Matches(text);
            foreach (Match match in matches)
            {
                findings.Add(new SecretFinding
                {
                    PatternId = pattern.Id,
                    PatternName = pattern.Name,
                    Severity = pattern.Severity,
                    Description = pattern.Description,
                    Location = $"prompt (offset {match.Index})",
                    MatchPreview = MaskSecret(match.Value)
                });
            }
        }

        return Task.FromResult(findings);
    }

    public async Task<SecretScanResult> ScanCodeAsync(Guid devRequestId, string projectPath)
    {
        _logger.LogInformation("Scanning code for secrets in project {DevRequestId} at {Path}",
            devRequestId, projectPath);

        var findings = new List<SecretFinding>();

        if (Directory.Exists(projectPath))
        {
            var extensions = new[] { ".ts", ".tsx", ".js", ".jsx", ".json", ".cs", ".py", ".env", ".yaml", ".yml", ".toml", ".cfg", ".ini", ".conf" };
            var skipDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "node_modules", ".git", "bin", "obj", "dist", ".next", "__pycache__" };

            var files = Directory.EnumerateFiles(projectPath, "*.*", SearchOption.AllDirectories)
                .Where(f =>
                {
                    var ext = Path.GetExtension(f).ToLowerInvariant();
                    if (!extensions.Contains(ext)) return false;

                    var relativePath = Path.GetRelativePath(projectPath, f);
                    return !relativePath.Split(Path.DirectorySeparatorChar).Any(part => skipDirs.Contains(part));
                })
                .Take(500); // safety limit

            foreach (var file in files)
            {
                try
                {
                    var content = await File.ReadAllTextAsync(file);
                    var relativePath = Path.GetRelativePath(projectPath, file);

                    foreach (var pattern in SecretPatterns)
                    {
                        var regex = new Regex(pattern.Pattern, RegexOptions.Compiled, TimeSpan.FromSeconds(5));
                        var matches = regex.Matches(content);
                        foreach (Match match in matches)
                        {
                            var lineNumber = content[..match.Index].Count(c => c == '\n') + 1;
                            findings.Add(new SecretFinding
                            {
                                PatternId = pattern.Id,
                                PatternName = pattern.Name,
                                Severity = pattern.Severity,
                                Description = pattern.Description,
                                Location = $"{relativePath}:{lineNumber}",
                                MatchPreview = MaskSecret(match.Value)
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to scan file {File}", file);
                }
            }
        }

        var result = new SecretScanResult
        {
            DevRequestId = devRequestId,
            FindingsJson = JsonSerializer.Serialize(findings, JsonOptions),
            FindingCount = findings.Count,
            Status = "completed",
            ScannedAt = DateTime.UtcNow
        };

        _context.SecretScanResults.Add(result);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Secret scan completed for {DevRequestId}: {Count} findings",
            devRequestId, findings.Count);

        return result;
    }

    public List<SecretPattern> GetPatterns() => SecretPatterns;

    private static string MaskSecret(string value)
    {
        if (value.Length <= 8) return "****";
        return value[..4] + new string('*', Math.Min(value.Length - 8, 20)) + value[^4..];
    }
}

#region DTOs

public class SecretPattern
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Pattern { get; set; } = "";
    public string Severity { get; set; } = "medium";
    public string Description { get; set; } = "";
}

public class SecretFinding
{
    public string PatternId { get; set; } = "";
    public string PatternName { get; set; } = "";
    public string Severity { get; set; } = "medium";
    public string Description { get; set; } = "";
    public string Location { get; set; } = "";
    public string MatchPreview { get; set; } = "";
}

#endregion

using System.Text.Json;
using System.Text.RegularExpressions;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IOAuthComplianceService
{
    Task<OAuthComplianceReport> AnalyzeScopesAsync(Guid devRequestId, string projectPath);
    Task<List<OAuthScopeRecommendation>> SuggestMinimalScopesAsync(Guid reportId);
    Task<OAuthComplianceReport> GenerateComplianceDocAsync(Guid devRequestId);
    Task<OAuthComplianceReport?> GetComplianceReportAsync(Guid devRequestId);
    Task<List<OAuthScopeDetail>> GetScopesWithJustificationsAsync(Guid devRequestId);
}

public class OAuthComplianceService : IOAuthComplianceService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<OAuthComplianceService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    // Known OAuth scope catalogs per provider
    private static readonly Dictionary<string, Dictionary<string, OAuthScopeInfo>> ProviderScopeCatalog = new()
    {
        ["google"] = new()
        {
            ["openid"] = new("openid", "OpenID Connect", "Basic identity verification", false, "Authenticate user identity"),
            ["email"] = new("email", "Email Address", "Read user email address", false, "Contact and account identification"),
            ["profile"] = new("profile", "Basic Profile", "Read basic profile info (name, picture)", false, "Display user name and avatar"),
            ["https://www.googleapis.com/auth/calendar"] = new("https://www.googleapis.com/auth/calendar", "Google Calendar (Full)", "Full read/write access to calendars", true, "Consider calendar.readonly if only reading events"),
            ["https://www.googleapis.com/auth/calendar.readonly"] = new("https://www.googleapis.com/auth/calendar.readonly", "Google Calendar (Read)", "Read-only access to calendars", false, "Read calendar events"),
            ["https://www.googleapis.com/auth/drive"] = new("https://www.googleapis.com/auth/drive", "Google Drive (Full)", "Full access to all Drive files", true, "Consider drive.file for app-created files only"),
            ["https://www.googleapis.com/auth/drive.file"] = new("https://www.googleapis.com/auth/drive.file", "Google Drive (App Files)", "Access only files created by the app", false, "Manage app-specific files"),
            ["https://www.googleapis.com/auth/contacts"] = new("https://www.googleapis.com/auth/contacts", "Contacts (Full)", "Full read/write access to contacts", true, "Consider contacts.readonly"),
            ["https://www.googleapis.com/auth/contacts.readonly"] = new("https://www.googleapis.com/auth/contacts.readonly", "Contacts (Read)", "Read-only access to contacts", false, "Read user contacts"),
            ["https://www.googleapis.com/auth/gmail.modify"] = new("https://www.googleapis.com/auth/gmail.modify", "Gmail (Modify)", "Read, send, and modify emails", true, "Consider gmail.readonly or gmail.send"),
            ["https://www.googleapis.com/auth/gmail.readonly"] = new("https://www.googleapis.com/auth/gmail.readonly", "Gmail (Read)", "Read-only access to Gmail", false, "Read email messages"),
            ["https://www.googleapis.com/auth/gmail.send"] = new("https://www.googleapis.com/auth/gmail.send", "Gmail (Send)", "Send emails only", false, "Send emails on behalf of user"),
        },
        ["apple"] = new()
        {
            ["name"] = new("name", "Name", "Read user's name", false, "Display user name"),
            ["email"] = new("email", "Email", "Read user's email", false, "Contact and account identification"),
        },
        ["github"] = new()
        {
            ["read:user"] = new("read:user", "Read User Profile", "Read user profile data", false, "Access basic profile information"),
            ["user:email"] = new("user:email", "User Email", "Read user email addresses", false, "Contact and account identification"),
            ["repo"] = new("repo", "Full Repository Access", "Full control of private repositories", true, "Consider public_repo or repo:status for limited access"),
            ["public_repo"] = new("public_repo", "Public Repositories", "Access public repositories only", false, "Read/write public repos"),
            ["repo:status"] = new("repo:status", "Commit Status", "Read/write commit statuses", false, "Update CI/CD commit status"),
            ["admin:org"] = new("admin:org", "Org Admin", "Full control of organizations", true, "Consider read:org for read-only access"),
            ["read:org"] = new("read:org", "Read Org", "Read-only access to organizations", false, "Read org membership"),
            ["gist"] = new("gist", "Gists", "Create and read gists", false, "Manage code snippets"),
            ["delete_repo"] = new("delete_repo", "Delete Repositories", "Delete repositories", true, "Rarely needed — remove unless critical"),
        },
        ["facebook"] = new()
        {
            ["email"] = new("email", "Email", "Read user email", false, "Contact and account identification"),
            ["public_profile"] = new("public_profile", "Public Profile", "Read basic profile info", false, "Display user name and picture"),
            ["user_friends"] = new("user_friends", "Friends List", "Read user's friends list", true, "Consider if social features really need this"),
            ["user_photos"] = new("user_photos", "Photos", "Access user photos", true, "Consider if photo access is essential"),
            ["publish_actions"] = new("publish_actions", "Publish Actions", "Post on behalf of user", true, "Requires explicit user consent and justification"),
        },
        ["microsoft"] = new()
        {
            ["openid"] = new("openid", "OpenID Connect", "Basic identity", false, "Authenticate user identity"),
            ["email"] = new("email", "Email", "Read email address", false, "Contact and account identification"),
            ["profile"] = new("profile", "Profile", "Read basic profile", false, "Display user name"),
            ["User.Read"] = new("User.Read", "Read User Profile", "Read signed-in user profile", false, "Basic user information"),
            ["User.ReadWrite"] = new("User.ReadWrite", "Read/Write User Profile", "Read and write user profile", true, "Consider User.Read if only reading"),
            ["Mail.Read"] = new("Mail.Read", "Read Mail", "Read user mail", false, "Read email messages"),
            ["Mail.ReadWrite"] = new("Mail.ReadWrite", "Read/Write Mail", "Full mail access", true, "Consider Mail.Read or Mail.Send"),
            ["Files.ReadWrite.All"] = new("Files.ReadWrite.All", "All Files Access", "Read/write all files", true, "Consider Files.ReadWrite for user files only"),
        }
    };

    // Minimal scope recommendations: overpermissioned -> suggested
    private static readonly Dictionary<string, string> ScopeMinimizationMap = new()
    {
        ["https://www.googleapis.com/auth/calendar"] = "https://www.googleapis.com/auth/calendar.readonly",
        ["https://www.googleapis.com/auth/drive"] = "https://www.googleapis.com/auth/drive.file",
        ["https://www.googleapis.com/auth/contacts"] = "https://www.googleapis.com/auth/contacts.readonly",
        ["https://www.googleapis.com/auth/gmail.modify"] = "https://www.googleapis.com/auth/gmail.readonly",
        ["repo"] = "public_repo",
        ["admin:org"] = "read:org",
        ["User.ReadWrite"] = "User.Read",
        ["Mail.ReadWrite"] = "Mail.Read",
        ["Files.ReadWrite.All"] = "Files.ReadWrite",
        ["user_friends"] = "",
        ["user_photos"] = "",
        ["publish_actions"] = "",
        ["delete_repo"] = "",
    };

    public OAuthComplianceService(
        AiDevRequestDbContext context,
        ILogger<OAuthComplianceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<OAuthComplianceReport> AnalyzeScopesAsync(Guid devRequestId, string projectPath)
    {
        _logger.LogInformation("Analyzing OAuth scopes for project at {Path}", projectPath);

        var detectedScopes = new List<DetectedOAuthScope>();

        // Scan common OAuth configuration patterns in source files
        var extensions = new[] { "*.ts", "*.tsx", "*.js", "*.jsx", "*.cs", "*.py", "*.dart", "*.json", "*.yaml", "*.yml" };

        foreach (var ext in extensions)
        {
            string[] files;
            try
            {
                files = Directory.GetFiles(projectPath, ext, SearchOption.AllDirectories);
            }
            catch
            {
                continue;
            }

            foreach (var file in files)
            {
                // Skip node_modules, bin, obj directories
                if (file.Contains("node_modules") || file.Contains(Path.DirectorySeparatorChar + "bin" + Path.DirectorySeparatorChar) ||
                    file.Contains(Path.DirectorySeparatorChar + "obj" + Path.DirectorySeparatorChar))
                    continue;

                try
                {
                    var content = await File.ReadAllTextAsync(file);
                    var relativePath = Path.GetRelativePath(projectPath, file);
                    detectedScopes.AddRange(ExtractOAuthScopes(content, relativePath));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to read file {File}", file);
                }
            }
        }

        // Deduplicate scopes
        var uniqueScopes = detectedScopes
            .GroupBy(s => new { s.Provider, s.Scope })
            .Select(g => g.First())
            .ToList();

        // Analyze for over-permissioned scopes
        var recommendations = new List<OAuthScopeRecommendation>();
        var overPermissionedCount = 0;

        foreach (var scope in uniqueScopes)
        {
            var isOverPermissioned = false;
            string? suggestedScope = null;

            if (ProviderScopeCatalog.TryGetValue(scope.Provider.ToLowerInvariant(), out var catalog))
            {
                if (catalog.TryGetValue(scope.Scope, out var info) && info.IsOverPermissioned)
                {
                    isOverPermissioned = true;
                    overPermissionedCount++;
                }
            }

            if (ScopeMinimizationMap.TryGetValue(scope.Scope, out var minimal))
            {
                isOverPermissioned = true;
                suggestedScope = string.IsNullOrEmpty(minimal) ? null : minimal;

                recommendations.Add(new OAuthScopeRecommendation
                {
                    Provider = scope.Provider,
                    CurrentScope = scope.Scope,
                    RecommendedScope = suggestedScope,
                    Reason = suggestedScope != null
                        ? $"Consider using '{suggestedScope}' instead for minimal required access"
                        : "This scope may not be necessary — consider removing it",
                    Severity = suggestedScope != null ? "warning" : "info"
                });
            }

            scope.IsOverPermissioned = isOverPermissioned;
        }

        // Create or update report
        var existing = await _context.OAuthComplianceReports
            .Where(r => r.DevRequestId == devRequestId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        var report = existing ?? new OAuthComplianceReport { DevRequestId = devRequestId };

        report.ScopesAnalyzedJson = JsonSerializer.Serialize(uniqueScopes, JsonOptions);
        report.RecommendationsJson = JsonSerializer.Serialize(recommendations, JsonOptions);
        report.TotalScopesDetected = uniqueScopes.Count;
        report.OverPermissionedCount = overPermissionedCount;
        report.Status = "analyzed";
        report.UpdatedAt = DateTime.UtcNow;

        if (existing == null)
            _context.OAuthComplianceReports.Add(report);

        await _context.SaveChangesAsync();

        _logger.LogInformation("OAuth analysis complete: {Total} scopes, {OverPermissioned} over-permissioned for request {RequestId}",
            uniqueScopes.Count, overPermissionedCount, devRequestId);

        return report;
    }

    public async Task<List<OAuthScopeRecommendation>> SuggestMinimalScopesAsync(Guid reportId)
    {
        var report = await _context.OAuthComplianceReports.FindAsync(reportId);
        if (report == null)
            throw new InvalidOperationException("OAuth compliance report not found.");

        return JsonSerializer.Deserialize<List<OAuthScopeRecommendation>>(report.RecommendationsJson, JsonOptions)
            ?? new List<OAuthScopeRecommendation>();
    }

    public async Task<OAuthComplianceReport> GenerateComplianceDocAsync(Guid devRequestId)
    {
        var report = await _context.OAuthComplianceReports
            .Where(r => r.DevRequestId == devRequestId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (report == null)
            throw new InvalidOperationException("No OAuth analysis found. Run scope analysis first.");

        var scopes = JsonSerializer.Deserialize<List<DetectedOAuthScope>>(report.ScopesAnalyzedJson, JsonOptions)
            ?? new List<DetectedOAuthScope>();

        var recommendations = JsonSerializer.Deserialize<List<OAuthScopeRecommendation>>(report.RecommendationsJson, JsonOptions)
            ?? new List<OAuthScopeRecommendation>();

        // Group scopes by provider
        var providerGroups = scopes.GroupBy(s => s.Provider).ToList();

        // Generate privacy policy section
        var privacyPolicy = GeneratePrivacyPolicy(providerGroups);

        // Generate data usage disclosure
        var dataUsage = GenerateDataUsageDisclosure(providerGroups);

        // Generate scope justification document
        var scopeJustifications = GenerateScopeJustifications(scopes, recommendations);

        // Generate provider-specific compliance notes
        var providerCompliance = GenerateProviderCompliance(providerGroups);

        var complianceDocs = new ComplianceDocumentation
        {
            PrivacyPolicy = privacyPolicy,
            DataUsageDisclosure = dataUsage,
            ScopeJustifications = scopeJustifications,
            ProviderCompliance = providerCompliance,
            GeneratedAt = DateTime.UtcNow
        };

        report.ComplianceDocsJson = JsonSerializer.Serialize(complianceDocs, JsonOptions);
        report.Status = "docs_generated";
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Compliance docs generated for request {RequestId}", devRequestId);

        return report;
    }

    public async Task<OAuthComplianceReport?> GetComplianceReportAsync(Guid devRequestId)
    {
        return await _context.OAuthComplianceReports
            .Where(r => r.DevRequestId == devRequestId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<OAuthScopeDetail>> GetScopesWithJustificationsAsync(Guid devRequestId)
    {
        var report = await _context.OAuthComplianceReports
            .Where(r => r.DevRequestId == devRequestId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (report == null)
            return new List<OAuthScopeDetail>();

        var scopes = JsonSerializer.Deserialize<List<DetectedOAuthScope>>(report.ScopesAnalyzedJson, JsonOptions)
            ?? new List<DetectedOAuthScope>();

        return scopes.Select(s =>
        {
            string description = "";
            string justification = "";

            if (ProviderScopeCatalog.TryGetValue(s.Provider.ToLowerInvariant(), out var catalog) &&
                catalog.TryGetValue(s.Scope, out var info))
            {
                description = info.Description;
                justification = info.DefaultJustification;
            }

            return new OAuthScopeDetail
            {
                Provider = s.Provider,
                Scope = s.Scope,
                Description = description,
                Justification = justification,
                IsOverPermissioned = s.IsOverPermissioned,
                DetectedInFile = s.DetectedInFile,
                MinimalAlternative = ScopeMinimizationMap.TryGetValue(s.Scope, out var alt)
                    ? (string.IsNullOrEmpty(alt) ? "Remove scope" : alt)
                    : null
            };
        }).ToList();
    }

    #region Private Helpers

    private static List<DetectedOAuthScope> ExtractOAuthScopes(string content, string filePath)
    {
        var scopes = new List<DetectedOAuthScope>();

        // Pattern: Google OAuth scopes
        var googleScopePattern = new Regex(@"(?:scope[s]?\s*[:=]\s*[\[""']|\.addScope\(|scope:\s*)(https://www\.googleapis\.com/auth/[\w./-]+|openid|email|profile)", RegexOptions.IgnoreCase);
        foreach (Match match in googleScopePattern.Matches(content))
        {
            scopes.Add(new DetectedOAuthScope
            {
                Provider = "google",
                Scope = match.Groups[1].Value,
                DetectedInFile = filePath
            });
        }

        // Pattern: GitHub OAuth scopes
        var githubScopePattern = new Regex(@"(?:scope[s]?\s*[:=]\s*[""'])((?:read:user|user:email|repo|public_repo|repo:status|admin:org|read:org|gist|delete_repo)(?:[,\s]+(?:read:user|user:email|repo|public_repo|repo:status|admin:org|read:org|gist|delete_repo))*)", RegexOptions.IgnoreCase);
        foreach (Match match in githubScopePattern.Matches(content))
        {
            var scopeList = match.Groups[1].Value.Split(new[] { ',', ' ' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var s in scopeList)
            {
                scopes.Add(new DetectedOAuthScope
                {
                    Provider = "github",
                    Scope = s.Trim(),
                    DetectedInFile = filePath
                });
            }
        }

        // Pattern: Apple Sign-In scopes
        var appleScopePattern = new Regex(@"(?:ASAuthorization\.Scope\.(\w+)|scope[s]?\s*[:=].*?(?:name|email))", RegexOptions.IgnoreCase);
        foreach (Match match in appleScopePattern.Matches(content))
        {
            var scope = match.Groups[1].Success ? match.Groups[1].Value.ToLowerInvariant() : "";
            if (string.IsNullOrEmpty(scope))
            {
                if (content.Contains("name", StringComparison.OrdinalIgnoreCase))
                    scopes.Add(new DetectedOAuthScope { Provider = "apple", Scope = "name", DetectedInFile = filePath });
                if (content.Contains("email", StringComparison.OrdinalIgnoreCase))
                    scopes.Add(new DetectedOAuthScope { Provider = "apple", Scope = "email", DetectedInFile = filePath });
            }
            else
            {
                scopes.Add(new DetectedOAuthScope { Provider = "apple", Scope = scope, DetectedInFile = filePath });
            }
        }

        // Pattern: Facebook OAuth scopes
        var facebookScopePattern = new Regex(@"(?:scope[s]?\s*[:=]\s*[""'])((?:email|public_profile|user_friends|user_photos|publish_actions)(?:[,\s]+(?:email|public_profile|user_friends|user_photos|publish_actions))*)", RegexOptions.IgnoreCase);
        foreach (Match match in facebookScopePattern.Matches(content))
        {
            var scopeList = match.Groups[1].Value.Split(new[] { ',', ' ' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var s in scopeList)
            {
                scopes.Add(new DetectedOAuthScope
                {
                    Provider = "facebook",
                    Scope = s.Trim(),
                    DetectedInFile = filePath
                });
            }
        }

        // Pattern: Microsoft/Azure AD scopes
        var msScopePattern = new Regex(@"(?:scope[s]?\s*[:=].*?)(User\.Read(?:Write)?|Mail\.Read(?:Write)?|Files\.ReadWrite(?:\.All)?|openid|email|profile)", RegexOptions.IgnoreCase);
        foreach (Match match in msScopePattern.Matches(content))
        {
            scopes.Add(new DetectedOAuthScope
            {
                Provider = "microsoft",
                Scope = match.Groups[1].Value,
                DetectedInFile = filePath
            });
        }

        return scopes;
    }

    private static string GeneratePrivacyPolicy(List<IGrouping<string, DetectedOAuthScope>> providerGroups)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("# Privacy Policy - OAuth Data Access");
        sb.AppendLine();
        sb.AppendLine("## Data We Access");
        sb.AppendLine();
        sb.AppendLine("This application uses OAuth authentication to provide a seamless sign-in experience. Below is a detailed description of the data we access through each provider.");
        sb.AppendLine();

        foreach (var group in providerGroups)
        {
            sb.AppendLine($"### {CapitalizeFirst(group.Key)}");
            sb.AppendLine();
            sb.AppendLine($"We request the following permissions from {CapitalizeFirst(group.Key)}:");
            sb.AppendLine();

            foreach (var scope in group)
            {
                var description = GetScopeDescription(group.Key, scope.Scope);
                sb.AppendLine($"- **{scope.Scope}**: {description}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("## Data Retention");
        sb.AppendLine();
        sb.AppendLine("We retain the data accessed through OAuth providers only for as long as necessary to provide our services. You may request deletion of your data at any time.");
        sb.AppendLine();
        sb.AppendLine("## Your Rights");
        sb.AppendLine();
        sb.AppendLine("- You can revoke our access at any time through your provider's account settings");
        sb.AppendLine("- You can request a copy of your data");
        sb.AppendLine("- You can request deletion of your data");
        sb.AppendLine();

        return sb.ToString();
    }

    private static string GenerateDataUsageDisclosure(List<IGrouping<string, DetectedOAuthScope>> providerGroups)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("# Data Usage Disclosure");
        sb.AppendLine();
        sb.AppendLine("## Purpose of Data Collection");
        sb.AppendLine();
        sb.AppendLine("This document describes how data obtained through OAuth providers is used within the application.");
        sb.AppendLine();

        foreach (var group in providerGroups)
        {
            sb.AppendLine($"### {CapitalizeFirst(group.Key)} Data");
            sb.AppendLine();
            sb.AppendLine("| Scope | Data Type | Usage Purpose | Shared With Third Parties |");
            sb.AppendLine("|-------|-----------|---------------|---------------------------|");

            foreach (var scope in group)
            {
                var description = GetScopeDescription(group.Key, scope.Scope);
                sb.AppendLine($"| `{scope.Scope}` | {description} | Application functionality | No |");
            }
            sb.AppendLine();
        }

        sb.AppendLine("## Data Processing");
        sb.AppendLine();
        sb.AppendLine("- All data is processed in accordance with applicable data protection regulations");
        sb.AppendLine("- Data is encrypted in transit and at rest");
        sb.AppendLine("- We do not sell or share personal data with third parties for advertising");
        sb.AppendLine();

        return sb.ToString();
    }

    private static string GenerateScopeJustifications(
        List<DetectedOAuthScope> scopes,
        List<OAuthScopeRecommendation> recommendations)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("# OAuth Scope Justifications");
        sb.AppendLine();
        sb.AppendLine("This document provides justification for each OAuth scope requested by the application.");
        sb.AppendLine();
        sb.AppendLine("| Provider | Scope | Justification | Status |");
        sb.AppendLine("|----------|-------|---------------|--------|");

        foreach (var scope in scopes)
        {
            var justification = GetScopeJustification(scope.Provider, scope.Scope);
            var recommendation = recommendations.FirstOrDefault(r => r.CurrentScope == scope.Scope && r.Provider == scope.Provider);
            var status = scope.IsOverPermissioned ? "Review Required" : "Approved";

            sb.AppendLine($"| {CapitalizeFirst(scope.Provider)} | `{scope.Scope}` | {justification} | {status} |");

            if (recommendation != null)
            {
                sb.AppendLine($"| | | **Recommendation**: {recommendation.Reason} | |");
            }
        }

        sb.AppendLine();
        return sb.ToString();
    }

    private static string GenerateProviderCompliance(List<IGrouping<string, DetectedOAuthScope>> providerGroups)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("# Provider-Specific Compliance Requirements");
        sb.AppendLine();

        foreach (var group in providerGroups)
        {
            sb.AppendLine($"## {CapitalizeFirst(group.Key)}");
            sb.AppendLine();

            switch (group.Key.ToLowerInvariant())
            {
                case "google":
                    sb.AppendLine("- **Google API Services User Data Policy**: Must comply with Limited Use requirements");
                    sb.AppendLine("- **OAuth Consent Screen**: Must submit for verification if using sensitive/restricted scopes");
                    sb.AppendLine("- **Privacy Policy**: Required — must be accessible from OAuth consent screen");
                    sb.AppendLine("- **Annual Security Assessment**: Required for restricted scopes");
                    break;
                case "apple":
                    sb.AppendLine("- **App Store Review Guidelines**: Sign In with Apple must be offered alongside other social logins");
                    sb.AppendLine("- **Data Minimization**: Only request name and email if needed");
                    sb.AppendLine("- **Hide My Email**: Must support Apple's private email relay");
                    break;
                case "github":
                    sb.AppendLine("- **GitHub App vs OAuth App**: Consider using GitHub Apps for more granular permissions");
                    sb.AppendLine("- **Scope Minimization**: Only request scopes actually used by the application");
                    sb.AppendLine("- **Token Expiry**: Implement token refresh for long-lived access");
                    break;
                case "facebook":
                    sb.AppendLine("- **App Review**: Required for permissions beyond email and public_profile");
                    sb.AppendLine("- **Data Use Checkup**: Must complete periodic data use checkups");
                    sb.AppendLine("- **Platform Terms**: Must comply with Facebook Platform Terms");
                    sb.AppendLine("- **Data Deletion Callback**: Must implement data deletion endpoint");
                    break;
                case "microsoft":
                    sb.AppendLine("- **Microsoft Identity Platform**: Follow least-privilege principle");
                    sb.AppendLine("- **Admin Consent**: Some scopes require tenant admin consent");
                    sb.AppendLine("- **Conditional Access**: Consider supporting organizational policies");
                    break;
                default:
                    sb.AppendLine("- Follow the provider's OAuth best practices and compliance requirements");
                    break;
            }

            sb.AppendLine();
        }

        return sb.ToString();
    }

    private static string GetScopeDescription(string provider, string scope)
    {
        if (ProviderScopeCatalog.TryGetValue(provider.ToLowerInvariant(), out var catalog) &&
            catalog.TryGetValue(scope, out var info))
        {
            return info.Description;
        }
        return "Access to the specified resource";
    }

    private static string GetScopeJustification(string provider, string scope)
    {
        if (ProviderScopeCatalog.TryGetValue(provider.ToLowerInvariant(), out var catalog) &&
            catalog.TryGetValue(scope, out var info))
        {
            return info.DefaultJustification;
        }
        return "Required for application functionality";
    }

    private static string CapitalizeFirst(string s) =>
        string.IsNullOrEmpty(s) ? s : char.ToUpper(s[0]) + s[1..];

    #endregion
}

#region DTOs / Models

public class DetectedOAuthScope
{
    public string Provider { get; set; } = "";
    public string Scope { get; set; } = "";
    public string DetectedInFile { get; set; } = "";
    public bool IsOverPermissioned { get; set; }
}

public class OAuthScopeRecommendation
{
    public string Provider { get; set; } = "";
    public string CurrentScope { get; set; } = "";
    public string? RecommendedScope { get; set; }
    public string Reason { get; set; } = "";
    public string Severity { get; set; } = "info"; // info, warning
}

public class OAuthScopeDetail
{
    public string Provider { get; set; } = "";
    public string Scope { get; set; } = "";
    public string Description { get; set; } = "";
    public string Justification { get; set; } = "";
    public bool IsOverPermissioned { get; set; }
    public string DetectedInFile { get; set; } = "";
    public string? MinimalAlternative { get; set; }
}

public class ComplianceDocumentation
{
    public string PrivacyPolicy { get; set; } = "";
    public string DataUsageDisclosure { get; set; } = "";
    public string ScopeJustifications { get; set; } = "";
    public string ProviderCompliance { get; set; } = "";
    public DateTime GeneratedAt { get; set; }
}

public record OAuthScopeInfo(
    string Scope,
    string DisplayName,
    string Description,
    bool IsOverPermissioned,
    string DefaultJustification
);

#endregion

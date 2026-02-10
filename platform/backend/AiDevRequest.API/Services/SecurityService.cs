using System.Text.Json;
using System.Text.Json.Serialization;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISecurityService
{
    Task<SbomReport> GenerateSbomAsync(Guid devRequestId, string projectPath, string projectType);
    Task<List<VulnerabilityResult>> ScanVulnerabilitiesAsync(Guid sbomReportId);
    Task<LicenseAnalysis> GetLicenseAnalysisAsync(Guid sbomReportId);
    Task<byte[]> ExportSbomAsync(Guid sbomReportId, string format);
}

public class SecurityService : ISecurityService
{
    private readonly AiDevRequestDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SecurityService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public SecurityService(
        AiDevRequestDbContext context,
        IHttpClientFactory httpClientFactory,
        ILogger<SecurityService> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<SbomReport> GenerateSbomAsync(Guid devRequestId, string projectPath, string projectType)
    {
        _logger.LogInformation("Generating SBOM for project at {Path} (type: {Type})", projectPath, projectType);

        var components = new List<SbomComponent>();

        // Parse package.json for npm dependencies
        var packageJsonPath = Path.Combine(projectPath, "package.json");
        if (File.Exists(packageJsonPath))
        {
            var packageJson = await File.ReadAllTextAsync(packageJsonPath);
            components.AddRange(ParseNpmDependencies(packageJson));
        }

        // Parse .csproj files for NuGet dependencies
        var csprojFiles = Directory.GetFiles(projectPath, "*.csproj", SearchOption.AllDirectories);
        foreach (var csproj in csprojFiles)
        {
            var content = await File.ReadAllTextAsync(csproj);
            components.AddRange(ParseNuGetDependencies(content));
        }

        // Parse requirements.txt for Python dependencies
        var requirementsPath = Path.Combine(projectPath, "requirements.txt");
        if (File.Exists(requirementsPath))
        {
            var requirementsTxt = await File.ReadAllTextAsync(requirementsPath);
            components.AddRange(ParsePythonDependencies(requirementsTxt));
        }

        // Build license summary
        var licenseSummary = components
            .GroupBy(c => c.License ?? "Unknown")
            .ToDictionary(g => g.Key, g => g.Count());

        var report = new SbomReport
        {
            DevRequestId = devRequestId,
            Format = "CycloneDX",
            ComponentsJson = JsonSerializer.Serialize(components, JsonOptions),
            DependencyCount = components.Count,
            LicensesSummaryJson = JsonSerializer.Serialize(licenseSummary, JsonOptions),
            GeneratedAt = DateTime.UtcNow
        };

        _context.SbomReports.Add(report);
        await _context.SaveChangesAsync();

        _logger.LogInformation("SBOM generated with {Count} components for request {RequestId}",
            components.Count, devRequestId);

        return report;
    }

    public async Task<List<VulnerabilityResult>> ScanVulnerabilitiesAsync(Guid sbomReportId)
    {
        var report = await _context.SbomReports.FindAsync(sbomReportId);
        if (report == null)
            throw new InvalidOperationException("SBOM report not found.");

        var components = JsonSerializer.Deserialize<List<SbomComponent>>(report.ComponentsJson, JsonOptions)
            ?? new List<SbomComponent>();

        _logger.LogInformation("Scanning {Count} components for vulnerabilities", components.Count);

        var results = new List<VulnerabilityResult>();
        var client = _httpClientFactory.CreateClient();

        foreach (var component in components)
        {
            try
            {
                var vulns = await QueryOsvAsync(client, component);
                results.AddRange(vulns.Select(v => new VulnerabilityResult
                {
                    SbomReportId = sbomReportId,
                    PackageName = component.Name,
                    PackageVersion = component.Version,
                    Ecosystem = component.Ecosystem,
                    VulnerabilityId = v.Id,
                    Severity = v.Severity,
                    Summary = v.Summary,
                    FixedVersion = v.FixedVersion,
                    ScannedAt = DateTime.UtcNow
                }));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to query OSV for {Package}@{Version}",
                    component.Name, component.Version);
            }
        }

        if (results.Count > 0)
        {
            _context.VulnerabilityResults.AddRange(results);
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Found {Count} vulnerabilities for SBOM report {ReportId}",
            results.Count, sbomReportId);

        return results;
    }

    public async Task<LicenseAnalysis> GetLicenseAnalysisAsync(Guid sbomReportId)
    {
        var report = await _context.SbomReports.FindAsync(sbomReportId);
        if (report == null)
            throw new InvalidOperationException("SBOM report not found.");

        var components = JsonSerializer.Deserialize<List<SbomComponent>>(report.ComponentsJson, JsonOptions)
            ?? new List<SbomComponent>();

        var licenseGroups = components
            .GroupBy(c => c.License ?? "Unknown")
            .Select(g => new LicenseGroup
            {
                License = g.Key,
                Count = g.Count(),
                Packages = g.Select(c => c.Name).ToList(),
                Category = CategorizeLicense(g.Key)
            })
            .OrderByDescending(g => g.Count)
            .ToList();

        var hasRestrictive = licenseGroups.Any(l => l.Category == "copyleft");

        return new LicenseAnalysis
        {
            TotalPackages = components.Count,
            UniqueLicenses = licenseGroups.Count,
            LicenseGroups = licenseGroups,
            HasCopyleftLicenses = hasRestrictive,
            CompatibilityStatus = hasRestrictive ? "review_required" : "compatible"
        };
    }

    public async Task<byte[]> ExportSbomAsync(Guid sbomReportId, string format)
    {
        var report = await _context.SbomReports.FindAsync(sbomReportId);
        if (report == null)
            throw new InvalidOperationException("SBOM report not found.");

        var components = JsonSerializer.Deserialize<List<SbomComponent>>(report.ComponentsJson, JsonOptions)
            ?? new List<SbomComponent>();

        string json;
        if (format.Equals("spdx", StringComparison.OrdinalIgnoreCase))
        {
            json = GenerateSpdxJson(report, components);
        }
        else
        {
            json = GenerateCycloneDxJson(report, components);
        }

        return System.Text.Encoding.UTF8.GetBytes(json);
    }

    #region Private Helpers

    private static List<SbomComponent> ParseNpmDependencies(string packageJson)
    {
        var components = new List<SbomComponent>();
        try
        {
            using var doc = JsonDocument.Parse(packageJson);
            var root = doc.RootElement;

            void AddDeps(string section, bool isDev)
            {
                if (!root.TryGetProperty(section, out var deps)) return;
                foreach (var dep in deps.EnumerateObject())
                {
                    var version = dep.Value.GetString()?.TrimStart('^', '~', '>', '=', '<', ' ') ?? "";
                    components.Add(new SbomComponent
                    {
                        Name = dep.Name,
                        Version = version,
                        Type = isDev ? "devDependency" : "dependency",
                        Ecosystem = "npm",
                        Purl = $"pkg:npm/{dep.Name}@{version}"
                    });
                }
            }

            AddDeps("dependencies", false);
            AddDeps("devDependencies", true);
        }
        catch { /* skip malformed package.json */ }

        return components;
    }

    private static List<SbomComponent> ParseNuGetDependencies(string csprojContent)
    {
        var components = new List<SbomComponent>();
        try
        {
            // Simple XML parsing for PackageReference elements
            var lines = csprojContent.Split('\n');
            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (!trimmed.Contains("PackageReference", StringComparison.OrdinalIgnoreCase)) continue;

                var name = ExtractAttribute(trimmed, "Include");
                var version = ExtractAttribute(trimmed, "Version");

                if (!string.IsNullOrEmpty(name))
                {
                    components.Add(new SbomComponent
                    {
                        Name = name,
                        Version = version ?? "unknown",
                        Type = "dependency",
                        Ecosystem = "NuGet",
                        Purl = $"pkg:nuget/{name}@{version}"
                    });
                }
            }
        }
        catch { /* skip malformed csproj */ }

        return components;
    }

    private static List<SbomComponent> ParsePythonDependencies(string requirementsTxt)
    {
        var components = new List<SbomComponent>();
        try
        {
            var lines = requirementsTxt.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (trimmed.StartsWith('#') || string.IsNullOrWhiteSpace(trimmed)) continue;

                var parts = trimmed.Split("==", 2);
                var name = parts[0].Trim();
                var version = parts.Length > 1 ? parts[1].Trim() : "unknown";

                components.Add(new SbomComponent
                {
                    Name = name,
                    Version = version,
                    Type = "dependency",
                    Ecosystem = "PyPI",
                    Purl = $"pkg:pypi/{name}@{version}"
                });
            }
        }
        catch { /* skip malformed requirements.txt */ }

        return components;
    }

    private static string ExtractAttribute(string xmlLine, string attributeName)
    {
        var pattern = $"{attributeName}=\"";
        var start = xmlLine.IndexOf(pattern, StringComparison.OrdinalIgnoreCase);
        if (start < 0) return "";
        start += pattern.Length;
        var end = xmlLine.IndexOf('"', start);
        return end > start ? xmlLine[start..end] : "";
    }

    private async Task<List<OsvVulnerability>> QueryOsvAsync(HttpClient client, SbomComponent component)
    {
        var ecosystem = component.Ecosystem switch
        {
            "npm" => "npm",
            "NuGet" => "NuGet",
            "PyPI" => "PyPI",
            _ => component.Ecosystem
        };

        var request = new
        {
            package = new { name = component.Name, ecosystem },
            version = component.Version
        };

        var response = await client.PostAsync(
            "https://api.osv.dev/v1/query",
            new StringContent(JsonSerializer.Serialize(request, JsonOptions), System.Text.Encoding.UTF8, "application/json"));

        if (!response.IsSuccessStatusCode)
            return new List<OsvVulnerability>();

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        if (!root.TryGetProperty("vulns", out var vulns))
            return new List<OsvVulnerability>();

        var results = new List<OsvVulnerability>();
        foreach (var vuln in vulns.EnumerateArray())
        {
            var id = vuln.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            var summary = vuln.TryGetProperty("summary", out var sumProp) ? sumProp.GetString() ?? "" : "";

            // Determine severity from database_specific or severity array
            var severity = "unknown";
            if (vuln.TryGetProperty("database_specific", out var dbSpecific) &&
                dbSpecific.TryGetProperty("severity", out var sevProp))
            {
                severity = sevProp.GetString()?.ToLowerInvariant() ?? "unknown";
            }
            else if (vuln.TryGetProperty("severity", out var sevArray) &&
                     sevArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var s in sevArray.EnumerateArray())
                {
                    if (s.TryGetProperty("score", out var scoreProp))
                    {
                        var score = scoreProp.GetString() ?? "";
                        severity = CvssToSeverity(score);
                        break;
                    }
                }
            }

            // Find fixed version from affected ranges
            string? fixedVersion = null;
            if (vuln.TryGetProperty("affected", out var affected))
            {
                foreach (var aff in affected.EnumerateArray())
                {
                    if (!aff.TryGetProperty("ranges", out var ranges)) continue;
                    foreach (var range in ranges.EnumerateArray())
                    {
                        if (!range.TryGetProperty("events", out var events)) continue;
                        foreach (var evt in events.EnumerateArray())
                        {
                            if (evt.TryGetProperty("fixed", out var fixedProp))
                            {
                                fixedVersion = fixedProp.GetString();
                                break;
                            }
                        }
                        if (fixedVersion != null) break;
                    }
                    if (fixedVersion != null) break;
                }
            }

            results.Add(new OsvVulnerability
            {
                Id = id,
                Severity = severity,
                Summary = summary,
                FixedVersion = fixedVersion
            });
        }

        return results;
    }

    private static string CvssToSeverity(string cvssVector)
    {
        // Simple CVSS v3 score extraction from vector string
        // e.g., "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" => critical
        if (string.IsNullOrEmpty(cvssVector)) return "unknown";

        // If it's a numeric score
        if (double.TryParse(cvssVector, out var score))
        {
            return score switch
            {
                >= 9.0 => "critical",
                >= 7.0 => "high",
                >= 4.0 => "medium",
                > 0.0 => "low",
                _ => "unknown"
            };
        }

        return "unknown";
    }

    private static string CategorizeLicense(string license)
    {
        var upper = license.ToUpperInvariant();
        if (upper.Contains("MIT") || upper.Contains("BSD") || upper.Contains("ISC") || upper.Contains("APACHE"))
            return "permissive";
        if (upper.Contains("GPL") || upper.Contains("AGPL") || upper.Contains("LGPL") || upper.Contains("MPL"))
            return "copyleft";
        if (upper.Contains("UNLICENSE") || upper.Contains("CC0") || upper.Contains("PUBLIC DOMAIN"))
            return "public_domain";
        return "unknown";
    }

    private static string GenerateCycloneDxJson(SbomReport report, List<SbomComponent> components)
    {
        var cdx = new
        {
            bomFormat = "CycloneDX",
            specVersion = "1.5",
            serialNumber = $"urn:uuid:{report.Id}",
            version = 1,
            metadata = new
            {
                timestamp = report.GeneratedAt.ToString("o"),
                tools = new[] { new { vendor = "AI Dev Request", name = "SecurityService", version = "1.0.0" } }
            },
            components = components.Select(c => new
            {
                type = "library",
                name = c.Name,
                version = c.Version,
                purl = c.Purl,
                licenses = string.IsNullOrEmpty(c.License) ? Array.Empty<object>() :
                    new object[] { new { license = new { id = c.License } } }
            })
        };

        return JsonSerializer.Serialize(cdx, new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }

    private static string GenerateSpdxJson(SbomReport report, List<SbomComponent> components)
    {
        var spdx = new
        {
            spdxVersion = "SPDX-2.3",
            dataLicense = "CC0-1.0",
            SPDXID = "SPDXRef-DOCUMENT",
            name = $"sbom-{report.DevRequestId}",
            documentNamespace = $"https://aidevrequest.kr/spdx/{report.Id}",
            creationInfo = new
            {
                created = report.GeneratedAt.ToString("o"),
                creators = new[] { "Tool: AI Dev Request SecurityService-1.0.0" }
            },
            packages = components.Select((c, i) => new
            {
                SPDXID = $"SPDXRef-Package-{i}",
                name = c.Name,
                versionInfo = c.Version,
                downloadLocation = "NOASSERTION",
                externalRefs = new[]
                {
                    new { referenceCategory = "PACKAGE-MANAGER", referenceType = "purl", referenceLocator = c.Purl ?? "" }
                },
                licenseDeclared = c.License ?? "NOASSERTION"
            })
        };

        return JsonSerializer.Serialize(spdx, new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }

    #endregion
}

#region DTOs / Models

public class SbomComponent
{
    public string Name { get; set; } = "";
    public string Version { get; set; } = "";
    public string Type { get; set; } = ""; // dependency, devDependency
    public string Ecosystem { get; set; } = ""; // npm, NuGet, PyPI
    public string? License { get; set; }
    public string? Purl { get; set; }
}

public class OsvVulnerability
{
    public string Id { get; set; } = "";
    public string Severity { get; set; } = "unknown";
    public string Summary { get; set; } = "";
    public string? FixedVersion { get; set; }
}

public class LicenseAnalysis
{
    public int TotalPackages { get; set; }
    public int UniqueLicenses { get; set; }
    public List<LicenseGroup> LicenseGroups { get; set; } = new();
    public bool HasCopyleftLicenses { get; set; }
    public string CompatibilityStatus { get; set; } = "compatible";
}

public class LicenseGroup
{
    public string License { get; set; } = "";
    public int Count { get; set; }
    public List<string> Packages { get; set; } = new();
    public string Category { get; set; } = "unknown"; // permissive, copyleft, public_domain, unknown
}

#endregion

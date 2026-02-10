namespace AiDevRequest.API.Entities;

public class SbomReport
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DevRequestId { get; set; }

    public string Format { get; set; } = "CycloneDX"; // CycloneDX or SPDX

    /// <summary>
    /// JSON array of SBOM components (name, version, type, license, purl)
    /// </summary>
    public string ComponentsJson { get; set; } = "[]";

    public int DependencyCount { get; set; }

    /// <summary>
    /// JSON summary of detected licenses with counts
    /// </summary>
    public string? LicensesSummaryJson { get; set; }

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class VulnerabilityResult
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SbomReportId { get; set; }

    public string PackageName { get; set; } = "";

    public string PackageVersion { get; set; } = "";

    public string Ecosystem { get; set; } = ""; // npm, NuGet, PyPI, etc.

    public string VulnerabilityId { get; set; } = ""; // CVE-XXXX or GHSA-XXXX

    public string Severity { get; set; } = "unknown"; // critical, high, medium, low, unknown

    public string Summary { get; set; } = "";

    public string? FixedVersion { get; set; }

    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;
}

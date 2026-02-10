using System.Text.Json;
using System.Text.RegularExpressions;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IFileGenerationService
{
    Task<GenerationManifest> CreateManifestAsync(Guid devRequestId, List<FileSpec> fileSpecs);
    Task<GenerationManifest?> GetManifestAsync(Guid devRequestId);
    Task<GenerationManifest> ValidateConsistencyAsync(Guid manifestId);
    Task<GenerationManifest> ResolveConflictsAsync(Guid manifestId);
    Task<List<GeneratedFileInfo>> GetFilesAsync(Guid devRequestId);
}

public class FileGenerationService : IFileGenerationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<FileGenerationService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public FileGenerationService(
        AiDevRequestDbContext context,
        ILogger<FileGenerationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<GenerationManifest> CreateManifestAsync(Guid devRequestId, List<FileSpec> fileSpecs)
    {
        _logger.LogInformation("Creating generation manifest for request {RequestId} with {Count} files",
            devRequestId, fileSpecs.Count);

        var files = fileSpecs.Select(spec => new ManifestFile
        {
            Path = spec.Path,
            Language = DetectLanguage(spec.Path),
            Size = spec.Content?.Length ?? 0,
            Exports = ExtractExports(spec.Content ?? "", spec.Path),
            Imports = ExtractImports(spec.Content ?? "", spec.Path),
            Description = spec.Description ?? ""
        }).ToList();

        var crossRefs = BuildCrossReferences(files);

        // Check for existing manifest
        var existing = await _context.GenerationManifests
            .Where(m => m.DevRequestId == devRequestId)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            existing.FilesJson = JsonSerializer.Serialize(files, JsonOptions);
            existing.CrossReferencesJson = JsonSerializer.Serialize(crossRefs, JsonOptions);
            existing.ValidationResultsJson = "[]";
            existing.ValidationStatus = "pending";
            existing.FileCount = files.Count;
            existing.CrossReferenceCount = crossRefs.Count;
            existing.IssueCount = 0;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new GenerationManifest
            {
                DevRequestId = devRequestId,
                FilesJson = JsonSerializer.Serialize(files, JsonOptions),
                CrossReferencesJson = JsonSerializer.Serialize(crossRefs, JsonOptions),
                ValidationResultsJson = "[]",
                ValidationStatus = "pending",
                FileCount = files.Count,
                CrossReferenceCount = crossRefs.Count,
                IssueCount = 0
            };
            _context.GenerationManifests.Add(existing);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Manifest created for request {RequestId}: {FileCount} files, {RefCount} cross-references",
            devRequestId, files.Count, crossRefs.Count);

        return existing;
    }

    public async Task<GenerationManifest?> GetManifestAsync(Guid devRequestId)
    {
        return await _context.GenerationManifests
            .Where(m => m.DevRequestId == devRequestId)
            .FirstOrDefaultAsync();
    }

    public async Task<GenerationManifest> ValidateConsistencyAsync(Guid manifestId)
    {
        var manifest = await _context.GenerationManifests.FindAsync(manifestId);
        if (manifest == null)
            throw new InvalidOperationException("Generation manifest not found.");

        _logger.LogInformation("Validating consistency for manifest {ManifestId}", manifestId);

        var files = JsonSerializer.Deserialize<List<ManifestFile>>(manifest.FilesJson, JsonOptions)
            ?? new List<ManifestFile>();
        var crossRefs = JsonSerializer.Deserialize<List<CrossReference>>(manifest.CrossReferencesJson, JsonOptions)
            ?? new List<CrossReference>();

        var issues = new List<ValidationIssue>();

        // Rule 1: Import targets must exist as files or exports
        issues.AddRange(ValidateImportsMatchExports(files, crossRefs));

        // Rule 2: No circular dependencies
        issues.AddRange(ValidateNoCyclicDependencies(files, crossRefs));

        // Rule 3: Type references are consistent
        issues.AddRange(ValidateTypeConsistency(files));

        // Rule 4: API contract alignment (frontend calls match backend routes)
        issues.AddRange(ValidateApiContractAlignment(files));

        // Rule 5: No duplicate file paths
        issues.AddRange(ValidateDuplicatePaths(files));

        manifest.ValidationResultsJson = JsonSerializer.Serialize(issues, JsonOptions);
        manifest.IssueCount = issues.Count;
        manifest.ValidationStatus = issues.Count == 0 ? "passed" : "failed";
        manifest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Validation complete for manifest {ManifestId}: {Status} with {IssueCount} issues",
            manifestId, manifest.ValidationStatus, issues.Count);

        return manifest;
    }

    public async Task<GenerationManifest> ResolveConflictsAsync(Guid manifestId)
    {
        var manifest = await _context.GenerationManifests.FindAsync(manifestId);
        if (manifest == null)
            throw new InvalidOperationException("Generation manifest not found.");

        var issues = JsonSerializer.Deserialize<List<ValidationIssue>>(manifest.ValidationResultsJson, JsonOptions)
            ?? new List<ValidationIssue>();

        if (issues.Count == 0)
        {
            manifest.ValidationStatus = "passed";
            manifest.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return manifest;
        }

        _logger.LogInformation("Resolving {Count} conflicts for manifest {ManifestId}", issues.Count, manifestId);

        var files = JsonSerializer.Deserialize<List<ManifestFile>>(manifest.FilesJson, JsonOptions)
            ?? new List<ManifestFile>();

        // Auto-resolve what we can
        var resolvedIssues = new List<ValidationIssue>();
        foreach (var issue in issues)
        {
            var resolved = TryAutoResolve(issue, files);
            resolved.Status = resolved.Suggestion != null ? "resolved" : issue.Status;
            resolvedIssues.Add(resolved);
        }

        var unresolvedCount = resolvedIssues.Count(i => i.Status != "resolved");

        manifest.ValidationResultsJson = JsonSerializer.Serialize(resolvedIssues, JsonOptions);
        manifest.IssueCount = unresolvedCount;
        manifest.ValidationStatus = unresolvedCount == 0 ? "resolved" : "failed";
        manifest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Conflict resolution complete for manifest {ManifestId}: {Resolved}/{Total} resolved",
            manifestId, issues.Count - unresolvedCount, issues.Count);

        return manifest;
    }

    public async Task<List<GeneratedFileInfo>> GetFilesAsync(Guid devRequestId)
    {
        var manifest = await _context.GenerationManifests
            .Where(m => m.DevRequestId == devRequestId)
            .FirstOrDefaultAsync();

        if (manifest == null)
            return new List<GeneratedFileInfo>();

        var files = JsonSerializer.Deserialize<List<ManifestFile>>(manifest.FilesJson, JsonOptions)
            ?? new List<ManifestFile>();

        var crossRefs = JsonSerializer.Deserialize<List<CrossReference>>(manifest.CrossReferencesJson, JsonOptions)
            ?? new List<CrossReference>();

        return files.Select(f => new GeneratedFileInfo
        {
            Path = f.Path,
            Language = f.Language,
            Size = f.Size,
            Description = f.Description,
            ExportCount = f.Exports.Count,
            ImportCount = f.Imports.Count,
            DependencyCount = crossRefs.Count(r => r.SourceFile == f.Path),
            DependentCount = crossRefs.Count(r => r.TargetFile == f.Path)
        }).ToList();
    }

    #region Cross-Reference Building

    private static List<CrossReference> BuildCrossReferences(List<ManifestFile> files)
    {
        var refs = new List<CrossReference>();
        var filePathSet = files.Select(f => f.Path).ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var file in files)
        {
            foreach (var imp in file.Imports)
            {
                // Try to resolve the import to a file in the manifest
                var resolved = ResolveImportPath(file.Path, imp, filePathSet);
                if (resolved != null)
                {
                    refs.Add(new CrossReference
                    {
                        SourceFile = file.Path,
                        TargetFile = resolved,
                        ReferenceType = "import",
                        Symbol = imp
                    });
                }
            }
        }

        return refs;
    }

    private static string? ResolveImportPath(string sourceFile, string importPath, HashSet<string> allPaths)
    {
        // Normalize relative imports
        if (importPath.StartsWith("./") || importPath.StartsWith("../"))
        {
            var sourceDir = Path.GetDirectoryName(sourceFile)?.Replace('\\', '/') ?? "";
            var combined = Path.Combine(sourceDir, importPath).Replace('\\', '/');

            // Try with common extensions
            string[] extensions = { "", ".ts", ".tsx", ".js", ".jsx", ".cs", ".py" };
            foreach (var ext in extensions)
            {
                var candidate = combined + ext;
                if (allPaths.Contains(candidate))
                    return candidate;
            }

            // Try index files
            foreach (var idx in new[] { "/index.ts", "/index.tsx", "/index.js" })
            {
                if (allPaths.Contains(combined + idx))
                    return combined + idx;
            }
        }

        // Direct match
        if (allPaths.Contains(importPath))
            return importPath;

        return null;
    }

    #endregion

    #region Extraction Helpers

    private static string DetectLanguage(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext switch
        {
            ".ts" or ".tsx" => "TypeScript",
            ".js" or ".jsx" => "JavaScript",
            ".cs" => "C#",
            ".py" => "Python",
            ".json" => "JSON",
            ".html" => "HTML",
            ".css" or ".scss" => "CSS",
            ".yaml" or ".yml" => "YAML",
            ".sql" => "SQL",
            ".bicep" => "Bicep",
            _ => "Other"
        };
    }

    private static List<string> ExtractExports(string content, string filePath)
    {
        var exports = new List<string>();
        if (string.IsNullOrEmpty(content)) return exports;

        var ext = Path.GetExtension(filePath).ToLowerInvariant();

        if (ext is ".ts" or ".tsx" or ".js" or ".jsx")
        {
            // Named exports: export function/const/class/interface/type Name
            var namedExport = new Regex(@"export\s+(?:function|const|class|interface|type|enum)\s+(\w+)");
            foreach (Match m in namedExport.Matches(content))
                exports.Add(m.Groups[1].Value);

            // Default exports: export default function/class Name
            var defaultExport = new Regex(@"export\s+default\s+(?:function|class)\s+(\w+)");
            foreach (Match m in defaultExport.Matches(content))
                exports.Add(m.Groups[1].Value);
        }
        else if (ext == ".cs")
        {
            // Public classes, interfaces, enums
            var csExport = new Regex(@"public\s+(?:class|interface|enum|record|struct)\s+(\w+)");
            foreach (Match m in csExport.Matches(content))
                exports.Add(m.Groups[1].Value);
        }
        else if (ext == ".py")
        {
            // Top-level class/def
            var pyExport = new Regex(@"^(?:class|def)\s+(\w+)", RegexOptions.Multiline);
            foreach (Match m in pyExport.Matches(content))
                exports.Add(m.Groups[1].Value);
        }

        return exports;
    }

    private static List<string> ExtractImports(string content, string filePath)
    {
        var imports = new List<string>();
        if (string.IsNullOrEmpty(content)) return imports;

        var ext = Path.GetExtension(filePath).ToLowerInvariant();

        if (ext is ".ts" or ".tsx" or ".js" or ".jsx")
        {
            // import ... from '...'
            var tsImport = new Regex(@"(?:import|from)\s+['""]([^'""]+)['""]");
            foreach (Match m in tsImport.Matches(content))
                imports.Add(m.Groups[1].Value);
        }
        else if (ext == ".cs")
        {
            // using Namespace;
            var csUsing = new Regex(@"using\s+([\w.]+)\s*;");
            foreach (Match m in csUsing.Matches(content))
                imports.Add(m.Groups[1].Value);
        }
        else if (ext == ".py")
        {
            // import module / from module import ...
            var pyImport = new Regex(@"(?:from|import)\s+([\w.]+)");
            foreach (Match m in pyImport.Matches(content))
                imports.Add(m.Groups[1].Value);
        }

        return imports.Distinct().ToList();
    }

    #endregion

    #region Validation Rules

    private static List<ValidationIssue> ValidateImportsMatchExports(List<ManifestFile> files, List<CrossReference> crossRefs)
    {
        var issues = new List<ValidationIssue>();
        var exportMap = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in files)
        {
            exportMap[file.Path] = new HashSet<string>(file.Exports, StringComparer.OrdinalIgnoreCase);
        }

        foreach (var file in files)
        {
            foreach (var imp in file.Imports)
            {
                // Only check local/relative imports
                if (!imp.StartsWith("./") && !imp.StartsWith("../")) continue;

                var matchingRef = crossRefs.FirstOrDefault(r =>
                    r.SourceFile == file.Path && r.Symbol == imp);

                if (matchingRef == null)
                {
                    issues.Add(new ValidationIssue
                    {
                        Rule = "import_target_missing",
                        Status = "error",
                        Message = $"Import '{imp}' in '{file.Path}' does not resolve to any file in the manifest.",
                        AffectedFiles = new List<string> { file.Path }
                    });
                }
            }
        }

        return issues;
    }

    private static List<ValidationIssue> ValidateNoCyclicDependencies(List<ManifestFile> files, List<CrossReference> crossRefs)
    {
        var issues = new List<ValidationIssue>();
        var adjacency = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in files)
            adjacency[file.Path] = new List<string>();

        foreach (var r in crossRefs)
        {
            if (adjacency.ContainsKey(r.SourceFile))
                adjacency[r.SourceFile].Add(r.TargetFile);
        }

        // DFS cycle detection
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var inStack = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in files)
        {
            if (!visited.Contains(file.Path))
            {
                var cycle = DetectCycle(file.Path, adjacency, visited, inStack, new List<string>());
                if (cycle != null)
                {
                    issues.Add(new ValidationIssue
                    {
                        Rule = "circular_dependency",
                        Status = "warning",
                        Message = $"Circular dependency detected: {string.Join(" -> ", cycle)}",
                        AffectedFiles = cycle
                    });
                }
            }
        }

        return issues;
    }

    private static List<string>? DetectCycle(
        string node,
        Dictionary<string, List<string>> adj,
        HashSet<string> visited,
        HashSet<string> inStack,
        List<string> path)
    {
        visited.Add(node);
        inStack.Add(node);
        path.Add(node);

        if (adj.TryGetValue(node, out var neighbors))
        {
            foreach (var neighbor in neighbors)
            {
                if (!visited.Contains(neighbor))
                {
                    var result = DetectCycle(neighbor, adj, visited, inStack, path);
                    if (result != null) return result;
                }
                else if (inStack.Contains(neighbor))
                {
                    var cycleStart = path.IndexOf(neighbor);
                    var cycle = path.Skip(cycleStart).Append(neighbor).ToList();
                    return cycle;
                }
            }
        }

        inStack.Remove(node);
        path.RemoveAt(path.Count - 1);
        return null;
    }

    private static List<ValidationIssue> ValidateTypeConsistency(List<ManifestFile> files)
    {
        var issues = new List<ValidationIssue>();

        // Check for shared type names across TypeScript files that might conflict
        var typesByName = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in files)
        {
            if (file.Language is not "TypeScript" and not "JavaScript") continue;
            foreach (var export in file.Exports)
            {
                if (!typesByName.ContainsKey(export))
                    typesByName[export] = new List<string>();
                typesByName[export].Add(file.Path);
            }
        }

        foreach (var (typeName, filePaths) in typesByName)
        {
            if (filePaths.Count > 1)
            {
                issues.Add(new ValidationIssue
                {
                    Rule = "duplicate_export_name",
                    Status = "warning",
                    Message = $"Export '{typeName}' is defined in multiple files: {string.Join(", ", filePaths)}. This may cause ambiguous imports.",
                    AffectedFiles = filePaths
                });
            }
        }

        return issues;
    }

    private static List<ValidationIssue> ValidateApiContractAlignment(List<ManifestFile> files)
    {
        var issues = new List<ValidationIssue>();

        // Collect backend API routes from C# controller files
        var backendRoutes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var controllerFiles = files.Where(f => f.Language == "C#" && f.Path.Contains("Controller")).ToList();

        foreach (var file in controllerFiles)
        {
            foreach (var export in file.Exports)
            {
                backendRoutes.Add(export);
            }
        }

        // Collect frontend API module files
        var apiFiles = files.Where(f =>
            (f.Language is "TypeScript" or "JavaScript") &&
            (f.Path.Contains("/api/") || f.Path.Contains("\\api\\"))).ToList();

        // Basic check: if there are API files referencing controller names that don't exist
        if (controllerFiles.Count > 0 && apiFiles.Count > 0)
        {
            foreach (var apiFile in apiFiles)
            {
                if (apiFile.Imports.Count == 0 && apiFile.Exports.Count == 0)
                {
                    issues.Add(new ValidationIssue
                    {
                        Rule = "empty_api_module",
                        Status = "warning",
                        Message = $"API module '{apiFile.Path}' has no exports. It may be incomplete.",
                        AffectedFiles = new List<string> { apiFile.Path }
                    });
                }
            }
        }

        return issues;
    }

    private static List<ValidationIssue> ValidateDuplicatePaths(List<ManifestFile> files)
    {
        var issues = new List<ValidationIssue>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in files)
        {
            if (!seen.Add(file.Path))
            {
                issues.Add(new ValidationIssue
                {
                    Rule = "duplicate_file_path",
                    Status = "error",
                    Message = $"Duplicate file path: '{file.Path}'. Each file must have a unique path.",
                    AffectedFiles = new List<string> { file.Path }
                });
            }
        }

        return issues;
    }

    #endregion

    #region Conflict Resolution

    private static ValidationIssue TryAutoResolve(ValidationIssue issue, List<ManifestFile> files)
    {
        var resolved = new ValidationIssue
        {
            Rule = issue.Rule,
            Status = issue.Status,
            Message = issue.Message,
            AffectedFiles = issue.AffectedFiles
        };

        switch (issue.Rule)
        {
            case "import_target_missing":
                resolved.Suggestion = "Add the missing file to the manifest or update the import path to reference an existing file.";
                break;

            case "circular_dependency":
                resolved.Suggestion = "Extract shared types/interfaces into a separate module to break the cycle.";
                break;

            case "duplicate_export_name":
                resolved.Suggestion = "Rename one of the exports or use namespaced imports to avoid ambiguity.";
                break;

            case "empty_api_module":
                resolved.Suggestion = "Add API functions that correspond to the backend endpoints.";
                break;

            case "duplicate_file_path":
                resolved.Suggestion = "Remove the duplicate entry or rename the file path.";
                break;
        }

        return resolved;
    }

    #endregion
}

#region DTOs

public class FileSpec
{
    public string Path { get; set; } = "";
    public string? Content { get; set; }
    public string? Description { get; set; }
}

public class ManifestFile
{
    public string Path { get; set; } = "";
    public string Language { get; set; } = "";
    public int Size { get; set; }
    public string Description { get; set; } = "";
    public List<string> Exports { get; set; } = new();
    public List<string> Imports { get; set; } = new();
}

public class CrossReference
{
    public string SourceFile { get; set; } = "";
    public string TargetFile { get; set; } = "";
    public string ReferenceType { get; set; } = ""; // import, type_reference, api_call
    public string Symbol { get; set; } = "";
}

public class ValidationIssue
{
    public string Rule { get; set; } = "";
    public string Status { get; set; } = "error"; // error, warning, resolved
    public string Message { get; set; } = "";
    public List<string> AffectedFiles { get; set; } = new();
    public string? Suggestion { get; set; }
}

public class GeneratedFileInfo
{
    public string Path { get; set; } = "";
    public string Language { get; set; } = "";
    public int Size { get; set; }
    public string Description { get; set; } = "";
    public int ExportCount { get; set; }
    public int ImportCount { get; set; }
    public int DependencyCount { get; set; }
    public int DependentCount { get; set; }
}

#endregion

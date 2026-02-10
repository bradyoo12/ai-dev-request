using System.Text.Json;

namespace AiDevRequest.API.Services;

public interface ICodeValidationService
{
    Task<CodeValidationResult> ValidateAsync(Dictionary<string, string> files, string framework);
}

public class CodeValidationService : ICodeValidationService
{
    private readonly ILogger<CodeValidationService> _logger;

    public CodeValidationService(ILogger<CodeValidationService> logger)
    {
        _logger = logger;
    }

    public Task<CodeValidationResult> ValidateAsync(Dictionary<string, string> files, string framework)
    {
        _logger.LogInformation("Validating {FileCount} files for framework {Framework}", files.Count, framework);

        var issues = new List<CodeIssue>();

        // Check for empty or stub-only files
        foreach (var (path, content) in files)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                issues.Add(new CodeIssue
                {
                    Severity = "error",
                    FilePath = path,
                    Description = "File is empty",
                    SuggestedFix = "Add implementation content to the file"
                });
                continue;
            }

            if (content.Trim().Length < 20)
            {
                issues.Add(new CodeIssue
                {
                    Severity = "warning",
                    FilePath = path,
                    Description = "File appears to be a stub with minimal content",
                    SuggestedFix = "Add complete implementation"
                });
            }
        }

        // Validate JSON files
        ValidateJsonFiles(files, issues);

        // Check for missing entry points
        ValidateEntryPoints(files, framework, issues);

        // Check for missing imports/references between files
        ValidateReferences(files, framework, issues);

        // Check for common syntax error patterns
        ValidateSyntaxPatterns(files, framework, issues);

        // Calculate score
        var errorCount = issues.Count(i => i.Severity == "error");
        var warningCount = issues.Count(i => i.Severity == "warning");
        var score = Math.Max(0, 100 - (errorCount * 15) - (warningCount * 5));

        var result = new CodeValidationResult
        {
            IsValid = errorCount == 0,
            Issues = issues,
            Score = score
        };

        _logger.LogInformation("Validation completed: Score={Score}, IsValid={IsValid}, Issues={IssueCount}",
            score, result.IsValid, issues.Count);

        return Task.FromResult(result);
    }

    private void ValidateJsonFiles(Dictionary<string, string> files, List<CodeIssue> issues)
    {
        var jsonFiles = files.Where(f =>
            f.Key.EndsWith(".json", StringComparison.OrdinalIgnoreCase));

        foreach (var (path, content) in jsonFiles)
        {
            try
            {
                JsonDocument.Parse(content);
            }
            catch (JsonException ex)
            {
                issues.Add(new CodeIssue
                {
                    Severity = "error",
                    FilePath = path,
                    Description = $"Invalid JSON: {ex.Message}",
                    SuggestedFix = "Fix the JSON syntax"
                });
            }
        }
    }

    private void ValidateEntryPoints(Dictionary<string, string> files, string framework, List<CodeIssue> issues)
    {
        var normalizedFiles = files.Keys
            .Select(f => f.Replace("\\", "/"))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        switch (framework.ToLowerInvariant())
        {
            case "react":
            case "react-native":
            case "expo":
                if (!normalizedFiles.Any(f => f.EndsWith("App.tsx") || f.EndsWith("App.jsx") || f.EndsWith("App.ts") || f.EndsWith("App.js")))
                {
                    issues.Add(new CodeIssue
                    {
                        Severity = "error",
                        FilePath = "App.tsx",
                        Description = "Missing App entry point file (App.tsx or App.jsx)",
                        SuggestedFix = "Create an App.tsx file as the application entry point"
                    });
                }
                if (!normalizedFiles.Any(f => f.EndsWith("package.json")))
                {
                    issues.Add(new CodeIssue
                    {
                        Severity = "error",
                        FilePath = "package.json",
                        Description = "Missing package.json",
                        SuggestedFix = "Create a package.json with project dependencies"
                    });
                }
                break;

            case "nextjs":
                if (!normalizedFiles.Any(f => f.EndsWith("package.json")))
                {
                    issues.Add(new CodeIssue
                    {
                        Severity = "error",
                        FilePath = "package.json",
                        Description = "Missing package.json",
                        SuggestedFix = "Create a package.json with Next.js dependencies"
                    });
                }
                break;

            case "flutter":
                if (!normalizedFiles.Any(f => f.EndsWith("main.dart")))
                {
                    issues.Add(new CodeIssue
                    {
                        Severity = "error",
                        FilePath = "lib/main.dart",
                        Description = "Missing main.dart entry point",
                        SuggestedFix = "Create lib/main.dart as the Flutter entry point"
                    });
                }
                if (!normalizedFiles.Any(f => f.EndsWith("pubspec.yaml")))
                {
                    issues.Add(new CodeIssue
                    {
                        Severity = "error",
                        FilePath = "pubspec.yaml",
                        Description = "Missing pubspec.yaml",
                        SuggestedFix = "Create pubspec.yaml with Flutter dependencies"
                    });
                }
                break;

            case "dotnet":
            case ".net":
                if (!normalizedFiles.Any(f => f.EndsWith("Program.cs")))
                {
                    issues.Add(new CodeIssue
                    {
                        Severity = "error",
                        FilePath = "Program.cs",
                        Description = "Missing Program.cs entry point",
                        SuggestedFix = "Create a Program.cs as the .NET entry point"
                    });
                }
                if (!normalizedFiles.Any(f => f.EndsWith(".csproj")))
                {
                    issues.Add(new CodeIssue
                    {
                        Severity = "error",
                        FilePath = "*.csproj",
                        Description = "Missing .csproj project file",
                        SuggestedFix = "Create a .csproj project file"
                    });
                }
                break;

            case "python":
                if (!normalizedFiles.Any(f => f.EndsWith("main.py") || f.EndsWith("app.py") || f.EndsWith("manage.py")))
                {
                    issues.Add(new CodeIssue
                    {
                        Severity = "warning",
                        FilePath = "main.py",
                        Description = "No obvious Python entry point (main.py, app.py, or manage.py)",
                        SuggestedFix = "Create a main.py or app.py entry point"
                    });
                }
                break;
        }
    }

    private void ValidateReferences(Dictionary<string, string> files, string framework, List<CodeIssue> issues)
    {
        var isJsProject = framework.ToLowerInvariant() is "react" or "react-native" or "expo" or "nextjs" or "vite";
        if (!isJsProject) return;

        var jsFiles = files.Where(f =>
            f.Key.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) ||
            f.Key.EndsWith(".tsx", StringComparison.OrdinalIgnoreCase) ||
            f.Key.EndsWith(".js", StringComparison.OrdinalIgnoreCase) ||
            f.Key.EndsWith(".jsx", StringComparison.OrdinalIgnoreCase));

        var projectFilePaths = files.Keys
            .Select(f => f.Replace("\\", "/"))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var (filePath, content) in jsFiles)
        {
            // Check for relative imports that reference files not in the project
            var lines = content.Split('\n');
            foreach (var line in lines)
            {
                var trimmedLine = line.Trim();
                if (!trimmedLine.StartsWith("import ") && !trimmedLine.StartsWith("from ")) continue;
                if (!trimmedLine.Contains("./") && !trimmedLine.Contains("../")) continue;

                // Extract the import path
                var quoteStart = trimmedLine.LastIndexOf('\'');
                var doubleQuoteStart = trimmedLine.LastIndexOf('"');
                var start = Math.Max(quoteStart, doubleQuoteStart);
                if (start < 0) continue;

                var quoteChar = trimmedLine[start];
                var pathStart = trimmedLine.LastIndexOf(quoteChar, start - 1);
                if (pathStart < 0) continue;

                var importPath = trimmedLine[(pathStart + 1)..start];
                if (string.IsNullOrEmpty(importPath) || !importPath.StartsWith('.')) continue;

                // Resolve relative path
                var dir = Path.GetDirectoryName(filePath.Replace("\\", "/"))?.Replace("\\", "/") ?? "";
                var resolved = Path.Combine(dir, importPath).Replace("\\", "/");

                // Normalize path segments
                var parts = resolved.Split('/').ToList();
                var normalized = new List<string>();
                foreach (var part in parts)
                {
                    if (part == ".") continue;
                    if (part == ".." && normalized.Count > 0)
                    {
                        normalized.RemoveAt(normalized.Count - 1);
                        continue;
                    }
                    normalized.Add(part);
                }
                resolved = string.Join("/", normalized);

                // Check if the referenced file exists (with common extensions)
                var extensions = new[] { "", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx" };
                var found = extensions.Any(ext => projectFilePaths.Contains(resolved + ext));

                if (!found)
                {
                    issues.Add(new CodeIssue
                    {
                        Severity = "warning",
                        FilePath = filePath,
                        Description = $"Import '{importPath}' may reference a file not included in the project",
                        SuggestedFix = $"Ensure the imported module exists or add the missing file"
                    });
                }
            }
        }
    }

    private void ValidateSyntaxPatterns(Dictionary<string, string> files, string framework, List<CodeIssue> issues)
    {
        foreach (var (path, content) in files)
        {
            // Skip non-code files
            if (path.EndsWith(".json", StringComparison.OrdinalIgnoreCase) ||
                path.EndsWith(".md", StringComparison.OrdinalIgnoreCase) ||
                path.EndsWith(".yaml", StringComparison.OrdinalIgnoreCase) ||
                path.EndsWith(".yml", StringComparison.OrdinalIgnoreCase))
                continue;

            // Check for TODO/FIXME placeholders that indicate incomplete code
            if (content.Contains("TODO: implement", StringComparison.OrdinalIgnoreCase) ||
                content.Contains("FIXME", StringComparison.OrdinalIgnoreCase) ||
                content.Contains("throw new NotImplementedException", StringComparison.OrdinalIgnoreCase))
            {
                issues.Add(new CodeIssue
                {
                    Severity = "warning",
                    FilePath = path,
                    Description = "File contains TODO/FIXME or unimplemented placeholders",
                    SuggestedFix = "Implement the placeholder code"
                });
            }

            // Check for console.log statements that should be removed in production code
            if ((path.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".tsx", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".js", StringComparison.OrdinalIgnoreCase) ||
                 path.EndsWith(".jsx", StringComparison.OrdinalIgnoreCase)) &&
                content.Contains("console.log(") &&
                content.Split("console.log(").Length > 5)
            {
                issues.Add(new CodeIssue
                {
                    Severity = "warning",
                    FilePath = path,
                    Description = "File contains excessive console.log statements",
                    SuggestedFix = "Remove or replace console.log with a proper logging solution"
                });
            }
        }
    }
}

public class CodeValidationResult
{
    public bool IsValid { get; set; }
    public List<CodeIssue> Issues { get; set; } = new();
    public int Score { get; set; }
}

public class CodeIssue
{
    public string Severity { get; set; } = "";
    public string FilePath { get; set; } = "";
    public string Description { get; set; } = "";
    public string SuggestedFix { get; set; } = "";
}

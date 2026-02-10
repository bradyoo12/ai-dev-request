using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ITestGenerationService
{
    Task<TestGenerationRecord> TriggerGenerationAsync(int projectId);
    Task<TestGenerationRecord?> GetResultAsync(int projectId);
    Task<List<TestGenerationRecord>> GetHistoryAsync(int projectId);
    Task<TestGenerationResult> GenerateTestsAsync(string projectPath, string projectType);
}

public class TestGenerationService : ITestGenerationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<TestGenerationService> _logger;
    private readonly string _projectsBasePath;

    public TestGenerationService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<TestGenerationService> logger)
    {
        _context = context;
        _logger = logger;
        _projectsBasePath = configuration["Projects:BasePath"] ?? "./projects";

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<TestGenerationRecord> TriggerGenerationAsync(int projectId)
    {
        var latestVersion = await _context.TestGenerationRecords
            .Where(r => r.ProjectId == projectId)
            .MaxAsync(r => (int?)r.GenerationVersion) ?? 0;

        var record = new TestGenerationRecord
        {
            ProjectId = projectId,
            Status = "generating",
            GenerationVersion = latestVersion + 1,
        };

        _context.TestGenerationRecords.Add(record);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Started test generation v{Version} for project {ProjectId}",
            record.GenerationVersion, projectId);

        try
        {
            var projectPath = await ResolveProjectPathAsync(projectId);

            if (projectPath != null)
            {
                var sourceFiles = ReadSourceFiles(projectPath);
                if (sourceFiles.Count > 0)
                {
                    var projectType = DetectProjectType(sourceFiles);
                    var result = await GenerateWithClaudeAsync(sourceFiles, projectType, projectId);

                    record.TestFilesGenerated = result.TestFiles.Count;
                    record.TotalTestCount = result.TestFiles.Sum(f => f.TestCount);
                    record.CoverageEstimate = result.CoverageEstimate;
                    record.TestFramework = result.TestFramework;
                    record.Summary = result.Summary;
                    record.TestFilesJson = JsonSerializer.Serialize(result.TestFiles);
                }
                else
                {
                    _logger.LogWarning("No source files found at {Path} for project {ProjectId}", projectPath, projectId);
                    record.Summary = "No source files found to generate tests for.";
                }
            }
            else
            {
                _logger.LogWarning("No project path found for project {ProjectId}", projectId);
                record.Summary = "Project path could not be resolved.";
            }

            record.Status = "completed";
            record.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Test generation completed for project {ProjectId}: {FileCount} files, {TestCount} tests, ~{Coverage}% coverage",
                projectId, record.TestFilesGenerated, record.TotalTestCount, record.CoverageEstimate);

            return record;
        }
        catch (Exception ex)
        {
            record.Status = "failed";
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Test generation failed for project {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<TestGenerationRecord?> GetResultAsync(int projectId)
    {
        return await _context.TestGenerationRecords
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.GenerationVersion)
            .FirstOrDefaultAsync();
    }

    public async Task<List<TestGenerationRecord>> GetHistoryAsync(int projectId)
    {
        return await _context.TestGenerationRecords
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.GenerationVersion)
            .ToListAsync();
    }

    public async Task<TestGenerationResult> GenerateTestsAsync(string projectPath, string projectType)
    {
        var sourceFiles = ReadSourceFiles(projectPath);
        if (sourceFiles.Count == 0)
        {
            return new TestGenerationResult { TestFramework = "none", Summary = "No source files found to generate tests for." };
        }

        var result = await GenerateWithClaudeAsync(sourceFiles, projectType, 0);
        return new TestGenerationResult
        {
            TestFilesGenerated = result.TestFiles.Count,
            TotalTestCount = result.TestFiles.Sum(f => f.TestCount),
            CoverageEstimate = result.CoverageEstimate,
            TestFramework = result.TestFramework,
            Summary = result.Summary,
            TestFiles = result.TestFiles.Select(f => new TestFileInfo
            {
                Path = f.Path,
                TestCount = f.TestCount,
                Type = f.Type
            }).ToList()
        };
    }

    private async Task<string?> ResolveProjectPathAsync(int projectId)
    {
        var devRequest = await _context.DevRequests
            .Where(r => r.ProjectPath != null)
            .OrderBy(r => r.CreatedAt)
            .Skip(projectId - 1)
            .FirstOrDefaultAsync();

        if (devRequest?.ProjectPath != null && Directory.Exists(devRequest.ProjectPath))
            return devRequest.ProjectPath;

        if (Directory.Exists(_projectsBasePath))
        {
            var dirs = Directory.GetDirectories(_projectsBasePath)
                .OrderBy(d => d)
                .ToArray();

            if (projectId >= 1 && projectId <= dirs.Length)
                return dirs[projectId - 1];
        }

        return null;
    }

    private static string DetectProjectType(Dictionary<string, string> sourceFiles)
    {
        var extensions = sourceFiles.Keys.Select(k => Path.GetExtension(k).ToLower()).ToHashSet();

        if (extensions.Contains(".tsx") || extensions.Contains(".jsx"))
            return "react";
        if (extensions.Contains(".cs"))
            return "dotnet";
        if (extensions.Contains(".py"))
            return "python";
        if (extensions.Contains(".vue"))
            return "vue";
        if (extensions.Contains(".svelte"))
            return "svelte";

        return "react"; // default
    }

    private async Task<GeneratedTestSuite> GenerateWithClaudeAsync(
        Dictionary<string, string> sourceFiles, string projectType, int projectId)
    {
        var filesSummary = string.Join("\n\n", sourceFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

        if (filesSummary.Length > 80000)
            filesSummary = filesSummary[..80000] + "\n\n... (additional files truncated for token limit)";

        var testFramework = GetTestFramework(projectType);

        var prompt = $@"You are a senior test engineer. Generate comprehensive tests for the following {projectType} project.

## Source Files
{filesSummary}

## Test Framework
Use {testFramework}.

## Requirements
1. Generate unit tests for all exported functions, components, and utilities
2. Generate integration tests for API endpoints if present
3. Generate basic E2E test scenarios for main user flows
4. Tests should cover: happy paths, edge cases, error handling
5. Use descriptive test names in the format: 'should [expected behavior] when [condition]'

Respond with ONLY a JSON object:
{{
  ""testFramework"": ""{testFramework}"",
  ""summary"": ""brief description of test coverage"",
  ""coverageEstimate"": 0-100,
  ""testFiles"": [
    {{
      ""path"": ""relative file path for test file"",
      ""content"": ""complete test file content"",
      ""testCount"": number_of_tests,
      ""type"": ""unit|integration|e2e""
    }}
  ]
}}

Generate realistic, runnable test files. JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 8000,
                Temperature = 0.3m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var jsonStart = content.IndexOf('{');
            var jsonEnd = content.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                content = content[jsonStart..(jsonEnd + 1)];
            }

            var generated = JsonSerializer.Deserialize<GeneratedTestSuite>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (generated != null)
            {
                _logger.LogInformation("Claude returned {Count} test files for project {ProjectId}",
                    generated.TestFiles.Count, projectId);
                return generated;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude API call failed for test generation, project {ProjectId}", projectId);
        }

        return new GeneratedTestSuite { TestFramework = testFramework, Summary = "Test generation could not be completed." };
    }

    private static string GetTestFramework(string projectType)
    {
        return projectType.ToLowerInvariant() switch
        {
            "react" or "nextjs" => "Vitest + React Testing Library + Playwright",
            "react-native" or "expo" => "Jest + React Native Testing Library",
            "dotnet" => "xUnit + FluentAssertions",
            "python" => "pytest",
            "vue" => "Vitest + Vue Test Utils",
            "svelte" => "Vitest + Svelte Testing Library",
            _ => "Vitest + Playwright"
        };
    }

    private static Dictionary<string, string> ReadSourceFiles(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var sourceExtensions = new HashSet<string>
        {
            ".ts", ".tsx", ".js", ".jsx", ".cs", ".py",
            ".vue", ".svelte", ".html", ".css"
        };

        var excludeDirs = new HashSet<string>
        {
            "node_modules", "dist", "build", ".next", "bin", "obj",
            "__pycache__", ".pytest_cache", "coverage", ".git"
        };

        foreach (var filePath in Directory.GetFiles(projectPath, "*.*", SearchOption.AllDirectories))
        {
            var ext = Path.GetExtension(filePath).ToLower();
            if (!sourceExtensions.Contains(ext)) continue;

            var relativePath = Path.GetRelativePath(projectPath, filePath);
            if (excludeDirs.Any(d => relativePath.Contains(d, StringComparison.OrdinalIgnoreCase))) continue;

            // Skip existing test files
            if (relativePath.Contains(".test.") || relativePath.Contains(".spec.") ||
                relativePath.Contains("__tests__")) continue;

            try
            {
                var content = File.ReadAllText(filePath);
                if (content.Length <= 50000)
                {
                    files[relativePath] = content;
                }
            }
            catch { /* Skip files that can't be read */ }
        }

        return files;
    }
}

public class TestGenerationResult
{
    public int TestFilesGenerated { get; set; }
    public int TotalTestCount { get; set; }
    public int CoverageEstimate { get; set; }
    public string TestFramework { get; set; } = "";
    public string Summary { get; set; } = "";
    public List<TestFileInfo> TestFiles { get; set; } = new();
}

public class TestFileInfo
{
    public string Path { get; set; } = "";
    public int TestCount { get; set; }
    public string Type { get; set; } = "";
}

public class GeneratedTestSuite
{
    public string TestFramework { get; set; } = "";
    public string Summary { get; set; } = "";
    public int CoverageEstimate { get; set; }
    public List<GeneratedTestFile> TestFiles { get; set; } = new();
}

public class GeneratedTestFile
{
    public string Path { get; set; } = "";
    public string Content { get; set; } = "";
    public int TestCount { get; set; }
    public string Type { get; set; } = "";
}

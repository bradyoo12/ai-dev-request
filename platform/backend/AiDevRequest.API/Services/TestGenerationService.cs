using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface ITestGenerationService
{
    Task<TestGenerationResult> GenerateTestsAsync(string projectPath, string projectType);
}

public class TestGenerationService : ITestGenerationService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<TestGenerationService> _logger;

    public TestGenerationService(IConfiguration configuration, ILogger<TestGenerationService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _logger = logger;
    }

    public async Task<TestGenerationResult> GenerateTestsAsync(string projectPath, string projectType)
    {
        _logger.LogInformation("Starting test generation for project at {Path} (type: {Type})", projectPath, projectType);

        var sourceFiles = ReadSourceFiles(projectPath);
        if (sourceFiles.Count == 0)
        {
            return new TestGenerationResult
            {
                TestFilesGenerated = 0,
                TestFramework = "none",
                Summary = "No source files found to generate tests for."
            };
        }

        var filesSummary = string.Join("\n\n", sourceFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

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

Respond in JSON format:
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

            if (generated?.TestFiles != null && generated.TestFiles.Count > 0)
            {
                // Write test files to project
                var filesWritten = 0;
                foreach (var testFile in generated.TestFiles)
                {
                    var filePath = Path.Combine(projectPath, testFile.Path);
                    var directory = Path.GetDirectoryName(filePath);
                    if (!string.IsNullOrEmpty(directory))
                    {
                        Directory.CreateDirectory(directory);
                    }
                    await File.WriteAllTextAsync(filePath, testFile.Content);
                    filesWritten++;
                    _logger.LogInformation("Generated test file: {Path}", testFile.Path);
                }

                var totalTests = generated.TestFiles.Sum(f => f.TestCount);

                _logger.LogInformation("Test generation completed: {FileCount} files, {TestCount} tests, ~{Coverage}% estimated coverage",
                    filesWritten, totalTests, generated.CoverageEstimate);

                return new TestGenerationResult
                {
                    TestFilesGenerated = filesWritten,
                    TotalTestCount = totalTests,
                    CoverageEstimate = generated.CoverageEstimate,
                    TestFramework = generated.TestFramework,
                    Summary = generated.Summary,
                    TestFiles = generated.TestFiles.Select(f => new TestFileInfo
                    {
                        Path = f.Path,
                        TestCount = f.TestCount,
                        Type = f.Type
                    }).ToList()
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test generation failed");
        }

        return new TestGenerationResult
        {
            TestFilesGenerated = 0,
            TestFramework = testFramework,
            Summary = "Test generation could not be completed."
        };
    }

    private static string GetTestFramework(string projectType)
    {
        return projectType.ToLowerInvariant() switch
        {
            "react" or "nextjs" => "Vitest + React Testing Library + Playwright",
            "react-native" or "expo" => "Jest + React Native Testing Library",
            "dotnet" => "xUnit + FluentAssertions",
            "python" => "pytest",
            _ => "Vitest + Playwright"
        };
    }

    private Dictionary<string, string> ReadSourceFiles(string projectPath)
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
            "__pycache__", ".pytest_cache", "coverage"
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
            catch { }
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

using System.Text.Json;
using AiDevRequest.API.Data;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface ISelfHealingService
{
    Task<SelfHealingResult> ValidateAndFixAsync(Guid requestId, Dictionary<string, string> files, string framework, int maxIterations = 3);
}

public class SelfHealingService : ISelfHealingService
{
    private readonly AnthropicClient _client;
    private readonly ICodeValidationService _validationService;
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SelfHealingService> _logger;

    public SelfHealingService(
        IConfiguration configuration,
        ICodeValidationService validationService,
        AiDevRequestDbContext context,
        ILogger<SelfHealingService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _validationService = validationService;
        _context = context;
        _logger = logger;
    }

    public async Task<SelfHealingResult> ValidateAndFixAsync(Guid requestId, Dictionary<string, string> files, string framework, int maxIterations = 3)
    {
        _logger.LogInformation("Starting self-healing loop for request {RequestId} with {FileCount} files (framework: {Framework}, maxIterations: {Max})",
            requestId, files.Count, framework, maxIterations);

        var currentFiles = new Dictionary<string, string>(files);
        var fixHistory = new List<FixRecord>();
        var passed = false;

        for (var iteration = 1; iteration <= maxIterations; iteration++)
        {
            _logger.LogInformation("Self-healing iteration {Iteration}/{Max} for {RequestId}", iteration, maxIterations, requestId);

            // Step 1: Validate
            var validationResult = await _validationService.ValidateAsync(currentFiles, framework);

            if (validationResult.IsValid)
            {
                _logger.LogInformation("Self-healing passed on iteration {Iteration} for {RequestId} with score {Score}",
                    iteration, requestId, validationResult.Score);
                passed = true;
                break;
            }

            _logger.LogInformation("Validation found {IssueCount} issues (score: {Score}) on iteration {Iteration} for {RequestId}",
                validationResult.Issues.Count, validationResult.Score, iteration, requestId);

            // Step 2: If last iteration, don't attempt fixes
            if (iteration == maxIterations)
            {
                fixHistory.Add(new FixRecord
                {
                    Iteration = iteration,
                    Issues = validationResult.Issues.Select(i => i.Description).ToList(),
                    FixDescription = "Max iterations reached, no fix attempted"
                });
                break;
            }

            // Step 3: Ask AI to fix the issues
            try
            {
                var fixedFiles = await AiFixIssuesAsync(currentFiles, validationResult.Issues, framework);

                if (fixedFiles.Count > 0)
                {
                    // Merge fixed files into current files
                    foreach (var (path, content) in fixedFiles)
                    {
                        currentFiles[path] = content;
                    }

                    fixHistory.Add(new FixRecord
                    {
                        Iteration = iteration,
                        Issues = validationResult.Issues.Select(i => i.Description).ToList(),
                        FixDescription = $"AI fixed {fixedFiles.Count} file(s)"
                    });

                    _logger.LogInformation("AI applied fixes to {FixCount} files on iteration {Iteration} for {RequestId}",
                        fixedFiles.Count, iteration, requestId);
                }
                else
                {
                    fixHistory.Add(new FixRecord
                    {
                        Iteration = iteration,
                        Issues = validationResult.Issues.Select(i => i.Description).ToList(),
                        FixDescription = "AI could not generate fixes"
                    });

                    _logger.LogWarning("AI returned no fixes on iteration {Iteration} for {RequestId}", iteration, requestId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI fix attempt failed on iteration {Iteration} for {RequestId}", iteration, requestId);

                fixHistory.Add(new FixRecord
                {
                    Iteration = iteration,
                    Issues = validationResult.Issues.Select(i => i.Description).ToList(),
                    FixDescription = $"Fix attempt failed: {ex.Message}"
                });
            }
        }

        // Save results to DevRequest
        try
        {
            var entity = await _context.DevRequests.FindAsync(requestId);
            if (entity != null)
            {
                entity.ValidationIterations = fixHistory.Count;
                entity.ValidationPassed = passed;
                entity.FixHistory = JsonSerializer.Serialize(fixHistory);
                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save self-healing results for {RequestId}", requestId);
        }

        var result = new SelfHealingResult
        {
            Files = currentFiles,
            FixHistory = fixHistory,
            Passed = passed,
            IterationsUsed = fixHistory.Count
        };

        _logger.LogInformation("Self-healing completed for {RequestId}: Passed={Passed}, Iterations={Iterations}",
            requestId, passed, result.IterationsUsed);

        return result;
    }

    private async Task<Dictionary<string, string>> AiFixIssuesAsync(
        Dictionary<string, string> files,
        List<CodeIssue> issues,
        string framework)
    {
        var issueText = string.Join("\n", issues.Select(i =>
            $"- [{i.Severity}] {i.FilePath}: {i.Description}" +
            (string.IsNullOrEmpty(i.SuggestedFix) ? "" : $" (suggestion: {i.SuggestedFix})")));

        // Include only affected files plus a few context files
        var affectedPaths = issues.Select(i => i.FilePath).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var relevantFiles = files.Where(f =>
            affectedPaths.Any(p => f.Key.Contains(p.Replace("*", ""), StringComparison.OrdinalIgnoreCase)))
            .ToDictionary(f => f.Key, f => f.Value);

        // If no specific files matched, include the first few files for context
        if (relevantFiles.Count == 0)
        {
            relevantFiles = files.Take(5).ToDictionary(f => f.Key, f => f.Value);
        }

        var filesSummary = string.Join("\n\n", relevantFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

        var prompt = $@"Fix the following issues in this {framework} project.

## Issues to Fix
{issueText}

## Affected Files
{filesSummary}

Respond in JSON format with the fixed file contents:
{{
  ""fixes"": [
    {{
      ""file"": ""relative/path/to/file"",
      ""content"": ""complete fixed file content""
    }}
  ]
}}

Only include files that need changes. Provide the complete file content, not patches. JSON only.";

        var messages = new List<Message> { new Message(RoleType.User, prompt) };
        var parameters = new MessageParameters
        {
            Messages = messages,
            Model = "claude-sonnet-4-20250514",
            MaxTokens = 6000,
            Temperature = 0.2m
        };

        var response = await _client.Messages.GetClaudeMessageAsync(parameters);
        var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

        var jsonStart = content.IndexOf('{');
        var jsonEnd = content.LastIndexOf('}');
        if (jsonStart >= 0 && jsonEnd > jsonStart)
        {
            content = content[jsonStart..(jsonEnd + 1)];
        }

        var fixResult = JsonSerializer.Deserialize<SelfHealingFixResponse>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        var result = new Dictionary<string, string>();
        if (fixResult?.Fixes != null)
        {
            foreach (var fix in fixResult.Fixes)
            {
                if (!string.IsNullOrEmpty(fix.File) && !string.IsNullOrEmpty(fix.Content))
                {
                    result[fix.File] = fix.Content;
                }
            }
        }

        return result;
    }
}

public class SelfHealingResult
{
    public Dictionary<string, string> Files { get; set; } = new();
    public List<FixRecord> FixHistory { get; set; } = new();
    public bool Passed { get; set; }
    public int IterationsUsed { get; set; }
}

public class FixRecord
{
    public int Iteration { get; set; }
    public List<string> Issues { get; set; } = new();
    public string FixDescription { get; set; } = "";
}

public class SelfHealingFixResponse
{
    public List<SelfHealingFileFix> Fixes { get; set; } = new();
}

public class SelfHealingFileFix
{
    public string File { get; set; } = "";
    public string Content { get; set; } = "";
}

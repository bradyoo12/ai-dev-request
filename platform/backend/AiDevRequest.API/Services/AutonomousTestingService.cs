using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IAutonomousTestingService
{
    Task<AutonomousTestExecution> StartAutonomousTestingLoopAsync(Guid devRequestId, Guid previewId, int maxIterations = 3);
    Task<AutonomousTestExecution?> GetLatestExecutionAsync(Guid devRequestId);
    Task<List<AutonomousTestExecution>> GetExecutionHistoryAsync(Guid devRequestId);
}

public class AutonomousTestingService : IAutonomousTestingService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<AutonomousTestingService> _logger;
    private readonly ISelfHealingTestService _selfHealingTestService;
    private readonly IPreviewDeploymentService _previewDeploymentService;
    private readonly ISandboxExecutionService _sandboxExecutionService;
    private readonly string _projectsBasePath;

    public AutonomousTestingService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<AutonomousTestingService> logger,
        ISelfHealingTestService selfHealingTestService,
        IPreviewDeploymentService previewDeploymentService,
        ISandboxExecutionService sandboxExecutionService)
    {
        _context = context;
        _logger = logger;
        _selfHealingTestService = selfHealingTestService;
        _previewDeploymentService = previewDeploymentService;
        _sandboxExecutionService = sandboxExecutionService;
        _projectsBasePath = configuration["Projects:BasePath"] ?? "./projects";

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<AutonomousTestExecution> StartAutonomousTestingLoopAsync(
        Guid devRequestId,
        Guid previewId,
        int maxIterations = 3)
    {
        var execution = new AutonomousTestExecution
        {
            DevRequestId = devRequestId,
            PreviewDeploymentId = previewId,
            Status = "running",
            MaxIterations = maxIterations,
            CurrentIteration = 0,
        };

        _context.AutonomousTestExecutions.Add(execution);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Started autonomous testing loop {ExecutionId} for dev request {DevRequestId}, preview {PreviewId}, max {MaxIterations} iterations",
            execution.Id, devRequestId, previewId, maxIterations);

        try
        {
            var devRequest = await _context.DevRequests
                .FirstOrDefaultAsync(r => r.Id == devRequestId)
                ?? throw new InvalidOperationException($"Dev request {devRequestId} not found");

            var projectPath = devRequest.ProjectPath
                ?? throw new InvalidOperationException("Project path not found for dev request");

            // Iterate until tests pass or max iterations reached
            for (int i = 0; i < maxIterations; i++)
            {
                execution.CurrentIteration = i + 1;
                execution.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Autonomous testing iteration {Iteration}/{Max} for execution {ExecutionId}",
                    execution.CurrentIteration, maxIterations, execution.Id);

                // Step 1: Run tests in sandbox
                var testExecution = await _sandboxExecutionService.ExecuteInSandbox(
                    devRequestId,
                    "test",
                    "npm test",
                    "container");

                execution.TestExecutionIds = execution.TestExecutionIds != null
                    ? execution.TestExecutionIds + "," + testExecution.Id
                    : testExecution.Id.ToString();

                // Step 2: Check if tests passed
                if (testExecution.ExitCode == 0)
                {
                    _logger.LogInformation(
                        "All tests passed on iteration {Iteration} for execution {ExecutionId}",
                        execution.CurrentIteration, execution.Id);

                    execution.Status = "completed";
                    execution.TestsPassed = true;
                    execution.FinalTestResult = "All tests passed";
                    execution.CompletedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    return execution;
                }

                // Step 3: Analyze failures with self-healing service
                var healingResult = await _selfHealingTestService.RunSelfHealingAnalysis(devRequestId);

                // Step 4: Use Claude to regenerate code based on test failures
                var regenerationResult = await RegenerateCodeFromTestFailuresAsync(
                    projectPath,
                    testExecution.ErrorLog,
                    healingResult,
                    i + 1);

                execution.CodeRegenerationAttempts = execution.CodeRegenerationAttempts != null
                    ? execution.CodeRegenerationAttempts + "," + regenerationResult.AttemptId
                    : regenerationResult.AttemptId;

                // Step 5: Apply code changes to project
                await ApplyCodeChangesAsync(projectPath, regenerationResult.CodeChanges);

                // Step 6: Redeploy preview
                var newPreview = await _previewDeploymentService.DeployPreviewAsync(
                    devRequestId,
                    devRequest.UserId);

                execution.PreviewDeploymentId = newPreview.Id;

                _logger.LogInformation(
                    "Redeployed preview {PreviewId} after code regeneration on iteration {Iteration}",
                    newPreview.Id, execution.CurrentIteration);
            }

            // Max iterations reached without success
            _logger.LogWarning(
                "Autonomous testing loop reached max iterations ({MaxIterations}) without passing tests for execution {ExecutionId}",
                maxIterations, execution.Id);

            execution.Status = "failed";
            execution.TestsPassed = false;
            execution.FinalTestResult = $"Tests still failing after {maxIterations} iterations";
            execution.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return execution;
        }
        catch (Exception ex)
        {
            execution.Status = "error";
            execution.FinalTestResult = $"Error: {ex.Message}";
            execution.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Autonomous testing loop failed for execution {ExecutionId}", execution.Id);
            throw;
        }
    }

    public async Task<AutonomousTestExecution?> GetLatestExecutionAsync(Guid devRequestId)
    {
        return await _context.AutonomousTestExecutions
            .Where(e => e.DevRequestId == devRequestId)
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<AutonomousTestExecution>> GetExecutionHistoryAsync(Guid devRequestId)
    {
        return await _context.AutonomousTestExecutions
            .Where(e => e.DevRequestId == devRequestId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    private async Task<CodeRegenerationResult> RegenerateCodeFromTestFailuresAsync(
        string projectPath,
        string testErrorLog,
        SelfHealingTestResult healingResult,
        int iterationNumber)
    {
        _logger.LogInformation(
            "Regenerating code based on test failures (iteration {Iteration})",
            iterationNumber);

        // Read source files for context
        var sourceFiles = ReadSourceFiles(projectPath);
        var filesSummary = string.Join("\n\n", sourceFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 2000 ? f.Value[..2000] + "\n... (truncated)" : f.Value)}\n```"));

        if (filesSummary.Length > 60000)
            filesSummary = filesSummary[..60000] + "\n\n... (additional files truncated)";

        var healingDetails = healingResult.FailedTestDetailsJson != null
            ? JsonSerializer.Deserialize<List<FailedTestDetail>>(healingResult.FailedTestDetailsJson)
            : new List<FailedTestDetail>();

        var failuresSummary = string.Join("\n", healingDetails?.Select(f =>
            $"- Test: {f.TestName}\n  Error: {f.ErrorMessage}\n  File: {f.FilePath}") ?? Array.Empty<string>());

        var prompt = $@"You are an expert software engineer fixing code based on test failures. Iteration {iterationNumber}/3.

## Current Source Code
{filesSummary}

## Test Execution Log
{testErrorLog}

## Failed Tests Analysis
{failuresSummary}

## Task
1. Analyze the test failures and identify the root cause in the source code
2. Generate fixed versions of the affected source files
3. Ensure fixes address the test failures without breaking other functionality
4. Provide confidence score (0-100) for each fix

Respond with ONLY a JSON object:
{{
  ""summary"": ""brief description of fixes"",
  ""overallConfidence"": 0-100,
  ""codeChanges"": [
    {{
      ""filePath"": ""relative file path"",
      ""originalCode"": ""original code snippet to replace"",
      ""fixedCode"": ""fixed code"",
      ""confidence"": 0-100,
      ""reason"": ""explanation of the fix""
    }}
  ]
}}

Be precise and only fix what's needed. JSON only.";

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

            var regeneration = StructuredOutputHelper.DeserializeResponse<CodeRegenerationAnalysis>(content);

            if (regeneration != null)
            {
                _logger.LogInformation(
                    "Claude generated {Count} code changes with {Confidence}% confidence",
                    regeneration.CodeChanges.Count, regeneration.OverallConfidence);

                return new CodeRegenerationResult
                {
                    AttemptId = Guid.NewGuid().ToString(),
                    Summary = regeneration.Summary,
                    Confidence = regeneration.OverallConfidence,
                    CodeChanges = regeneration.CodeChanges
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude API call failed for code regeneration");
        }

        return new CodeRegenerationResult
        {
            AttemptId = Guid.NewGuid().ToString(),
            Summary = "Code regeneration failed",
            Confidence = 0,
            CodeChanges = new List<CodeChange>()
        };
    }

    private async Task ApplyCodeChangesAsync(string projectPath, List<CodeChange> codeChanges)
    {
        _logger.LogInformation("Applying {Count} code changes to project", codeChanges.Count);

        foreach (var change in codeChanges)
        {
            try
            {
                var filePath = Path.Combine(projectPath, change.FilePath);
                if (!File.Exists(filePath))
                {
                    _logger.LogWarning("File not found, skipping: {FilePath}", change.FilePath);
                    continue;
                }

                var content = await File.ReadAllTextAsync(filePath);

                // Apply the code change
                if (content.Contains(change.OriginalCode))
                {
                    var updatedContent = content.Replace(change.OriginalCode, change.FixedCode);
                    await File.WriteAllTextAsync(filePath, updatedContent);

                    _logger.LogInformation(
                        "Applied code change to {FilePath}: {Reason}",
                        change.FilePath, change.Reason);
                }
                else
                {
                    _logger.LogWarning(
                        "Original code not found in {FilePath}, skipping change",
                        change.FilePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to apply code change to {FilePath}", change.FilePath);
            }
        }
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

            // Skip test files
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

public class CodeRegenerationResult
{
    public string AttemptId { get; set; } = "";
    public string Summary { get; set; } = "";
    public int Confidence { get; set; }
    public List<CodeChange> CodeChanges { get; set; } = new();
}

public class CodeRegenerationAnalysis
{
    public string Summary { get; set; } = "";
    public int OverallConfidence { get; set; }
    public List<CodeChange> CodeChanges { get; set; } = new();
}

public class CodeChange
{
    public string FilePath { get; set; } = "";
    public string OriginalCode { get; set; } = "";
    public string FixedCode { get; set; } = "";
    public int Confidence { get; set; }
    public string Reason { get; set; } = "";
}

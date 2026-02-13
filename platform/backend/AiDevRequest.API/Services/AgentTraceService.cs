using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IAgentTraceService
{
    Task<AgentTrace> RecordAttribution(Guid devRequestId);
    Task<AgentTrace?> GetLatestTrace(Guid devRequestId);
    Task<List<AgentTrace>> GetHistory(Guid devRequestId);
    Task<AgentTrace?> ExportTrace(Guid traceId);
}

public class AgentTraceService : IAgentTraceService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<AgentTraceService> _logger;
    private readonly string _projectsBasePath;

    public AgentTraceService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<AgentTraceService> logger)
    {
        _context = context;
        _logger = logger;
        _projectsBasePath = configuration["Projects:BasePath"] ?? "./projects";

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<AgentTrace> RecordAttribution(Guid devRequestId)
    {
        var latestVersion = await _context.AgentTraces
            .Where(t => t.DevRequestId == devRequestId)
            .MaxAsync(t => (int?)t.Version) ?? 0;

        var trace = new AgentTrace
        {
            DevRequestId = devRequestId,
            Status = "recording",
            Version = latestVersion + 1,
        };

        _context.AgentTraces.Add(trace);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Started agent trace recording v{Version} for dev request {DevRequestId}",
            trace.Version, devRequestId);

        try
        {
            var projectPath = await ResolveProjectPathAsync(devRequestId);

            if (projectPath != null)
            {
                var sourceFiles = ReadSourceFiles(projectPath);

                if (sourceFiles.Count > 0)
                {
                    var analysis = await AnalyzeWithClaudeAsync(sourceFiles, devRequestId);

                    trace.TotalFiles = analysis.TotalFiles;
                    trace.AiGeneratedFiles = analysis.AiGeneratedFiles;
                    trace.HumanEditedFiles = analysis.HumanEditedFiles;
                    trace.MixedFiles = analysis.MixedFiles;
                    trace.AiContributionPercentage = analysis.AiContributionPercentage;
                    trace.TraceDataJson = JsonSerializer.Serialize(analysis.FileTraces);
                    trace.ExportFormat = "agent-trace-v1";
                }
                else
                {
                    _logger.LogWarning("No source files found for dev request {DevRequestId}", devRequestId);
                    trace.TraceDataJson = JsonSerializer.Serialize(Array.Empty<object>());
                }
            }
            else
            {
                _logger.LogWarning("No project path found for dev request {DevRequestId}", devRequestId);
                trace.TraceDataJson = JsonSerializer.Serialize(Array.Empty<object>());
            }

            trace.Status = "completed";
            trace.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Agent trace completed for dev request {DevRequestId}: {Total} files, {AiGenerated} AI-generated, {HumanEdited} human-edited, {Mixed} mixed, {AiPercent}% AI contribution",
                devRequestId, trace.TotalFiles, trace.AiGeneratedFiles, trace.HumanEditedFiles, trace.MixedFiles, trace.AiContributionPercentage);

            return trace;
        }
        catch (Exception ex)
        {
            trace.Status = "failed";
            trace.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Agent trace recording failed for dev request {DevRequestId}", devRequestId);
            throw;
        }
    }

    public async Task<AgentTrace?> GetLatestTrace(Guid devRequestId)
    {
        return await _context.AgentTraces
            .Where(t => t.DevRequestId == devRequestId)
            .OrderByDescending(t => t.Version)
            .FirstOrDefaultAsync();
    }

    public async Task<List<AgentTrace>> GetHistory(Guid devRequestId)
    {
        return await _context.AgentTraces
            .Where(t => t.DevRequestId == devRequestId)
            .OrderByDescending(t => t.Version)
            .ToListAsync();
    }

    public async Task<AgentTrace?> ExportTrace(Guid traceId)
    {
        var trace = await _context.AgentTraces.FindAsync(traceId);
        if (trace == null) return null;

        trace.ExportFormat = "agent-trace-v1";
        trace.ExportedAt = DateTime.UtcNow.ToString("o");
        trace.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Exported agent trace {TraceId} in format {Format}",
            traceId, trace.ExportFormat);

        return trace;
    }

    private async Task<string?> ResolveProjectPathAsync(Guid devRequestId)
    {
        var devRequest = await _context.DevRequests
            .Where(r => r.Id == devRequestId)
            .FirstOrDefaultAsync();

        if (devRequest?.ProjectPath != null && Directory.Exists(devRequest.ProjectPath))
            return devRequest.ProjectPath;

        // Fallback: find any dev request with a project path
        var fallback = await _context.DevRequests
            .Where(r => r.ProjectPath != null)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (fallback?.ProjectPath != null && Directory.Exists(fallback.ProjectPath))
            return fallback.ProjectPath;

        if (Directory.Exists(_projectsBasePath))
        {
            var dirs = Directory.GetDirectories(_projectsBasePath)
                .OrderBy(d => d)
                .ToArray();

            if (dirs.Length > 0)
                return dirs[0];
        }

        return null;
    }

    private async Task<AgentTraceAnalysis> AnalyzeWithClaudeAsync(
        Dictionary<string, string> sourceFiles,
        Guid devRequestId)
    {
        var fileSummary = string.Join("\n\n", sourceFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

        if (fileSummary.Length > 40000)
            fileSummary = fileSummary[..40000] + "\n\n... (additional files truncated)";

        var prompt = $@"You are an expert code analyst specializing in identifying AI-generated vs human-written code. Analyze the following source files and classify each code range by its likely origin (AI-generated or human-written).

## Source Files
{fileSummary}

## Analysis Requirements
1. For each file, identify code ranges (by line numbers) and classify them as:
   - ""ai"" — code that shows patterns typical of AI generation (boilerplate, consistent formatting, template-like structure, common AI patterns)
   - ""human"" — code that shows patterns of human authorship (inconsistent style, creative solutions, domain-specific logic, comments with personality)
   - ""mixed"" — code that appears to be AI-generated but human-edited
2. Calculate overall AI contribution percentage
3. Count files by category: fully AI-generated, fully human-edited, mixed

Respond with ONLY a JSON object:
{{
  ""totalFiles"": <number>,
  ""aiGeneratedFiles"": <number of files that are mostly AI-generated>,
  ""humanEditedFiles"": <number of files that are mostly human-written>,
  ""mixedFiles"": <number of files with mixed attribution>,
  ""aiContributionPercentage"": <0-100 decimal>,
  ""fileTraces"": [
    {{
      ""filePath"": ""relative/path/to/file"",
      ""ranges"": [
        {{
          ""startLine"": 1,
          ""endLine"": 25,
          ""source"": ""ai"",
          ""confidence"": 0.85,
          ""reason"": ""Template-like boilerplate structure""
        }}
      ]
    }}
  ]
}}

Be realistic and base your analysis on actual code patterns. JSON only.";

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

            var analysis = StructuredOutputHelper.DeserializeResponse<AgentTraceAnalysis>(content);

            if (analysis != null)
            {
                _logger.LogInformation("Claude returned trace analysis for dev request {DevRequestId}: {TotalFiles} files analyzed",
                    devRequestId, analysis.TotalFiles);
                return analysis;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude API call failed for agent trace analysis, dev request {DevRequestId}", devRequestId);
        }

        return new AgentTraceAnalysis();
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

public class AgentTraceAnalysis
{
    public int TotalFiles { get; set; }
    public int AiGeneratedFiles { get; set; }
    public int HumanEditedFiles { get; set; }
    public int MixedFiles { get; set; }
    public decimal AiContributionPercentage { get; set; }
    public List<FileTrace> FileTraces { get; set; } = new();
}

public class FileTrace
{
    public string FilePath { get; set; } = "";
    public List<CodeRange> Ranges { get; set; } = new();
}

public class CodeRange
{
    public int StartLine { get; set; }
    public int EndLine { get; set; }
    public string Source { get; set; } = ""; // "ai", "human", "mixed"
    public decimal Confidence { get; set; }
    public string Reason { get; set; } = "";
}

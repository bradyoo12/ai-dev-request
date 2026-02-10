using System.Diagnostics;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ICompilerValidationService
{
    Task<CompilationOutput> CompileAsync(Guid requestId, string language);
    Task<CompilationResult?> GetCompilationResultAsync(Guid requestId);
    Task<CompilationOutput> ValidateAndFixAsync(Guid requestId);
    List<SupportedLanguage> GetSupportedLanguages();
}

public class CompilerValidationService : ICompilerValidationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<CompilerValidationService> _logger;
    private const int MaxRetries = 3;

    public CompilerValidationService(
        IConfiguration configuration,
        AiDevRequestDbContext context,
        ILogger<CompilerValidationService> logger)
    {
        _context = context;
        _logger = logger;

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public List<SupportedLanguage> GetSupportedLanguages()
    {
        return new List<SupportedLanguage>
        {
            new() { Id = "typescript", Name = "TypeScript", Command = "npx tsc --noEmit", Extensions = new[] { ".ts", ".tsx" } },
            new() { Id = "dotnet", Name = ".NET", Command = "dotnet build", Extensions = new[] { ".cs", ".csproj" } },
            new() { Id = "python", Name = "Python", Command = "python -m py_compile", Extensions = new[] { ".py" } },
        };
    }

    public async Task<CompilationOutput> CompileAsync(Guid requestId, string language)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null)
            throw new InvalidOperationException("DevRequest not found.");

        if (string.IsNullOrEmpty(entity.ProjectPath))
            throw new InvalidOperationException("Project has not been built yet.");

        _logger.LogInformation("Compiling project {RequestId} with language {Language}", requestId, language);

        var output = await RunCompiler(entity.ProjectPath, language);

        var result = new CompilationResult
        {
            DevRequestId = requestId,
            Language = language,
            Success = output.Success,
            ErrorsJson = JsonSerializer.Serialize(output.Errors),
            WarningsJson = JsonSerializer.Serialize(output.Warnings),
            RetryCount = 0,
            CompiledAt = DateTime.UtcNow
        };

        _context.CompilationResults.Add(result);
        await _context.SaveChangesAsync();

        output.ResultId = result.Id;
        return output;
    }

    public async Task<CompilationResult?> GetCompilationResultAsync(Guid requestId)
    {
        return await _context.CompilationResults
            .Where(r => r.DevRequestId == requestId)
            .OrderByDescending(r => r.CompiledAt)
            .FirstOrDefaultAsync();
    }

    public async Task<CompilationOutput> ValidateAndFixAsync(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null)
            throw new InvalidOperationException("DevRequest not found.");

        if (string.IsNullOrEmpty(entity.ProjectPath))
            throw new InvalidOperationException("Project has not been built yet.");

        var language = DetectLanguage(entity.ProjectPath);
        CompilationOutput output = await RunCompiler(entity.ProjectPath, language);

        for (var retry = 0; retry < MaxRetries && !output.Success && output.Errors.Count > 0; retry++)
        {
            _logger.LogInformation("Auto-fix attempt {Retry}/{Max} for {RequestId}", retry + 1, MaxRetries, requestId);

            var fixes = await AskAiToFix(entity.ProjectPath, output.Errors, language);
            ApplyFixes(entity.ProjectPath, fixes);
            output = await RunCompiler(entity.ProjectPath, language);
            output.RetryCount = retry + 1;
        }

        var result = new CompilationResult
        {
            DevRequestId = requestId,
            Language = language,
            Success = output.Success,
            ErrorsJson = JsonSerializer.Serialize(output.Errors),
            WarningsJson = JsonSerializer.Serialize(output.Warnings),
            RetryCount = output.RetryCount,
            CompiledAt = DateTime.UtcNow
        };

        _context.CompilationResults.Add(result);
        await _context.SaveChangesAsync();

        output.ResultId = result.Id;
        return output;
    }

    private string DetectLanguage(string projectPath)
    {
        if (Directory.GetFiles(projectPath, "*.csproj", SearchOption.AllDirectories).Length > 0)
            return "dotnet";
        if (Directory.GetFiles(projectPath, "tsconfig.json", SearchOption.AllDirectories).Length > 0)
            return "typescript";
        if (Directory.GetFiles(projectPath, "*.py", SearchOption.AllDirectories).Length > 0)
            return "python";
        return "typescript"; // default
    }

    private async Task<CompilationOutput> RunCompiler(string projectPath, string language)
    {
        var output = new CompilationOutput();

        try
        {
            string command;
            string arguments;

            switch (language.ToLower())
            {
                case "typescript":
                    command = "npx";
                    arguments = "tsc --noEmit";
                    break;
                case "dotnet":
                case ".net":
                    command = "dotnet";
                    arguments = "build --no-restore";
                    break;
                case "python":
                    command = "python";
                    arguments = "-m compileall -q .";
                    break;
                default:
                    output.Errors.Add(new CompilerError { Message = $"Unsupported language: {language}" });
                    return output;
            }

            var psi = new ProcessStartInfo
            {
                FileName = command,
                Arguments = arguments,
                WorkingDirectory = projectPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null)
            {
                output.Errors.Add(new CompilerError { Message = "Failed to start compiler process." });
                return output;
            }

            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            output.Success = process.ExitCode == 0;
            output.RawOutput = stdout + "\n" + stderr;

            ParseCompilerOutput(stdout + "\n" + stderr, language, output);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Compiler execution failed for {ProjectPath}", projectPath);
            output.Errors.Add(new CompilerError { Message = $"Compiler execution failed: {ex.Message}" });
        }

        return output;
    }

    private static void ParseCompilerOutput(string raw, string language, CompilationOutput output)
    {
        var lines = raw.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;

            var isWarning = trimmed.Contains("warning", StringComparison.OrdinalIgnoreCase);
            var isError = trimmed.Contains("error", StringComparison.OrdinalIgnoreCase);

            if (!isWarning && !isError) continue;

            var entry = new CompilerError { Message = trimmed };

            // Try to extract file and line info (common format: file(line,col): error TS1234: message)
            var parenIdx = trimmed.IndexOf('(');
            if (parenIdx > 0)
            {
                entry.File = trimmed[..parenIdx];
                var closeParen = trimmed.IndexOf(')', parenIdx);
                if (closeParen > parenIdx)
                {
                    var coords = trimmed[(parenIdx + 1)..closeParen].Split(',');
                    if (coords.Length > 0 && int.TryParse(coords[0], out var lineNum))
                        entry.Line = lineNum;
                }
            }

            if (isWarning)
                output.Warnings.Add(entry);
            else if (isError)
                output.Errors.Add(entry);
        }
    }

    private async Task<List<FileFix>> AskAiToFix(string projectPath, List<CompilerError> errors, string language)
    {
        var errorText = string.Join("\n", errors.Select(e =>
            $"- {e.File ?? "unknown"}:{e.Line?.ToString() ?? "?"} — {e.Message}"));

        var affectedFiles = errors
            .Where(e => !string.IsNullOrEmpty(e.File))
            .Select(e => e.File!)
            .Distinct()
            .Take(5)
            .ToList();

        var fileContents = new List<string>();
        foreach (var relativePath in affectedFiles)
        {
            var fullPath = Path.Combine(projectPath, relativePath);
            if (File.Exists(fullPath))
            {
                var content = await File.ReadAllTextAsync(fullPath);
                if (content.Length <= 5000)
                    fileContents.Add($"### {relativePath}\n```\n{content}\n```");
            }
        }

        var filesSection = fileContents.Count > 0
            ? string.Join("\n\n", fileContents)
            : "(affected files could not be read)";

        var prompt = $@"Fix the following {language} compilation errors. Return ONLY the fixed file contents.

## Errors
{errorText}

## Affected Files
{filesSection}

Respond in JSON:
{{
  ""fixes"": [
    {{ ""file"": ""relative/path"", ""content"": ""complete fixed file content"" }}
  ]
}}

Only include files that need changes. Provide complete file content, not patches. JSON only.";

        try
        {
            var messages = new List<Message> { new(RoleType.User, prompt) };
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
                content = content[jsonStart..(jsonEnd + 1)];

            var result = JsonSerializer.Deserialize<AiFixResult>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result?.Fixes ?? new List<FileFix>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI auto-fix failed");
            return new List<FileFix>();
        }
    }

    private static void ApplyFixes(string projectPath, List<FileFix> fixes)
    {
        foreach (var fix in fixes)
        {
            var filePath = Path.Combine(projectPath, fix.File);
            var directory = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(directory))
                Directory.CreateDirectory(directory);
            File.WriteAllText(filePath, fix.Content);
        }
    }
}

public class CompilationOutput
{
    public Guid ResultId { get; set; }
    public bool Success { get; set; }
    public List<CompilerError> Errors { get; set; } = new();
    public List<CompilerError> Warnings { get; set; } = new();
    public string RawOutput { get; set; } = "";
    public int RetryCount { get; set; }
}

public class CompilerError
{
    public string? File { get; set; }
    public int? Line { get; set; }
    public string Message { get; set; } = "";
}

public class SupportedLanguage
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Command { get; set; } = "";
    public string[] Extensions { get; set; } = Array.Empty<string>();
}

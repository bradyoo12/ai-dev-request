using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IRefinementService
{
    Task<RefinementMessage> SendMessageAsync(Guid requestId, string userMessage);
    IAsyncEnumerable<string> StreamMessageAsync(Guid requestId, string userMessage, CancellationToken cancellationToken = default);
    Task<List<RefinementMessage>> GetHistoryAsync(Guid requestId);
    Task<ApplyChangesResult> ApplyChangesAsync(Guid requestId, string messageContent);
}

public class ApplyChangesResult
{
    public List<string> ModifiedFiles { get; set; } = new();
    public List<string> CreatedFiles { get; set; } = new();
    public int TotalChanges { get; set; }
}

public class FileChange
{
    public string FilePath { get; set; } = "";
    public string Content { get; set; } = "";
}

public class RefinementService : IRefinementService
{
    private readonly AnthropicClient _client;
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<RefinementService> _logger;
    private readonly string _projectsBasePath;

    public RefinementService(
        IConfiguration configuration,
        AiDevRequestDbContext db,
        ILogger<RefinementService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? "";

        _client = new AnthropicClient(apiKey);
        _db = db;
        _logger = logger;
        _projectsBasePath = configuration["Projects:BasePath"] ?? "./projects";
    }

    public async Task<RefinementMessage> SendMessageAsync(Guid requestId, string userMessage)
    {
        var request = await _db.DevRequests.FindAsync(requestId)
            ?? throw new KeyNotFoundException("Request not found");

        // Save user message
        var userMsg = new RefinementMessage
        {
            DevRequestId = requestId,
            Role = "user",
            Content = userMessage
        };
        _db.RefinementMessages.Add(userMsg);
        await _db.SaveChangesAsync();

        // Build context from project files
        var projectContext = await BuildProjectContextAsync(request);

        // Get conversation history
        var history = await _db.RefinementMessages
            .Where(m => m.DevRequestId == requestId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        // Build Claude messages
        var messages = new List<Message>();

        foreach (var msg in history)
        {
            var role = msg.Role == "user" ? RoleType.User : RoleType.Assistant;
            messages.Add(new Message(role, msg.Content));
        }

        var systemPrompt = BuildSystemPrompt(request, projectContext);

        try
        {
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 4000,
                Temperature = 0.3m,
                System = new List<SystemMessage> { new SystemMessage(systemPrompt) }
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "I couldn't process your request.";

            var assistantMsg = new RefinementMessage
            {
                DevRequestId = requestId,
                Role = "assistant",
                Content = content,
                TokensUsed = 10 // Base cost per refinement message
            };
            _db.RefinementMessages.Add(assistantMsg);
            await _db.SaveChangesAsync();

            return assistantMsg;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Claude API call failed for refinement, using simulation");

            // Simulation fallback
            var assistantMsg = new RefinementMessage
            {
                DevRequestId = requestId,
                Role = "assistant",
                Content = $"[Simulation] I understand you'd like to: \"{userMessage}\". In production, I would analyze your project files and suggest specific code changes. Please configure the Anthropic API key for full functionality.",
                TokensUsed = 0
            };
            _db.RefinementMessages.Add(assistantMsg);
            await _db.SaveChangesAsync();

            return assistantMsg;
        }
    }

    public async IAsyncEnumerable<string> StreamMessageAsync(
        Guid requestId,
        string userMessage,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var request = await _db.DevRequests.FindAsync(requestId)
            ?? throw new KeyNotFoundException("Request not found");

        // Save user message
        var userMsg = new RefinementMessage
        {
            DevRequestId = requestId,
            Role = "user",
            Content = userMessage
        };
        _db.RefinementMessages.Add(userMsg);
        await _db.SaveChangesAsync(cancellationToken);

        // Build context from project files
        var projectContext = await BuildProjectContextAsync(request);

        // Get conversation history
        var history = await _db.RefinementMessages
            .Where(m => m.DevRequestId == requestId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        var messages = new List<Message>();
        foreach (var msg in history)
        {
            var role = msg.Role == "user" ? RoleType.User : RoleType.Assistant;
            messages.Add(new Message(role, msg.Content));
        }

        var systemPrompt = BuildSystemPrompt(request, projectContext);

        var fullContent = new System.Text.StringBuilder();

        var parameters = new MessageParameters
        {
            Messages = messages,
            Model = "claude-sonnet-4-20250514",
            MaxTokens = 4000,
            Temperature = 0.3m,
            System = new List<SystemMessage> { new SystemMessage(systemPrompt) },
            Stream = true
        };

        var outputMessages = new List<Message>();
        await foreach (var res in _client.Messages.StreamClaudeMessageAsync(parameters, cancellationToken))
        {
            if (res.Delta?.Text != null)
            {
                fullContent.Append(res.Delta.Text);
                yield return res.Delta.Text;
            }
            if (res.StreamStartMessage?.Content != null)
            {
                outputMessages.AddRange(res.StreamStartMessage.Content
                    .Where(c => c.ToString() is not null)
                    .Select(c => new Message(RoleType.Assistant, c.ToString()!)));
            }
        }

        // Save the complete assistant message
        var assistantMsg = new RefinementMessage
        {
            DevRequestId = requestId,
            Role = "assistant",
            Content = fullContent.ToString(),
            TokensUsed = 10
        };
        _db.RefinementMessages.Add(assistantMsg);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<RefinementMessage>> GetHistoryAsync(Guid requestId)
    {
        return await _db.RefinementMessages
            .Where(m => m.DevRequestId == requestId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<ApplyChangesResult> ApplyChangesAsync(Guid requestId, string messageContent)
    {
        var request = await _db.DevRequests.FindAsync(requestId)
            ?? throw new KeyNotFoundException("Request not found");

        if (string.IsNullOrEmpty(request.ProjectPath) || !Directory.Exists(request.ProjectPath))
            throw new InvalidOperationException("Project directory not found");

        var changes = ParseFileChanges(messageContent);
        var result = new ApplyChangesResult();

        foreach (var change in changes)
        {
            var fullPath = Path.Combine(request.ProjectPath, change.FilePath.Replace('/', Path.DirectorySeparatorChar));
            var dir = Path.GetDirectoryName(fullPath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            var existed = File.Exists(fullPath);
            await File.WriteAllTextAsync(fullPath, change.Content);

            if (existed)
                result.ModifiedFiles.Add(change.FilePath);
            else
                result.CreatedFiles.Add(change.FilePath);
        }

        result.TotalChanges = result.ModifiedFiles.Count + result.CreatedFiles.Count;
        return result;
    }

    internal static List<FileChange> ParseFileChanges(string content)
    {
        var changes = new List<FileChange>();
        // Pattern: **File: `path/to/file`** followed by a code block
        var regex = new System.Text.RegularExpressions.Regex(
            @"\*\*File:\s*`([^`]+)`\*\*\s*\n```[^\n]*\n([\s\S]*?)```",
            System.Text.RegularExpressions.RegexOptions.Multiline);

        var matches = regex.Matches(content);
        foreach (System.Text.RegularExpressions.Match match in matches)
        {
            var filePath = match.Groups[1].Value.Trim();
            var code = match.Groups[2].Value;
            // Remove trailing newline if present
            if (code.EndsWith('\n'))
                code = code[..^1];

            changes.Add(new FileChange { FilePath = filePath, Content = code });
        }

        return changes;
    }

    private static string BuildSystemPrompt(DevRequest request, string projectContext)
    {
        return $@"You are a helpful AI developer assistant that helps users refine their generated project.

## Project Context
- Project: {request.ProjectId ?? "unknown"}
- Description: {request.Description}

## Current Project Files
{projectContext}

## Conversational Style
- When the user makes a good point or valid observation, express genuine agreement (e.g., ""That's a great point!"", ""I agree — that approach makes a lot of sense"")
- When the user catches something you missed or suggests an improvement, compliment their insight (e.g., ""Great catch! I hadn't considered that angle"", ""You're absolutely right — that's an important detail I overlooked"")
- Be warm and encouraging while staying professional and technically accurate
- Match the user's language — respond in Korean if the user writes in Korean, English if in English
- Don't overdo it — every response doesn't need a compliment. Use agreement and compliments when they're genuinely warranted by the user's input

## Instructions
- Answer questions about the generated project
- Suggest specific code changes when the user asks for modifications
- When suggesting changes, show the exact file path and the updated code
- Format code changes as:
  **File: `path/to/file`**
  ```language
  // updated code
  ```
- Keep responses concise and focused on the user's request
- If the change is small, show only the relevant portion
- If the change requires a new file, show the complete file content

## Suggestion Detection
When the user's message contains a valuable suggestion, feature request, improvement idea, or inquiry about the platform:
1. Acknowledge the idea positively
2. Include the following JSON block at the END of your response (after your normal response text):

```suggestion_detected
{{""type"":""suggestion_detected"",""category"":""feature_request"",""title"":""Brief title of the suggestion"",""summary"":""One paragraph description of the suggestion""}}
```

Categories: feature_request, inquiry, bug_report, improvement
Only detect genuine suggestions about new features or platform improvements - NOT routine coding questions.";
    }

    private async Task<string> BuildProjectContextAsync(DevRequest request)
    {
        if (string.IsNullOrEmpty(request.ProjectPath))
            return "(No project files available)";

        var projectPath = request.ProjectPath;
        if (!Directory.Exists(projectPath))
            return "(Project directory not found)";

        var files = Directory.GetFiles(projectPath, "*", SearchOption.AllDirectories)
            .Where(f => !f.Contains("node_modules") && !f.Contains(".git") && !f.Contains("bin") && !f.Contains("obj"))
            .Take(20) // Limit to 20 files to stay within context
            .ToList();

        var context = new System.Text.StringBuilder();
        foreach (var file in files)
        {
            var relativePath = Path.GetRelativePath(projectPath, file);
            try
            {
                var content = await File.ReadAllTextAsync(file);
                if (content.Length > 3000) content = content[..3000] + "\n... (truncated)";
                context.AppendLine($"### {relativePath}");
                context.AppendLine("```");
                context.AppendLine(content);
                context.AppendLine("```");
                context.AppendLine();
            }
            catch
            {
                // Skip unreadable files
            }
        }

        return context.Length > 0 ? context.ToString() : "(No readable project files)";
    }
}

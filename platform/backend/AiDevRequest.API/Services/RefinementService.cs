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
    Task<DiffPreviewResult> GetDiffPreviewAsync(Guid requestId, string userMessage);
    Task<bool> UndoLastIterationAsync(Guid requestId);
    Task<AcceptChangesResult> AcceptChangesAsync(Guid requestId, int messageId);
    Task<RevertChangesResult> RevertChangesAsync(Guid requestId, int messageId);
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

public class FileChangeSummary
{
    public string File { get; set; } = "";
    public string Operation { get; set; } = "modify"; // modify, create, delete
    public string Diff { get; set; } = ""; // Full file content (NOT Git patch)
    public string? Explanation { get; set; } // AI's explanation of the change
}

public class DiffPreviewResult
{
    public string AssistantMessage { get; set; } = "";
    public List<FileChangeSummary> Changes { get; set; } = new();
    public string DiffText { get; set; } = "";
}

public class AcceptChangesResult
{
    public int AppliedChanges { get; set; }
    public List<string> ModifiedFiles { get; set; } = new();
    public List<string> CreatedFiles { get; set; } = new();
}

public class RevertChangesResult
{
    public bool Success { get; set; }
    public List<string> RestoredFiles { get; set; } = new();
}

public class RefinementService : IRefinementService
{
    private readonly AnthropicClient _client;
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<RefinementService> _logger;
    private readonly IProjectVersionService _versionService;
    private readonly string _projectsBasePath;

    public RefinementService(
        IConfiguration configuration,
        AiDevRequestDbContext db,
        IProjectVersionService versionService,
        ILogger<RefinementService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? "";

        _client = new AnthropicClient(apiKey);
        _db = db;
        _versionService = versionService;
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

            // Parse file changes and create summary with full content
            var fileChanges = ParseFileChanges(content);
            var fileChangeSummary = fileChanges.Select(fc => new FileChangeSummary
            {
                File = fc.FilePath,
                Operation = "modify", // Will be determined during apply
                Diff = fc.Content, // Full file content
                Explanation = null // Could extract from Claude's response if needed
            }).ToList();

            var assistantMsg = new RefinementMessage
            {
                DevRequestId = requestId,
                Role = "assistant",
                Content = content,
                FileChangesJson = fileChangeSummary.Count > 0
                    ? JsonSerializer.Serialize(fileChangeSummary)
                    : null,
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
        var contentStr = fullContent.ToString();

        // Parse file changes and create summary with full content
        var fileChanges = ParseFileChanges(contentStr);
        var fileChangeSummary = fileChanges.Select(fc => new FileChangeSummary
        {
            File = fc.FilePath,
            Operation = "modify",
            Diff = fc.Content, // Full file content
            Explanation = null
        }).ToList();

        var assistantMsg = new RefinementMessage
        {
            DevRequestId = requestId,
            Role = "assistant",
            Content = contentStr,
            FileChangesJson = fileChangeSummary.Count > 0
                ? JsonSerializer.Serialize(fileChangeSummary)
                : null,
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
- When the user makes a good point or valid observation, express genuine agreement (e.g., ""That's a great point!"", ""I agree — that approach makes sense"")
- When the user catches something you missed or suggests an improvement, compliment their insight (e.g., ""Great catch!"", ""You're right, I should have considered that"")
- Be warm and encouraging while staying professional and technically accurate
- Match the user's language — respond in Korean if the user writes in Korean, English if in English
- Don't overdo it — every response doesn't need a compliment. Use agreement and compliments when they're genuinely warranted

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

## Follow-Up Actions
At the END of every response, include 2-3 contextual follow-up suggestions the user might want to do next.
Format as a JSON block:

```follow_up_actions
[{{""label"":""Short button text"",""message"":""Full message to send""}}]
```

Examples:
- After explaining code: [{{""label"":""Show me the tests"",""message"":""Show me the test files for this component""}},{{""label"":""Modify this"",""message"":""I'd like to change this implementation""}}]
- After applying changes: [{{""label"":""Run tests"",""message"":""Can you check if the tests still pass?""}},{{""label"":""Another change"",""message"":""I have another change to make""}}]
- After answering a question: [{{""label"":""Tell me more"",""message"":""Can you explain this in more detail?""}},{{""label"":""Show the code"",""message"":""Show me the relevant code for this""}}]

Always include the follow_up_actions block. Make suggestions context-aware based on what you just discussed.

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

    public async Task<DiffPreviewResult> GetDiffPreviewAsync(Guid requestId, string userMessage)
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

            // Parse file changes WITHOUT applying them
            var fileChanges = ParseFileChanges(content);
            var changeSummary = fileChanges.Select(fc => new FileChangeSummary
            {
                File = fc.FilePath,
                Operation = "modify", // Determined by checking if file exists
                Diff = fc.Content, // Full file content
                Explanation = null
            }).ToList();

            // Build diff text (optional summary, not required by frontend)
            var diffText = new System.Text.StringBuilder();
            foreach (var change in fileChanges)
            {
                diffText.AppendLine($"File: {change.FilePath}");
                diffText.AppendLine($"Lines: {change.Content.Split('\n').Length}");
                diffText.AppendLine("---");
            }

            // Save assistant message with file changes JSON (but don't apply)
            var assistantMsg = new RefinementMessage
            {
                DevRequestId = requestId,
                Role = "assistant",
                Content = content,
                FileChangesJson = changeSummary.Count > 0
                    ? JsonSerializer.Serialize(changeSummary)
                    : null,
                TokensUsed = 10
            };
            _db.RefinementMessages.Add(assistantMsg);
            await _db.SaveChangesAsync();

            return new DiffPreviewResult
            {
                AssistantMessage = content,
                Changes = changeSummary,
                DiffText = diffText.ToString()
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Claude API call failed for diff preview");

            return new DiffPreviewResult
            {
                AssistantMessage = $"[Simulation] Preview of changes for: \"{userMessage}\". Please configure the Anthropic API key for full functionality.",
                Changes = new List<FileChangeSummary>(),
                DiffText = ""
            };
        }
    }

    public async Task<bool> UndoLastIterationAsync(Guid requestId)
    {
        var request = await _db.DevRequests.FindAsync(requestId)
            ?? throw new KeyNotFoundException("Request not found");

        if (string.IsNullOrEmpty(request.ProjectPath))
            throw new InvalidOperationException("Project path not found");

        // Get the last version snapshot
        var lastVersion = await _versionService.GetLatestVersionAsync(requestId);
        if (lastVersion == null)
        {
            _logger.LogWarning("No version snapshot found for undo operation on DevRequest {RequestId}", requestId);
            return false;
        }

        // Rollback to previous version
        var rolledBackVersion = await _versionService.RollbackAsync(requestId, lastVersion.Id);
        if (rolledBackVersion == null)
        {
            _logger.LogWarning("Failed to rollback to version {VersionId} for DevRequest {RequestId}", lastVersion.Id, requestId);
            return false;
        }

        _logger.LogInformation("Successfully undid last iteration for DevRequest {RequestId}, rolled back to version {VersionNumber}",
            requestId, rolledBackVersion.VersionNumber);

        return true;
    }

    public async Task<AcceptChangesResult> AcceptChangesAsync(Guid requestId, int messageId)
    {
        var request = await _db.DevRequests.FindAsync(requestId)
            ?? throw new KeyNotFoundException("Request not found");

        var message = await _db.RefinementMessages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.DevRequestId == requestId);

        if (message == null)
            throw new ArgumentException("invalid_message_id");

        if (message.Status == "accepted")
        {
            // Idempotent - already accepted, return existing result
            var existingChanges = string.IsNullOrEmpty(message.FileChangesJson)
                ? new List<FileChangeSummary>()
                : JsonSerializer.Deserialize<List<FileChangeSummary>>(message.FileChangesJson) ?? new List<FileChangeSummary>();

            return new AcceptChangesResult
            {
                AppliedChanges = existingChanges.Count,
                ModifiedFiles = existingChanges.Where(c => c.Operation == "modify").Select(c => c.File).ToList(),
                CreatedFiles = existingChanges.Where(c => c.Operation == "create").Select(c => c.File).ToList()
            };
        }

        // Apply changes if not already applied
        if (string.IsNullOrEmpty(request.ProjectPath) || !Directory.Exists(request.ProjectPath))
            throw new InvalidOperationException("Project directory not found");

        var applyResult = await ApplyChangesAsync(requestId, message.Content);

        // Update status to accepted
        message.Status = "accepted";
        await _db.SaveChangesAsync();

        _logger.LogInformation("Accepted changes for message {MessageId} in DevRequest {RequestId}", messageId, requestId);

        return new AcceptChangesResult
        {
            AppliedChanges = applyResult.TotalChanges,
            ModifiedFiles = applyResult.ModifiedFiles,
            CreatedFiles = applyResult.CreatedFiles
        };
    }

    public async Task<RevertChangesResult> RevertChangesAsync(Guid requestId, int messageId)
    {
        var request = await _db.DevRequests.FindAsync(requestId)
            ?? throw new KeyNotFoundException("Request not found");

        var message = await _db.RefinementMessages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.DevRequestId == requestId);

        if (message == null)
            throw new ArgumentException("invalid_message_id");

        if (message.Status == "reverted")
        {
            // Idempotent - already reverted
            return new RevertChangesResult
            {
                Success = true,
                RestoredFiles = new List<string>()
            };
        }

        // Find the snapshot created before this message was applied
        // We need to rollback to the version that existed before this message
        var messageIndex = await _db.RefinementMessages
            .Where(m => m.DevRequestId == requestId && m.Role == "assistant")
            .OrderBy(m => m.CreatedAt)
            .Select(m => m.Id)
            .ToListAsync();

        var currentIndex = messageIndex.IndexOf(messageId);
        if (currentIndex == -1)
            throw new InvalidOperationException("Message not found in iteration history");

        // Get the version snapshot that existed before this message
        var versions = await _versionService.GetVersionsAsync(requestId);
        var targetVersion = versions.OrderBy(v => v.CreatedAt).Skip(currentIndex).FirstOrDefault();

        if (targetVersion != null)
        {
            await _versionService.RollbackAsync(requestId, targetVersion.Id);
        }

        // Parse file changes to determine what was reverted
        var fileChanges = string.IsNullOrEmpty(message.FileChangesJson)
            ? new List<FileChangeSummary>()
            : JsonSerializer.Deserialize<List<FileChangeSummary>>(message.FileChangesJson) ?? new List<FileChangeSummary>();

        // Update status to reverted
        message.Status = "reverted";
        await _db.SaveChangesAsync();

        _logger.LogInformation("Reverted changes for message {MessageId} in DevRequest {RequestId}", messageId, requestId);

        return new RevertChangesResult
        {
            Success = true,
            RestoredFiles = fileChanges.Select(c => c.File).ToList()
        };
    }
}

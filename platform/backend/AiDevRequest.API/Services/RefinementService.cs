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
    Task<List<RefinementMessage>> GetHistoryAsync(Guid requestId);
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

        var systemPrompt = $@"You are a helpful AI developer assistant that helps users refine their generated project.

## Project Context
- Project: {request.ProjectId ?? "unknown"}
- Description: {request.Description}

## Current Project Files
{projectContext}

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
- If the change requires a new file, show the complete file content";

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

    public async Task<List<RefinementMessage>> GetHistoryAsync(Guid requestId)
    {
        return await _db.RefinementMessages
            .Where(m => m.DevRequestId == requestId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
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

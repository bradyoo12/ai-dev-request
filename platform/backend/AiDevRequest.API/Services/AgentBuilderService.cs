using System.Text.Json;
using AiDevRequest.API.Controllers;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface IAgentBuilderService
{
    Task<GenerateAgentResultDto> GenerateAgentFromDescriptionAsync(string description, string userId, string modelId);
    Task<GenerateAgentResultDto> RefineAgentAsync(string currentAgentJson, string refinementInstructions, string userId, string modelId);
    List<AgentExampleDto> GetExampleAgents();
}

public class AgentBuilderService : IAgentBuilderService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<AgentBuilderService> _logger;

    public AgentBuilderService(IConfiguration configuration, ILogger<AgentBuilderService> logger)
    {
        _logger = logger;
        var apiKey = configuration["Anthropic:ApiKey"] ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY") ?? throw new InvalidOperationException("Anthropic API key not configured");
        _client = new AnthropicClient(apiKey);
    }

    public async Task<GenerateAgentResultDto> GenerateAgentFromDescriptionAsync(string description, string userId, string modelId)
    {
        var prompt = "You are an expert at creating AI agent skill definitions. Generate a complete AgentSkill JSON from: " + description;
        var messages = new List<Message> { new Message { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } };
        var parameters = new MessageParameters { Messages = messages, Model = modelId, MaxTokens = 4096, Temperature = 0.7m };
        var response = await _client.Messages.GetClaudeMessageAsync(parameters);
        var generatedContent = response.Content.OfType<TextContent>().FirstOrDefault()?.Text ?? "";
        var jsonContent = generatedContent.Trim().Replace("```json", "").Replace("```", "").Trim();
        var doc = JsonDocument.Parse(jsonContent);
        var root = doc.RootElement;
        return new GenerateAgentResultDto
        {
            AgentJson = jsonContent,
            Name = root.TryGetProperty("name", out var name) ? name.GetString() ?? "Untitled Agent" : "Untitled Agent",
            Description = root.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "",
            Category = root.TryGetProperty("category", out var cat) ? cat.GetString() ?? "other" : "other",
            SuggestedTags = root.TryGetProperty("tags", out var tags) ? tags.EnumerateArray().Select(t => t.GetString() ?? "").Where(t => !string.IsNullOrEmpty(t)).ToList() : new List<string>()
        };
    }

    public async Task<GenerateAgentResultDto> RefineAgentAsync(string currentAgentJson, string refinementInstructions, string userId, string modelId)
    {
        var prompt = "Refine this agent JSON: " + currentAgentJson + " with instructions: " + refinementInstructions;
        var messages = new List<Message> { new Message { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } };
        var parameters = new MessageParameters { Messages = messages, Model = modelId, MaxTokens = 4096, Temperature = 0.7m };
        var response = await _client.Messages.GetClaudeMessageAsync(parameters);
        var generatedContent = response.Content.OfType<TextContent>().FirstOrDefault()?.Text ?? "";
        var jsonContent = generatedContent.Trim().Replace("```json", "").Replace("```", "").Trim();
        var doc = JsonDocument.Parse(jsonContent);
        var root = doc.RootElement;
        return new GenerateAgentResultDto
        {
            AgentJson = jsonContent,
            Name = root.TryGetProperty("name", out var name) ? name.GetString() ?? "Untitled Agent" : "Untitled Agent",
            Description = root.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "",
            Category = root.TryGetProperty("category", out var cat) ? cat.GetString() ?? "other" : "other",
            SuggestedTags = root.TryGetProperty("tags", out var tags) ? tags.EnumerateArray().Select(t => t.GetString() ?? "").Where(t => !string.IsNullOrEmpty(t)).ToList() : new List<string>()
        };
    }

    public List<AgentExampleDto> GetExampleAgents()
    {
        return new List<AgentExampleDto>
        {
            new AgentExampleDto { Title = "Slack Bot", Description = "Slack notifications", Category = "slack", ExamplePrompt = "Create a Slack standup reminder bot" },
            new AgentExampleDto { Title = "Customer Support", Description = "FAQ agent", Category = "customer-service", ExamplePrompt = "Build a customer support FAQ agent" },
            new AgentExampleDto { Title = "Webhook", Description = "Webhook processor", Category = "webhook", ExamplePrompt = "Create a GitHub webhook to Slack bridge" },
            new AgentExampleDto { Title = "Monitor", Description = "Data monitoring", Category = "monitoring", ExamplePrompt = "Build an API response time monitor" },
            new AgentExampleDto { Title = "Telegram Bot", Description = "News bot", Category = "telegram", ExamplePrompt = "Create a Telegram tech news bot" }
        };
    }
}

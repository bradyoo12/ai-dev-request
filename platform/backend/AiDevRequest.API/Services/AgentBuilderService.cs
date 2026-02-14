using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AiDevRequest.API.Services;

public interface IAgentBuilderService
{
    Task<AgentAnalysisResult> AnalyzeDescriptionAsync(string description, string agentType);
    Task<AgentBlueprint> GenerateAgentAsync(Guid blueprintId);
    Task<AgentSkill> ConvertToSkillAsync(Guid blueprintId);
    Task<List<AgentTemplate>> GetTemplatesAsync();
}

public class AgentBuilderService : IAgentBuilderService
{
    private readonly AiDevRequestDbContext _db;
    private readonly IModelProviderService _modelProvider;
    private readonly ILogger<AgentBuilderService> _logger;

    public AgentBuilderService(
        AiDevRequestDbContext db,
        IModelProviderService modelProvider,
        ILogger<AgentBuilderService> logger)
    {
        _db = db;
        _modelProvider = modelProvider;
        _logger = logger;
    }

    public async Task<AgentAnalysisResult> AnalyzeDescriptionAsync(string description, string agentType)
    {
        try
        {
            var prompt = $@"Analyze this agent description and extract structured information:

Agent Type: {agentType}
Description: {description}

Extract:
1. Key capabilities (what the agent should be able to do)
2. Required integrations (external services, APIs)
3. Suggested configuration parameters
4. Technical requirements

Return as JSON with structure:
{{
  ""capabilities"": [""capability1"", ""capability2""],
  ""integrations"": [""service1"", ""service2""],
  ""configuration"": {{""param1"": ""value1""}},
  ""requirements"": [""req1"", ""req2""]
}}";

            var response = await _modelProvider.GenerateAsync(prompt, "claude-sonnet-4-5-20250929");

            // Parse JSON response
            var analysisData = JsonSerializer.Deserialize<AnalysisData>(response);

            return new AgentAnalysisResult
            {
                Success = true,
                Capabilities = analysisData?.capabilities ?? new List<string>(),
                Integrations = analysisData?.integrations ?? new List<string>(),
                Configuration = analysisData?.configuration ?? new Dictionary<string, string>(),
                Requirements = analysisData?.requirements ?? new List<string>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze agent description");
            return new AgentAnalysisResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AgentBlueprint> GenerateAgentAsync(Guid blueprintId)
    {
        var blueprint = await _db.AgentBlueprints.FindAsync(blueprintId);
        if (blueprint == null)
        {
            throw new InvalidOperationException($"Blueprint {blueprintId} not found");
        }

        try
        {
            blueprint.Status = "Generating";
            blueprint.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            // Generate agent code based on type
            var code = await GenerateCodeForTypeAsync(blueprint);

            // Generate configuration
            var config = await GenerateConfigurationAsync(blueprint);

            blueprint.GeneratedCode = code;
            blueprint.ConfigurationJson = JsonSerializer.Serialize(config);
            blueprint.Status = "Ready";
            blueprint.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return blueprint;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate agent {BlueprintId}", blueprintId);
            blueprint.Status = "Failed";
            blueprint.ErrorMessage = ex.Message;
            blueprint.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            throw;
        }
    }

    private async Task<string> GenerateCodeForTypeAsync(AgentBlueprint blueprint)
    {
        var prompt = blueprint.AgentType switch
        {
            "Slack" => GenerateSlackBotPrompt(blueprint),
            "Telegram" => GenerateTelegramBotPrompt(blueprint),
            "CustomerService" => GenerateCustomerServicePrompt(blueprint),
            "Monitoring" => GenerateMonitoringAgentPrompt(blueprint),
            "DataPipeline" => GenerateDataPipelinePrompt(blueprint),
            _ => GenerateGenericAgentPrompt(blueprint)
        };

        var code = await _modelProvider.GenerateAsync(prompt, "claude-sonnet-4-5-20250929");
        return code;
    }

    private string GenerateSlackBotPrompt(AgentBlueprint blueprint)
    {
        return $@"Generate a complete Slack bot implementation in TypeScript.

Description: {blueprint.Description}
Capabilities: {blueprint.CapabilitiesJson}
Integrations: {blueprint.IntegrationsJson}

Requirements:
1. Use @slack/bolt framework
2. Implement OAuth 2.0 authentication
3. Handle slash commands
4. Handle event subscriptions
5. Include error handling and logging
6. Include deployment instructions

Generate production-ready code with:
- Main bot file (index.ts)
- Event handlers
- Command handlers
- Configuration file
- package.json
- README.md
- .env.example

Return ONLY the code files in a structured format.";
    }

    private string GenerateTelegramBotPrompt(AgentBlueprint blueprint)
    {
        return $@"Generate a complete Telegram bot implementation in TypeScript.

Description: {blueprint.Description}
Capabilities: {blueprint.CapabilitiesJson}
Integrations: {blueprint.IntegrationsJson}

Requirements:
1. Use node-telegram-bot-api or telegraf
2. Implement BotFather token authentication
3. Handle commands
4. Handle inline keyboards
5. Include error handling and logging
6. Include deployment instructions

Generate production-ready code with all necessary files.";
    }

    private string GenerateCustomerServicePrompt(AgentBlueprint blueprint)
    {
        return $@"Generate a complete customer service AI agent implementation.

Description: {blueprint.Description}
Capabilities: {blueprint.CapabilitiesJson}
Integrations: {blueprint.IntegrationsJson}

Requirements:
1. Natural language understanding
2. FAQ knowledge base integration
3. Sentiment analysis
4. Ticket creation and escalation
5. Multi-channel support
6. Analytics and reporting

Generate production-ready code with all necessary files.";
    }

    private string GenerateMonitoringAgentPrompt(AgentBlueprint blueprint)
    {
        return $@"Generate a complete monitoring agent implementation.

Description: {blueprint.Description}
Capabilities: {blueprint.CapabilitiesJson}
Integrations: {blueprint.IntegrationsJson}

Requirements:
1. Health check scheduling
2. Alert threshold configuration
3. Notification channels (email, Slack, etc.)
4. Log aggregation
5. Dashboard integration
6. Incident response automation

Generate production-ready code with all necessary files.";
    }

    private string GenerateDataPipelinePrompt(AgentBlueprint blueprint)
    {
        return $@"Generate a complete data pipeline agent implementation.

Description: {blueprint.Description}
Capabilities: {blueprint.CapabilitiesJson}
Integrations: {blueprint.IntegrationsJson}

Requirements:
1. Source connectors
2. Data transformation logic
3. Destination sinks
4. Error handling and retry logic
5. Data validation
6. Monitoring and logging

Generate production-ready code with all necessary files.";
    }

    private string GenerateGenericAgentPrompt(AgentBlueprint blueprint)
    {
        return $@"Generate a complete AI agent implementation.

Type: {blueprint.AgentType}
Description: {blueprint.Description}
Capabilities: {blueprint.CapabilitiesJson}
Integrations: {blueprint.IntegrationsJson}

Generate production-ready code with all necessary files, error handling, and deployment instructions.";
    }

    private async Task<Dictionary<string, object>> GenerateConfigurationAsync(AgentBlueprint blueprint)
    {
        var prompt = $@"Generate configuration parameters for this agent:

Type: {blueprint.AgentType}
Description: {blueprint.Description}
Capabilities: {blueprint.CapabilitiesJson}

Return JSON with configuration parameters, environment variables, and secrets needed.";

        var response = await _modelProvider.GenerateAsync(prompt, "claude-sonnet-4-5-20250929");
        var config = JsonSerializer.Deserialize<Dictionary<string, object>>(response)
            ?? new Dictionary<string, object>();

        return config;
    }

    public async Task<AgentSkill> ConvertToSkillAsync(Guid blueprintId)
    {
        var blueprint = await _db.AgentBlueprints.FindAsync(blueprintId);
        if (blueprint == null)
        {
            throw new InvalidOperationException($"Blueprint {blueprintId} not found");
        }

        if (blueprint.Status != "Ready")
        {
            throw new InvalidOperationException("Blueprint must be in Ready status to convert to skill");
        }

        var skill = new AgentSkill
        {
            UserId = blueprint.UserId,
            Name = blueprint.Name,
            Description = blueprint.Description,
            Category = blueprint.AgentType,
            InstructionContent = blueprint.GeneratedCode,
            ResourcesJson = blueprint.ConfigurationJson,
            TagsJson = blueprint.CapabilitiesJson,
            IsPublic = false,
            IsBuiltIn = false,
            Version = "1.0.0",
            Author = blueprint.UserId
        };

        _db.AgentSkills.Add(skill);

        blueprint.GeneratedSkillId = skill.Id;
        blueprint.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return skill;
    }

    public Task<List<AgentTemplate>> GetTemplatesAsync()
    {
        var templates = new List<AgentTemplate>
        {
            new AgentTemplate
            {
                Id = "slack-helpdesk",
                Name = "Slack Helpdesk Bot",
                Description = "Customer support bot for Slack workspaces with ticket creation and FAQ",
                AgentType = "Slack",
                Icon = "MessageSquare",
                UseCount = 0,
                SampleCapabilities = new List<string> { "Answer FAQs", "Create tickets", "Escalate issues" }
            },
            new AgentTemplate
            {
                Id = "telegram-news",
                Name = "Telegram News Bot",
                Description = "Automated news aggregation and distribution bot for Telegram",
                AgentType = "Telegram",
                Icon = "Newspaper",
                UseCount = 0,
                SampleCapabilities = new List<string> { "Fetch news", "Filter by topic", "Schedule updates" }
            },
            new AgentTemplate
            {
                Id = "customer-service",
                Name = "AI Customer Service Agent",
                Description = "Intelligent customer service agent with NLU and sentiment analysis",
                AgentType = "CustomerService",
                Icon = "Users",
                UseCount = 0,
                SampleCapabilities = new List<string> { "Understand queries", "Analyze sentiment", "Route tickets" }
            },
            new AgentTemplate
            {
                Id = "monitoring-devops",
                Name = "DevOps Monitoring Agent",
                Description = "System health monitoring with automated alerts and incident response",
                AgentType = "Monitoring",
                Icon = "Activity",
                UseCount = 0,
                SampleCapabilities = new List<string> { "Health checks", "Alert on thresholds", "Auto-remediate" }
            },
            new AgentTemplate
            {
                Id = "data-etl",
                Name = "ETL Pipeline Agent",
                Description = "Data extraction, transformation, and loading pipeline automation",
                AgentType = "DataPipeline",
                Icon = "Database",
                UseCount = 0,
                SampleCapabilities = new List<string> { "Extract data", "Transform schemas", "Load to warehouse" }
            }
        };

        return Task.FromResult(templates);
    }
}

// DTOs
public class AgentAnalysisResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> Capabilities { get; set; } = new();
    public List<string> Integrations { get; set; } = new();
    public Dictionary<string, string> Configuration { get; set; } = new();
    public List<string> Requirements { get; set; } = new();
}

public class AnalysisData
{
    public List<string>? capabilities { get; set; }
    public List<string>? integrations { get; set; }
    public Dictionary<string, string>? configuration { get; set; }
    public List<string>? requirements { get; set; }
}

public class AgentTemplate
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string AgentType { get; set; }
    public required string Icon { get; set; }
    public int UseCount { get; set; }
    public required List<string> SampleCapabilities { get; set; }
}

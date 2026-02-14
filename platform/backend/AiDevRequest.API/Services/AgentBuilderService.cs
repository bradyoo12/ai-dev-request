using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AiDevRequest.API.Services;

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

    public async Task<AgentSkill> GenerateAgentFromSpecAsync(string specification, string userId)
    {
        _logger.LogInformation("Generating agent from specification for user {UserId}", userId);

        var prompt = $@"You are an AI agent builder. Generate a complete agent configuration based on the following specification:

{specification}

Return a JSON object with the following structure:
{{
  ""name"": ""Agent name"",
  ""description"": ""Brief description"",
  ""category"": ""bot"" or ""automation"" or ""service"",
  ""instructionContent"": ""Detailed instructions for the agent"",
  ""scripts"": [
    {{
      ""name"": ""script name"",
      ""language"": ""javascript"" or ""python"" or ""bash"",
      ""code"": ""script code""
    }}
  ],
  ""resources"": [
    {{
      ""name"": ""resource name"",
      ""type"": ""api"" or ""database"" or ""file"",
      ""config"": ""configuration details""
    }}
  ],
  ""tags"": [""tag1"", ""tag2""]
}}

Generate a production-ready agent configuration that can be deployed immediately.";

        var response = await _modelProvider.GenerateAsync(prompt, "claude-sonnet-4-20250514");

        // Parse the JSON response
        var agentConfig = JsonSerializer.Deserialize<AgentConfigResponse>(response);
        if (agentConfig == null)
        {
            throw new InvalidOperationException("Failed to parse agent configuration from AI response");
        }

        var skill = new AgentSkill
        {
            UserId = userId,
            Name = agentConfig.Name,
            Description = agentConfig.Description,
            Category = agentConfig.Category,
            InstructionContent = agentConfig.InstructionContent,
            ScriptsJson = JsonSerializer.Serialize(agentConfig.Scripts),
            ResourcesJson = JsonSerializer.Serialize(agentConfig.Resources),
            TagsJson = JsonSerializer.Serialize(agentConfig.Tags),
            IsPublic = false,
            Version = "1.0.0",
            Author = userId,
        };

        _db.AgentSkills.Add(skill);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created agent skill {SkillId} for user {UserId}", skill.Id, userId);
        return skill;
    }

    public async Task<AgentSkill> PreviewAgentAsync(string specification)
    {
        _logger.LogInformation("Generating agent preview from specification");

        var prompt = $@"You are an AI agent builder. Generate a complete agent configuration based on the following specification:

{specification}

Return a JSON object with the following structure:
{{
  ""name"": ""Agent name"",
  ""description"": ""Brief description"",
  ""category"": ""bot"" or ""automation"" or ""service"",
  ""instructionContent"": ""Detailed instructions for the agent"",
  ""scripts"": [
    {{
      ""name"": ""script name"",
      ""language"": ""javascript"" or ""python"" or ""bash"",
      ""code"": ""script code""
    }}
  ],
  ""resources"": [
    {{
      ""name"": ""resource name"",
      ""type"": ""api"" or ""database"" or ""file"",
      ""config"": ""configuration details""
    }}
  ],
  ""tags"": [""tag1"", ""tag2""]
}}

Generate a production-ready agent configuration that can be deployed immediately.";

        var response = await _modelProvider.GenerateAsync(prompt, "claude-sonnet-4-20250514");

        // Parse the JSON response
        var agentConfig = JsonSerializer.Deserialize<AgentConfigResponse>(response);
        if (agentConfig == null)
        {
            throw new InvalidOperationException("Failed to parse agent configuration from AI response");
        }

        // Return preview without saving
        return new AgentSkill
        {
            Id = Guid.Empty, // Preview, not saved
            UserId = "preview",
            Name = agentConfig.Name,
            Description = agentConfig.Description,
            Category = agentConfig.Category,
            InstructionContent = agentConfig.InstructionContent,
            ScriptsJson = JsonSerializer.Serialize(agentConfig.Scripts),
            ResourcesJson = JsonSerializer.Serialize(agentConfig.Resources),
            TagsJson = JsonSerializer.Serialize(agentConfig.Tags),
            IsPublic = false,
            Version = "1.0.0",
            Author = "preview",
        };
    }

    public Task<bool> ValidateAgentConfigAsync(AgentSkill skill)
    {
        if (string.IsNullOrWhiteSpace(skill.Name))
            return Task.FromResult(false);

        if (string.IsNullOrWhiteSpace(skill.InstructionContent))
            return Task.FromResult(false);

        // Validate JSON fields if present
        if (!string.IsNullOrWhiteSpace(skill.ScriptsJson))
        {
            try
            {
                JsonSerializer.Deserialize<List<ScriptConfig>>(skill.ScriptsJson);
            }
            catch
            {
                return Task.FromResult(false);
            }
        }

        if (!string.IsNullOrWhiteSpace(skill.ResourcesJson))
        {
            try
            {
                JsonSerializer.Deserialize<List<ResourceConfig>>(skill.ResourcesJson);
            }
            catch
            {
                return Task.FromResult(false);
            }
        }

        return Task.FromResult(true);
    }

    public async Task<AgentDeployment> DeployAgentAsync(Guid agentSkillId, string platform, string configJson, string userId)
    {
        var skill = await _db.AgentSkills.FindAsync(agentSkillId);
        if (skill == null)
        {
            throw new InvalidOperationException($"Agent skill {agentSkillId} not found");
        }

        if (skill.UserId != userId)
        {
            throw new UnauthorizedAccessException("Not authorized to deploy this agent");
        }

        var deployment = new AgentDeployment
        {
            UserId = userId,
            AgentSkillId = agentSkillId,
            Platform = platform,
            Status = "active",
            ConfigJson = configJson,
            MetricsJson = JsonSerializer.Serialize(new { messagesProcessed = 0, errors = 0 }),
        };

        _db.AgentDeployments.Add(deployment);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Deployed agent {AgentSkillId} to {Platform} as {DeploymentId}",
            agentSkillId, platform, deployment.Id);

        return deployment;
    }

    public async Task<List<AgentDeployment>> GetDeploymentsAsync(string userId)
    {
        return await _db.AgentDeployments
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.DeployedAt)
            .ToListAsync();
    }

    public async Task<bool> UndeployAgentAsync(Guid deploymentId, string userId)
    {
        var deployment = await _db.AgentDeployments.FindAsync(deploymentId);
        if (deployment == null || deployment.UserId != userId)
        {
            return false;
        }

        _db.AgentDeployments.Remove(deployment);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Undeployed agent deployment {DeploymentId}", deploymentId);
        return true;
    }

    public Task<List<AgentTemplate>> GetAgentTemplatesAsync()
    {
        var templates = new List<AgentTemplate>
        {
            new()
            {
                Id = "slack-bot",
                Name = "Slack Bot",
                Description = "Interactive Slack bot with commands, slash commands, and message handling",
                Category = "bot",
                Platform = "slack",
                IconUrl = "https://cdn.icon-icons.com/icons2/2699/PNG/512/slack_tile_logo_icon_168820.png",
                TemplateSpec = "Create a Slack bot that responds to mentions, slash commands, and direct messages. Include interactive buttons and message formatting."
            },
            new()
            {
                Id = "telegram-bot",
                Name = "Telegram Bot",
                Description = "Telegram bot with commands, inline queries, and callback handling",
                Category = "bot",
                Platform = "telegram",
                IconUrl = "https://cdn.icon-icons.com/icons2/2699/PNG/512/telegram_tile_logo_icon_168818.png",
                TemplateSpec = "Create a Telegram bot that handles commands, inline queries, and callback buttons. Support media messages and keyboard layouts."
            },
            new()
            {
                Id = "customer-service",
                Name = "Customer Service Agent",
                Description = "AI customer service agent for FAQ handling, ticket creation, and sentiment analysis",
                Category = "service",
                Platform = "webhook",
                IconUrl = "https://cdn.icon-icons.com/icons2/2699/PNG/512/atlassian_jira_logo_icon_170511.png",
                TemplateSpec = "Create a customer service agent that handles FAQs, creates support tickets, analyzes sentiment, and escalates complex issues to humans."
            },
            new()
            {
                Id = "monitoring-agent",
                Name = "Monitoring Agent",
                Description = "Automated monitoring with health checks, alerts, and auto-remediation",
                Category = "automation",
                Platform = "scheduled",
                IconUrl = "https://cdn.icon-icons.com/icons2/2699/PNG/512/grafana_logo_icon_171048.png",
                TemplateSpec = "Create a monitoring agent that performs health checks, sends alerts on failures, and attempts auto-remediation for common issues."
            },
            new()
            {
                Id = "webhook-agent",
                Name = "Webhook Agent",
                Description = "HTTP webhook endpoint for event handling and API integration",
                Category = "automation",
                Platform = "webhook",
                IconUrl = "https://cdn.icon-icons.com/icons2/2699/PNG/512/zapier_logo_icon_168318.png",
                TemplateSpec = "Create a webhook agent that receives HTTP requests, processes events, validates data, and triggers actions based on event types."
            },
            new()
            {
                Id = "scheduled-agent",
                Name = "Scheduled Agent",
                Description = "Cron-based automation for data aggregation and reporting",
                Category = "automation",
                Platform = "scheduled",
                IconUrl = "https://cdn.icon-icons.com/icons2/2699/PNG/512/airflow_logo_icon_170385.png",
                TemplateSpec = "Create a scheduled agent that runs on a cron schedule, aggregates data from multiple sources, generates reports, and sends notifications."
            }
        };

        return Task.FromResult(templates);
    }
}

internal record AgentConfigResponse
{
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Category { get; init; } = "";
    public string InstructionContent { get; init; } = "";
    public List<ScriptConfig> Scripts { get; init; } = new();
    public List<ResourceConfig> Resources { get; init; } = new();
    public List<string> Tags { get; init; } = new();
}

internal record ScriptConfig
{
    public string Name { get; init; } = "";
    public string Language { get; init; } = "";
    public string Code { get; init; } = "";
}

internal record ResourceConfig
{
    public string Name { get; init; } = "";
    public string Type { get; init; } = "";
    public string Config { get; init; } = "";
}

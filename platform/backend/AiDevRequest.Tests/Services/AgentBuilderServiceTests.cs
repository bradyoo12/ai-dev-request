using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace AiDevRequest.Tests.Services;

public class AgentBuilderServiceTests
{
    private AgentBuilderService CreateService(
        API.Data.AiDevRequestDbContext? db = null,
        Mock<IModelProviderService>? modelProvider = null)
    {
        db ??= TestDbContextFactory.Create();
        modelProvider ??= new Mock<IModelProviderService>();
        var logger = new Mock<ILogger<AgentBuilderService>>();
        return new AgentBuilderService(db, modelProvider.Object, logger.Object);
    }

    [Fact]
    public async Task AnalyzeDescriptionAsync_ReturnsSuccessWithParsedData()
    {
        var modelProvider = new Mock<IModelProviderService>();
        var analysisJson = JsonSerializer.Serialize(new
        {
            capabilities = new[] { "Send messages", "Create channels" },
            integrations = new[] { "Slack API", "OAuth 2.0" },
            configuration = new Dictionary<string, string> { { "botToken", "xoxb-xxx" } },
            requirements = new[] { "Slack workspace", "Bot permissions" }
        });
        modelProvider.Setup(m => m.GenerateAsync(It.IsAny<string>(), "claude-sonnet-4-5-20250929"))
            .ReturnsAsync(analysisJson);

        var service = CreateService(modelProvider: modelProvider);
        var result = await service.AnalyzeDescriptionAsync("A Slack bot for customer support", "Slack");

        Assert.True(result.Success);
        Assert.Equal(2, result.Capabilities.Count);
        Assert.Contains("Send messages", result.Capabilities);
        Assert.Equal(2, result.Integrations.Count);
        Assert.Contains("Slack API", result.Integrations);
        Assert.Single(result.Configuration);
        Assert.Equal(2, result.Requirements.Count);
    }

    [Fact]
    public async Task AnalyzeDescriptionAsync_HandlesInvalidJson()
    {
        var modelProvider = new Mock<IModelProviderService>();
        modelProvider.Setup(m => m.GenerateAsync(It.IsAny<string>(), "claude-sonnet-4-5-20250929"))
            .ReturnsAsync("invalid json");

        var service = CreateService(modelProvider: modelProvider);
        var result = await service.AnalyzeDescriptionAsync("A bot", "Telegram");

        Assert.False(result.Success);
        Assert.NotNull(result.ErrorMessage);
    }

    [Fact]
    public async Task AnalyzeDescriptionAsync_HandlesProviderException()
    {
        var modelProvider = new Mock<IModelProviderService>();
        modelProvider.Setup(m => m.GenerateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("API error"));

        var service = CreateService(modelProvider: modelProvider);
        var result = await service.AnalyzeDescriptionAsync("A bot", "Slack");

        Assert.False(result.Success);
        Assert.Equal("API error", result.ErrorMessage);
    }

    [Fact]
    public async Task GenerateAgentAsync_ThrowsWhenBlueprintNotFound()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.GenerateAgentAsync(Guid.NewGuid())
        );
    }

    [Fact]
    public async Task GenerateAgentAsync_GeneratesCodeAndConfiguration()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "user1",
            Name = "Slack Bot",
            Description = "A helpdesk bot",
            AgentType = "Slack",
            Status = "Draft"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var modelProvider = new Mock<IModelProviderService>();
        modelProvider.Setup(m => m.GenerateAsync(It.IsAny<string>(), "claude-sonnet-4-5-20250929"))
            .ReturnsAsync("// Generated code");

        var service = CreateService(db, modelProvider);
        var result = await service.GenerateAgentAsync(blueprint.Id);

        Assert.Equal("Ready", result.Status);
        Assert.NotNull(result.GeneratedCode);
        Assert.Contains("// Generated code", result.GeneratedCode);
        Assert.NotNull(result.ConfigurationJson);
        modelProvider.Verify(m => m.GenerateAsync(It.IsAny<string>(), "claude-sonnet-4-5-20250929"), Times.Exactly(2));
    }

    [Fact]
    public async Task GenerateAgentAsync_UpdatesStatusThroughoutProcess()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "user1",
            Name = "Test Agent",
            Description = "Test",
            AgentType = "Telegram",
            Status = "Draft"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var modelProvider = new Mock<IModelProviderService>();
        var callCount = 0;
        modelProvider.Setup(m => m.GenerateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(() =>
            {
                callCount++;
                return callCount == 1 ? "code" : "{}";
            });

        var service = CreateService(db, modelProvider);
        await service.GenerateAgentAsync(blueprint.Id);

        var updated = await db.AgentBlueprints.FindAsync(blueprint.Id);
        Assert.NotNull(updated);
        Assert.Equal("Ready", updated.Status);
        Assert.True(updated.UpdatedAt > blueprint.CreatedAt);
    }

    [Fact]
    public async Task GenerateAgentAsync_SetsFailedStatusOnException()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "user1",
            Name = "Test Agent",
            Description = "Test",
            AgentType = "Slack",
            Status = "Draft"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var modelProvider = new Mock<IModelProviderService>();
        modelProvider.Setup(m => m.GenerateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("Generation failed"));

        var service = CreateService(db, modelProvider);

        await Assert.ThrowsAsync<Exception>(() => service.GenerateAgentAsync(blueprint.Id));

        var updated = await db.AgentBlueprints.FindAsync(blueprint.Id);
        Assert.NotNull(updated);
        Assert.Equal("Failed", updated.Status);
        Assert.Equal("Generation failed", updated.ErrorMessage);
    }

    [Fact]
    public async Task GenerateAgentAsync_GeneratesSlackBotCode()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "user1",
            Name = "Slack Bot",
            Description = "Customer support bot",
            AgentType = "Slack",
            CapabilitiesJson = "[\"Answer FAQs\"]",
            IntegrationsJson = "[\"Slack API\"]"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var modelProvider = new Mock<IModelProviderService>();
        modelProvider.Setup(m => m.GenerateAsync(It.Is<string>(p => p.Contains("@slack/bolt")), It.IsAny<string>()))
            .ReturnsAsync("// Slack bot code");
        modelProvider.Setup(m => m.GenerateAsync(It.Is<string>(p => p.Contains("configuration parameters")), It.IsAny<string>()))
            .ReturnsAsync("{}");

        var service = CreateService(db, modelProvider);
        var result = await service.GenerateAgentAsync(blueprint.Id);

        Assert.Contains("Slack bot code", result.GeneratedCode);
        modelProvider.Verify(m => m.GenerateAsync(It.Is<string>(p => p.Contains("@slack/bolt")), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task GenerateAgentAsync_GeneratesTelegramBotCode()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "user1",
            Name = "Telegram Bot",
            Description = "News bot",
            AgentType = "Telegram"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var modelProvider = new Mock<IModelProviderService>();
        modelProvider.Setup(m => m.GenerateAsync(It.Is<string>(p => p.Contains("node-telegram-bot-api") || p.Contains("telegraf")), It.IsAny<string>()))
            .ReturnsAsync("// Telegram bot code");
        modelProvider.Setup(m => m.GenerateAsync(It.Is<string>(p => p.Contains("configuration parameters")), It.IsAny<string>()))
            .ReturnsAsync("{}");

        var service = CreateService(db, modelProvider);
        var result = await service.GenerateAgentAsync(blueprint.Id);

        Assert.Contains("Telegram bot code", result.GeneratedCode);
    }

    [Fact]
    public async Task ConvertToSkillAsync_ThrowsWhenBlueprintNotFound()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ConvertToSkillAsync(Guid.NewGuid())
        );
    }

    [Fact]
    public async Task ConvertToSkillAsync_ThrowsWhenBlueprintNotReady()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "user1",
            Name = "Test",
            Description = "Test",
            AgentType = "Slack",
            Status = "Draft"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ConvertToSkillAsync(blueprint.Id)
        );
        Assert.Contains("Ready status", exception.Message);
    }

    [Fact]
    public async Task ConvertToSkillAsync_CreatesAgentSkillFromBlueprint()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "user1",
            Name = "My Bot",
            Description = "A helpful bot",
            AgentType = "Slack",
            Status = "Ready",
            GeneratedCode = "// bot code",
            ConfigurationJson = "{\"token\":\"xxx\"}",
            CapabilitiesJson = "[\"chat\"]"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var skill = await service.ConvertToSkillAsync(blueprint.Id);

        Assert.NotNull(skill);
        Assert.Equal("user1", skill.UserId);
        Assert.Equal("My Bot", skill.Name);
        Assert.Equal("A helpful bot", skill.Description);
        Assert.Equal("Slack", skill.Category);
        Assert.Equal("// bot code", skill.InstructionContent);
        Assert.Equal("{\"token\":\"xxx\"}", skill.ResourcesJson);
        Assert.Equal("[\"chat\"]", skill.TagsJson);
        Assert.False(skill.IsPublic);
        Assert.False(skill.IsBuiltIn);
        Assert.Equal("1.0.0", skill.Version);

        // Verify blueprint is updated
        var updatedBlueprint = await db.AgentBlueprints.FindAsync(blueprint.Id);
        Assert.NotNull(updatedBlueprint);
        Assert.Equal(skill.Id, updatedBlueprint.GeneratedSkillId);
    }

    [Fact]
    public async Task GetTemplatesAsync_ReturnsAllFiveTemplates()
    {
        var service = CreateService();
        var templates = await service.GetTemplatesAsync();

        Assert.Equal(5, templates.Count);
        Assert.Contains(templates, t => t.AgentType == "Slack");
        Assert.Contains(templates, t => t.AgentType == "Telegram");
        Assert.Contains(templates, t => t.AgentType == "CustomerService");
        Assert.Contains(templates, t => t.AgentType == "Monitoring");
        Assert.Contains(templates, t => t.AgentType == "DataPipeline");
    }

    [Fact]
    public async Task GetTemplatesAsync_ReturnsTemplatesWithCorrectStructure()
    {
        var service = CreateService();
        var templates = await service.GetTemplatesAsync();

        var slackTemplate = templates.First(t => t.Id == "slack-helpdesk");
        Assert.Equal("Slack Helpdesk Bot", slackTemplate.Name);
        Assert.NotEmpty(slackTemplate.Description);
        Assert.Equal("Slack", slackTemplate.AgentType);
        Assert.Equal("MessageSquare", slackTemplate.Icon);
        Assert.NotEmpty(slackTemplate.SampleCapabilities);
        Assert.Contains("Answer FAQs", slackTemplate.SampleCapabilities);
    }
}

using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace AiDevRequest.Tests.Services;

public class AgentBuilderServiceTests
{
    private AgentBuilderService CreateService(API.Data.AiDevRequestDbContext? db = null, IModelProviderService? modelProvider = null)
    {
        db ??= TestDbContextFactory.Create();
        modelProvider ??= new Mock<IModelProviderService>().Object;
        var logger = new Mock<ILogger<AgentBuilderService>>();
        return new AgentBuilderService(db, modelProvider, logger.Object);
    }

    [Fact]
    public async Task GenerateAgentFromSpecAsync_CreatesAgentSkill()
    {
        var db = TestDbContextFactory.Create();
        var mockModelProvider = new Mock<IModelProviderService>();

        var mockResponse = JsonSerializer.Serialize(new
        {
            name = "Test Agent",
            description = "A test agent",
            category = "bot",
            instructionContent = "Test instructions",
            scripts = new[] { new { name = "test.js", language = "javascript", code = "console.log('test');" } },
            resources = new[] { new { name = "api", type = "api", config = "http://test" } },
            tags = new[] { "test", "bot" }
        });

        mockModelProvider
            .Setup(m => m.GenerateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(mockResponse);

        var service = CreateService(db, mockModelProvider.Object);

        var skill = await service.GenerateAgentFromSpecAsync("Create a test bot", "user1");

        Assert.Equal("Test Agent", skill.Name);
        Assert.Equal("A test agent", skill.Description);
        Assert.Equal("bot", skill.Category);
        Assert.Equal("user1", skill.UserId);
        Assert.False(skill.IsPublic);
        Assert.Equal("1.0.0", skill.Version);
        Assert.NotNull(skill.ScriptsJson);
        Assert.NotNull(skill.ResourcesJson);
        Assert.NotNull(skill.TagsJson);
    }

    [Fact]
    public async Task GenerateAgentFromSpecAsync_ThrowsOnInvalidResponse()
    {
        var mockModelProvider = new Mock<IModelProviderService>();
        mockModelProvider
            .Setup(m => m.GenerateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync("invalid json");

        var service = CreateService(modelProvider: mockModelProvider.Object);

        await Assert.ThrowsAsync<JsonException>(
            () => service.GenerateAgentFromSpecAsync("Create a bot", "user1"));
    }

    [Fact]
    public async Task PreviewAgentAsync_ReturnsAgentWithoutSaving()
    {
        var db = TestDbContextFactory.Create();
        var mockModelProvider = new Mock<IModelProviderService>();

        var mockResponse = JsonSerializer.Serialize(new
        {
            name = "Preview Agent",
            description = "Preview description",
            category = "service",
            instructionContent = "Preview instructions",
            scripts = Array.Empty<object>(),
            resources = Array.Empty<object>(),
            tags = new[] { "preview" }
        });

        mockModelProvider
            .Setup(m => m.GenerateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(mockResponse);

        var service = CreateService(db, mockModelProvider.Object);

        var preview = await service.PreviewAgentAsync("Create a service agent");

        Assert.Equal("Preview Agent", preview.Name);
        Assert.Equal(Guid.Empty, preview.Id);
        Assert.Equal("preview", preview.UserId);
        Assert.Equal("preview", preview.Author);

        // Verify nothing was saved to database
        var skillsInDb = await db.AgentSkills.CountAsync();
        Assert.Equal(0, skillsInDb);
    }

    [Fact]
    public async Task ValidateAgentConfigAsync_ReturnsTrueForValidConfig()
    {
        var service = CreateService();

        var validSkill = new AgentSkill
        {
            UserId = "user1",
            Name = "Valid Agent",
            InstructionContent = "Some instructions",
            ScriptsJson = JsonSerializer.Serialize(new[] { new { name = "test", language = "js", code = "code" } }),
            ResourcesJson = JsonSerializer.Serialize(new[] { new { name = "api", type = "api", config = "config" } }),
            TagsJson = JsonSerializer.Serialize(new[] { "tag1" })
        };

        var result = await service.ValidateAgentConfigAsync(validSkill);

        Assert.True(result);
    }

    [Fact]
    public async Task ValidateAgentConfigAsync_ReturnsFalseForMissingName()
    {
        var service = CreateService();

        var invalidSkill = new AgentSkill
        {
            UserId = "user1",
            Name = "",
            InstructionContent = "Some instructions"
        };

        var result = await service.ValidateAgentConfigAsync(invalidSkill);

        Assert.False(result);
    }

    [Fact]
    public async Task ValidateAgentConfigAsync_ReturnsFalseForMissingInstructions()
    {
        var service = CreateService();

        var invalidSkill = new AgentSkill
        {
            UserId = "user1",
            Name = "Test",
            InstructionContent = ""
        };

        var result = await service.ValidateAgentConfigAsync(invalidSkill);

        Assert.False(result);
    }

    [Fact]
    public async Task ValidateAgentConfigAsync_ReturnsFalseForInvalidScriptsJson()
    {
        var service = CreateService();

        var invalidSkill = new AgentSkill
        {
            UserId = "user1",
            Name = "Test",
            InstructionContent = "Instructions",
            ScriptsJson = "invalid json"
        };

        var result = await service.ValidateAgentConfigAsync(invalidSkill);

        Assert.False(result);
    }

    [Fact]
    public async Task ValidateAgentConfigAsync_ReturnsFalseForInvalidResourcesJson()
    {
        var service = CreateService();

        var invalidSkill = new AgentSkill
        {
            UserId = "user1",
            Name = "Test",
            InstructionContent = "Instructions",
            ResourcesJson = "invalid json"
        };

        var result = await service.ValidateAgentConfigAsync(invalidSkill);

        Assert.False(result);
    }

    [Fact]
    public async Task DeployAgentAsync_CreatesDeployment()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var skill = new AgentSkill
        {
            UserId = "user1",
            Name = "Test Agent",
            InstructionContent = "Instructions"
        };
        db.AgentSkills.Add(skill);
        await db.SaveChangesAsync();

        var deployment = await service.DeployAgentAsync(skill.Id, "slack", "{\"token\":\"test\"}", "user1");

        Assert.Equal("user1", deployment.UserId);
        Assert.Equal(skill.Id, deployment.AgentSkillId);
        Assert.Equal("slack", deployment.Platform);
        Assert.Equal("active", deployment.Status);
        Assert.Equal("{\"token\":\"test\"}", deployment.ConfigJson);
    }

    [Fact]
    public async Task DeployAgentAsync_ThrowsForNonexistentSkill()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.DeployAgentAsync(Guid.NewGuid(), "slack", "{}", "user1"));
    }

    [Fact]
    public async Task DeployAgentAsync_ThrowsForUnauthorizedUser()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var skill = new AgentSkill
        {
            UserId = "user1",
            Name = "Test Agent",
            InstructionContent = "Instructions"
        };
        db.AgentSkills.Add(skill);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.DeployAgentAsync(skill.Id, "slack", "{}", "user2"));
    }

    [Fact]
    public async Task GetDeploymentsAsync_ReturnsUserDeployments()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var skill1 = new AgentSkill { UserId = "user1", Name = "Agent 1", InstructionContent = "I1" };
        var skill2 = new AgentSkill { UserId = "user2", Name = "Agent 2", InstructionContent = "I2" };
        db.AgentSkills.AddRange(skill1, skill2);
        await db.SaveChangesAsync();

        var dep1 = new AgentDeployment { UserId = "user1", AgentSkillId = skill1.Id, Platform = "slack", Status = "active" };
        var dep2 = new AgentDeployment { UserId = "user1", AgentSkillId = skill1.Id, Platform = "telegram", Status = "active" };
        var dep3 = new AgentDeployment { UserId = "user2", AgentSkillId = skill2.Id, Platform = "slack", Status = "active" };
        db.AgentDeployments.AddRange(dep1, dep2, dep3);
        await db.SaveChangesAsync();

        var deployments = await service.GetDeploymentsAsync("user1");

        Assert.Equal(2, deployments.Count);
        Assert.All(deployments, d => Assert.Equal("user1", d.UserId));
    }

    [Fact]
    public async Task UndeployAgentAsync_RemovesDeployment()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var skill = new AgentSkill { UserId = "user1", Name = "Agent", InstructionContent = "I" };
        db.AgentSkills.Add(skill);
        await db.SaveChangesAsync();

        var deployment = new AgentDeployment { UserId = "user1", AgentSkillId = skill.Id, Platform = "slack", Status = "active" };
        db.AgentDeployments.Add(deployment);
        await db.SaveChangesAsync();

        var result = await service.UndeployAgentAsync(deployment.Id, "user1");

        Assert.True(result);
        Assert.Null(await db.AgentDeployments.FindAsync(deployment.Id));
    }

    [Fact]
    public async Task UndeployAgentAsync_ReturnsFalseForNonexistentDeployment()
    {
        var service = CreateService();

        var result = await service.UndeployAgentAsync(Guid.NewGuid(), "user1");

        Assert.False(result);
    }

    [Fact]
    public async Task UndeployAgentAsync_ReturnsFalseForUnauthorizedUser()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var skill = new AgentSkill { UserId = "user1", Name = "Agent", InstructionContent = "I" };
        db.AgentSkills.Add(skill);
        await db.SaveChangesAsync();

        var deployment = new AgentDeployment { UserId = "user1", AgentSkillId = skill.Id, Platform = "slack", Status = "active" };
        db.AgentDeployments.Add(deployment);
        await db.SaveChangesAsync();

        var result = await service.UndeployAgentAsync(deployment.Id, "user2");

        Assert.False(result);
    }

    [Fact]
    public async Task GetAgentTemplatesAsync_ReturnsSixTemplates()
    {
        var service = CreateService();

        var templates = await service.GetAgentTemplatesAsync();

        Assert.Equal(6, templates.Count);
        Assert.Contains(templates, t => t.Id == "slack-bot");
        Assert.Contains(templates, t => t.Id == "telegram-bot");
        Assert.Contains(templates, t => t.Id == "customer-service");
        Assert.Contains(templates, t => t.Id == "monitoring-agent");
        Assert.Contains(templates, t => t.Id == "webhook-agent");
        Assert.Contains(templates, t => t.Id == "scheduled-agent");
    }

    [Fact]
    public async Task GetAgentTemplatesAsync_TemplatesHaveRequiredFields()
    {
        var service = CreateService();

        var templates = await service.GetAgentTemplatesAsync();

        Assert.All(templates, t =>
        {
            Assert.NotEmpty(t.Id);
            Assert.NotEmpty(t.Name);
            Assert.NotEmpty(t.Description);
            Assert.NotEmpty(t.Category);
            Assert.NotEmpty(t.Platform);
            Assert.NotEmpty(t.IconUrl);
            Assert.NotEmpty(t.TemplateSpec);
        });
    }
}

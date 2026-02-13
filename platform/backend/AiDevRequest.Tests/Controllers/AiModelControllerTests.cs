using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.DTOs;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Text.Json;

namespace AiDevRequest.Tests.Controllers;

public class AiModelControllerTests
{
    private AiDevRequestDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AiDevRequestDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AiDevRequestDbContext(options);
    }

    private AiModelController CreateController(AiDevRequestDbContext? db = null, Mock<IModelRouterService>? modelRouter = null)
    {
        db ??= CreateInMemoryDbContext();
        modelRouter ??= new Mock<IModelRouterService>();

        var controller = new AiModelController(db, modelRouter.Object);
        ControllerTestHelper.SetupUser(controller, "test-user-id");

        return controller;
    }

    // ===== GetEffortLevels Tests =====

    [Fact]
    public async Task GetEffortLevels_ReturnsUnauthorized_WhenNotAuthenticated()
    {
        var db = CreateInMemoryDbContext();
        var modelRouter = new Mock<IModelRouterService>();
        var controller = new AiModelController(db, modelRouter.Object);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.GetEffortLevels();

        result.Result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task GetEffortLevels_ReturnsDefaultConfig_WhenNoConfigExists()
    {
        var db = CreateInMemoryDbContext();
        var controller = CreateController(db);

        var result = await controller.GetEffortLevels();

        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var config = okResult?.Value as EffortLevelConfigDto;

        config.Should().NotBeNull();
        config!.StructuredOutputsEnabled.Should().BeTrue();
        config.TaskConfigs.Should().HaveCount(5);
        config.TaskConfigs.Should().Contain(t => t.TaskType == "analysis" && t.EffortLevel == ThinkingEffortLevel.High);
        config.TaskConfigs.Should().Contain(t => t.TaskType == "proposal" && t.EffortLevel == ThinkingEffortLevel.Medium);
        config.TaskConfigs.Should().Contain(t => t.TaskType == "production" && t.EffortLevel == ThinkingEffortLevel.Low);
        config.TaskConfigs.Should().Contain(t => t.TaskType == "code_review" && t.EffortLevel == ThinkingEffortLevel.High);
        config.TaskConfigs.Should().Contain(t => t.TaskType == "test_generation" && t.EffortLevel == ThinkingEffortLevel.Low);
    }

    [Fact]
    public async Task GetEffortLevels_ReturnsSavedConfig_WhenConfigExists()
    {
        var db = CreateInMemoryDbContext();
        var controller = CreateController(db);

        // Create saved configuration
        var savedConfig = new AiModelConfig
        {
            UserId = "test-user-id",
            EffortLevelConfigJson = JsonSerializer.Serialize(new List<TaskTypeEffortConfig>
            {
                new() { TaskType = "custom_task", EffortLevel = ThinkingEffortLevel.Medium, Description = "Custom task" }
            }),
            StructuredOutputsEnabled = false
        };
        db.AiModelConfigs.Add(savedConfig);
        await db.SaveChangesAsync();

        var result = await controller.GetEffortLevels();

        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var config = okResult?.Value as EffortLevelConfigDto;

        config.Should().NotBeNull();
        config!.StructuredOutputsEnabled.Should().BeFalse();
        config.TaskConfigs.Should().HaveCount(1);
        config.TaskConfigs[0].TaskType.Should().Be("custom_task");
        config.TaskConfigs[0].EffortLevel.Should().Be(ThinkingEffortLevel.Medium);
    }

    // ===== UpdateEffortLevels Tests =====

    [Fact]
    public async Task UpdateEffortLevels_ReturnsUnauthorized_WhenNotAuthenticated()
    {
        var db = CreateInMemoryDbContext();
        var modelRouter = new Mock<IModelRouterService>();
        var controller = new AiModelController(db, modelRouter.Object);
        ControllerTestHelper.SetupAnonymous(controller);

        var dto = new UpdateEffortLevelConfigDto
        {
            TaskConfigs = new List<TaskTypeEffortConfig>()
        };

        var result = await controller.UpdateEffortLevels(dto);

        result.Result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task UpdateEffortLevels_CreatesNewConfig_WhenNoneExists()
    {
        var db = CreateInMemoryDbContext();
        var controller = CreateController(db);

        var dto = new UpdateEffortLevelConfigDto
        {
            TaskConfigs = new List<TaskTypeEffortConfig>
            {
                new() { TaskType = "analysis", EffortLevel = ThinkingEffortLevel.Low, Description = "Updated" }
            },
            StructuredOutputsEnabled = false
        };

        var result = await controller.UpdateEffortLevels(dto);

        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var config = okResult?.Value as EffortLevelConfigDto;

        config.Should().NotBeNull();
        config!.StructuredOutputsEnabled.Should().BeFalse();
        config.TaskConfigs.Should().HaveCount(1);
        config.TaskConfigs[0].TaskType.Should().Be("analysis");
        config.TaskConfigs[0].EffortLevel.Should().Be(ThinkingEffortLevel.Low);

        // Verify saved to database
        var savedConfig = await db.AiModelConfigs.FirstOrDefaultAsync(c => c.UserId == "test-user-id");
        savedConfig.Should().NotBeNull();
        savedConfig!.StructuredOutputsEnabled.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateEffortLevels_UpdatesExistingConfig()
    {
        var db = CreateInMemoryDbContext();
        var controller = CreateController(db);

        // Create existing configuration
        var existingConfig = new AiModelConfig
        {
            UserId = "test-user-id",
            EffortLevelConfigJson = JsonSerializer.Serialize(new List<TaskTypeEffortConfig>
            {
                new() { TaskType = "old_task", EffortLevel = ThinkingEffortLevel.High }
            }),
            StructuredOutputsEnabled = true
        };
        db.AiModelConfigs.Add(existingConfig);
        await db.SaveChangesAsync();

        var dto = new UpdateEffortLevelConfigDto
        {
            TaskConfigs = new List<TaskTypeEffortConfig>
            {
                new() { TaskType = "new_task", EffortLevel = ThinkingEffortLevel.Medium, Description = "New task" }
            },
            StructuredOutputsEnabled = false
        };

        var result = await controller.UpdateEffortLevels(dto);

        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var config = okResult?.Value as EffortLevelConfigDto;

        config.Should().NotBeNull();
        config!.StructuredOutputsEnabled.Should().BeFalse();
        config.TaskConfigs.Should().HaveCount(1);
        config.TaskConfigs[0].TaskType.Should().Be("new_task");
        config.TaskConfigs[0].EffortLevel.Should().Be(ThinkingEffortLevel.Medium);
    }

    [Fact]
    public async Task UpdateEffortLevels_PreservesStructuredOutputsSetting_WhenNotProvided()
    {
        var db = CreateInMemoryDbContext();
        var controller = CreateController(db);

        // Create existing configuration with StructuredOutputsEnabled = false
        var existingConfig = new AiModelConfig
        {
            UserId = "test-user-id",
            StructuredOutputsEnabled = false
        };
        db.AiModelConfigs.Add(existingConfig);
        await db.SaveChangesAsync();

        var dto = new UpdateEffortLevelConfigDto
        {
            TaskConfigs = new List<TaskTypeEffortConfig>
            {
                new() { TaskType = "test", EffortLevel = ThinkingEffortLevel.Low }
            },
            StructuredOutputsEnabled = null // Not provided
        };

        var result = await controller.UpdateEffortLevels(dto);

        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var config = okResult?.Value as EffortLevelConfigDto;

        config.Should().NotBeNull();
        config!.StructuredOutputsEnabled.Should().BeFalse(); // Should preserve existing value
    }

    [Fact]
    public async Task UpdateEffortLevels_HandlesMultipleTaskTypes()
    {
        var db = CreateInMemoryDbContext();
        var controller = CreateController(db);

        var dto = new UpdateEffortLevelConfigDto
        {
            TaskConfigs = new List<TaskTypeEffortConfig>
            {
                new() { TaskType = "analysis", EffortLevel = ThinkingEffortLevel.High },
                new() { TaskType = "proposal", EffortLevel = ThinkingEffortLevel.Medium },
                new() { TaskType = "production", EffortLevel = ThinkingEffortLevel.Low },
                new() { TaskType = "code_review", EffortLevel = ThinkingEffortLevel.High },
                new() { TaskType = "test_generation", EffortLevel = ThinkingEffortLevel.Low }
            },
            StructuredOutputsEnabled = true
        };

        var result = await controller.UpdateEffortLevels(dto);

        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var config = okResult?.Value as EffortLevelConfigDto;

        config.Should().NotBeNull();
        config!.TaskConfigs.Should().HaveCount(5);
    }

    [Fact]
    public async Task UpdateEffortLevels_SavesJsonCorrectly()
    {
        var db = CreateInMemoryDbContext();
        var controller = CreateController(db);

        var dto = new UpdateEffortLevelConfigDto
        {
            TaskConfigs = new List<TaskTypeEffortConfig>
            {
                new() { TaskType = "test_task", EffortLevel = ThinkingEffortLevel.Medium, Description = "Test description" }
            }
        };

        await controller.UpdateEffortLevels(dto);

        var savedConfig = await db.AiModelConfigs.FirstOrDefaultAsync(c => c.UserId == "test-user-id");
        savedConfig.Should().NotBeNull();
        savedConfig!.EffortLevelConfigJson.Should().NotBeNullOrWhiteSpace();

        var deserializedConfig = JsonSerializer.Deserialize<List<TaskTypeEffortConfig>>(savedConfig.EffortLevelConfigJson!);
        deserializedConfig.Should().NotBeNull();
        deserializedConfig!.Should().HaveCount(1);
        deserializedConfig[0].TaskType.Should().Be("test_task");
        deserializedConfig[0].EffortLevel.Should().Be(ThinkingEffortLevel.Medium);
        deserializedConfig[0].Description.Should().Be("Test description");
    }
}

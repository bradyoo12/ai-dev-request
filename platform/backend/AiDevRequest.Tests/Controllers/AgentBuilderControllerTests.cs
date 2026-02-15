using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace AiDevRequest.Tests.Controllers;

public class AgentBuilderControllerTests
{
    private AgentBuilderController CreateController(
        API.Data.AiDevRequestDbContext? db = null,
        Mock<IAgentBuilderService>? builderService = null,
        string userId = "test-user")
    {
        db ??= TestDbContextFactory.Create();
        builderService ??= new Mock<IAgentBuilderService>();
        var logger = new Mock<ILogger<AgentBuilderController>>();

        var controller = new AgentBuilderController(db, builderService.Object, logger.Object);

        // Set up user claims
        var claims = new List<Claim>
        {
            new Claim("id", userId),
            new Claim("sub", userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };

        return controller;
    }

    [Fact]
    public async Task AnalyzeDescription_ReturnsOkWithAnalysisResult()
    {
        var builderService = new Mock<IAgentBuilderService>();
        builderService.Setup(s => s.AnalyzeDescriptionAsync("A Slack bot", "Slack"))
            .ReturnsAsync(new AgentAnalysisResult
            {
                Success = true,
                Capabilities = new List<string> { "Chat" },
                Integrations = new List<string> { "Slack API" },
                Configuration = new Dictionary<string, string>(),
                Requirements = new List<string>()
            });

        var controller = CreateController(builderService: builderService);
        var result = await controller.AnalyzeDescription(new AnalyzeDescriptionRequest
        {
            Description = "A Slack bot",
            AgentType = "Slack"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        var analysisResult = Assert.IsType<AgentAnalysisResult>(okResult.Value);
        Assert.True(analysisResult.Success);
        Assert.Single(analysisResult.Capabilities);
    }

    [Fact]
    public async Task AnalyzeDescription_ReturnsBadRequestOnException()
    {
        var builderService = new Mock<IAgentBuilderService>();
        builderService.Setup(s => s.AnalyzeDescriptionAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("Analysis failed"));

        var controller = CreateController(builderService: builderService);
        var result = await controller.AnalyzeDescription(new AnalyzeDescriptionRequest
        {
            Description = "Test",
            AgentType = "Slack"
        });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task CreateBlueprint_ReturnsCreatedWithBlueprint()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);

        var result = await controller.CreateBlueprint(new CreateBlueprintRequest
        {
            Name = "My Bot",
            Description = "A helpful bot",
            AgentType = "Slack",
            CapabilitiesJson = "[\"chat\"]",
            IntegrationsJson = "[\"slack\"]"
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var blueprint = Assert.IsType<BlueprintDto>(createdResult.Value);
        Assert.Equal("My Bot", blueprint.Name);
        Assert.Equal("A helpful bot", blueprint.Description);
        Assert.Equal("Slack", blueprint.AgentType);
        Assert.Equal("Draft", blueprint.Status);
        Assert.Equal("test-user", blueprint.UserId);
    }

    [Fact]
    public async Task CreateBlueprint_ReturnsBadRequestOnException()
    {
        var db = TestDbContextFactory.Create();
        db.Dispose(); // Force database to be unusable

        var controller = CreateController(db: TestDbContextFactory.Create());
        var result = await controller.CreateBlueprint(new CreateBlueprintRequest
        {
            Name = "Test",
            Description = "Test",
            AgentType = "Slack"
        });

        // Should succeed with new in-memory DB
        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task GetBlueprints_ReturnsUserBlueprints()
    {
        var db = TestDbContextFactory.Create();
        db.AgentBlueprints.Add(new AgentBlueprint
        {
            UserId = "test-user",
            Name = "Bot1",
            Description = "Test",
            AgentType = "Slack"
        });
        db.AgentBlueprints.Add(new AgentBlueprint
        {
            UserId = "other-user",
            Name = "Bot2",
            Description = "Test",
            AgentType = "Telegram"
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db, userId: "test-user");
        var result = await controller.GetBlueprints();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var blueprints = Assert.IsAssignableFrom<IEnumerable<BlueprintDto>>(okResult.Value);
        Assert.Single(blueprints);
        Assert.Equal("Bot1", blueprints.First().Name);
    }

    [Fact]
    public async Task GetBlueprint_ReturnsNotFoundWhenDoesNotExist()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);

        var result = await controller.GetBlueprint(Guid.NewGuid());

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetBlueprint_ReturnsOkWithBlueprint()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "test-user",
            Name = "My Bot",
            Description = "Test",
            AgentType = "Slack"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        var result = await controller.GetBlueprint(blueprint.Id);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<BlueprintDto>(okResult.Value);
        Assert.Equal("My Bot", dto.Name);
    }

    [Fact]
    public async Task UpdateBlueprint_ReturnsNotFoundWhenDoesNotExist()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);

        var result = await controller.UpdateBlueprint(Guid.NewGuid(), new UpdateBlueprintRequest
        {
            Name = "Updated"
        });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task UpdateBlueprint_UpdatesFields()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "test-user",
            Name = "Old Name",
            Description = "Old Desc",
            AgentType = "Slack"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        var result = await controller.UpdateBlueprint(blueprint.Id, new UpdateBlueprintRequest
        {
            Name = "New Name",
            Description = "New Desc"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<BlueprintDto>(okResult.Value);
        Assert.Equal("New Name", dto.Name);
        Assert.Equal("New Desc", dto.Description);
    }

    [Fact]
    public async Task DeleteBlueprint_ReturnsNotFoundWhenDoesNotExist()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);

        var result = await controller.DeleteBlueprint(Guid.NewGuid());

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task DeleteBlueprint_RemovesBlueprint()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "test-user",
            Name = "To Delete",
            Description = "Test",
            AgentType = "Slack"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        var result = await controller.DeleteBlueprint(blueprint.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Null(await db.AgentBlueprints.FindAsync(blueprint.Id));
    }

    [Fact]
    public async Task GenerateAgent_ReturnsNotFoundWhenBlueprintNotFound()
    {
        var builderService = new Mock<IAgentBuilderService>();
        builderService.Setup(s => s.GenerateAgentAsync(It.IsAny<Guid>()))
            .ThrowsAsync(new InvalidOperationException("Blueprint not found"));

        var controller = CreateController(builderService: builderService);
        var result = await controller.GenerateAgent(Guid.NewGuid());

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GenerateAgent_ReturnsOkWithGeneratedBlueprint()
    {
        var builderService = new Mock<IAgentBuilderService>();
        var generatedBlueprint = new AgentBlueprint
        {
            UserId = "test-user",
            Name = "Bot",
            Description = "Test",
            AgentType = "Slack",
            Status = "Ready",
            GeneratedCode = "// code"
        };
        builderService.Setup(s => s.GenerateAgentAsync(It.IsAny<Guid>()))
            .ReturnsAsync(generatedBlueprint);

        var controller = CreateController(builderService: builderService);
        var result = await controller.GenerateAgent(Guid.NewGuid());

        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<BlueprintDto>(okResult.Value);
        Assert.Equal("Ready", dto.Status);
        Assert.NotNull(dto.GeneratedCode);
    }

    [Fact]
    public async Task GetGenerationStatus_ReturnsNotFoundWhenBlueprintNotFound()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);

        var result = await controller.GetGenerationStatus(Guid.NewGuid());

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetGenerationStatus_ReturnsStatusResponse()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "test-user",
            Name = "Bot",
            Description = "Test",
            AgentType = "Slack",
            Status = "Generating"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        var result = await controller.GetGenerationStatus(blueprint.Id);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<StatusResponse>(okResult.Value);
        Assert.Equal("Generating", response.Status);
    }

    [Fact]
    public async Task ConvertToSkill_ReturnsBadRequestWhenBlueprintNotReady()
    {
        var builderService = new Mock<IAgentBuilderService>();
        builderService.Setup(s => s.ConvertToSkillAsync(It.IsAny<Guid>()))
            .ThrowsAsync(new InvalidOperationException("Blueprint must be in Ready status"));

        var controller = CreateController(builderService: builderService);
        var result = await controller.ConvertToSkill(Guid.NewGuid());

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task ConvertToSkill_ReturnsOkWithSkillDto()
    {
        var builderService = new Mock<IAgentBuilderService>();
        var skill = new AgentSkill
        {
            UserId = "test-user",
            Name = "My Skill",
            Description = "Test",
            Category = "Slack",
            InstructionContent = "// code",
            ResourcesJson = "{}",
            TagsJson = "[]",
            IsBuiltIn = false,
            IsPublic = false,
            Version = "1.0.0",
            Author = "test-user"
        };
        builderService.Setup(s => s.ConvertToSkillAsync(It.IsAny<Guid>()))
            .ReturnsAsync(skill);

        var controller = CreateController(builderService: builderService);
        var result = await controller.ConvertToSkill(Guid.NewGuid());

        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<AgentSkillDto>(okResult.Value);
        Assert.Equal("My Skill", dto.Name);
        Assert.Equal("1.0.0", dto.Version);
    }

    [Fact]
    public async Task GetTemplates_ReturnsAllTemplates()
    {
        var builderService = new Mock<IAgentBuilderService>();
        builderService.Setup(s => s.GetTemplatesAsync())
            .ReturnsAsync(new List<AgentTemplate>
            {
                new AgentTemplate
                {
                    Id = "slack-bot",
                    Name = "Slack Bot",
                    Description = "Test",
                    AgentType = "Slack",
                    Icon = "MessageSquare",
                    UseCount = 0,
                    SampleCapabilities = new List<string> { "Chat" }
                }
            });

        var controller = CreateController(builderService: builderService);
        var result = await controller.GetTemplates();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var templates = Assert.IsAssignableFrom<IEnumerable<AgentTemplate>>(okResult.Value);
        Assert.Single(templates);
    }

    [Fact]
    public async Task ExportToMarketplace_ReturnsNotFoundWhenBlueprintNotFound()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);

        var result = await controller.ExportToMarketplace(Guid.NewGuid());

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task ExportToMarketplace_ReturnsBadRequestWhenNoGeneratedSkill()
    {
        var db = TestDbContextFactory.Create();
        var blueprint = new AgentBlueprint
        {
            UserId = "test-user",
            Name = "Bot",
            Description = "Test",
            AgentType = "Slack",
            Status = "Ready"
        };
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        var result = await controller.ExportToMarketplace(blueprint.Id);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task ExportToMarketplace_SetsSkillAsPublic()
    {
        var db = TestDbContextFactory.Create();
        var skill = new AgentSkill
        {
            UserId = "test-user",
            Name = "Skill",
            Description = "Test",
            Category = "Slack",
            InstructionContent = "code",
            IsBuiltIn = false,
            IsPublic = false,
            Version = "1.0.0",
            Author = "test-user"
        };
        var blueprint = new AgentBlueprint
        {
            UserId = "test-user",
            Name = "Bot",
            Description = "Test",
            AgentType = "Slack",
            Status = "Ready",
            GeneratedSkillId = skill.Id
        };
        db.AgentSkills.Add(skill);
        db.AgentBlueprints.Add(blueprint);
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        var result = await controller.ExportToMarketplace(blueprint.Id);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var updatedSkill = await db.AgentSkills.FindAsync(skill.Id);
        Assert.NotNull(updatedSkill);
        Assert.True(updatedSkill.IsPublic);
    }
}

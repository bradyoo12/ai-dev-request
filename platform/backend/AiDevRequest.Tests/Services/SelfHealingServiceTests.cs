using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class SelfHealingServiceTests
{
    [Fact]
    public void Constructor_ThrowsWhenNoApiKey()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var logger = new Mock<ILogger<SelfHealingService>>();
        var validationService = new Mock<ICodeValidationService>();

        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            Assert.Throws<InvalidOperationException>(() =>
                new SelfHealingService(config, validationService.Object, db, logger.Object));
        }
        finally
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", originalKey);
        }
    }

    [Fact]
    public void Constructor_SucceedsWithApiKey()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<SelfHealingService>>();
        var validationService = new Mock<ICodeValidationService>();

        var service = new SelfHealingService(config, validationService.Object, db, logger.Object);

        Assert.NotNull(service);
    }

    [Fact]
    public async Task ValidateAndFixAsync_PassesOnFirstIteration_WhenCodeIsValid()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();

        // Seed a DevRequest entity
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user",
            Description = "Test project"
        });
        await db.SaveChangesAsync();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<SelfHealingService>>();

        var validationService = new Mock<ICodeValidationService>();
        validationService
            .Setup(v => v.ValidateAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
            .ReturnsAsync(new CodeValidationResult
            {
                IsValid = true,
                Score = 95,
                Issues = new List<CodeIssue>()
            });

        var service = new SelfHealingService(config, validationService.Object, db, logger.Object);

        var files = new Dictionary<string, string>
        {
            ["App.tsx"] = "export default function App() { return <div>Hello</div>; }",
            ["package.json"] = """{"name": "test"}"""
        };

        var result = await service.ValidateAndFixAsync(requestId, files, "react");

        Assert.True(result.Passed);
        Assert.Equal(0, result.IterationsUsed);
        Assert.Equal(2, result.Files.Count);

        // Verify the entity was updated
        var entity = await db.DevRequests.FindAsync(requestId);
        Assert.NotNull(entity);
        Assert.True(entity.ValidationPassed);
    }

    [Fact]
    public async Task ValidateAndFixAsync_RecordsFailure_WhenValidationAlwaysFails()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();

        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user",
            Description = "Test project"
        });
        await db.SaveChangesAsync();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<SelfHealingService>>();

        var validationService = new Mock<ICodeValidationService>();
        validationService
            .Setup(v => v.ValidateAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
            .ReturnsAsync(new CodeValidationResult
            {
                IsValid = false,
                Score = 30,
                Issues = new List<CodeIssue>
                {
                    new CodeIssue
                    {
                        Severity = "error",
                        FilePath = "App.tsx",
                        Description = "Missing component export",
                        SuggestedFix = "Add default export"
                    }
                }
            });

        var service = new SelfHealingService(config, validationService.Object, db, logger.Object);

        var files = new Dictionary<string, string>
        {
            ["App.tsx"] = "function App() {}",
            ["package.json"] = """{"name": "test"}"""
        };

        // With maxIterations=1, it should not attempt fixes (only validate)
        var result = await service.ValidateAndFixAsync(requestId, files, "react", maxIterations: 1);

        Assert.False(result.Passed);
        Assert.Equal(1, result.IterationsUsed);
        Assert.Single(result.FixHistory);
        Assert.Contains("Max iterations reached", result.FixHistory[0].FixDescription);
    }

    [Fact]
    public async Task ValidateAndFixAsync_HandlesNonExistentEntity_Gracefully()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid(); // No entity in DB

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<SelfHealingService>>();

        var validationService = new Mock<ICodeValidationService>();
        validationService
            .Setup(v => v.ValidateAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
            .ReturnsAsync(new CodeValidationResult
            {
                IsValid = true,
                Score = 100,
                Issues = new List<CodeIssue>()
            });

        var service = new SelfHealingService(config, validationService.Object, db, logger.Object);

        var files = new Dictionary<string, string>
        {
            ["App.tsx"] = "export default function App() { return <div>Hello</div>; }"
        };

        // Should not throw even if entity doesn't exist
        var result = await service.ValidateAndFixAsync(requestId, files, "react");

        Assert.True(result.Passed);
    }

    [Fact]
    public async Task ValidateAndFixAsync_ReturnsOriginalFiles_WhenPassesImmediately()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();

        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user",
            Description = "Test"
        });
        await db.SaveChangesAsync();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<SelfHealingService>>();

        var validationService = new Mock<ICodeValidationService>();
        validationService
            .Setup(v => v.ValidateAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
            .ReturnsAsync(new CodeValidationResult { IsValid = true, Score = 100, Issues = new() });

        var service = new SelfHealingService(config, validationService.Object, db, logger.Object);

        var originalFiles = new Dictionary<string, string>
        {
            ["main.dart"] = "void main() => runApp(MyApp());",
            ["pubspec.yaml"] = "name: test"
        };

        var result = await service.ValidateAndFixAsync(requestId, originalFiles, "flutter");

        // Files should be unchanged
        Assert.Equal("void main() => runApp(MyApp());", result.Files["main.dart"]);
        Assert.Equal("name: test", result.Files["pubspec.yaml"]);
    }
}

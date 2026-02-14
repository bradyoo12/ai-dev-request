using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class SelfHealingTestServiceTests
{
    private static IConfiguration CreateConfig(string? apiKey = "test-api-key") =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(apiKey != null
                ? new Dictionary<string, string?> { ["Anthropic:ApiKey"] = apiKey }
                : new Dictionary<string, string?>())
            .Build();

    [Fact]
    public void Constructor_ThrowsWhenNoApiKey()
    {
        var db = TestDbContextFactory.Create();
        var config = CreateConfig(null);
        var logger = new Mock<ILogger<SelfHealingTestService>>();

        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            Assert.Throws<InvalidOperationException>(() =>
                new SelfHealingTestService(db, config, logger.Object));
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
        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();

        var service = new SelfHealingTestService(db, config, logger.Object);

        Assert.NotNull(service);
    }

    [Fact]
    public async Task GetLatestResult_ReturnsLatestByVersion()
    {
        var db = TestDbContextFactory.Create();
        var devRequestId = Guid.NewGuid();

        db.SelfHealingTestResults.AddRange(
            new SelfHealingTestResult { DevRequestId = devRequestId, Status = "completed", AnalysisVersion = 1 },
            new SelfHealingTestResult { DevRequestId = devRequestId, Status = "completed", AnalysisVersion = 3 },
            new SelfHealingTestResult { DevRequestId = devRequestId, Status = "completed", AnalysisVersion = 2 }
        );
        await db.SaveChangesAsync();

        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();
        var service = new SelfHealingTestService(db, config, logger.Object);

        var result = await service.GetLatestResult(devRequestId);

        Assert.NotNull(result);
        Assert.Equal(3, result.AnalysisVersion);
    }

    [Fact]
    public async Task GetLatestResult_ReturnsNull_WhenNoResults()
    {
        var db = TestDbContextFactory.Create();
        var devRequestId = Guid.NewGuid();

        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();
        var service = new SelfHealingTestService(db, config, logger.Object);

        var result = await service.GetLatestResult(devRequestId);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetHistory_ReturnsOrderedByVersionDescending()
    {
        var db = TestDbContextFactory.Create();
        var devRequestId = Guid.NewGuid();

        db.SelfHealingTestResults.AddRange(
            new SelfHealingTestResult { DevRequestId = devRequestId, Status = "completed", AnalysisVersion = 1 },
            new SelfHealingTestResult { DevRequestId = devRequestId, Status = "completed", AnalysisVersion = 3 },
            new SelfHealingTestResult { DevRequestId = devRequestId, Status = "failed", AnalysisVersion = 2 }
        );
        await db.SaveChangesAsync();

        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();
        var service = new SelfHealingTestService(db, config, logger.Object);

        var history = await service.GetHistory(devRequestId);

        Assert.Equal(3, history.Count);
        Assert.Equal(3, history[0].AnalysisVersion);
        Assert.Equal(2, history[1].AnalysisVersion);
        Assert.Equal(1, history[2].AnalysisVersion);
    }

    [Fact]
    public async Task GetHistory_ReturnsEmpty_WhenNoResults()
    {
        var db = TestDbContextFactory.Create();
        var devRequestId = Guid.NewGuid();

        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();
        var service = new SelfHealingTestService(db, config, logger.Object);

        var history = await service.GetHistory(devRequestId);

        Assert.Empty(history);
    }

    [Fact]
    public async Task GetHistory_OnlyReturnsResultsForSpecifiedDevRequest()
    {
        var db = TestDbContextFactory.Create();
        var devRequestId1 = Guid.NewGuid();
        var devRequestId2 = Guid.NewGuid();

        db.SelfHealingTestResults.AddRange(
            new SelfHealingTestResult { DevRequestId = devRequestId1, Status = "completed", AnalysisVersion = 1 },
            new SelfHealingTestResult { DevRequestId = devRequestId2, Status = "completed", AnalysisVersion = 1 },
            new SelfHealingTestResult { DevRequestId = devRequestId1, Status = "completed", AnalysisVersion = 2 }
        );
        await db.SaveChangesAsync();

        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();
        var service = new SelfHealingTestService(db, config, logger.Object);

        var history = await service.GetHistory(devRequestId1);

        Assert.Equal(2, history.Count);
        Assert.All(history, r => Assert.Equal(devRequestId1, r.DevRequestId));
    }

    [Fact]
    public async Task GetHealingTimelineAsync_ParsesHealedAndFailedEntries()
    {
        var db = TestDbContextFactory.Create();
        var devRequestId = Guid.NewGuid();

        db.SelfHealingTestResults.Add(new SelfHealingTestResult
        {
            DevRequestId = devRequestId,
            Status = "completed",
            AnalysisVersion = 1,
            HealedTestsJson = """[{"testName":"test1","filePath":"test.spec.ts","originalCode":".old","fixedCode":"[data-testid='new']","confidence":90,"reason":"Used data-testid"}]""",
            FailedTestDetailsJson = """[{"testName":"test2","filePath":"test.spec.ts","errorMessage":"Element not found","stackTrace":"at line 10"}]""",
        });
        await db.SaveChangesAsync();

        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();
        var service = new SelfHealingTestService(db, config, logger.Object);

        var timeline = await service.GetHealingTimelineAsync(devRequestId);

        Assert.Equal(2, timeline.Count);
        Assert.Contains(timeline, e => e.Action == "healed" && e.TestName == "test1");
        Assert.Contains(timeline, e => e.Action == "failed" && e.TestName == "test2");
    }

    [Fact]
    public async Task GetHealingTimelineAsync_ReturnsEmpty_WhenNoResults()
    {
        var db = TestDbContextFactory.Create();
        var devRequestId = Guid.NewGuid();

        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();
        var service = new SelfHealingTestService(db, config, logger.Object);

        var timeline = await service.GetHealingTimelineAsync(devRequestId);

        Assert.Empty(timeline);
    }

    [Fact]
    public async Task GetHealingTimelineAsync_HandlesMalformedJson()
    {
        var db = TestDbContextFactory.Create();
        var devRequestId = Guid.NewGuid();

        db.SelfHealingTestResults.Add(new SelfHealingTestResult
        {
            DevRequestId = devRequestId,
            Status = "completed",
            AnalysisVersion = 1,
            HealedTestsJson = "not valid json",
            FailedTestDetailsJson = "also not valid json",
        });
        await db.SaveChangesAsync();

        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();
        var service = new SelfHealingTestService(db, config, logger.Object);

        var timeline = await service.GetHealingTimelineAsync(devRequestId);

        Assert.Empty(timeline);
    }

    [Fact]
    public async Task GetHealingTimelineAsync_HandlesNullJsonFields()
    {
        var db = TestDbContextFactory.Create();
        var devRequestId = Guid.NewGuid();

        db.SelfHealingTestResults.Add(new SelfHealingTestResult
        {
            DevRequestId = devRequestId,
            Status = "completed",
            AnalysisVersion = 1,
            HealedTestsJson = null,
            FailedTestDetailsJson = null,
        });
        await db.SaveChangesAsync();

        var config = CreateConfig();
        var logger = new Mock<ILogger<SelfHealingTestService>>();
        var service = new SelfHealingTestService(db, config, logger.Object);

        var timeline = await service.GetHealingTimelineAsync(devRequestId);

        Assert.Empty(timeline);
    }
}

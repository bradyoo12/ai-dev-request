using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class TranslationSeedControllerTests
{
    private TranslationSeedController CreateController(AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<TranslationSeedController>>();
        return new TranslationSeedController(db, logger.Object);
    }

    [Fact]
    public async Task SeedTranslations_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.SeedTranslations("ko", new Dictionary<string, string>
        {
            { "hero.title", "Test Title" },
            { "hero.subtitle", "Test Subtitle" }
        });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task SeedTranslations_SkipsWhenAlreadySeeded()
    {
        var db = TestDbContextFactory.Create();
        db.Translations.Add(new Translation { LanguageCode = "ko", Namespace = "hero", Key = "title", Value = "Existing" });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.SeedTranslations("ko", new Dictionary<string, string>
        {
            { "hero.title", "New Title" }
        });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task SeedTranslations_SkipsInvalidKeys()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.SeedTranslations("en", new Dictionary<string, string>
        {
            { "invalidkey", "Value without namespace" },
            { "valid.key", "Valid value" }
        });

        Assert.IsType<OkObjectResult>(result);
    }
}

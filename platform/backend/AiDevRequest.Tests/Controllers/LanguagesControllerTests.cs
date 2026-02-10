using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class LanguagesControllerTests
{
    private LanguagesController CreateController(AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<LanguagesController>>();
        return new LanguagesController(db, logger.Object);
    }

    [Fact]
    public async Task GetLanguages_ReturnsOk()
    {
        // DB has seed data (ko, en), so it returns OK with at least 2 languages
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);

        var result = await controller.GetLanguages();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var languages = Assert.IsAssignableFrom<IEnumerable<LanguageDto>>(okResult.Value);
        Assert.True(languages.Count() >= 2);
    }

    [Fact]
    public async Task GetLanguages_ReturnsOnlyActiveLanguages()
    {
        // Seed data has 2 active languages (ko, en). Add an inactive one.
        var db = TestDbContextFactory.Create();
        db.Languages.Add(new Language { Code = "ja", Name = "Japanese", NativeName = "Japanese", IsDefault = false, IsActive = false });
        await db.SaveChangesAsync();

        var controller = CreateController(db);

        var result = await controller.GetLanguages();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var languages = Assert.IsAssignableFrom<IEnumerable<LanguageDto>>(okResult.Value);
        // Only active languages should be returned (2 seeded active + 0 from newly added inactive)
        Assert.Equal(2, languages.Count());
        Assert.DoesNotContain(languages, l => l.Code == "ja");
    }

    [Fact]
    public async Task GetAllLanguages_ReturnsAllLanguages()
    {
        // Seed data has 2 languages (ko, en). Add one more inactive.
        var db = TestDbContextFactory.Create();
        db.Languages.Add(new Language { Code = "ja", Name = "Japanese", NativeName = "Japanese", IsDefault = false, IsActive = false });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetAllLanguages();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var languages = Assert.IsAssignableFrom<IEnumerable<AdminLanguageDto>>(okResult.Value);
        // All languages including inactive (2 seeded + 1 added)
        Assert.Equal(3, languages.Count());
    }

    [Fact]
    public async Task CreateLanguage_ReturnsConflict_WhenExists()
    {
        // ko is already seeded
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateLanguage(new CreateLanguageDto { Code = "ko", Name = "Korean", NativeName = "Korean" });

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateLanguage_ReturnsCreated_WhenNew()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateLanguage(new CreateLanguageDto { Code = "fr", Name = "French", NativeName = "Francais" });

        Assert.IsType<CreatedAtActionResult>(result.Result);
    }

    [Fact]
    public async Task UpdateLanguage_ReturnsNotFound_WhenMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.UpdateLanguage("zz", new UpdateLanguageDto { Name = "Unknown" });

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task DeleteLanguage_ReturnsNotFound_WhenMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteLanguage("zz");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task DeleteLanguage_ReturnsBadRequest_WhenDefault()
    {
        // ko is already seeded as default
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteLanguage("ko");

        Assert.IsType<BadRequestObjectResult>(result);
    }
}

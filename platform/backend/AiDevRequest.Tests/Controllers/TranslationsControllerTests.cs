using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class TranslationsControllerTests
{
    private TranslationsController CreateController(AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<TranslationsController>>();
        return new TranslationsController(db, logger.Object);
    }

    [Fact]
    public async Task GetTranslations_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);

        var result = await controller.GetTranslations("ko");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var translations = Assert.IsAssignableFrom<Dictionary<string, string>>(okResult.Value);
        Assert.Empty(translations);
    }

    [Fact]
    public async Task GetTranslations_ReturnsFlatKeyValues()
    {
        var db = TestDbContextFactory.Create();
        db.Translations.Add(new Translation { LanguageCode = "ko", Namespace = "hero", Key = "title", Value = "Test Title" });
        db.Translations.Add(new Translation { LanguageCode = "ko", Namespace = "hero", Key = "subtitle", Value = "Test Subtitle" });
        await db.SaveChangesAsync();

        var controller = CreateController(db);

        var result = await controller.GetTranslations("ko");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var translations = Assert.IsAssignableFrom<Dictionary<string, string>>(okResult.Value);
        Assert.Equal(2, translations.Count);
        Assert.Equal("Test Title", translations["hero.title"]);
    }

    [Fact]
    public async Task GetTranslationsForAdmin_ReturnsOk_WhenDefaultLangExists()
    {
        var db = TestDbContextFactory.Create();
        db.Languages.Add(new Language { Code = "ko", Name = "Korean", NativeName = "Korean", IsDefault = true, IsActive = true });
        db.Translations.Add(new Translation { LanguageCode = "ko", Namespace = "hero", Key = "title", Value = "Title" });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTranslationsForAdmin("en");

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateTranslations_ReturnsNotFound_WhenLanguageMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.UpdateTranslations("zz", new BulkUpdateTranslationsDto());

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task UpdateTranslations_ReturnsNoContent_WhenValid()
    {
        var db = TestDbContextFactory.Create();
        db.Languages.Add(new Language { Code = "en", Name = "English", NativeName = "English", IsDefault = false, IsActive = true });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.UpdateTranslations("en", new BulkUpdateTranslationsDto
        {
            Translations = new List<TranslationUpdateItem>
            {
                new() { Namespace = "hero", Key = "title", Value = "Hello" }
            }
        });

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task ImportTranslations_ReturnsNotFound_WhenLanguageMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ImportTranslations("zz", new Dictionary<string, string>());

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task ImportTranslations_ReturnsOk_WhenValid()
    {
        var db = TestDbContextFactory.Create();
        db.Languages.Add(new Language { Code = "en", Name = "English", NativeName = "English", IsDefault = false, IsActive = true });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ImportTranslations("en", new Dictionary<string, string>
        {
            { "hero.title", "Hello World" }
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var importResult = Assert.IsType<ImportResultDto>(okResult.Value);
        Assert.Equal(1, importResult.Imported);
    }

    [Fact]
    public async Task GetNamespaces_ReturnsOk()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);

        var result = await controller.GetNamespaces();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task ExportTranslations_ReturnsOk()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ExportTranslations("ko");

        Assert.IsType<OkObjectResult>(result.Result);
    }
}

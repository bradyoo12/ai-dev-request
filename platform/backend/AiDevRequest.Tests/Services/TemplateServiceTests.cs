using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class TemplateServiceTests
{
    private TemplateService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<TemplateService>>();
        return new TemplateService(db, logger.Object);
    }

    [Fact]
    public async Task GetTemplatesAsync_ReturnsAllTemplates()
    {
        var db = TestDbContextFactory.Create();
        db.ProjectTemplates.Add(new ProjectTemplate
        {
            Name = "Template1",
            Description = "Desc1",
            Category = "web",
            Framework = "react",
            Tags = "react,web",
            PromptTemplate = "prompt1",
            CreatedBy = "admin"
        });
        db.ProjectTemplates.Add(new ProjectTemplate
        {
            Name = "Template2",
            Description = "Desc2",
            Category = "mobile",
            Framework = "flutter",
            Tags = "flutter,mobile",
            PromptTemplate = "prompt2",
            CreatedBy = "admin"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var templates = await service.GetTemplatesAsync(null, null);

        Assert.Equal(2, templates.Count);
    }

    [Fact]
    public async Task GetTemplatesAsync_FiltersByCategory()
    {
        var db = TestDbContextFactory.Create();
        db.ProjectTemplates.Add(new ProjectTemplate
        {
            Name = "WebTemplate",
            Description = "Desc",
            Category = "web",
            Framework = "react",
            Tags = "react",
            PromptTemplate = "prompt",
            CreatedBy = "admin"
        });
        db.ProjectTemplates.Add(new ProjectTemplate
        {
            Name = "MobileTemplate",
            Description = "Desc",
            Category = "mobile",
            Framework = "flutter",
            Tags = "flutter",
            PromptTemplate = "prompt",
            CreatedBy = "admin"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var templates = await service.GetTemplatesAsync("web", null);

        Assert.Single(templates);
        Assert.Equal("WebTemplate", templates[0].Name);
    }

    [Fact]
    public async Task GetTemplateAsync_ReturnsTemplate()
    {
        var db = TestDbContextFactory.Create();
        var template = new ProjectTemplate
        {
            Name = "Template1",
            Description = "Desc",
            Category = "web",
            Framework = "react",
            Tags = "react",
            PromptTemplate = "prompt",
            CreatedBy = "admin"
        };
        db.ProjectTemplates.Add(template);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetTemplateAsync(template.Id);

        Assert.NotNull(result);
        Assert.Equal("Template1", result!.Name);
    }

    [Fact]
    public async Task GetTemplateAsync_ReturnsNullForNonExistent()
    {
        var service = CreateService();
        var result = await service.GetTemplateAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task IncrementUsageAsync_IncrementsCount()
    {
        var db = TestDbContextFactory.Create();
        var template = new ProjectTemplate
        {
            Name = "Template1",
            Description = "Desc",
            Category = "web",
            Framework = "react",
            Tags = "react",
            PromptTemplate = "prompt",
            CreatedBy = "admin",
            UsageCount = 5
        };
        db.ProjectTemplates.Add(template);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.IncrementUsageAsync(template.Id);

        var updated = await service.GetTemplateAsync(template.Id);
        Assert.Equal(6, updated!.UsageCount);
    }
}

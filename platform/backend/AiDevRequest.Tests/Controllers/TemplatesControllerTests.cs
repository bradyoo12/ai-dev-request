using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class TemplatesControllerTests
{
    private TemplatesController CreateController(Mock<ITemplateService>? templateService = null)
    {
        templateService ??= new Mock<ITemplateService>();
        return new TemplatesController(templateService.Object);
    }

    [Fact]
    public async Task GetTemplates_ReturnsOk()
    {
        var templateService = new Mock<ITemplateService>();
        templateService.Setup(s => s.GetTemplatesAsync(It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync(new List<ProjectTemplate>
            {
                new() { Name = "Template1", Description = "D", Category = "web", Framework = "react", Tags = "react,web", PromptTemplate = "p", CreatedBy = "admin" }
            });

        var controller = CreateController(templateService);
        var result = await controller.GetTemplates();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var templates = Assert.IsType<List<TemplateDto>>(okResult.Value);
        Assert.Single(templates);
    }

    [Fact]
    public async Task GetTemplate_ReturnsNotFound_WhenNull()
    {
        var templateService = new Mock<ITemplateService>();
        templateService.Setup(s => s.GetTemplateAsync(It.IsAny<Guid>()))
            .ReturnsAsync((ProjectTemplate?)null);

        var controller = CreateController(templateService);
        var result = await controller.GetTemplate(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetTemplate_ReturnsOk_WhenFound()
    {
        var templateService = new Mock<ITemplateService>();
        templateService.Setup(s => s.GetTemplateAsync(It.IsAny<Guid>()))
            .ReturnsAsync(new ProjectTemplate
            {
                Name = "Template1",
                Description = "D",
                Category = "web",
                Framework = "react",
                Tags = "react,web",
                PromptTemplate = "p",
                CreatedBy = "admin"
            });

        var controller = CreateController(templateService);
        var result = await controller.GetTemplate(Guid.NewGuid());

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<TemplateDto>(okResult.Value);
    }
}

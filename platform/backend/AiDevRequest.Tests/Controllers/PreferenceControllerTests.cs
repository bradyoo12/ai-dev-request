using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class PreferenceControllerTests
{
    private PreferenceController CreateController(Mock<IPreferenceService>? service = null)
    {
        service ??= new Mock<IPreferenceService>();
        return new PreferenceController(service.Object);
    }

    [Fact]
    public async Task GetPreferences_ReturnsOk()
    {
        var service = new Mock<IPreferenceService>();
        service.Setup(s => s.GetPreferencesAsync(It.IsAny<string>(), It.IsAny<string?>()))
            .ReturnsAsync(new List<UserPreference>());
        service.Setup(s => s.GetPreferenceCountAsync(It.IsAny<string>()))
            .ReturnsAsync(0);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetPreferences();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task SetPreference_ReturnsOk()
    {
        var service = new Mock<IPreferenceService>();
        service.Setup(s => s.SetPreferenceAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double>(), It.IsAny<string>()))
            .ReturnsAsync(new UserPreference { Id = 1, Category = "ui", Key = "theme", Value = "dark", UserId = "user1", Source = "manual" });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.SetPreference(new SetPreferenceDto { Category = "ui", Key = "theme", Value = "dark" });

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task DeletePreference_ReturnsOk()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeletePreference(1);

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task GetSummary_ReturnsOk()
    {
        var service = new Mock<IPreferenceService>();
        service.Setup(s => s.GetSummaryAsync(It.IsAny<string>()))
            .ReturnsAsync(new UserPreferenceSummary { UserId = "user1", SummaryText = "Prefers dark mode" });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetSummary();

        Assert.IsType<OkObjectResult>(result.Result);
    }
}

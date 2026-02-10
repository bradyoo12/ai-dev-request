using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class WhiteLabelControllerTests
{
    private WhiteLabelController CreateController(Mock<IWhiteLabelService>? service = null)
    {
        service ??= new Mock<IWhiteLabelService>();
        return new WhiteLabelController(service.Object);
    }

    [Fact]
    public async Task GetTenants_ReturnsOk()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.GetTenantsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<WhiteLabelTenant>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTenants();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetTenant_ReturnsNotFound_WhenNull()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.GetTenantAsync(It.IsAny<int>(), It.IsAny<string>()))
            .ReturnsAsync((WhiteLabelTenant?)null);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTenant(999);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task CreateTenant_ReturnsOk()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.CreateTenantAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new WhiteLabelTenant { Id = 1, Name = "Test", Slug = "test", UserId = "user1" });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateTenant(new CreateTenantDto("Test", "test"));

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task CreateTenant_ReturnsBadRequest_OnDuplicate()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.CreateTenantAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Already exists"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateTenant(new CreateTenantDto("Test", "test"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task DeleteTenant_ReturnsOk_WhenDeleted()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.DeleteTenantAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(true);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteTenant(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task DeleteTenant_ReturnsNotFound_WhenNotDeleted()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.DeleteTenantAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(false);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteTenant(999);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetPartners_ReturnsOk()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.GetPartnersAsync(It.IsAny<int>(), It.IsAny<string>()))
            .ReturnsAsync(new List<ResellerPartner>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetPartners(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task AddPartner_ReturnsOk()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.AddPartnerAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<decimal>()))
            .ReturnsAsync(new ResellerPartner { Id = 1, TenantId = 1, CompanyName = "Partner1", UserId = "user1" });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.AddPartner(1, new AddPartnerDto("Partner1", "a@b.com", 10m));

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task RemovePartner_ReturnsNotFound_WhenNotFound()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.RemovePartnerAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(false);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RemovePartner(999);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetUsage_ReturnsOk()
    {
        var service = new Mock<IWhiteLabelService>();
        service.Setup(s => s.GetUsageAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>()))
            .ReturnsAsync(new List<TenantUsage>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetUsage(1, null, null);

        Assert.IsType<OkObjectResult>(result);
    }
}

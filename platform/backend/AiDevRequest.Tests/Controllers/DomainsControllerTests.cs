using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class DomainsControllerTests
{
    private DomainsController CreateController(
        Mock<IDomainService>? domainService = null,
        Mock<IDeploymentService>? deploymentService = null)
    {
        domainService ??= new Mock<IDomainService>();
        deploymentService ??= new Mock<IDeploymentService>();
        var logger = new Mock<ILogger<DomainsController>>();
        return new DomainsController(domainService.Object, deploymentService.Object, logger.Object);
    }

    [Fact]
    public async Task SearchDomains_ReturnsBadRequest_WhenEmptyQuery()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.SearchDomains("", null);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task SearchDomains_ReturnsOk()
    {
        var domainService = new Mock<IDomainService>();
        domainService.Setup(s => s.SearchDomainsAsync(It.IsAny<string>(), It.IsAny<string[]?>()))
            .ReturnsAsync(new List<DomainSearchResult>());

        var controller = CreateController(domainService: domainService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.SearchDomains("example", null);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetUserDomains_ReturnsOk()
    {
        var domainService = new Mock<IDomainService>();
        domainService.Setup(s => s.GetUserDomainsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<Domain>());

        var controller = CreateController(domainService: domainService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetUserDomains();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetSiteDomain_ReturnsNotFound_WhenNull()
    {
        var domainService = new Mock<IDomainService>();
        domainService.Setup(s => s.GetDomainByDeploymentAsync(It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync((Domain?)null);

        var controller = CreateController(domainService: domainService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetSiteDomain(Guid.NewGuid());

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task PurchaseDomain_ReturnsNotFound_WhenNoDeployment()
    {
        var deploymentService = new Mock<IDeploymentService>();
        deploymentService.Setup(s => s.GetDeploymentAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Deployment?)null);

        var controller = CreateController(deploymentService: deploymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.PurchaseDomain(Guid.NewGuid(), new PurchaseDomainDto
        {
            DomainName = "example",
            Tld = "com",
            PriceUsd = 12.99m
        });

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task RemoveDomain_ReturnsNotFound_WhenNoDomain()
    {
        var domainService = new Mock<IDomainService>();
        domainService.Setup(s => s.GetDomainByDeploymentAsync(It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync((Domain?)null);

        var controller = CreateController(domainService: domainService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RemoveDomain(Guid.NewGuid());

        Assert.IsType<NotFoundObjectResult>(result);
    }
}

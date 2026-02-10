using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class MemoryControllerTests
{
    private MemoryController CreateController(Mock<IMemoryService>? memoryService = null)
    {
        memoryService ??= new Mock<IMemoryService>();
        return new MemoryController(memoryService.Object);
    }

    [Fact]
    public async Task GetMemories_ReturnsOk()
    {
        var memoryService = new Mock<IMemoryService>();
        memoryService.Setup(s => s.GetAllMemoriesAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(new List<UserMemory>());
        memoryService.Setup(s => s.GetMemoryCountAsync(It.IsAny<string>()))
            .ReturnsAsync(0);

        var controller = CreateController(memoryService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetMemories();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<MemoryListDto>(okResult.Value);
    }

    [Fact]
    public async Task AddMemory_ReturnsOk()
    {
        var memoryService = new Mock<IMemoryService>();
        memoryService.Setup(s => s.AddMemoryAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<MemoryScope>(), It.IsAny<string?>()))
            .ReturnsAsync(new UserMemory { Id = 1, Content = "Test", Category = "general", UserId = "user1", Scope = MemoryScope.User });

        var controller = CreateController(memoryService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.AddMemory(new AddMemoryDto { Content = "Test", Category = "general" });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<MemoryDto>(okResult.Value);
    }

    [Fact]
    public async Task DeleteMemory_ReturnsOk()
    {
        var memoryService = new Mock<IMemoryService>();
        var controller = CreateController(memoryService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteMemory(1);

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task DeleteAllMemories_ReturnsOk()
    {
        var memoryService = new Mock<IMemoryService>();
        var controller = CreateController(memoryService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteAllMemories();

        Assert.IsType<OkResult>(result);
    }
}

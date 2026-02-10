using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class RefinementControllerTests
{
    private RefinementController CreateController(
        Mock<IRefinementService>? refinementService = null,
        Mock<ITokenService>? tokenService = null,
        AiDevRequestDbContext? db = null)
    {
        refinementService ??= new Mock<IRefinementService>();
        tokenService ??= new Mock<ITokenService>();
        db ??= TestDbContextFactory.Create();

        return new RefinementController(refinementService.Object, tokenService.Object, db);
    }

    [Fact]
    public async Task GetHistory_ReturnsNotFound_WhenRequestMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetHistory(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetHistory_ReturnsOk_WhenRequestExists()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test",
            Status = RequestStatus.Analyzed
        });
        await db.SaveChangesAsync();

        var refinementService = new Mock<IRefinementService>();
        refinementService.Setup(s => s.GetHistoryAsync(requestId))
            .ReturnsAsync(new List<RefinementMessage>());

        var controller = CreateController(refinementService: refinementService, db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetHistory(requestId);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task SendMessage_ReturnsBadRequest_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.SendMessage(Guid.NewGuid(), new SendMessageRequest { Message = "" });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task SendMessage_ReturnsNotFound_WhenRequestMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.SendMessage(Guid.NewGuid(), new SendMessageRequest { Message = "Hello" });

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task ApplyChanges_ReturnsBadRequest_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ApplyChanges(Guid.NewGuid(), new ApplyChangesRequest { MessageContent = "" });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task ApplyChanges_ReturnsNotFound_WhenRequestMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ApplyChanges(Guid.NewGuid(), new ApplyChangesRequest { MessageContent = "some code" });

        Assert.IsType<NotFoundResult>(result);
    }
}

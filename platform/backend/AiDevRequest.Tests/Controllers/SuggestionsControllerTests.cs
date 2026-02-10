using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class SuggestionsControllerTests
{
    private SuggestionsController CreateController(
        AiDevRequestDbContext? db = null,
        Mock<ITokenService>? tokenService = null)
    {
        db ??= TestDbContextFactory.Create();
        tokenService ??= new Mock<ITokenService>();
        var logger = new Mock<ILogger<SuggestionsController>>();

        return new SuggestionsController(db, tokenService.Object, logger.Object);
    }

    [Fact]
    public async Task GetSuggestions_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetSuggestions();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetSuggestion_ReturnsNotFound_WhenMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetSuggestion(999);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task CreateSuggestion_ReturnsBadRequest_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateSuggestion(new CreateSuggestionRequest { Title = "", Description = "" });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task CreateSuggestion_ReturnsOk_WhenValid()
    {
        var db = TestDbContextFactory.Create();
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.CreditTokens(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ReturnsAsync(new TokenTransaction { Id = 1, UserId = "test-user-id", Type = "credit", Amount = 50, Action = "suggestion_registered", BalanceAfter = 550 });
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 550 });

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateSuggestion(new CreateSuggestionRequest
        {
            Title = "New Feature",
            Description = "A great feature idea"
        });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task VoteSuggestion_ReturnsNotFound_WhenMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.VoteSuggestion(999);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task AddComment_ReturnsBadRequest_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.AddComment(1, new AddCommentRequest { Content = "" });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task AddComment_ReturnsNotFound_WhenSuggestionMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.AddComment(999, new AddCommentRequest { Content = "Great idea!" });

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task UpdateStatus_ReturnsNotFound_WhenSuggestionMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.UpdateStatus(999, new UpdateStatusRequest { Status = "in_progress" });

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetComments_ReturnsOk()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetComments(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetVoteStatus_ReturnsOk()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetVoteStatus(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetStatusHistory_ReturnsOk()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetStatusHistory(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAdminSuggestions_ReturnsOk()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetAdminSuggestions();

        Assert.IsType<OkObjectResult>(result);
    }
}

using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class AuthControllerTests
{
    private AuthController CreateController(
        Mock<IAuthService>? authService = null,
        Mock<ISocialAuthService>? socialAuthService = null)
    {
        authService ??= new Mock<IAuthService>();
        socialAuthService ??= new Mock<ISocialAuthService>();
        var logger = new Mock<ILogger<AuthController>>();
        return new AuthController(authService.Object, socialAuthService.Object, logger.Object);
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenEmailEmpty()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = "", Password = "password123" });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenPasswordTooShort()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = "test@test.com", Password = "short" });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Register_ReturnsOk_WhenSuccessful()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.RegisterAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync((new User { Id = "1", Email = "test@test.com" }, "jwt-token"));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = "test@test.com", Password = "password123" });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<AuthResponseDto>(okResult.Value);
        Assert.Equal("jwt-token", response.Token);
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenDuplicateEmail()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.RegisterAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ThrowsAsync(new InvalidOperationException("Email already exists"));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = "test@test.com", Password = "password123" });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_ReturnsBadRequest_WhenEmailEmpty()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Login(new LoginRequestDto { Email = "", Password = "pass" });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_ReturnsOk_WhenSuccessful()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.LoginAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((new User { Id = "1", Email = "test@test.com" }, "jwt-token"));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Login(new LoginRequestDto { Email = "test@test.com", Password = "password123" });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<AuthResponseDto>(okResult.Value);
    }

    [Fact]
    public async Task Login_ReturnsUnauthorized_WhenInvalidCredentials()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.LoginAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Invalid credentials"));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Login(new LoginRequestDto { Email = "test@test.com", Password = "wrong" });

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetMe_ReturnsUnauthorized_WhenNoUserId()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.GetMe();

        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task GetMe_ReturnsOk_WhenAuthenticated()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.GetUserAsync("test-user-id"))
            .ReturnsAsync(new User { Id = "test-user-id", Email = "test@test.com" });

        var controller = CreateController(authService);
        ControllerTestHelper.SetupUser(controller, "test-user-id");

        var result = await controller.GetMe();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<UserDto>(okResult.Value);
    }

    [Fact]
    public void GetProviders_ReturnsOk()
    {
        var socialAuthService = new Mock<ISocialAuthService>();
        socialAuthService.Setup(s => s.GetOrderedProviders(It.IsAny<string?>()))
            .Returns(new[] { "google", "kakao" });

        var controller = CreateController(socialAuthService: socialAuthService);
        ControllerTestHelper.SetupAnonymous(controller);
        controller.ControllerContext.HttpContext.Request.Headers.AcceptLanguage = "en";

        var result = controller.GetProviders();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<ProvidersResponseDto>(okResult.Value);
    }
}

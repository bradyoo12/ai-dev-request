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

    // ===== Register =====

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenEmailEmpty()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = "", Password = "password123" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenPasswordEmpty()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = "test@test.com", Password = "" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenPasswordTooShort()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = "test@test.com", Password = "short" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData("", "password123")]
    [InlineData("test@test.com", "")]
    [InlineData("  ", "password123")]
    [InlineData("test@test.com", "   ")]
    public async Task Register_ReturnsBadRequest_WhenInputInvalid(string email, string password)
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = email, Password = password });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_ReturnsOk_WhenSuccessful()
    {
        var authService = new Mock<IAuthService>();
        var testUser = new User { Id = "user-1", Email = "test@test.com", DisplayName = "Test User" };
        authService.Setup(s => s.RegisterAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync((testUser, "jwt-token-123"));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto
        {
            Email = "test@test.com",
            Password = "password123",
            DisplayName = "Test User"
        });

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Token.Should().Be("jwt-token-123");
        response.User.Email.Should().Be("test@test.com");
        response.User.Id.Should().Be("user-1");
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenDuplicateEmail()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.RegisterAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ThrowsAsync(new InvalidOperationException("An account with this email already exists."));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = "test@test.com", Password = "password123" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_Returns500_WhenUnexpectedException()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.RegisterAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Register(new RegisterRequestDto { Email = "test@test.com", Password = "password123" });

        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task Register_PassesAnonymousUserId_ToService()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.RegisterAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync((new User { Id = "1", Email = "test@test.com" }, "jwt-token"));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        await controller.Register(new RegisterRequestDto
        {
            Email = "test@test.com",
            Password = "password123",
            AnonymousUserId = "anon-123"
        });

        authService.Verify(s => s.RegisterAsync("test@test.com", "password123", null, "anon-123"), Times.Once);
    }

    // ===== Login =====

    [Fact]
    public async Task Login_ReturnsBadRequest_WhenEmailEmpty()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Login(new LoginRequestDto { Email = "", Password = "pass" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Login_ReturnsBadRequest_WhenPasswordEmpty()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Login(new LoginRequestDto { Email = "test@test.com", Password = "" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Login_ReturnsOk_WhenSuccessful()
    {
        var authService = new Mock<IAuthService>();
        var testUser = new User { Id = "1", Email = "test@test.com", IsAdmin = true };
        authService.Setup(s => s.LoginAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((testUser, "jwt-token"));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Login(new LoginRequestDto { Email = "test@test.com", Password = "password123" });

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Token.Should().Be("jwt-token");
        response.User.IsAdmin.Should().BeTrue();
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

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_Returns500_WhenUnexpectedException()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.LoginAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("DB down"));

        var controller = CreateController(authService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.Login(new LoginRequestDto { Email = "test@test.com", Password = "pass1234" });

        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    // ===== GetMe =====

    [Fact]
    public async Task GetMe_ReturnsUnauthorized_WhenNoUserId()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.GetMe();

        result.Result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task GetMe_ReturnsUnauthorized_WhenUserNotFound()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.GetUserAsync("test-user-id"))
            .ReturnsAsync((User?)null);

        var controller = CreateController(authService);
        ControllerTestHelper.SetupUser(controller, "test-user-id");

        var result = await controller.GetMe();

        result.Result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task GetMe_ReturnsOk_WhenAuthenticated()
    {
        var authService = new Mock<IAuthService>();
        authService.Setup(s => s.GetUserAsync("test-user-id"))
            .ReturnsAsync(new User
            {
                Id = "test-user-id",
                Email = "test@test.com",
                DisplayName = "Test User",
                ProfileImageUrl = "https://example.com/avatar.png",
                IsAdmin = false,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });

        var controller = CreateController(authService);
        ControllerTestHelper.SetupUser(controller, "test-user-id");

        var result = await controller.GetMe();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var user = okResult.Value.Should().BeOfType<UserDto>().Subject;
        user.Id.Should().Be("test-user-id");
        user.Email.Should().Be("test@test.com");
        user.DisplayName.Should().Be("Test User");
        user.ProfileImageUrl.Should().Be("https://example.com/avatar.png");
        user.IsAdmin.Should().BeFalse();
    }

    // ===== Social Login =====

    [Theory]
    [InlineData("github")]
    [InlineData("facebook")]
    [InlineData("twitter")]
    public async Task SocialLogin_ReturnsBadRequest_WhenInvalidProvider(string provider)
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.SocialLogin(provider, new SocialLoginRequestDto { Code = "abc" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task SocialLogin_ReturnsBadRequest_WhenCodeEmpty()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.SocialLogin("google", new SocialLoginRequestDto { Code = "" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData("google")]
    [InlineData("kakao")]
    [InlineData("line")]
    [InlineData("apple")]
    public async Task SocialLogin_ReturnsOk_WhenValidProvider(string provider)
    {
        var socialAuthService = new Mock<ISocialAuthService>();
        socialAuthService.Setup(s => s.SocialLoginAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ReturnsAsync((new User { Id = "1", Email = "test@social.com" }, "social-jwt"));

        var controller = CreateController(socialAuthService: socialAuthService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.SocialLogin(provider, new SocialLoginRequestDto { Code = "auth-code-123" });

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Token.Should().Be("social-jwt");
    }

    [Fact]
    public async Task SocialLogin_ReturnsBadRequest_WhenServiceThrows()
    {
        var socialAuthService = new Mock<ISocialAuthService>();
        socialAuthService.Setup(s => s.SocialLoginAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ThrowsAsync(new Exception("OAuth flow failed"));

        var controller = CreateController(socialAuthService: socialAuthService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.SocialLogin("google", new SocialLoginRequestDto { Code = "bad-code" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ===== GetProviders =====

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

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ProvidersResponseDto>().Subject;
        response.Providers.Should().HaveCount(2);
        response.Providers.Should().Contain("google");
    }

    // ===== GetAuthUrl =====

    [Fact]
    public void GetAuthUrl_ReturnsBadRequest_WhenInvalidProvider()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupAnonymous(controller);

        var result = controller.GetAuthUrl("twitter", "https://callback.com", null);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public void GetAuthUrl_ReturnsOk_WhenValidProvider()
    {
        var socialAuthService = new Mock<ISocialAuthService>();
        socialAuthService.Setup(s => s.GetAuthorizationUrl("google", It.IsAny<string>(), It.IsAny<string>()))
            .Returns("https://accounts.google.com/o/oauth2/v2/auth?...");

        var controller = CreateController(socialAuthService: socialAuthService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = controller.GetAuthUrl("google", "https://callback.com", "state123");

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthUrlResponseDto>().Subject;
        response.Url.Should().Contain("google.com");
    }

    [Fact]
    public void GetAuthUrl_Returns503_WhenProviderNotConfigured()
    {
        var socialAuthService = new Mock<ISocialAuthService>();
        socialAuthService.Setup(s => s.GetAuthorizationUrl("line", It.IsAny<string>(), It.IsAny<string>()))
            .Throws(new InvalidOperationException("LINE ChannelId not configured"));

        var controller = CreateController(socialAuthService: socialAuthService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = controller.GetAuthUrl("line", "https://callback.com", "state123");

        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(503);
        var errorResponse = statusResult.Value.Should().BeOfType<OAuthErrorResponseDto>().Subject;
        errorResponse.Error.Should().Be("line_oauth_not_configured");
        errorResponse.Message.Should().Contain("LINE OAuth is not configured");
    }

    [Theory]
    [InlineData("google", "google_oauth_not_configured", "Google OAuth")]
    [InlineData("apple", "apple_oauth_not_configured", "Apple OAuth")]
    [InlineData("kakao", "kakao_oauth_not_configured", "Kakao OAuth")]
    public void GetAuthUrl_Returns503WithStructuredError_ForEachProvider(string provider, string expectedErrorCode, string expectedMessageFragment)
    {
        var socialAuthService = new Mock<ISocialAuthService>();
        socialAuthService.Setup(s => s.GetAuthorizationUrl(provider, It.IsAny<string>(), It.IsAny<string>()))
            .Throws(new InvalidOperationException($"{provider} ClientId not configured"));

        var controller = CreateController(socialAuthService: socialAuthService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = controller.GetAuthUrl(provider, "https://callback.com", "state123");

        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(503);
        var errorResponse = statusResult.Value.Should().BeOfType<OAuthErrorResponseDto>().Subject;
        errorResponse.Error.Should().Be(expectedErrorCode);
        errorResponse.Message.Should().Contain(expectedMessageFragment);
    }

    // ===== SocialLogin OAuth Not Configured =====

    [Fact]
    public async Task SocialLogin_Returns503_WhenProviderNotConfigured()
    {
        var socialAuthService = new Mock<ISocialAuthService>();
        socialAuthService.Setup(s => s.SocialLoginAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ThrowsAsync(new InvalidOperationException("Google ClientId not configured"));

        var controller = CreateController(socialAuthService: socialAuthService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.SocialLogin("google", new SocialLoginRequestDto { Code = "auth-code" });

        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(503);
        var errorResponse = statusResult.Value.Should().BeOfType<OAuthErrorResponseDto>().Subject;
        errorResponse.Error.Should().Be("google_oauth_not_configured");
        errorResponse.Message.Should().Contain("Google OAuth is not configured");
    }

    [Fact]
    public async Task SocialLogin_ReturnsBadRequest_WhenOtherExceptionOccurs()
    {
        var socialAuthService = new Mock<ISocialAuthService>();
        socialAuthService.Setup(s => s.SocialLoginAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ThrowsAsync(new InvalidOperationException("Token exchange failed: invalid_grant"));

        var controller = CreateController(socialAuthService: socialAuthService);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.SocialLogin("google", new SocialLoginRequestDto { Code = "bad-code" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }
}

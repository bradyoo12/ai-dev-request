using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text;

namespace AiDevRequest.Tests.Services;

public class SocialAuthServiceTests
{
    private (SocialAuthService service, API.Data.AiDevRequestDbContext db, Mock<ILogger<SocialAuthService>> logger) CreateService(
        Mock<IHttpClientFactory>? httpClientFactory = null)
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "SuperSecretTestKeyThatIsLongEnoughForHS256Algorithm!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["OAuth:Google:ClientId"] = "google-client-id",
                ["OAuth:Google:ClientSecret"] = "google-secret",
                ["OAuth:Kakao:ClientId"] = "kakao-client-id",
                ["OAuth:Kakao:ClientSecret"] = "kakao-secret"
            })
            .Build();

        if (httpClientFactory == null)
        {
            httpClientFactory = new Mock<IHttpClientFactory>();
            httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());
        }

        var authService = new Mock<IAuthService>();
        authService.Setup(a => a.GenerateJwt(It.IsAny<API.Entities.User>())).Returns("test-jwt-token");

        var logger = new Mock<ILogger<SocialAuthService>>();

        var service = new SocialAuthService(db, config, httpClientFactory.Object, authService.Object, logger.Object);
        return (service, db, logger);
    }

    [Fact]
    public void GetOrderedProviders_ReturnsProviders()
    {
        var (service, _, _) = CreateService();

        var providers = service.GetOrderedProviders(null);

        Assert.NotNull(providers);
        Assert.NotEmpty(providers);
    }

    [Fact]
    public void GetOrderedProviders_ReturnsKakaoFirstForKorean()
    {
        var (service, _, _) = CreateService();

        var providers = service.GetOrderedProviders("ko");

        Assert.Equal("kakao", providers[0]);
    }

    [Fact]
    public void GetOrderedProviders_ReturnsGoogleFirstForEnglish()
    {
        var (service, _, _) = CreateService();

        var providers = service.GetOrderedProviders("en");

        Assert.Equal("google", providers[0]);
    }

    [Fact]
    public void GetAuthorizationUrl_ReturnsUrlForGoogle()
    {
        var (service, _, _) = CreateService();

        var url = service.GetAuthorizationUrl("google", "http://localhost/callback", "state123");

        Assert.NotEmpty(url);
        Assert.Contains("accounts.google.com", url);
    }

    [Fact]
    public void GetAuthorizationUrl_ReturnsUrlForKakao()
    {
        var (service, _, _) = CreateService();

        var url = service.GetAuthorizationUrl("kakao", "http://localhost/callback", "state123");

        Assert.NotEmpty(url);
        Assert.Contains("kauth.kakao.com", url);
        // Kakao requires comma-separated scopes, not space-separated
        // Note: account_email removed - requires business verification
        Assert.Contains("scope=profile_nickname%2Cprofile_image", url);
        Assert.DoesNotContain("account_email", url);
    }

    [Fact]
    public async Task KakaoOAuth_TokenExchange_LogsErrorOn400Response()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://kauth.kakao.com/oauth/token"),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.BadRequest,
                Content = new StringContent("{\"error\":\"invalid_grant\",\"error_description\":\"authorization code not found for code=test-code\"}", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var mockFactory = new Mock<IHttpClientFactory>();
        mockFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

        var (service, _, logger) = CreateService(mockFactory);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await service.SocialLoginAsync("kakao", "test-code", "https://example.com/callback", null));

        Assert.Contains("Kakao token exchange failed", exception.Message);
        Assert.Contains("400", exception.Message);

        // Verify error logging was called
        logger.Verify(
            l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Kakao token exchange failed")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task KakaoOAuth_TokenExchange_LogsInfoOnSuccess()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();

        // Mock token exchange response
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://kauth.kakao.com/oauth/token"),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"access_token\":\"test-access-token\",\"token_type\":\"bearer\"}", Encoding.UTF8, "application/json")
            });

        // Mock user info response
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://kapi.kakao.com/v2/user/me"),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"id\":123456789,\"kakao_account\":{\"email\":\"test@kakao.com\",\"profile\":{\"nickname\":\"Test User\",\"profile_image_url\":\"https://example.com/image.jpg\"}}}", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var mockFactory = new Mock<IHttpClientFactory>();
        mockFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

        var (service, _, logger) = CreateService(mockFactory);

        // Act
        var (user, token) = await service.SocialLoginAsync("kakao", "test-code", "https://example.com/callback", null);

        // Assert
        Assert.NotNull(user);
        Assert.Equal("test@kakao.com", user.Email);
        Assert.Equal("123456789", user.KakaoId);

        // Verify info logging was called for token exchange
        logger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Kakao OAuth token exchange")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task KakaoOAuth_UserInfoRequest_LogsErrorOn400Response()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();

        // Mock successful token exchange
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://kauth.kakao.com/oauth/token"),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"access_token\":\"test-access-token\",\"token_type\":\"bearer\"}", Encoding.UTF8, "application/json")
            });

        // Mock failed user info request
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://kapi.kakao.com/v2/user/me"),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.Unauthorized,
                Content = new StringContent("{\"msg\":\"this access token does not exist\",\"code\":-401}", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var mockFactory = new Mock<IHttpClientFactory>();
        mockFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

        var (service, _, logger) = CreateService(mockFactory);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await service.SocialLoginAsync("kakao", "test-code", "https://example.com/callback", null));

        Assert.Contains("Kakao user info request failed", exception.Message);

        // Verify error logging was called
        logger.Verify(
            l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Kakao user info request failed")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task KakaoOAuth_TokenExchange_IncludesClientSecretWhenConfigured()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        HttpRequestMessage? capturedRequest = null;

        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://kauth.kakao.com/oauth/token"),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"access_token\":\"test-token\",\"token_type\":\"bearer\"}", Encoding.UTF8, "application/json")
            });

        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://kapi.kakao.com/v2/user/me"),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"id\":123456789,\"kakao_account\":{\"email\":\"test@kakao.com\"}}", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var mockFactory = new Mock<IHttpClientFactory>();
        mockFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

        var (service, _, _) = CreateService(mockFactory);

        // Act
        await service.SocialLoginAsync("kakao", "test-code", "https://example.com/callback", null);

        // Assert
        Assert.NotNull(capturedRequest);
        var content = await capturedRequest!.Content!.ReadAsStringAsync();

        // Verify request includes all required parameters
        Assert.Contains("grant_type=authorization_code", content);
        Assert.Contains("client_id=kakao-client-id", content);
        Assert.Contains("client_secret=kakao-secret", content);
        Assert.Contains("redirect_uri=https%3A%2F%2Fexample.com%2Fcallback", content);
        Assert.Contains("code=test-code", content);

        // Verify Content-Type is application/x-www-form-urlencoded
        Assert.Equal("application/x-www-form-urlencoded", capturedRequest.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public void GetOrderedProviders_ExcludesProvidersWithEmptyClientId()
    {
        // Arrange: configure Google with empty ClientId, Kakao fully configured
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "SuperSecretTestKeyThatIsLongEnoughForHS256Algorithm!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["OAuth:Google:ClientId"] = "",
                ["OAuth:Google:ClientSecret"] = "google-secret",
                ["OAuth:Kakao:ClientId"] = "kakao-client-id",
                ["OAuth:Kakao:ClientSecret"] = "kakao-secret"
            })
            .Build();

        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());
        var authService = new Mock<IAuthService>();
        var logger = new Mock<ILogger<SocialAuthService>>();
        var service = new SocialAuthService(db, config, httpClientFactory.Object, authService.Object, logger.Object);

        // Act
        var providers = service.GetOrderedProviders(null);

        // Assert
        Assert.DoesNotContain("google", providers);
        Assert.Contains("kakao", providers);
    }

    [Fact]
    public void GetOrderedProviders_ExcludesProvidersWithEmptyClientSecret()
    {
        // Arrange: configure Google with empty ClientSecret
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "SuperSecretTestKeyThatIsLongEnoughForHS256Algorithm!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["OAuth:Google:ClientId"] = "google-client-id",
                ["OAuth:Google:ClientSecret"] = "",
                ["OAuth:Kakao:ClientId"] = "kakao-client-id",
                ["OAuth:Kakao:ClientSecret"] = "kakao-secret"
            })
            .Build();

        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());
        var authService = new Mock<IAuthService>();
        var logger = new Mock<ILogger<SocialAuthService>>();
        var service = new SocialAuthService(db, config, httpClientFactory.Object, authService.Object, logger.Object);

        // Act
        var providers = service.GetOrderedProviders(null);

        // Assert
        Assert.DoesNotContain("google", providers);
        Assert.Contains("kakao", providers);
    }

    [Fact]
    public void GetOrderedProviders_IncludesOnlyFullyConfiguredProviders()
    {
        // Arrange: configure only Google and Kakao, leave Line and Apple unconfigured
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "SuperSecretTestKeyThatIsLongEnoughForHS256Algorithm!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["OAuth:Google:ClientId"] = "google-client-id",
                ["OAuth:Google:ClientSecret"] = "google-secret",
                ["OAuth:Kakao:ClientId"] = "kakao-client-id",
                ["OAuth:Kakao:ClientSecret"] = "kakao-secret"
            })
            .Build();

        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());
        var authService = new Mock<IAuthService>();
        var logger = new Mock<ILogger<SocialAuthService>>();
        var service = new SocialAuthService(db, config, httpClientFactory.Object, authService.Object, logger.Object);

        // Act
        var providers = service.GetOrderedProviders(null);

        // Assert — only google and kakao are configured
        Assert.Equal(2, providers.Length);
        Assert.Contains("google", providers);
        Assert.Contains("kakao", providers);
        Assert.DoesNotContain("line", providers);
        Assert.DoesNotContain("apple", providers);
    }

    [Fact]
    public void GetOrderedProviders_AllUnconfigured_ReturnsEmptyArray()
    {
        // Arrange: no OAuth providers configured at all
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "SuperSecretTestKeyThatIsLongEnoughForHS256Algorithm!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
            })
            .Build();

        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());
        var authService = new Mock<IAuthService>();
        var logger = new Mock<ILogger<SocialAuthService>>();
        var service = new SocialAuthService(db, config, httpClientFactory.Object, authService.Object, logger.Object);

        // Act
        var providers = service.GetOrderedProviders(null);

        // Assert
        Assert.Empty(providers);
    }

    [Fact]
    public async Task KakaoOAuth_UsesPlaceholderEmailWhenNotProvided()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();

        // Mock token exchange response
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://kauth.kakao.com/oauth/token"),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"access_token\":\"test-access-token\",\"token_type\":\"bearer\"}", Encoding.UTF8, "application/json")
            });

        // Mock user info response WITHOUT email (account_email scope not granted)
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.RequestUri != null &&
                    req.RequestUri.ToString() == "https://kapi.kakao.com/v2/user/me"),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"id\":987654321,\"kakao_account\":{\"profile\":{\"nickname\":\"TestUser\",\"profile_image_url\":\"https://example.com/pic.jpg\"}}}", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var mockFactory = new Mock<IHttpClientFactory>();
        mockFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

        var (service, _, _) = CreateService(mockFactory);

        // Act
        var (user, token) = await service.SocialLoginAsync("kakao", "test-code", "https://example.com/callback", null);

        // Assert
        Assert.NotNull(user);
        Assert.Equal("987654321@kakao.placeholder", user.Email); // Should use placeholder email
        Assert.Equal("987654321", user.KakaoId);
        Assert.Equal("TestUser", user.DisplayName);
        Assert.Equal("https://example.com/pic.jpg", user.ProfileImageUrl);
    }
}

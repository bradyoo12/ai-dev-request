using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class SocialAuthServiceTests
{
    private (SocialAuthService service, API.Data.AiDevRequestDbContext db) CreateService()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "SuperSecretTestKeyThatIsLongEnoughForHS256Algorithm!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["Google:ClientId"] = "google-client-id",
                ["Google:ClientSecret"] = "google-secret",
                ["Kakao:ClientId"] = "kakao-client-id",
                ["Kakao:ClientSecret"] = "kakao-secret"
            })
            .Build();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());
        var authService = new Mock<IAuthService>();
        var logger = new Mock<ILogger<SocialAuthService>>();

        var service = new SocialAuthService(db, config, httpClientFactory.Object, authService.Object, logger.Object);
        return (service, db);
    }

    [Fact]
    public void GetOrderedProviders_ReturnsProviders()
    {
        var (service, _) = CreateService();

        var providers = service.GetOrderedProviders(null);

        Assert.NotNull(providers);
        Assert.NotEmpty(providers);
    }

    [Fact]
    public void GetOrderedProviders_ReturnsKakaoFirstForKorean()
    {
        var (service, _) = CreateService();

        var providers = service.GetOrderedProviders("ko");

        Assert.Equal("kakao", providers[0]);
    }

    [Fact]
    public void GetOrderedProviders_ReturnsGoogleFirstForEnglish()
    {
        var (service, _) = CreateService();

        var providers = service.GetOrderedProviders("en");

        Assert.Equal("google", providers[0]);
    }

    [Fact]
    public void GetAuthorizationUrl_ReturnsUrlForGoogle()
    {
        var (service, _) = CreateService();

        var url = service.GetAuthorizationUrl("google", "http://localhost/callback", "state123");

        Assert.NotEmpty(url);
        Assert.Contains("accounts.google.com", url);
    }

    [Fact]
    public void GetAuthorizationUrl_ReturnsUrlForKakao()
    {
        var (service, _) = CreateService();

        var url = service.GetAuthorizationUrl("kakao", "http://localhost/callback", "state123");

        Assert.NotEmpty(url);
        Assert.Contains("kauth.kakao.com", url);
    }
}

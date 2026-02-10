using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class AuthServiceTests
{
    private AuthService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "SuperSecretTestKeyThatIsLongEnoughForHS256Algorithm!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:ExpiryDays"] = "7"
            })
            .Build();
        var logger = new Mock<ILogger<AuthService>>();
        return new AuthService(db, config, logger.Object);
    }

    [Fact]
    public async Task RegisterAsync_CreatesNewUser()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var (user, token) = await service.RegisterAsync("test@example.com", "password123", null, null);

        Assert.NotNull(user);
        Assert.Equal("test@example.com", user.Email);
        Assert.NotEmpty(token);
    }

    [Fact]
    public async Task RegisterAsync_ThrowsWhenEmailExists()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAsync("test@example.com", "password123", null, null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.RegisterAsync("test@example.com", "password456", null, null));
    }

    [Fact]
    public async Task LoginAsync_ReturnsUserAndToken()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAsync("test@example.com", "password123", null, null);
        var (user, token) = await service.LoginAsync("test@example.com", "password123");

        Assert.NotNull(user);
        Assert.Equal("test@example.com", user.Email);
        Assert.NotEmpty(token);
    }

    [Fact]
    public async Task LoginAsync_ThrowsOnInvalidPassword()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAsync("test@example.com", "password123", null, null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.LoginAsync("test@example.com", "wrongpassword"));
    }

    [Fact]
    public async Task LoginAsync_ThrowsOnNonExistentEmail()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.LoginAsync("nonexistent@example.com", "password123"));
    }

    [Fact]
    public async Task GetUserAsync_ReturnsUser()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var (registered, _) = await service.RegisterAsync("test@example.com", "password123", null, null);
        var user = await service.GetUserAsync(registered.Id);

        Assert.NotNull(user);
        Assert.Equal("test@example.com", user!.Email);
    }

    [Fact]
    public async Task GetUserAsync_ReturnsNullForNonExistentUser()
    {
        var service = CreateService();

        var user = await service.GetUserAsync("non-existent-id");

        Assert.Null(user);
    }

    [Fact]
    public async Task GenerateJwt_ReturnsValidToken()
    {
        var service = CreateService();
        var user = new User
        {
            Id = "test-id",
            Email = "test@example.com",
            DisplayName = "Test User"
        };

        var token = service.GenerateJwt(user);

        Assert.NotEmpty(token);
    }
}

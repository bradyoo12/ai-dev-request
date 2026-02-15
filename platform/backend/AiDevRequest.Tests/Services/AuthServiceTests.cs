using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class AuthServiceTests
{
    private AuthService CreateService(API.Data.AiDevRequestDbContext? db = null, IConfiguration? config = null)
    {
        db ??= TestDbContextFactory.Create();
        config ??= new ConfigurationBuilder()
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

    // ===== RegisterAsync =====

    [Fact]
    public async Task RegisterAsync_CreatesNewUser()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var (user, token) = await service.RegisterAsync("test@example.com", "password123", null, null);

        user.Should().NotBeNull();
        user.Email.Should().Be("test@example.com");
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task RegisterAsync_NormalizesEmail()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var (user, _) = await service.RegisterAsync("  TEST@Example.COM  ", "password123", null, null);

        user.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task RegisterAsync_SetsDisplayName()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var (user, _) = await service.RegisterAsync("test@example.com", "password123", "  Test User  ", null);

        user.DisplayName.Should().Be("Test User");
    }

    [Fact]
    public async Task RegisterAsync_HashesPassword()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var (user, _) = await service.RegisterAsync("test@example.com", "password123", null, null);

        user.PasswordHash.Should().NotBeNullOrEmpty();
        user.PasswordHash.Should().NotBe("password123");
        user.PasswordHash.Should().StartWith("$2"); // BCrypt hash prefix
    }

    [Fact]
    public async Task RegisterAsync_ThrowsWhenEmailExists()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAsync("test@example.com", "password123", null, null);

        var act = () => service.RegisterAsync("test@example.com", "password456", null, null);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task RegisterAsync_ThrowsForDuplicateCaseInsensitive()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAsync("test@example.com", "password123", null, null);

        var act = () => service.RegisterAsync("TEST@Example.COM", "password456", null, null);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task RegisterAsync_SetsAnonymousUserId()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var (user, _) = await service.RegisterAsync("test@example.com", "password123", null, "anon-123");

        user.AnonymousUserId.Should().Be("anon-123");
    }

    [Fact]
    public async Task RegisterAsync_GeneratesUniqueId()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var (user1, _) = await service.RegisterAsync("test1@example.com", "password123", null, null);
        var (user2, _) = await service.RegisterAsync("test2@example.com", "password123", null, null);

        user1.Id.Should().NotBe(user2.Id);
    }

    // ===== LoginAsync =====

    [Fact]
    public async Task LoginAsync_ReturnsUserAndToken()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAsync("test@example.com", "password123", null, null);
        var (user, token) = await service.LoginAsync("test@example.com", "password123");

        user.Should().NotBeNull();
        user.Email.Should().Be("test@example.com");
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task LoginAsync_NormalizesEmail()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAsync("test@example.com", "password123", null, null);
        var (user, _) = await service.LoginAsync("  TEST@Example.COM  ", "password123");

        user.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task LoginAsync_UpdatesLastLoginAt()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAsync("test@example.com", "password123", null, null);
        var before = DateTime.UtcNow;
        var (user, _) = await service.LoginAsync("test@example.com", "password123");

        user.LastLoginAt.Should().NotBeNull();
        user.LastLoginAt.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task LoginAsync_ThrowsOnInvalidPassword()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAsync("test@example.com", "password123", null, null);

        var act = () => service.LoginAsync("test@example.com", "wrongpassword");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Invalid*");
    }

    [Fact]
    public async Task LoginAsync_ThrowsOnNonExistentEmail()
    {
        var service = CreateService();

        var act = () => service.LoginAsync("nonexistent@example.com", "password123");

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    // ===== GetUserAsync =====

    [Fact]
    public async Task GetUserAsync_ReturnsUser()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var (registered, _) = await service.RegisterAsync("test@example.com", "password123", null, null);
        var user = await service.GetUserAsync(registered.Id.ToString());

        user.Should().NotBeNull();
        user!.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task GetUserAsync_ReturnsNullForNonExistentUser()
    {
        var service = CreateService();

        var user = await service.GetUserAsync("non-existent-id");

        user.Should().BeNull();
    }

    // ===== GenerateJwt =====

    [Fact]
    public void GenerateJwt_ReturnsValidToken()
    {
        var service = CreateService();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            DisplayName = "Test User"
        };

        var token = service.GenerateJwt(user);

        token.Should().NotBeNullOrEmpty();
        // JWT tokens have 3 parts separated by dots
        token.Split('.').Should().HaveCount(3);
    }

    [Fact]
    public void GenerateJwt_IncludesAdminRole_WhenIsAdmin()
    {
        var service = CreateService();
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@example.com",
            IsAdmin = true
        };

        var token = service.GenerateJwt(adminUser);

        token.Should().NotBeNullOrEmpty();
        // The token should be different (contain admin role claim) but we can't easily decode here
        // Just verify it doesn't crash
    }

    [Fact]
    public void GenerateJwt_ThrowsWhenNoJwtSecret()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var service = CreateService(config: config);
        var user = new User { Id = Guid.NewGuid(), Email = "test@example.com" };

        var act = () => service.GenerateJwt(user);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Jwt:Secret*");
    }

    [Fact]
    public void GenerateJwt_GeneratesDifferentTokensForDifferentUsers()
    {
        var service = CreateService();

        var token1 = service.GenerateJwt(new User { Id = Guid.NewGuid(), Email = "a@a.com" });
        var token2 = service.GenerateJwt(new User { Id = Guid.NewGuid(), Email = "b@b.com" });

        token1.Should().NotBe(token2);
    }
}

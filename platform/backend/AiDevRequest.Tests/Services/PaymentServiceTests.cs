using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class PaymentServiceTests
{
    private (StripePaymentService Service, AiDevRequestDbContext Db) CreateService(
        bool isDevelopment = true,
        string? stripeKey = "sk_test_fake",
        string? webhookSecret = "whsec_test_fake")
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Stripe:SecretKey"] = stripeKey,
                ["Stripe:WebhookSecret"] = webhookSecret
            })
            .Build();

        var db = Helpers.TestDbContextFactory.Create();
        var scope = new Mock<IServiceScope>();
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider.Setup(x => x.GetService(typeof(AiDevRequestDbContext))).Returns(db);
        scope.Setup(x => x.ServiceProvider).Returns(serviceProvider.Object);
        var scopeFactory = new Mock<IServiceScopeFactory>();
        scopeFactory.Setup(x => x.CreateScope()).Returns(scope.Object);

        var logger = new Mock<ILogger<StripePaymentService>>();
        var env = new Mock<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns(isDevelopment ? "Development" : "Production");

        var service = new StripePaymentService(scopeFactory.Object, config, logger.Object, env.Object);
        return (service, db);
    }

    // ===== Constructor =====

    [Fact]
    public void Constructor_SucceedsWithConfiguration()
    {
        var (service, _) = CreateService();

        service.Should().NotBeNull();
    }

    [Fact]
    public void Constructor_SucceedsWithoutStripeKey()
    {
        var (service, _) = CreateService(stripeKey: null);

        service.Should().NotBeNull();
    }

    // ===== GetPaymentHistoryAsync =====

    [Fact]
    public async Task GetPaymentHistoryAsync_ReturnsEmptyListForNewUser()
    {
        var (service, _) = CreateService();

        var history = await service.GetPaymentHistoryAsync("user1", 1, 20);

        history.Should().BeEmpty();
    }

    [Fact]
    public async Task GetPaymentHistoryAsync_ReturnsPaymentsForUser()
    {
        var (service, db) = CreateService();
        db.Payments.Add(new Payment
        {
            UserId = "user1",
            Type = PaymentType.TokenPurchase,
            AmountUsd = 9.99m,
            Status = PaymentStatus.Succeeded,
            Description = "Test purchase"
        });
        db.Payments.Add(new Payment
        {
            UserId = "user2",
            Type = PaymentType.TokenPurchase,
            AmountUsd = 14.99m,
            Status = PaymentStatus.Succeeded
        });
        await db.SaveChangesAsync();

        var history = await service.GetPaymentHistoryAsync("user1", 1, 20);

        history.Should().HaveCount(1);
        history[0].UserId.Should().Be("user1");
        history[0].AmountUsd.Should().Be(9.99m);
    }

    [Fact]
    public async Task GetPaymentHistoryAsync_PaginatesCorrectly()
    {
        var (service, db) = CreateService();
        for (int i = 0; i < 15; i++)
        {
            db.Payments.Add(new Payment
            {
                UserId = "user1",
                Type = PaymentType.TokenPurchase,
                AmountUsd = i + 1,
                Status = PaymentStatus.Succeeded,
                CreatedAt = DateTime.UtcNow.AddMinutes(-i)
            });
        }
        await db.SaveChangesAsync();

        var page1 = await service.GetPaymentHistoryAsync("user1", 1, 10);
        var page2 = await service.GetPaymentHistoryAsync("user1", 2, 10);

        page1.Should().HaveCount(10);
        page2.Should().HaveCount(5);
    }

    [Fact]
    public async Task GetPaymentHistoryAsync_OrdersByCreatedAtDescending()
    {
        var (service, db) = CreateService();
        db.Payments.Add(new Payment
        {
            UserId = "user1",
            Type = PaymentType.TokenPurchase,
            AmountUsd = 1.00m,
            Status = PaymentStatus.Succeeded,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        });
        db.Payments.Add(new Payment
        {
            UserId = "user1",
            Type = PaymentType.TokenPurchase,
            AmountUsd = 2.00m,
            Status = PaymentStatus.Succeeded,
            CreatedAt = DateTime.UtcNow.AddHours(-1) // More recent
        });
        await db.SaveChangesAsync();

        var history = await service.GetPaymentHistoryAsync("user1", 1, 20);

        history.Should().HaveCount(2);
        history[0].AmountUsd.Should().Be(2.00m); // Most recent first
    }

    // ===== GetPaymentCountAsync =====

    [Fact]
    public async Task GetPaymentCountAsync_ReturnsZeroForNewUser()
    {
        var (service, _) = CreateService();

        var count = await service.GetPaymentCountAsync("user1");

        count.Should().Be(0);
    }

    [Fact]
    public async Task GetPaymentCountAsync_ReturnsCorrectCount()
    {
        var (service, db) = CreateService();
        db.Payments.Add(new Payment { UserId = "user1", Type = PaymentType.TokenPurchase, AmountUsd = 1m, Status = PaymentStatus.Succeeded });
        db.Payments.Add(new Payment { UserId = "user1", Type = PaymentType.TokenPurchase, AmountUsd = 2m, Status = PaymentStatus.Pending });
        db.Payments.Add(new Payment { UserId = "user1", Type = PaymentType.TokenPurchase, AmountUsd = 3m, Status = PaymentStatus.Failed });
        db.Payments.Add(new Payment { UserId = "other-user", Type = PaymentType.TokenPurchase, AmountUsd = 4m, Status = PaymentStatus.Succeeded });
        await db.SaveChangesAsync();

        var count = await service.GetPaymentCountAsync("user1");

        count.Should().Be(3); // All 3 for user1, regardless of status
    }

    // ===== CreateCheckoutSessionAsync =====

    [Fact]
    public async Task CreateCheckoutSessionAsync_ThrowsWhenPackageNotFound()
    {
        var (service, _) = CreateService();

        var act = () => service.CreateCheckoutSessionAsync("user1", 999, "https://success.com", "https://cancel.com");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task CreateCheckoutSessionAsync_ThrowsWhenPackageInactive()
    {
        var (service, db) = CreateService();
        var package = new TokenPackage { Name = "Inactive", TokenAmount = 100, PriceUsd = 1m, IsActive = false };
        db.TokenPackages.Add(package);
        await db.SaveChangesAsync();

        var act = () => service.CreateCheckoutSessionAsync("user1", package.Id, "https://success.com", "https://cancel.com");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not active*");
    }

    [Fact]
    public async Task CreateCheckoutSessionAsync_InSimulationMode_CreditsTokensImmediately()
    {
        var (service, db) = CreateService(isDevelopment: true, stripeKey: null);
        var package = new TokenPackage { Name = "Starter", TokenAmount = 500, PriceUsd = 4.99m, IsActive = true };
        db.TokenPackages.Add(package);
        await db.SaveChangesAsync();

        var result = await service.CreateCheckoutSessionAsync("user1", package.Id, "https://success.com", "https://cancel.com");

        result.Should().StartWith("SIMULATION_SUCCESS:");
        result.Should().Contain("500");
    }

    [Fact]
    public async Task CreateCheckoutSessionAsync_InSimulationMode_CreatesPaymentRecord()
    {
        var (service, db) = CreateService(isDevelopment: true, stripeKey: null);
        var package = new TokenPackage { Name = "Starter", TokenAmount = 500, PriceUsd = 4.99m, IsActive = true };
        db.TokenPackages.Add(package);
        await db.SaveChangesAsync();

        await service.CreateCheckoutSessionAsync("user1", package.Id, "https://success.com", "https://cancel.com");

        var payment = db.Payments.FirstOrDefault(p => p.UserId == "user1");
        payment.Should().NotBeNull();
        payment!.Status.Should().Be(PaymentStatus.Succeeded);
        payment.TokensAwarded.Should().Be(500);
        payment.Description.Should().Contain("SIMULATION");
    }

    [Fact]
    public async Task CreateCheckoutSessionAsync_InSimulationMode_UpdatesExistingBalance()
    {
        var (service, db) = CreateService(isDevelopment: true, stripeKey: null);
        // Pre-create a balance
        db.TokenBalances.Add(new TokenBalance { UserId = "user1", Balance = 100, TotalEarned = 100 });
        var package = new TokenPackage { Name = "Starter", TokenAmount = 500, PriceUsd = 4.99m, IsActive = true };
        db.TokenPackages.Add(package);
        await db.SaveChangesAsync();

        await service.CreateCheckoutSessionAsync("user1", package.Id, "https://success.com", "https://cancel.com");

        var balance = db.TokenBalances.First(b => b.UserId == "user1");
        balance.Balance.Should().Be(600); // 100 + 500
        balance.TotalEarned.Should().Be(600);
    }

    [Fact]
    public async Task CreateCheckoutSessionAsync_InSimulationMode_CreatesNewBalance_IfNoneExists()
    {
        var (service, db) = CreateService(isDevelopment: true, stripeKey: null);
        var package = new TokenPackage { Name = "Starter", TokenAmount = 500, PriceUsd = 4.99m, IsActive = true };
        db.TokenPackages.Add(package);
        await db.SaveChangesAsync();

        await service.CreateCheckoutSessionAsync("newuser", package.Id, "https://success.com", "https://cancel.com");

        var balance = db.TokenBalances.FirstOrDefault(b => b.UserId == "newuser");
        balance.Should().NotBeNull();
        balance!.Balance.Should().Be(500);
    }

    [Fact]
    public async Task CreateCheckoutSessionAsync_ThrowsInProduction_WhenNoStripeKey()
    {
        var (service, db) = CreateService(isDevelopment: false, stripeKey: null);
        var package = new TokenPackage { Name = "Starter", TokenAmount = 500, PriceUsd = 4.99m, IsActive = true };
        db.TokenPackages.Add(package);
        await db.SaveChangesAsync();

        var act = () => service.CreateCheckoutSessionAsync("user1", package.Id, "https://success.com", "https://cancel.com");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*non-development*");
    }

    // ===== HandleWebhookAsync =====

    [Fact]
    public async Task HandleWebhookAsync_DoesNothing_WhenNoWebhookSecret()
    {
        var (service, _) = CreateService(webhookSecret: null);

        // Should not throw
        await service.HandleWebhookAsync("{}", "sig_test");
    }
}

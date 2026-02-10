using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class WhiteLabelServiceTests
{
    private WhiteLabelService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<WhiteLabelService>>();
        return new WhiteLabelService(db, logger.Object);
    }

    [Fact]
    public async Task GetTenantsAsync_ReturnsUserTenants()
    {
        var db = TestDbContextFactory.Create();
        db.WhiteLabelTenants.Add(new WhiteLabelTenant { UserId = "user1", Name = "Tenant1", Slug = "tenant1" });
        db.WhiteLabelTenants.Add(new WhiteLabelTenant { UserId = "user2", Name = "Tenant2", Slug = "tenant2" });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var tenants = await service.GetTenantsAsync("user1");

        Assert.Single(tenants);
        Assert.Equal("Tenant1", tenants[0].Name);
    }

    [Fact]
    public async Task CreateTenantAsync_CreatesTenant()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var tenant = await service.CreateTenantAsync("user1", "My Brand", "my-brand");

        Assert.Equal("My Brand", tenant.Name);
        Assert.Equal("my-brand", tenant.Slug);
        Assert.Equal("user1", tenant.UserId);
    }

    [Fact]
    public async Task CreateTenantAsync_ThrowsOnDuplicateSlug()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.CreateTenantAsync("user1", "Brand1", "my-brand");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateTenantAsync("user2", "Brand2", "my-brand"));
    }

    [Fact]
    public async Task GetTenantAsync_ReturnsTenantForOwner()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateTenantAsync("user1", "Brand1", "brand1");
        var tenant = await service.GetTenantAsync(created.Id, "user1");

        Assert.NotNull(tenant);
        Assert.Equal("Brand1", tenant!.Name);
    }

    [Fact]
    public async Task GetTenantAsync_ReturnsNullForOtherUser()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateTenantAsync("user1", "Brand1", "brand1");
        var tenant = await service.GetTenantAsync(created.Id, "user2");

        Assert.Null(tenant);
    }

    [Fact]
    public async Task UpdateTenantAsync_UpdatesTenant()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateTenantAsync("user1", "Brand1", "brand1");
        var updated = await service.UpdateTenantAsync(created.Id, "user1", t => t.Name = "Updated Brand");

        Assert.NotNull(updated);
        Assert.Equal("Updated Brand", updated!.Name);
    }

    [Fact]
    public async Task DeleteTenantAsync_DeletesTenant()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateTenantAsync("user1", "Brand1", "brand1");
        var result = await service.DeleteTenantAsync(created.Id, "user1");

        Assert.True(result);
        var tenant = await service.GetTenantAsync(created.Id, "user1");
        Assert.Null(tenant);
    }

    [Fact]
    public async Task DeleteTenantAsync_ReturnsFalseForOtherUser()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateTenantAsync("user1", "Brand1", "brand1");
        var result = await service.DeleteTenantAsync(created.Id, "user2");

        Assert.False(result);
    }

    [Fact]
    public async Task AddPartnerAsync_AddsPartner()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var tenant = await service.CreateTenantAsync("user1", "Brand", "brand");
        var partner = await service.AddPartnerAsync(tenant.Id, "user1", "PartnerCo", "partner@test.com", 20m);

        Assert.Equal("PartnerCo", partner.CompanyName);
        Assert.Equal(20m, partner.MarginPercent);
    }

    [Fact]
    public async Task AddPartnerAsync_ThrowsForNonOwner()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var tenant = await service.CreateTenantAsync("user1", "Brand", "brand");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.AddPartnerAsync(tenant.Id, "user2", "PartnerCo", "p@test.com", 20m));
    }

    [Fact]
    public async Task GetPartnersAsync_ReturnsEmptyForNonOwner()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var tenant = await service.CreateTenantAsync("user1", "Brand", "brand");
        var partners = await service.GetPartnersAsync(tenant.Id, "user2");

        Assert.Empty(partners);
    }

    [Fact]
    public async Task RemovePartnerAsync_RemovesPartner()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var tenant = await service.CreateTenantAsync("user1", "Brand", "brand");
        var partner = await service.AddPartnerAsync(tenant.Id, "user1", "PartnerCo", "p@test.com", 20m);
        var result = await service.RemovePartnerAsync(partner.Id, "user1");

        Assert.True(result);
    }

    [Fact]
    public async Task GetUsageSummaryAsync_ReturnsEmptyForNonOwner()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var tenant = await service.CreateTenantAsync("user1", "Brand", "brand");
        var summary = await service.GetUsageSummaryAsync(tenant.Id, "user2");

        Assert.NotNull(summary);
    }
}

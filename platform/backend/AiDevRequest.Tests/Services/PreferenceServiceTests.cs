using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;

namespace AiDevRequest.Tests.Services;

public class PreferenceServiceTests
{
    private PreferenceService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        return new PreferenceService(db);
    }

    [Fact]
    public async Task SetPreferenceAsync_CreatesPreference()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var pref = await service.SetPreferenceAsync("user1", "ui", "theme", "dark", 0.9, "manual");

        Assert.Equal("ui", pref.Category);
        Assert.Equal("theme", pref.Key);
        Assert.Equal("dark", pref.Value);
    }

    [Fact]
    public async Task SetPreferenceAsync_UpdatesExistingPreference()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SetPreferenceAsync("user1", "ui", "theme", "dark", 0.9, "manual");
        var updated = await service.SetPreferenceAsync("user1", "ui", "theme", "light", 0.95, "manual");

        Assert.Equal("light", updated.Value);
        Assert.Equal(0.95, updated.Confidence);
    }

    [Fact]
    public async Task GetPreferencesAsync_ReturnsUserPreferences()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SetPreferenceAsync("user1", "ui", "theme", "dark", 0.9, "manual");
        await service.SetPreferenceAsync("user1", "coding", "lang", "typescript", 0.8, "manual");

        var prefs = await service.GetPreferencesAsync("user1");

        Assert.Equal(2, prefs.Count);
    }

    [Fact]
    public async Task GetPreferencesAsync_FiltersByCategory()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SetPreferenceAsync("user1", "ui", "theme", "dark", 0.9, "manual");
        await service.SetPreferenceAsync("user1", "coding", "lang", "typescript", 0.8, "manual");

        var prefs = await service.GetPreferencesAsync("user1", "ui");

        Assert.Single(prefs);
        Assert.Equal("theme", prefs[0].Key);
    }

    [Fact]
    public async Task GetPreferenceCountAsync_ReturnsCorrectCount()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SetPreferenceAsync("user1", "ui", "theme", "dark", 0.9, "manual");
        await service.SetPreferenceAsync("user1", "coding", "lang", "ts", 0.8, "manual");

        var count = await service.GetPreferenceCountAsync("user1");

        Assert.Equal(2, count);
    }

    [Fact]
    public async Task DeletePreferenceAsync_DeletesPreference()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var pref = await service.SetPreferenceAsync("user1", "ui", "theme", "dark", 0.9, "manual");
        await service.DeletePreferenceAsync("user1", pref.Id);

        var count = await service.GetPreferenceCountAsync("user1");
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task DeleteAllPreferencesAsync_DeletesAll()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SetPreferenceAsync("user1", "ui", "theme", "dark", 0.9, "manual");
        await service.SetPreferenceAsync("user1", "coding", "lang", "ts", 0.8, "manual");
        await service.DeleteAllPreferencesAsync("user1");

        var count = await service.GetPreferenceCountAsync("user1");
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task GetSummaryAsync_ReturnsNullWhenNoSummary()
    {
        var service = CreateService();

        var summary = await service.GetSummaryAsync("user1");

        Assert.Null(summary);
    }

    [Fact]
    public async Task RegenerateSummaryAsync_CreatesSummary()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SetPreferenceAsync("user1", "ui", "theme", "dark", 0.9, "manual");
        var summary = await service.RegenerateSummaryAsync("user1");

        Assert.NotNull(summary);
        Assert.NotEmpty(summary.SummaryText);
    }

    [Fact]
    public async Task BuildPreferenceContextAsync_ReturnsEmptyWhenNoPrefs()
    {
        var service = CreateService();

        var context = await service.BuildPreferenceContextAsync("user1");

        Assert.NotNull(context);
    }
}

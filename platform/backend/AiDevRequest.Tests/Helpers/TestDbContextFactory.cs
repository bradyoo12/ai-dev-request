using AiDevRequest.API.Data;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.Tests.Helpers;

public static class TestDbContextFactory
{
    public static AiDevRequestDbContext Create(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<AiDevRequestDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .Options;

        var context = new AiDevRequestDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}

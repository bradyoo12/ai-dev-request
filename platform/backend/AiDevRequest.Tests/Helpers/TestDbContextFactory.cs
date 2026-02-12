using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace AiDevRequest.Tests.Helpers;

public class TestModelCacheKeyFactory : IModelCacheKeyFactory
{
    public object Create(DbContext context, bool designTime)
        => (context.GetType(), designTime);
}

public class TestAiDevRequestDbContext : AiDevRequestDbContext
{
    public TestAiDevRequestDbContext(DbContextOptions<AiDevRequestDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Remove entities with int FK pointing to Guid PK (schema mismatches).
        // Called AFTER base.OnModelCreating because Ignore before base doesn't stick
        // when base re-adds them via Entity<T>() calls.
        var typesToRemove = new[]
        {
            typeof(WorkflowExecution), typeof(DevelopmentSpec), typeof(GenerationStream),
            typeof(BidirectionalGitSync), typeof(CodeQualityReview), typeof(CollaborativeSession),
            typeof(ContainerConfig), typeof(GitHubSync), typeof(ProjectReview), typeof(TestGenerationRecord)
        };
        foreach (var type in typesToRemove)
        {
            var entityType = modelBuilder.Model.FindEntityType(type);
            if (entityType != null)
            {
                modelBuilder.Model.RemoveEntityType(type);
            }
        }

        // Strip out provider-specific column types that InMemory doesn't understand.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                property.SetColumnType(null);
            }
        }
    }
}

public static class TestDbContextFactory
{
    public static AiDevRequestDbContext Create(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<AiDevRequestDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .ConfigureWarnings(w =>
            {
                w.Ignore(InMemoryEventId.TransactionIgnoredWarning);
                w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning);
            })
            .ReplaceService<IModelCacheKeyFactory, TestModelCacheKeyFactory>()
            .Options;

        var context = new TestAiDevRequestDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}

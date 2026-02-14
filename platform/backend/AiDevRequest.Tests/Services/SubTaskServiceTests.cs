using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class SubTaskServiceTests
{
    private SubTaskService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<SubTaskService>>();
        return new SubTaskService(db, logger.Object);
    }

    [Fact]
    public async Task CreateAsync_CreatesSubTask()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var subTask = new SubTask
        {
            DevRequestId = Guid.NewGuid(),
            Title = "Test SubTask",
            Order = 0,
        };

        var result = await service.CreateAsync(subTask);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("Test SubTask", result.Title);
        Assert.Equal(SubTaskStatus.Pending, result.Status);
    }

    [Fact]
    public async Task GetByRequestIdAsync_ReturnsOrderedSubTasks()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var requestId = Guid.NewGuid();

        await service.CreateAsync(new SubTask { DevRequestId = requestId, Title = "Task B", Order = 2 });
        await service.CreateAsync(new SubTask { DevRequestId = requestId, Title = "Task A", Order = 1 });
        await service.CreateAsync(new SubTask { DevRequestId = Guid.NewGuid(), Title = "Other", Order = 0 });

        var results = await service.GetByRequestIdAsync(requestId);

        Assert.Equal(2, results.Count);
        Assert.Equal("Task A", results[0].Title);
        Assert.Equal("Task B", results[1].Title);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsSubTask()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateAsync(new SubTask
        {
            DevRequestId = Guid.NewGuid(),
            Title = "Find me",
            Order = 0,
        });

        var found = await service.GetByIdAsync(created.Id);

        Assert.NotNull(found);
        Assert.Equal("Find me", found!.Title);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNullForMissing()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.GetByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_UpdatesFields()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateAsync(new SubTask
        {
            DevRequestId = Guid.NewGuid(),
            Title = "Original",
            Order = 0,
        });

        var update = new SubTask
        {
            Title = "Updated Title",
            Description = "New desc",
            Status = SubTaskStatus.Approved,
            Order = 5,
        };

        var updated = await service.UpdateAsync(created.Id, update);

        Assert.NotNull(updated);
        Assert.Equal("Updated Title", updated!.Title);
        Assert.Equal("New desc", updated.Description);
        Assert.Equal(SubTaskStatus.Approved, updated.Status);
        Assert.Equal(5, updated.Order);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNullForMissing()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.UpdateAsync(Guid.NewGuid(), new SubTask { Title = "X", Order = 0 });

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_DeletesSubTask()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateAsync(new SubTask
        {
            DevRequestId = Guid.NewGuid(),
            Title = "Delete me",
            Order = 0,
        });

        var deleted = await service.DeleteAsync(created.Id);
        var found = await service.GetByIdAsync(created.Id);

        Assert.True(deleted);
        Assert.Null(found);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalseForMissing()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.DeleteAsync(Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public async Task ApproveAsync_SetsStatusToApproved()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateAsync(new SubTask
        {
            DevRequestId = Guid.NewGuid(),
            Title = "Approve me",
            Order = 0,
        });

        var approved = await service.ApproveAsync(created.Id);

        Assert.NotNull(approved);
        Assert.Equal(SubTaskStatus.Approved, approved!.Status);
    }

    [Fact]
    public async Task ApproveAsync_ReturnsNullForMissing()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.ApproveAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task RejectAsync_SetsStatusToRejected()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var created = await service.CreateAsync(new SubTask
        {
            DevRequestId = Guid.NewGuid(),
            Title = "Reject me",
            Order = 0,
        });

        var rejected = await service.RejectAsync(created.Id);

        Assert.NotNull(rejected);
        Assert.Equal(SubTaskStatus.Rejected, rejected!.Status);
    }

    [Fact]
    public async Task RejectAsync_ReturnsNullForMissing()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.RejectAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task ApproveAllAsync_ApprovesOnlyPendingTasks()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var requestId = Guid.NewGuid();

        var task1 = await service.CreateAsync(new SubTask { DevRequestId = requestId, Title = "Pending 1", Order = 0 });
        var task2 = await service.CreateAsync(new SubTask { DevRequestId = requestId, Title = "Pending 2", Order = 1 });
        // Approve one manually first
        await service.ApproveAsync(task2.Id);

        var approved = await service.ApproveAllAsync(requestId);

        Assert.Single(approved);
        Assert.Equal(task1.Id, approved[0].Id);
        Assert.Equal(SubTaskStatus.Approved, approved[0].Status);
    }

    [Fact]
    public async Task CreateBatchAsync_CreatesMultipleSubTasks()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var requestId = Guid.NewGuid();

        var subTasks = new List<SubTask>
        {
            new SubTask { Title = "Task 1", Order = 0 },
            new SubTask { Title = "Task 2", Order = 1 },
        };

        var created = await service.CreateBatchAsync(requestId, subTasks);

        Assert.Equal(2, created.Count);
        Assert.Equal(requestId, created[0].DevRequestId);
        Assert.Equal(requestId, created[1].DevRequestId);
    }

    [Fact]
    public async Task CreateBatchAsync_ThrowsOnCircularDependency()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var requestId = Guid.NewGuid();

        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();

        var subTasks = new List<SubTask>
        {
            new SubTask { Id = id1, Title = "Task 1", Order = 0, DependsOnSubTaskId = id2 },
            new SubTask { Id = id2, Title = "Task 2", Order = 1, DependsOnSubTaskId = id1 },
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateBatchAsync(requestId, subTasks)
        );
    }

    [Fact]
    public void ValidateDependencies_ReturnsTrueForNoCycles()
    {
        var service = CreateService();

        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();
        var id3 = Guid.NewGuid();

        var subTasks = new List<SubTask>
        {
            new SubTask { Id = id1, Title = "Task 1", Order = 0 },
            new SubTask { Id = id2, Title = "Task 2", Order = 1, DependsOnSubTaskId = id1 },
            new SubTask { Id = id3, Title = "Task 3", Order = 2, DependsOnSubTaskId = id2 },
        };

        Assert.True(service.ValidateDependencies(subTasks));
    }

    [Fact]
    public void ValidateDependencies_ReturnsFalseForCycle()
    {
        var service = CreateService();

        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();

        var subTasks = new List<SubTask>
        {
            new SubTask { Id = id1, Title = "Task 1", Order = 0, DependsOnSubTaskId = id2 },
            new SubTask { Id = id2, Title = "Task 2", Order = 1, DependsOnSubTaskId = id1 },
        };

        Assert.False(service.ValidateDependencies(subTasks));
    }

    [Fact]
    public void ValidateDependencies_ReturnsTrueForEmptyList()
    {
        var service = CreateService();
        Assert.True(service.ValidateDependencies(new List<SubTask>()));
    }

    [Fact]
    public void ValidateDependencies_ReturnsFalseForSelfReference()
    {
        var service = CreateService();

        var id1 = Guid.NewGuid();

        var subTasks = new List<SubTask>
        {
            new SubTask { Id = id1, Title = "Task 1", Order = 0, DependsOnSubTaskId = id1 },
        };

        Assert.False(service.ValidateDependencies(subTasks));
    }

    [Fact]
    public void ValidateDependencies_ReturnsTrueForExternalDependency()
    {
        var service = CreateService();

        var id1 = Guid.NewGuid();

        // Depends on an ID not in the list - should be treated as valid (external reference)
        var subTasks = new List<SubTask>
        {
            new SubTask { Id = id1, Title = "Task 1", Order = 0, DependsOnSubTaskId = Guid.NewGuid() },
        };

        Assert.True(service.ValidateDependencies(subTasks));
    }
}

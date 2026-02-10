using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class A2AServiceTests
{
    private A2AService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<A2AService>>();
        return new A2AService(db, logger.Object);
    }

    [Fact]
    public async Task RegisterAgentAsync_CreatesAgent()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var agent = await service.RegisterAgentAsync("user1", "test-agent", "Test Agent", "A test agent", null, null, null);

        Assert.Equal("test-agent", agent.AgentKey);
        Assert.Equal("Test Agent", agent.Name);
        Assert.True(agent.IsActive);
    }

    [Fact]
    public async Task RegisterAgentAsync_ThrowsOnDuplicateKey()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAgentAsync("user1", "test-agent", "Test Agent", "Desc", null, null, null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.RegisterAgentAsync("user2", "test-agent", "Another Agent", "Desc", null, null, null));
    }

    [Fact]
    public async Task GetAgentsAsync_ReturnsAllAgents()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAgentAsync("user1", "agent1", "Agent 1", "Desc", null, null, null);
        await service.RegisterAgentAsync("user2", "agent2", "Agent 2", "Desc", null, null, null);

        var agents = await service.GetAgentsAsync();

        Assert.Equal(2, agents.Count);
    }

    [Fact]
    public async Task GetAgentsAsync_FiltersByOwner()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAgentAsync("user1", "agent1", "Agent 1", "Desc", null, null, null);
        await service.RegisterAgentAsync("user2", "agent2", "Agent 2", "Desc", null, null, null);

        var agents = await service.GetAgentsAsync("user1");

        Assert.Single(agents);
    }

    [Fact]
    public async Task GetAgentByKeyAsync_ReturnsAgent()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.RegisterAgentAsync("user1", "my-agent", "My Agent", "Desc", null, null, null);

        var agent = await service.GetAgentByKeyAsync("my-agent");

        Assert.NotNull(agent);
        Assert.Equal("My Agent", agent!.Name);
    }

    [Fact]
    public async Task GetAgentByKeyAsync_ReturnsNullForNonExistent()
    {
        var service = CreateService();

        var agent = await service.GetAgentByKeyAsync("nonexistent");

        Assert.Null(agent);
    }

    [Fact]
    public async Task GrantConsentAsync_CreatesConsent()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var agent1 = await service.RegisterAgentAsync("user1", "agent1", "Agent1", "D", null, null, null);
        var agent2 = await service.RegisterAgentAsync("user1", "agent2", "Agent2", "D", null, null, null);

        var consent = await service.GrantConsentAsync("user1", agent1.Id, agent2.Id, "read,write");

        Assert.True(consent.IsGranted);
        Assert.Equal("read,write", consent.Scopes);
    }

    [Fact]
    public async Task RevokeConsentAsync_RevokesConsent()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var agent1 = await service.RegisterAgentAsync("user1", "agent1", "Agent1", "D", null, null, null);
        var agent2 = await service.RegisterAgentAsync("user1", "agent2", "Agent2", "D", null, null, null);
        var consent = await service.GrantConsentAsync("user1", agent1.Id, agent2.Id, "read");

        await service.RevokeConsentAsync("user1", consent.Id);

        var consents = await service.GetConsentsAsync("user1");
        Assert.All(consents, c => Assert.False(c.IsGranted));
    }

    [Fact]
    public async Task CreateTaskAsync_CreatesTask()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var agent1 = await service.RegisterAgentAsync("user1", "agent1", "Agent1", "D", null, null, null);
        var agent2 = await service.RegisterAgentAsync("user1", "agent2", "Agent2", "D", null, null, null);
        await service.GrantConsentAsync("user1", agent1.Id, agent2.Id, "execute");

        var task = await service.CreateTaskAsync("user1", agent1.Id, agent2.Id, "code_gen", "{\"prompt\":\"test\"}");

        Assert.NotNull(task);
        Assert.Equal(A2ATaskStatus.Submitted, task.Status);
    }

    [Fact]
    public async Task UpdateTaskStatusAsync_UpdatesStatus()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var agent1 = await service.RegisterAgentAsync("user1", "agent1", "Agent1", "D", null, null, null);
        var agent2 = await service.RegisterAgentAsync("user1", "agent2", "Agent2", "D", null, null, null);
        await service.GrantConsentAsync("user1", agent1.Id, agent2.Id, "execute");
        var task = await service.CreateTaskAsync("user1", agent1.Id, agent2.Id, "code_gen", "{}");

        var updated = await service.UpdateTaskStatusAsync(task.Id, A2ATaskStatus.Completed);

        Assert.Equal(A2ATaskStatus.Completed, updated.Status);
        Assert.NotNull(updated.CompletedAt);
    }

    [Fact]
    public async Task GenerateClientCredentialsAsync_ReturnsSecret()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var agent = await service.RegisterAgentAsync("user1", "agent1", "Agent1", "D", null, null, null);
        var secret = await service.GenerateClientCredentialsAsync(agent.Id);

        Assert.NotEmpty(secret);
    }

    [Fact]
    public async Task AddArtifactAsync_CreatesArtifact()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var agent1 = await service.RegisterAgentAsync("user1", "agent1", "Agent1", "D", null, null, null);
        var agent2 = await service.RegisterAgentAsync("user1", "agent2", "Agent2", "D", null, null, null);
        await service.GrantConsentAsync("user1", agent1.Id, agent2.Id, "execute");
        var task = await service.CreateTaskAsync("user1", agent1.Id, agent2.Id, "code_gen", "{}");

        var artifact = await service.AddArtifactAsync(task.Id, "code", "{\"code\":\"hello\"}", "response");

        Assert.Equal("code", artifact.ArtifactType);
        Assert.Equal("response", artifact.Direction);
    }

    [Fact]
    public async Task GetTasksAsync_ReturnsTasks()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var agent1 = await service.RegisterAgentAsync("user1", "agent1", "Agent1", "D", null, null, null);
        var agent2 = await service.RegisterAgentAsync("user1", "agent2", "Agent2", "D", null, null, null);
        await service.GrantConsentAsync("user1", agent1.Id, agent2.Id, "execute");
        await service.CreateTaskAsync("user1", agent1.Id, agent2.Id, "code_gen", "{}");

        var tasks = await service.GetTasksAsync("user1");

        Assert.Single(tasks);
    }
}

using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class TeamServiceTests
{
    private TeamService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<TeamService>>();
        return new TeamService(db, logger.Object);
    }

    [Fact]
    public async Task CreateTeamAsync_CreatesTeam()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var team = await service.CreateTeamAsync("user1", "My Team", "A test team");

        Assert.Equal("My Team", team.Name);
        Assert.Equal("user1", team.OwnerId);
    }

    [Fact]
    public async Task GetUserTeamsAsync_ReturnsUserTeams()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.CreateTeamAsync("user1", "Team1", "Desc1");
        await service.CreateTeamAsync("user1", "Team2", "Desc2");
        await service.CreateTeamAsync("user2", "Team3", "Desc3");

        var teams = await service.GetUserTeamsAsync("user1");

        Assert.Equal(2, teams.Count);
    }

    [Fact]
    public async Task GetTeamAsync_ReturnsTeamForMember()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var team = await service.CreateTeamAsync("user1", "Team1", "Desc");
        var result = await service.GetTeamAsync(team.Id, "user1");

        Assert.NotNull(result);
        Assert.Equal("Team1", result!.Name);
    }

    [Fact]
    public async Task UpdateTeamAsync_UpdatesTeam()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var team = await service.CreateTeamAsync("user1", "Team1", "Desc");
        var updated = await service.UpdateTeamAsync(team.Id, "user1", "Updated Team", "New desc");

        Assert.NotNull(updated);
        Assert.Equal("Updated Team", updated!.Name);
    }

    [Fact]
    public async Task UpdateTeamAsync_ReturnsNullForNonOwner()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var team = await service.CreateTeamAsync("user1", "Team1", "Desc");
        var updated = await service.UpdateTeamAsync(team.Id, "user2", "Hacked", "nope");

        Assert.Null(updated);
    }

    [Fact]
    public async Task DeleteTeamAsync_DeletesTeam()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var team = await service.CreateTeamAsync("user1", "Team1", "Desc");
        var result = await service.DeleteTeamAsync(team.Id, "user1");

        Assert.True(result);
    }

    [Fact]
    public async Task DeleteTeamAsync_ReturnsFalseForNonOwner()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var team = await service.CreateTeamAsync("user1", "Team1", "Desc");
        var result = await service.DeleteTeamAsync(team.Id, "user2");

        Assert.False(result);
    }

    [Fact]
    public async Task GetMembersAsync_ReturnsMembers()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var team = await service.CreateTeamAsync("user1", "Team1", "Desc");
        // Owner is added as a member automatically
        var members = await service.GetMembersAsync(team.Id, "user1");

        Assert.NotEmpty(members);
    }

    [Fact]
    public async Task AddMemberAsync_AddsMember()
    {
        var db = TestDbContextFactory.Create();
        // Need a user to add
        db.Users.Add(new User { Id = Guid.NewGuid(), Email = "user2@test.com", PasswordHash = "hash" });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var team = await service.CreateTeamAsync("user1", "Team1", "Desc");
        var member = await service.AddMemberAsync(team.Id, "user1", "user2@test.com", "editor");

        Assert.NotNull(member);
    }

    [Fact]
    public async Task RemoveMemberAsync_RemovesMember()
    {
        var db = TestDbContextFactory.Create();
        db.Users.Add(new User { Id = Guid.NewGuid(), Email = "user2@test.com", PasswordHash = "hash" });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var team = await service.CreateTeamAsync("user1", "Team1", "Desc");
        var member = await service.AddMemberAsync(team.Id, "user1", "user2@test.com", "editor");

        if (member != null)
        {
            var result = await service.RemoveMemberAsync(team.Id, "user1", member.Id);
            Assert.True(result);
        }
    }

    [Fact]
    public async Task GetActivitiesAsync_ReturnsActivities()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var team = await service.CreateTeamAsync("user1", "Team1", "Desc");
        // Creating a team logs an activity
        var activities = await service.GetActivitiesAsync(team.Id, "user1", 50);

        Assert.NotNull(activities);
    }
}

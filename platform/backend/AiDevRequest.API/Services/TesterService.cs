using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ITesterService
{
    Task<List<TesterApplication>> GetApplicationsAsync();
    Task<TesterApplication?> GetApplicationByUserIdAsync(string userId);
    Task<TesterApplication> SubmitApplicationAsync(TesterApplication application);
    Task<TesterApplication?> ApproveApplicationAsync(Guid applicationId);
    Task<TesterApplication?> RejectApplicationAsync(Guid applicationId);
    Task<TesterProfile?> GetProfileAsync(string userId);
    Task<object> GetDashboardAsync(string userId);
    Task<TesterContribution?> AddContributionAsync(Guid profileId, string type, string description);
    Task<List<object>> GetLeaderboardAsync(int top = 10);
}

public class TesterService : ITesterService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ILogger<TesterService> _logger;

    // Credit rewards per contribution type
    private static readonly Dictionary<string, int> CreditRewards = new()
    {
        { "feature_review", 30 },
        { "bug_report", 50 },
        { "critical_bug_report", 100 },
        { "test_completion", 20 },
        { "monthly_bonus", 50 }
    };

    // Points awarded per contribution type
    private static readonly Dictionary<string, int> PointRewards = new()
    {
        { "feature_review", 30 },
        { "bug_report", 50 },
        { "critical_bug_report", 100 },
        { "test_completion", 20 },
        { "monthly_bonus", 50 }
    };

    public TesterService(
        AiDevRequestDbContext db,
        ITokenService tokenService,
        ILogger<TesterService> logger)
    {
        _db = db;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<List<TesterApplication>> GetApplicationsAsync()
    {
        return await _db.TesterApplications
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<TesterApplication?> GetApplicationByUserIdAsync(string userId)
    {
        return await _db.TesterApplications
            .FirstOrDefaultAsync(a => a.UserId == userId);
    }

    public async Task<TesterApplication> SubmitApplicationAsync(TesterApplication application)
    {
        // Check if user already has an application
        var existing = await _db.TesterApplications
            .FirstOrDefaultAsync(a => a.UserId == application.UserId);

        if (existing != null)
            throw new InvalidOperationException("User already has an existing application.");

        _db.TesterApplications.Add(application);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Tester application submitted by user {UserId}", application.UserId);
        return application;
    }

    public async Task<TesterApplication?> ApproveApplicationAsync(Guid applicationId)
    {
        var application = await _db.TesterApplications.FindAsync(applicationId);
        if (application == null) return null;

        application.Status = "approved";
        application.UpdatedAt = DateTime.UtcNow;

        // Create a tester profile if one doesn't exist
        var existingProfile = await _db.TesterProfiles
            .FirstOrDefaultAsync(p => p.UserId == application.UserId);

        if (existingProfile == null)
        {
            var profile = new TesterProfile
            {
                UserId = application.UserId
            };
            _db.TesterProfiles.Add(profile);
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Tester application {ApplicationId} approved for user {UserId}",
            applicationId, application.UserId);
        return application;
    }

    public async Task<TesterApplication?> RejectApplicationAsync(Guid applicationId)
    {
        var application = await _db.TesterApplications.FindAsync(applicationId);
        if (application == null) return null;

        application.Status = "rejected";
        application.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Tester application {ApplicationId} rejected", applicationId);
        return application;
    }

    public async Task<TesterProfile?> GetProfileAsync(string userId)
    {
        return await _db.TesterProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);
    }

    public async Task<object> GetDashboardAsync(string userId)
    {
        var profile = await _db.TesterProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
            throw new InvalidOperationException("Tester profile not found.");

        var recentContributions = await _db.TesterContributions
            .Where(c => c.TesterProfileId == profile.Id)
            .OrderByDescending(c => c.CreatedAt)
            .Take(20)
            .ToListAsync();

        var leaderboard = await GetLeaderboardAsync(10);

        // Calculate rank
        var rank = await _db.TesterProfiles
            .CountAsync(p => p.ContributionPoints > profile.ContributionPoints) + 1;

        return new
        {
            profile = new
            {
                profile.Id,
                profile.UserId,
                profile.Tier,
                profile.ContributionPoints,
                profile.TotalCreditsEarned,
                profile.BugsFound,
                profile.ReviewsWritten,
                profile.TestsCompleted,
                profile.JoinedAt
            },
            rank,
            recentContributions = recentContributions.Select(c => new
            {
                c.Id,
                c.Type,
                c.Description,
                c.PointsAwarded,
                c.CreditsAwarded,
                c.CreatedAt
            }),
            leaderboard
        };
    }

    public async Task<TesterContribution?> AddContributionAsync(Guid profileId, string type, string description)
    {
        var profile = await _db.TesterProfiles.FindAsync(profileId);
        if (profile == null) return null;

        if (!CreditRewards.TryGetValue(type, out var baseCredits))
            throw new ArgumentException($"Invalid contribution type: {type}");

        var basePoints = PointRewards[type];

        // Apply tier multiplier to credits
        var multiplier = profile.Tier switch
        {
            "Gold" => 2.0,
            "Silver" => 1.5,
            _ => 1.0 // Bronze
        };

        var creditsAwarded = (int)(baseCredits * multiplier);

        var contribution = new TesterContribution
        {
            TesterProfileId = profileId,
            Type = type,
            Description = description,
            PointsAwarded = basePoints,
            CreditsAwarded = creditsAwarded
        };

        _db.TesterContributions.Add(contribution);

        // Update profile stats
        profile.ContributionPoints += basePoints;
        profile.TotalCreditsEarned += creditsAwarded;

        switch (type)
        {
            case "bug_report":
            case "critical_bug_report":
                profile.BugsFound++;
                break;
            case "feature_review":
                profile.ReviewsWritten++;
                break;
            case "test_completion":
                profile.TestsCompleted++;
                break;
        }

        // Recalculate tier
        profile.Tier = profile.ContributionPoints switch
        {
            >= 2000 => "Gold",
            >= 500 => "Silver",
            _ => "Bronze"
        };

        await _db.SaveChangesAsync();

        // Credit tokens to user account
        await _tokenService.CreditTokens(
            profile.UserId,
            creditsAwarded,
            "tester_contribution",
            contribution.Id.ToString(),
            $"Tester contribution ({type}): +{creditsAwarded} credits");

        _logger.LogInformation(
            "Contribution added for tester {ProfileId}: type={Type}, points={Points}, credits={Credits}",
            profileId, type, basePoints, creditsAwarded);

        return contribution;
    }

    public async Task<List<object>> GetLeaderboardAsync(int top = 10)
    {
        var topTesters = await _db.TesterProfiles
            .OrderByDescending(p => p.ContributionPoints)
            .Take(top)
            .Select(p => new
            {
                p.Id,
                p.UserId,
                p.Tier,
                p.ContributionPoints,
                p.TotalCreditsEarned,
                p.BugsFound,
                p.ReviewsWritten,
                p.TestsCompleted,
                p.JoinedAt
            })
            .ToListAsync();

        return topTesters.Select((t, index) => (object)new
        {
            rank = index + 1,
            t.Id,
            t.UserId,
            t.Tier,
            t.ContributionPoints,
            t.TotalCreditsEarned,
            t.BugsFound,
            t.ReviewsWritten,
            t.TestsCompleted,
            t.JoinedAt
        }).ToList();
    }
}

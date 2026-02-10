using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IOnboardingService
{
    Task<OnboardingProgress> GetProgressAsync(string userId);
    Task<OnboardingProgress> CompleteStepAsync(string userId, string step);
    Task<OnboardingProgress> SkipOnboardingAsync(string userId);
    Task<OnboardingProgress> ResetOnboardingAsync(string userId);
}

public class OnboardingService : IOnboardingService
{
    private readonly AiDevRequestDbContext _db;

    private static readonly string[] AllSteps =
    {
        "account_created",
        "first_request",
        "analysis_viewed",
        "proposal_reviewed",
        "build_completed",
        "preview_deployed"
    };

    public OnboardingService(AiDevRequestDbContext db)
    {
        _db = db;
    }

    public async Task<OnboardingProgress> GetProgressAsync(string userId)
    {
        var progress = await _db.OnboardingProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (progress == null)
        {
            progress = new OnboardingProgress
            {
                UserId = userId,
                CurrentStep = 0,
                CompletedStepsJson = "[]",
                Status = "active"
            };
            _db.OnboardingProgresses.Add(progress);
            await _db.SaveChangesAsync();
        }

        return progress;
    }

    public async Task<OnboardingProgress> CompleteStepAsync(string userId, string step)
    {
        var progress = await GetProgressAsync(userId);

        var completedSteps = JsonSerializer.Deserialize<List<string>>(progress.CompletedStepsJson) ?? new List<string>();

        if (!completedSteps.Contains(step))
        {
            completedSteps.Add(step);
            progress.CompletedStepsJson = JsonSerializer.Serialize(completedSteps);
        }

        var stepIndex = Array.IndexOf(AllSteps, step);
        if (stepIndex >= 0 && stepIndex + 1 > progress.CurrentStep)
        {
            progress.CurrentStep = stepIndex + 1;
        }

        if (completedSteps.Count >= AllSteps.Length)
        {
            progress.Status = "completed";
            progress.CompletedAt = DateTime.UtcNow;
        }

        progress.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return progress;
    }

    public async Task<OnboardingProgress> SkipOnboardingAsync(string userId)
    {
        var progress = await GetProgressAsync(userId);
        progress.Status = "skipped";
        progress.CompletedAt = DateTime.UtcNow;
        progress.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return progress;
    }

    public async Task<OnboardingProgress> ResetOnboardingAsync(string userId)
    {
        var progress = await GetProgressAsync(userId);
        progress.CurrentStep = 0;
        progress.CompletedStepsJson = "[]";
        progress.Status = "active";
        progress.CompletedAt = null;
        progress.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return progress;
    }
}

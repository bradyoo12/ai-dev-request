using System.Security.Claims;
using System.Text.Json;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/onboarding")]
public class OnboardingController : ControllerBase
{
    private readonly IOnboardingService _onboardingService;

    public OnboardingController(IOnboardingService onboardingService)
    {
        _onboardingService = onboardingService;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    [HttpGet("progress")]
    public async Task<ActionResult<OnboardingProgressDto>> GetProgress()
    {
        var userId = GetUserId();
        var progress = await _onboardingService.GetProgressAsync(userId);
        return Ok(MapToDto(progress));
    }

    [HttpPost("step/{step}")]
    public async Task<ActionResult<OnboardingProgressDto>> CompleteStep(string step)
    {
        var userId = GetUserId();
        var progress = await _onboardingService.CompleteStepAsync(userId, step);
        return Ok(MapToDto(progress));
    }

    [HttpPost("skip")]
    public async Task<ActionResult<OnboardingProgressDto>> SkipOnboarding()
    {
        var userId = GetUserId();
        var progress = await _onboardingService.SkipOnboardingAsync(userId);
        return Ok(MapToDto(progress));
    }

    [HttpPost("reset")]
    public async Task<ActionResult<OnboardingProgressDto>> ResetOnboarding()
    {
        var userId = GetUserId();
        var progress = await _onboardingService.ResetOnboardingAsync(userId);
        return Ok(MapToDto(progress));
    }

    private static OnboardingProgressDto MapToDto(Entities.OnboardingProgress progress) => new()
    {
        Id = progress.Id,
        UserId = progress.UserId,
        CurrentStep = progress.CurrentStep,
        CompletedSteps = JsonSerializer.Deserialize<List<string>>(progress.CompletedStepsJson) ?? new(),
        Status = progress.Status,
        StartedAt = progress.StartedAt,
        CompletedAt = progress.CompletedAt,
        UpdatedAt = progress.UpdatedAt
    };
}

public record OnboardingProgressDto
{
    public int Id { get; init; }
    public string UserId { get; init; } = "";
    public int CurrentStep { get; init; }
    public List<string> CompletedSteps { get; init; } = new();
    public string Status { get; init; } = "";
    public DateTime StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

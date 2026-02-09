using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/preferences")]
public class PreferenceController : ControllerBase
{
    private readonly IPreferenceService _preferenceService;

    public PreferenceController(IPreferenceService preferenceService)
    {
        _preferenceService = preferenceService;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    [HttpGet]
    public async Task<ActionResult<PreferenceListDto>> GetPreferences([FromQuery] string? category = null)
    {
        var userId = GetUserId();
        var prefs = await _preferenceService.GetPreferencesAsync(userId, category);
        var totalCount = await _preferenceService.GetPreferenceCountAsync(userId);

        return Ok(new PreferenceListDto
        {
            Preferences = prefs.Select(p => new PreferenceDto
            {
                Id = p.Id,
                Category = p.Category,
                Key = p.Key,
                Value = p.Value,
                Confidence = p.Confidence,
                Source = p.Source,
                DetectedAt = p.DetectedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList(),
            TotalCount = totalCount
        });
    }

    [HttpPost]
    public async Task<ActionResult<PreferenceDto>> SetPreference([FromBody] SetPreferenceDto dto)
    {
        var userId = GetUserId();
        var pref = await _preferenceService.SetPreferenceAsync(
            userId, dto.Category, dto.Key, dto.Value, dto.Confidence, "manual");

        return Ok(new PreferenceDto
        {
            Id = pref.Id,
            Category = pref.Category,
            Key = pref.Key,
            Value = pref.Value,
            Confidence = pref.Confidence,
            Source = pref.Source,
            DetectedAt = pref.DetectedAt,
            UpdatedAt = pref.UpdatedAt
        });
    }

    [HttpDelete("{preferenceId:int}")]
    public async Task<IActionResult> DeletePreference(int preferenceId)
    {
        await _preferenceService.DeletePreferenceAsync(GetUserId(), preferenceId);
        return Ok();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAllPreferences()
    {
        await _preferenceService.DeleteAllPreferencesAsync(GetUserId());
        return Ok();
    }

    [HttpGet("summary")]
    public async Task<ActionResult<PreferenceSummaryDto>> GetSummary()
    {
        var userId = GetUserId();
        var summary = await _preferenceService.GetSummaryAsync(userId);
        if (summary == null)
        {
            summary = await _preferenceService.RegenerateSummaryAsync(userId);
        }

        return Ok(new PreferenceSummaryDto
        {
            SummaryText = summary.SummaryText,
            LastUpdatedAt = summary.LastUpdatedAt
        });
    }

    [HttpPost("summary/regenerate")]
    public async Task<ActionResult<PreferenceSummaryDto>> RegenerateSummary()
    {
        var userId = GetUserId();
        var summary = await _preferenceService.RegenerateSummaryAsync(userId);

        return Ok(new PreferenceSummaryDto
        {
            SummaryText = summary.SummaryText,
            LastUpdatedAt = summary.LastUpdatedAt
        });
    }

    [HttpPost("detect")]
    public async Task<ActionResult<List<PreferenceDto>>> DetectPreferences([FromBody] DetectPreferencesDto dto)
    {
        var userId = GetUserId();
        var detected = await _preferenceService.DetectPreferencesAsync(userId, dto.Text);

        return Ok(detected.Select(p => new PreferenceDto
        {
            Id = p.Id,
            Category = p.Category,
            Key = p.Key,
            Value = p.Value,
            Confidence = p.Confidence,
            Source = p.Source,
            DetectedAt = p.DetectedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList());
    }
}

public record PreferenceDto
{
    public int Id { get; init; }
    public string Category { get; init; } = "";
    public string Key { get; init; } = "";
    public string Value { get; init; } = "";
    public double Confidence { get; init; }
    public string Source { get; init; } = "";
    public DateTime DetectedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record PreferenceListDto
{
    public List<PreferenceDto> Preferences { get; init; } = [];
    public int TotalCount { get; init; }
}

public record SetPreferenceDto
{
    public required string Category { get; init; }
    public required string Key { get; init; }
    public required string Value { get; init; }
    public double Confidence { get; init; } = 0.8;
}

public record PreferenceSummaryDto
{
    public string SummaryText { get; init; } = "";
    public DateTime LastUpdatedAt { get; init; }
}

public record DetectPreferencesDto
{
    public required string Text { get; init; }
}

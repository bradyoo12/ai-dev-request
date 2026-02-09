using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/recommendations")]
public class RecommendationController : ControllerBase
{
    private readonly IRecommendationService _recommendationService;

    public RecommendationController(IRecommendationService recommendationService)
    {
        _recommendationService = recommendationService;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    [HttpGet]
    public async Task<ActionResult<List<AppRecommendationDto>>> GetRecommendations()
    {
        var userId = GetUserId();
        var recs = await _recommendationService.GetRecommendationsAsync(userId);
        return Ok(recs.Select(r => new AppRecommendationDto
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            Reason = r.Reason,
            PromptTemplate = r.PromptTemplate,
            MatchPercent = r.MatchPercent,
            InterestCategory = r.InterestCategory,
        }).ToList());
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<List<AppRecommendationDto>>> RefreshRecommendations()
    {
        var userId = GetUserId();
        var recs = await _recommendationService.GenerateRecommendationsAsync(userId);
        return Ok(recs.Select(r => new AppRecommendationDto
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            Reason = r.Reason,
            PromptTemplate = r.PromptTemplate,
            MatchPercent = r.MatchPercent,
            InterestCategory = r.InterestCategory,
        }).ToList());
    }

    [HttpPost("{recommendationId:int}/dismiss")]
    public async Task<IActionResult> DismissRecommendation(int recommendationId)
    {
        await _recommendationService.DismissRecommendationAsync(GetUserId(), recommendationId);
        return Ok();
    }

    [HttpGet("interests")]
    public async Task<ActionResult<List<UserInterestDto>>> GetInterests()
    {
        var userId = GetUserId();
        var interests = await _recommendationService.GetInterestsAsync(userId);
        return Ok(interests.Select(i => new UserInterestDto
        {
            Id = i.Id,
            Category = i.Category,
            Confidence = i.Confidence,
            Source = i.Source,
            DetectedAt = i.DetectedAt,
        }).ToList());
    }

    [HttpPost("interests")]
    public async Task<ActionResult<UserInterestDto>> AddInterest([FromBody] AddInterestDto dto)
    {
        var userId = GetUserId();
        var interest = await _recommendationService.AddInterestAsync(userId, dto.Category);
        return Ok(new UserInterestDto
        {
            Id = interest.Id,
            Category = interest.Category,
            Confidence = interest.Confidence,
            Source = interest.Source,
            DetectedAt = interest.DetectedAt,
        });
    }

    [HttpDelete("interests/{interestId:int}")]
    public async Task<IActionResult> DeleteInterest(int interestId)
    {
        await _recommendationService.DeleteInterestAsync(GetUserId(), interestId);
        return Ok();
    }
}

public record AppRecommendationDto
{
    public int Id { get; init; }
    public string Title { get; init; } = "";
    public string Description { get; init; } = "";
    public string Reason { get; init; } = "";
    public string PromptTemplate { get; init; } = "";
    public int MatchPercent { get; init; }
    public string InterestCategory { get; init; } = "";
}

public record UserInterestDto
{
    public int Id { get; init; }
    public string Category { get; init; } = "";
    public double Confidence { get; init; }
    public string Source { get; init; } = "";
    public DateTime DetectedAt { get; init; }
}

public record AddInterestDto
{
    public required string Category { get; init; }
}

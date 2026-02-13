using AiDevRequest.API.DTOs;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/discovery")]
public class DiscoveryController : ControllerBase
{
    private readonly IDiscoveryService _discoveryService;

    public DiscoveryController(IDiscoveryService discoveryService)
    {
        _discoveryService = discoveryService;
    }

    /// <summary>
    /// Submit questionnaire answers and receive AI-generated project recommendations
    /// </summary>
    [HttpPost("questionnaire")]
    public async Task<ActionResult<List<DiscoveryRecommendationDto>>> SubmitQuestionnaire([FromBody] QuestionnaireAnswersDto answers)
    {
        // TODO: Get actual user ID from authentication context
        // For now, using a placeholder - this will be replaced with actual auth
        var userId = "placeholder-user-id";

        var recommendations = await _discoveryService.GenerateRecommendationsAsync(userId, answers);
        return Ok(recommendations);
    }

    /// <summary>
    /// Get previously saved recommendations for the current user
    /// </summary>
    [HttpGet("recommendations")]
    public async Task<ActionResult<List<DiscoveryRecommendationDto>>> GetRecommendations()
    {
        // TODO: Get actual user ID from authentication context
        var userId = "placeholder-user-id";

        var recommendations = await _discoveryService.GetSavedRecommendationsAsync(userId);
        return Ok(recommendations);
    }
}

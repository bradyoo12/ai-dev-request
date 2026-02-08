using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/suggestions")]
public class SuggestionsController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ILogger<SuggestionsController> _logger;

    private const int SuggestionRegistrationReward = 50;
    private const int UpvoteMilestone10Reward = 100;
    private const int UpvoteMilestone50Reward = 300;
    private const int ImplementedReward = 500;

    public SuggestionsController(
        AiDevRequestDbContext db,
        ITokenService tokenService,
        ILogger<SuggestionsController> logger)
    {
        _db = db;
        _tokenService = tokenService;
        _logger = logger;
    }

    private string GetUserId()
    {
        var jwtUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(jwtUserId)) return jwtUserId;
        return Request.Headers["X-User-Id"].FirstOrDefault() ?? "anonymous";
    }

    /// <summary>
    /// Get all suggestions with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSuggestions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? category = null,
        [FromQuery] string sort = "newest")
    {
        var query = _db.Suggestions.AsQueryable();

        if (!string.IsNullOrEmpty(category) && category != "all")
            query = query.Where(s => s.Category == category);

        query = sort switch
        {
            "popular" => query.OrderByDescending(s => s.UpvoteCount),
            "oldest" => query.OrderBy(s => s.CreatedAt),
            _ => query.OrderByDescending(s => s.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                s.Id,
                s.UserId,
                s.Title,
                s.Description,
                s.Category,
                s.Status,
                s.UpvoteCount,
                s.CommentCount,
                s.TokenReward,
                s.DevRequestId,
                s.CreatedAt,
                s.UpdatedAt
            })
            .ToListAsync();

        return Ok(new { items, total, page, pageSize });
    }

    /// <summary>
    /// Get a single suggestion by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetSuggestion(int id)
    {
        var suggestion = await _db.Suggestions.FindAsync(id);
        if (suggestion == null) return NotFound();

        var userId = GetUserId();
        var userVote = await _db.SuggestionVotes
            .FirstOrDefaultAsync(v => v.SuggestionId == id && v.UserId == userId);

        return Ok(new
        {
            suggestion.Id,
            suggestion.UserId,
            suggestion.Title,
            suggestion.Description,
            suggestion.Category,
            suggestion.Status,
            suggestion.UpvoteCount,
            suggestion.CommentCount,
            suggestion.TokenReward,
            suggestion.DevRequestId,
            suggestion.CreatedAt,
            suggestion.UpdatedAt,
            userVoted = userVote != null,
            userVoteIsUpvote = userVote?.IsUpvote
        });
    }

    /// <summary>
    /// Create a new suggestion (from chat or direct)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateSuggestion([FromBody] CreateSuggestionRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.Description))
            return BadRequest(new { error = "Title and description are required" });

        var userId = GetUserId();

        var suggestion = new Suggestion
        {
            UserId = userId,
            Title = body.Title,
            Description = body.Description,
            Category = body.Category ?? "feature_request",
            DevRequestId = body.DevRequestId
        };
        _db.Suggestions.Add(suggestion);
        await _db.SaveChangesAsync();

        // Award tokens for suggestion registration
        var transaction = await _tokenService.CreditTokens(
            userId,
            SuggestionRegistrationReward,
            "suggestion_registered",
            suggestion.Id.ToString(),
            "Suggestion registration reward");

        suggestion.TokenReward = SuggestionRegistrationReward;
        await _db.SaveChangesAsync();

        var updatedBalance = await _tokenService.GetOrCreateBalance(userId);

        return Ok(new
        {
            suggestion = new
            {
                suggestion.Id,
                suggestion.UserId,
                suggestion.Title,
                suggestion.Description,
                suggestion.Category,
                suggestion.Status,
                suggestion.UpvoteCount,
                suggestion.TokenReward,
                suggestion.CreatedAt
            },
            tokensAwarded = SuggestionRegistrationReward,
            newBalance = updatedBalance.Balance
        });
    }

    /// <summary>
    /// Vote on a suggestion (upvote/remove vote)
    /// </summary>
    [HttpPost("{id}/vote")]
    public async Task<IActionResult> VoteSuggestion(int id)
    {
        var suggestion = await _db.Suggestions.FindAsync(id);
        if (suggestion == null) return NotFound();

        var userId = GetUserId();
        var existingVote = await _db.SuggestionVotes
            .FirstOrDefaultAsync(v => v.SuggestionId == id && v.UserId == userId);

        int? bonusTokens = null;

        if (existingVote != null)
        {
            // Remove vote (toggle)
            _db.SuggestionVotes.Remove(existingVote);
            suggestion.UpvoteCount = Math.Max(0, suggestion.UpvoteCount - 1);
        }
        else
        {
            // Add upvote
            _db.SuggestionVotes.Add(new SuggestionVote
            {
                SuggestionId = id,
                UserId = userId
            });
            suggestion.UpvoteCount++;

            // Check upvote milestones for the suggestion author
            if (suggestion.UpvoteCount == 10)
            {
                await _tokenService.CreditTokens(
                    suggestion.UserId,
                    UpvoteMilestone10Reward,
                    "suggestion_10_upvotes",
                    suggestion.Id.ToString(),
                    "Suggestion reached 10 upvotes");
                suggestion.TokenReward += UpvoteMilestone10Reward;
                bonusTokens = UpvoteMilestone10Reward;
            }
            else if (suggestion.UpvoteCount == 50)
            {
                await _tokenService.CreditTokens(
                    suggestion.UserId,
                    UpvoteMilestone50Reward,
                    "suggestion_50_upvotes",
                    suggestion.Id.ToString(),
                    "Suggestion reached 50 upvotes");
                suggestion.TokenReward += UpvoteMilestone50Reward;
                bonusTokens = UpvoteMilestone50Reward;
            }
        }

        suggestion.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            suggestion.Id,
            suggestion.UpvoteCount,
            voted = existingVote == null, // true if we just added a vote
            bonusTokensAwarded = bonusTokens
        });
    }

    /// <summary>
    /// Get vote status for current user on a suggestion
    /// </summary>
    [HttpGet("{id}/vote")]
    public async Task<IActionResult> GetVoteStatus(int id)
    {
        var userId = GetUserId();
        var vote = await _db.SuggestionVotes
            .FirstOrDefaultAsync(v => v.SuggestionId == id && v.UserId == userId);

        return Ok(new { voted = vote != null });
    }
}

public class CreateSuggestionRequest
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string? Category { get; set; }
    public Guid? DevRequestId { get; set; }
}

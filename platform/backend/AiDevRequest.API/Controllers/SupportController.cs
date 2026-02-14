using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/support")]
public class SupportController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ILogger<SupportController> _logger;

    public SupportController(
        AiDevRequestDbContext db,
        ITokenService tokenService,
        ILogger<SupportController> logger)
    {
        _db = db;
        _tokenService = tokenService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    private async Task<bool> IsAdmin()
    {
        var userId = GetUserId();
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        return user?.IsAdmin == true;
    }

    /// <summary>
    /// Get paginated support posts with optional category filter and sort
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetSupportPosts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null,
        [FromQuery] string sort = "newest")
    {
        try
        {
            var query = _db.SupportPosts.AsQueryable();

            if (!string.IsNullOrEmpty(category) && category != "all")
                query = query.Where(p => p.Category == category);

            query = sort switch
            {
                "oldest" => query.OrderBy(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };

            var total = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    p.UserId,
                    p.Title,
                    p.Content,
                    p.Category,
                    p.Status,
                    p.FeedbackType,
                    p.RewardCredit,
                    p.RewardedByUserId,
                    p.RewardMessage,
                    p.RewardedAt,
                    p.CreatedAt,
                    p.UpdatedAt
                })
                .ToListAsync();

            return Ok(new { items, total, page, pageSize });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query support posts — possible schema mismatch. Returning empty result.");
            return Ok(new { items = Array.Empty<object>(), total = 0, page, pageSize, warning = "Support posts temporarily unavailable" });
        }
    }

    /// <summary>
    /// Get preset credit values for feedback types
    /// </summary>
    [AllowAnonymous]
    [HttpGet("feedback-presets")]
    public IActionResult GetFeedbackPresets()
    {
        return Ok(new[]
        {
            new { type = "bug_report", credits = 50, label = "Bug Report" },
            new { type = "feature_suggestion", credits = 30, label = "Feature Suggestion" },
            new { type = "general_inquiry", credits = 10, label = "General Inquiry" }
        });
    }

    /// <summary>
    /// Get a single support post by ID
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetSupportPost(Guid id)
    {
        var post = await _db.SupportPosts
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.UserId,
                p.Title,
                p.Content,
                p.Category,
                p.Status,
                p.FeedbackType,
                p.RewardCredit,
                p.RewardedByUserId,
                p.RewardMessage,
                p.RewardedAt,
                p.CreatedAt,
                p.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (post == null) return NotFound();

        return Ok(post);
    }

    /// <summary>
    /// Create a new support post (requires authentication)
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateSupportPost([FromBody] CreateSupportPostRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.Content))
            return BadRequest(new { error = "Title and content are required" });

        var validCategories = new[] { "complaint", "request", "inquiry", "other" };
        var category = body.Category ?? "inquiry";
        if (!validCategories.Contains(category))
            return BadRequest(new { error = "Invalid category. Must be: complaint, request, inquiry, or other" });

        var userId = GetUserId();

        var post = new SupportPost
        {
            UserId = userId,
            Title = body.Title,
            Content = body.Content,
            Category = category
        };
        _db.SupportPosts.Add(post);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            post.Id,
            post.UserId,
            post.Title,
            post.Content,
            post.Category,
            post.Status,
            post.FeedbackType,
            post.RewardCredit,
            post.RewardedByUserId,
            post.RewardMessage,
            post.RewardedAt,
            post.CreatedAt,
            post.UpdatedAt
        });
    }

    /// <summary>
    /// Set reward credit for a support post (admin only).
    /// Classifies feedback type and awards credits accordingly.
    /// </summary>
    [Authorize]
    [HttpPatch("{id}/reward")]
    public async Task<IActionResult> SetRewardCredit(Guid id, [FromBody] SetRewardCreditRequest body)
    {
        if (!await IsAdmin())
            return Forbid();

        var post = await _db.SupportPosts.FindAsync(id);
        if (post == null) return NotFound();

        // Validate feedback type if provided
        var validFeedbackTypes = new[] { "bug_report", "feature_suggestion", "general_inquiry" };
        if (!string.IsNullOrEmpty(body.FeedbackType) && !validFeedbackTypes.Contains(body.FeedbackType))
            return BadRequest(new { error = "Invalid feedback type. Must be: bug_report, feature_suggestion, or general_inquiry" });

        var adminUserId = GetUserId();
        var newReward = body.RewardCredit;
        var existingReward = post.RewardCredit ?? 0m;
        var difference = newReward - existingReward;

        // Build description with feedback type context
        var feedbackLabel = body.FeedbackType switch
        {
            "bug_report" => "Bug Report",
            "feature_suggestion" => "Feature Suggestion",
            "general_inquiry" => "General Inquiry",
            _ => "Feedback"
        };

        // Credit or debit the post author based on the difference
        if (difference > 0)
        {
            await _tokenService.CreditTokens(
                post.UserId,
                (int)difference,
                "support_reward",
                post.Id.ToString(),
                $"Support reward ({feedbackLabel}): +{difference} credits");
        }
        else if (difference < 0)
        {
            var absAmount = (int)Math.Abs(difference);
            await _db.Database.ExecuteSqlRawAsync(
                "UPDATE token_balances SET balance = balance - {0}, total_spent = total_spent + {0}, updated_at = NOW() WHERE user_id = {1}",
                absAmount, post.UserId);

            var newBalance = await _db.TokenBalances
                .AsNoTracking()
                .FirstAsync(b => b.UserId == post.UserId);

            _db.TokenTransactions.Add(new TokenTransaction
            {
                UserId = post.UserId,
                Type = "debit",
                Amount = absAmount,
                Action = "support_reward_adjustment",
                ReferenceId = post.Id.ToString(),
                Description = $"Support reward adjustment ({feedbackLabel}): -{absAmount} credits",
                BalanceAfter = newBalance.Balance
            });
            await _db.SaveChangesAsync();
        }

        post.FeedbackType = body.FeedbackType ?? post.FeedbackType;
        post.RewardCredit = newReward;
        post.RewardedByUserId = adminUserId;
        post.RewardMessage = body.RewardMessage ?? post.RewardMessage;
        post.RewardedAt = DateTime.UtcNow;
        post.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Admin {AdminId} awarded {Credits} credits to user {UserId} for support post {PostId} (type: {FeedbackType})",
            adminUserId, newReward, post.UserId, post.Id, post.FeedbackType);

        return Ok(new
        {
            post.Id,
            post.FeedbackType,
            post.RewardCredit,
            post.RewardedByUserId,
            post.RewardMessage,
            post.RewardedAt
        });
    }

    /// <summary>
    /// Update support post status (admin only)
    /// </summary>
    [Authorize]
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateSupportStatusRequest body)
    {
        if (!await IsAdmin())
            return Forbid();

        var post = await _db.SupportPosts.FindAsync(id);
        if (post == null) return NotFound();

        var validStatuses = new[] { "open", "in_review", "resolved", "closed" };
        if (!validStatuses.Contains(body.Status))
            return BadRequest(new { error = "Invalid status. Must be: open, in_review, resolved, or closed" });

        var previousStatus = post.Status;
        if (previousStatus == body.Status)
            return Ok(new { post.Id, post.Status, previousStatus });

        post.Status = body.Status;
        post.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            post.Id,
            post.Status,
            previousStatus
        });
    }
}

public class CreateSupportPostRequest
{
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string? Category { get; set; }
}

public class SetRewardCreditRequest
{
    public decimal RewardCredit { get; set; }
    public string? FeedbackType { get; set; }
    public string? RewardMessage { get; set; }
}

public class UpdateSupportStatusRequest
{
    public string Status { get; set; } = "";
}

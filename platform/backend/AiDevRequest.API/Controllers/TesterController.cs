using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/testers")]
public class TesterController : ControllerBase
{
    private readonly ITesterService _testerService;
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<TesterController> _logger;

    public TesterController(
        ITesterService testerService,
        AiDevRequestDbContext db,
        ILogger<TesterController> logger)
    {
        _testerService = testerService;
        _db = db;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    private async Task<bool> IsAdmin()
    {
        var userId = GetUserId();
        if (!Guid.TryParse(userId, out var userGuid))
            return false;
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userGuid);
        return user?.IsAdmin == true;
    }

    /// <summary>
    /// Submit a tester application (authenticated)
    /// </summary>
    [Authorize]
    [HttpPost("apply")]
    public async Task<IActionResult> SubmitApplication([FromBody] SubmitTesterApplicationRequest body)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.Email))
                return BadRequest(new { error = "Name and email are required." });

            if (string.IsNullOrWhiteSpace(body.Motivation))
                return BadRequest(new { error = "Motivation is required." });

            var validLevels = new[] { "Beginner", "Intermediate", "Expert" };
            if (!validLevels.Contains(body.ExperienceLevel))
                return BadRequest(new { error = "Invalid experience level. Must be: Beginner, Intermediate, or Expert." });

            var userId = GetUserId();

            var application = new TesterApplication
            {
                UserId = userId,
                Name = body.Name,
                Email = body.Email,
                Motivation = body.Motivation,
                ExperienceLevel = body.ExperienceLevel,
                InterestedAreas = body.InterestedAreas
            };

            var result = await _testerService.SubmitApplicationAsync(application);
            return Ok(new
            {
                result.Id,
                result.UserId,
                result.Name,
                result.Email,
                result.Motivation,
                result.ExperienceLevel,
                result.InterestedAreas,
                result.Status,
                result.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to submit tester application");
            return StatusCode(500, new { error = "Failed to submit application." });
        }
    }

    /// <summary>
    /// Get current user's application status
    /// </summary>
    [Authorize]
    [HttpGet("application")]
    public async Task<IActionResult> GetMyApplication()
    {
        try
        {
            var userId = GetUserId();
            var application = await _testerService.GetApplicationByUserIdAsync(userId);

            if (application == null)
                return NotFound(new { error = "No application found." });

            return Ok(new
            {
                application.Id,
                application.UserId,
                application.Name,
                application.Email,
                application.Motivation,
                application.ExperienceLevel,
                application.InterestedAreas,
                application.Status,
                application.CreatedAt,
                application.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get tester application");
            return StatusCode(500, new { error = "Failed to get application." });
        }
    }

    /// <summary>
    /// List all applications (admin)
    /// </summary>
    [Authorize]
    [HttpGet("applications")]
    public async Task<IActionResult> GetAllApplications()
    {
        try
        {
            if (!await IsAdmin())
                return Forbid();

            var applications = await _testerService.GetApplicationsAsync();
            return Ok(applications.Select(a => new
            {
                a.Id,
                a.UserId,
                a.Name,
                a.Email,
                a.Motivation,
                a.ExperienceLevel,
                a.InterestedAreas,
                a.Status,
                a.CreatedAt,
                a.UpdatedAt
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get tester applications");
            return StatusCode(500, new { error = "Failed to get applications." });
        }
    }

    /// <summary>
    /// Approve a tester application (admin)
    /// </summary>
    [Authorize]
    [HttpPost("applications/{id}/approve")]
    public async Task<IActionResult> ApproveApplication(Guid id)
    {
        try
        {
            if (!await IsAdmin())
                return Forbid();

            var application = await _testerService.ApproveApplicationAsync(id);
            if (application == null)
                return NotFound(new { error = "Application not found." });

            return Ok(new { application.Id, application.Status, application.UpdatedAt });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to approve tester application {Id}", id);
            return StatusCode(500, new { error = "Failed to approve application." });
        }
    }

    /// <summary>
    /// Reject a tester application (admin)
    /// </summary>
    [Authorize]
    [HttpPost("applications/{id}/reject")]
    public async Task<IActionResult> RejectApplication(Guid id)
    {
        try
        {
            if (!await IsAdmin())
                return Forbid();

            var application = await _testerService.RejectApplicationAsync(id);
            if (application == null)
                return NotFound(new { error = "Application not found." });

            return Ok(new { application.Id, application.Status, application.UpdatedAt });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reject tester application {Id}", id);
            return StatusCode(500, new { error = "Failed to reject application." });
        }
    }

    /// <summary>
    /// Get current tester profile
    /// </summary>
    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var userId = GetUserId();
            var profile = await _testerService.GetProfileAsync(userId);

            if (profile == null)
                return NotFound(new { error = "Tester profile not found." });

            return Ok(new
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
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get tester profile");
            return StatusCode(500, new { error = "Failed to get profile." });
        }
    }

    /// <summary>
    /// Get tester dashboard data
    /// </summary>
    [Authorize]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        try
        {
            var userId = GetUserId();
            var dashboard = await _testerService.GetDashboardAsync(userId);
            return Ok(dashboard);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get tester dashboard");
            return StatusCode(500, new { error = "Failed to get dashboard." });
        }
    }

    /// <summary>
    /// Add a contribution
    /// </summary>
    [Authorize]
    [HttpPost("contributions")]
    public async Task<IActionResult> AddContribution([FromBody] AddContributionRequest body)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(body.Type) || string.IsNullOrWhiteSpace(body.Description))
                return BadRequest(new { error = "Type and description are required." });

            var userId = GetUserId();
            var profile = await _testerService.GetProfileAsync(userId);

            if (profile == null)
                return NotFound(new { error = "Tester profile not found. You must be an approved tester." });

            var contribution = await _testerService.AddContributionAsync(profile.Id, body.Type, body.Description);
            if (contribution == null)
                return NotFound(new { error = "Profile not found." });

            return Ok(new
            {
                contribution.Id,
                contribution.Type,
                contribution.Description,
                contribution.PointsAwarded,
                contribution.CreditsAwarded,
                contribution.CreatedAt
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to add contribution");
            return StatusCode(500, new { error = "Failed to add contribution." });
        }
    }

    /// <summary>
    /// Get leaderboard (public)
    /// </summary>
    [AllowAnonymous]
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int top = 10)
    {
        try
        {
            var leaderboard = await _testerService.GetLeaderboardAsync(Math.Min(top, 50));
            return Ok(leaderboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get leaderboard");
            return Ok(Array.Empty<object>());
        }
    }
}

public class SubmitTesterApplicationRequest
{
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Motivation { get; set; } = "";
    public string ExperienceLevel { get; set; } = "Beginner";
    public string? InterestedAreas { get; set; }
}

public class AddContributionRequest
{
    public string Type { get; set; } = "";
    public string Description { get; set; } = "";
}

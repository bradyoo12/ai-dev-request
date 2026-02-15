using System.Security.Claims;
using System.Text.Json.Serialization;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/referrals")]
public class ReferralController : ControllerBase
{
    private readonly IReferralService _referralService;
    private readonly ILogger<ReferralController> _logger;

    public ReferralController(
        IReferralService referralService,
        ILogger<ReferralController> logger)
    {
        _referralService = referralService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// List user's referrals with details.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ReferralDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ReferralDto>>> GetReferrals()
    {
        try
        {
            var userId = GetUserId();
            var referrals = await _referralService.GetUserReferralsAsync(userId);

            var result = referrals.Select(r => new ReferralDto
            {
                Id = r.Id,
                ReferralCode = r.ReferralCode,
                Status = r.Status.ToString(),
                ReferredUserId = r.ReferredUserId,
                SignupCreditAmount = r.SignupCreditAmount,
                PaymentBonusPercent = r.PaymentBonusPercent,
                TotalCreditsEarned = r.TotalCreditsEarned,
                CreatedAt = r.CreatedAt,
                SignedUpAt = r.SignedUpAt,
                ConvertedAt = r.ConvertedAt,
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get referrals");
            return Ok(new List<ReferralDto>());
        }
    }

    /// <summary>
    /// Generate a unique referral code/link for the current user.
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(ReferralDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ReferralDto>> GenerateReferralCode()
    {
        try
        {
            var userId = GetUserId();
            var referral = await _referralService.GenerateReferralCodeAsync(userId);

            return Ok(new ReferralDto
            {
                Id = referral.Id,
                ReferralCode = referral.ReferralCode,
                Status = referral.Status.ToString(),
                ReferredUserId = referral.ReferredUserId,
                SignupCreditAmount = referral.SignupCreditAmount,
                PaymentBonusPercent = referral.PaymentBonusPercent,
                TotalCreditsEarned = referral.TotalCreditsEarned,
                CreatedAt = referral.CreatedAt,
                SignedUpAt = referral.SignedUpAt,
                ConvertedAt = referral.ConvertedAt,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate referral code");
            return StatusCode(500, new { error = "Failed to generate referral code." });
        }
    }

    /// <summary>
    /// Validate a referral code (anonymous access allowed).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("code/{code}")]
    [ProducesResponseType(typeof(ReferralValidationDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ReferralValidationDto>> ValidateReferralCode(string code)
    {
        try
        {
            var referral = await _referralService.ValidateReferralCodeAsync(code);

            return Ok(new ReferralValidationDto
            {
                Valid = referral != null,
                Code = code,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate referral code {Code}", code);
            return Ok(new ReferralValidationDto { Valid = false, Code = code });
        }
    }

    /// <summary>
    /// Get referral stats for the current user.
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ReferralStatsResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ReferralStatsResponseDto>> GetStats()
    {
        try
        {
            var userId = GetUserId();
            var stats = await _referralService.GetReferralStatsAsync(userId);

            return Ok(new ReferralStatsResponseDto
            {
                TotalInvited = stats.TotalInvited,
                TotalSignedUp = stats.TotalSignedUp,
                TotalConverted = stats.TotalConverted,
                TotalCreditsEarned = stats.TotalCreditsEarned,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get referral stats");
            return Ok(new ReferralStatsResponseDto());
        }
    }
}

// ===== DTOs =====

public record ReferralDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; init; }

    [JsonPropertyName("referralCode")]
    public string ReferralCode { get; init; } = "";

    [JsonPropertyName("status")]
    public string Status { get; init; } = "";

    [JsonPropertyName("referredUserId")]
    public string? ReferredUserId { get; init; }

    [JsonPropertyName("signupCreditAmount")]
    public int SignupCreditAmount { get; init; }

    [JsonPropertyName("paymentBonusPercent")]
    public decimal PaymentBonusPercent { get; init; }

    [JsonPropertyName("totalCreditsEarned")]
    public int TotalCreditsEarned { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; init; }

    [JsonPropertyName("signedUpAt")]
    public DateTime? SignedUpAt { get; init; }

    [JsonPropertyName("convertedAt")]
    public DateTime? ConvertedAt { get; init; }
}

public record ReferralValidationDto
{
    [JsonPropertyName("valid")]
    public bool Valid { get; init; }

    [JsonPropertyName("code")]
    public string Code { get; init; } = "";
}

public record ReferralStatsResponseDto
{
    [JsonPropertyName("totalInvited")]
    public int TotalInvited { get; init; }

    [JsonPropertyName("totalSignedUp")]
    public int TotalSignedUp { get; init; }

    [JsonPropertyName("totalConverted")]
    public int TotalConverted { get; init; }

    [JsonPropertyName("totalCreditsEarned")]
    public int TotalCreditsEarned { get; init; }
}

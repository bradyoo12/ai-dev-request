using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IReferralService
{
    Task<Referral> GenerateReferralCodeAsync(string userId);
    Task<Referral?> ValidateReferralCodeAsync(string code);
    Task<List<Referral>> GetUserReferralsAsync(string userId);
    Task<ReferralStatsDto> GetReferralStatsAsync(string userId);
    Task<Referral?> ProcessSignupAsync(string referralCode, string newUserId);
    Task<int> ProcessPaymentBonusAsync(string payingUserId, int paymentCredits);
}

public class ReferralStatsDto
{
    public int TotalInvited { get; set; }
    public int TotalSignedUp { get; set; }
    public int TotalConverted { get; set; }
    public int TotalCreditsEarned { get; set; }
}

public class ReferralService : IReferralService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ILogger<ReferralService> _logger;
    private static readonly Random _random = new();

    public ReferralService(
        AiDevRequestDbContext db,
        ITokenService tokenService,
        ILogger<ReferralService> logger)
    {
        _db = db;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<Referral> GenerateReferralCodeAsync(string userId)
    {
        // Check if user already has an active referral code (pending, no referred user)
        var existing = await _db.Referrals
            .Where(r => r.ReferrerId == userId && r.ReferredUserId == null && r.Status == ReferralStatus.Pending)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (existing != null)
            return existing;

        // Generate unique code
        var code = await GenerateUniqueCodeAsync();

        var referral = new Referral
        {
            ReferrerId = userId,
            ReferralCode = code,
        };

        _db.Referrals.Add(referral);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Generated referral code {Code} for user {UserId}", code, userId);
        return referral;
    }

    public async Task<Referral?> ValidateReferralCodeAsync(string code)
    {
        return await _db.Referrals
            .AsNoTracking()
            .Where(r => r.ReferralCode == code && r.Status == ReferralStatus.Pending && r.ReferredUserId == null)
            .FirstOrDefaultAsync();
    }

    public async Task<List<Referral>> GetUserReferralsAsync(string userId)
    {
        return await _db.Referrals
            .Where(r => r.ReferrerId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<ReferralStatsDto> GetReferralStatsAsync(string userId)
    {
        var referrals = await _db.Referrals
            .Where(r => r.ReferrerId == userId)
            .ToListAsync();

        return new ReferralStatsDto
        {
            TotalInvited = referrals.Count,
            TotalSignedUp = referrals.Count(r => r.Status >= ReferralStatus.SignedUp),
            TotalConverted = referrals.Count(r => r.Status == ReferralStatus.Converted),
            TotalCreditsEarned = referrals.Sum(r => r.TotalCreditsEarned),
        };
    }

    public async Task<Referral?> ProcessSignupAsync(string referralCode, string newUserId)
    {
        var referral = await _db.Referrals
            .Where(r => r.ReferralCode == referralCode && r.Status == ReferralStatus.Pending && r.ReferredUserId == null)
            .FirstOrDefaultAsync();

        if (referral == null)
            return null;

        // Don't allow self-referral
        if (referral.ReferrerId == newUserId)
            return null;

        referral.ReferredUserId = newUserId;
        referral.Status = ReferralStatus.SignedUp;
        referral.SignedUpAt = DateTime.UtcNow;
        referral.TotalCreditsEarned += referral.SignupCreditAmount;
        referral.UpdatedAt = DateTime.UtcNow;

        // Award signup credits to referrer
        await _tokenService.CreditTokens(
            referral.ReferrerId,
            referral.SignupCreditAmount,
            "referral_signup",
            referral.Id.ToString(),
            $"Referral signup bonus: +{referral.SignupCreditAmount} credits");

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Processed referral signup: referrer {ReferrerId} earned {Credits} credits for new user {NewUserId}",
            referral.ReferrerId, referral.SignupCreditAmount, newUserId);

        return referral;
    }

    public async Task<int> ProcessPaymentBonusAsync(string payingUserId, int paymentCredits)
    {
        // Find referral where this user was referred
        var referral = await _db.Referrals
            .Where(r => r.ReferredUserId == payingUserId && r.Status >= ReferralStatus.SignedUp)
            .FirstOrDefaultAsync();

        if (referral == null)
            return 0;

        var bonusCredits = (int)Math.Ceiling(paymentCredits * referral.PaymentBonusPercent / 100m);
        if (bonusCredits <= 0)
            return 0;

        referral.Status = ReferralStatus.Converted;
        referral.ConvertedAt ??= DateTime.UtcNow;
        referral.TotalCreditsEarned += bonusCredits;
        referral.UpdatedAt = DateTime.UtcNow;

        // Award payment bonus credits to referrer
        await _tokenService.CreditTokens(
            referral.ReferrerId,
            bonusCredits,
            "referral_payment_bonus",
            referral.Id.ToString(),
            $"Referral payment bonus ({referral.PaymentBonusPercent}%): +{bonusCredits} credits");

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Processed referral payment bonus: referrer {ReferrerId} earned {BonusCredits} credits from user {PayingUserId} payment of {PaymentCredits}",
            referral.ReferrerId, bonusCredits, payingUserId, paymentCredits);

        return bonusCredits;
    }

    private async Task<string> GenerateUniqueCodeAsync()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        string code;
        bool exists;

        do
        {
            code = new string(Enumerable.Range(0, 8).Select(_ => chars[_random.Next(chars.Length)]).ToArray());
            exists = await _db.Referrals.AnyAsync(r => r.ReferralCode == code);
        } while (exists);

        return code;
    }
}

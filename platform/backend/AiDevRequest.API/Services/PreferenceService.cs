using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IPreferenceService
{
    Task<UserPreference> SetPreferenceAsync(string userId, string category, string key, string value, double confidence = 0.8, string source = "manual");
    Task<List<UserPreference>> GetPreferencesAsync(string userId, string? category = null);
    Task<int> GetPreferenceCountAsync(string userId);
    Task DeletePreferenceAsync(string userId, int preferenceId);
    Task DeleteAllPreferencesAsync(string userId);
    Task<UserPreferenceSummary?> GetSummaryAsync(string userId);
    Task<UserPreferenceSummary> RegenerateSummaryAsync(string userId);
    Task<List<UserPreference>> DetectPreferencesAsync(string userId, string text);
    Task<string> BuildPreferenceContextAsync(string userId, string? query = null);
}

public class PreferenceService : IPreferenceService
{
    private readonly AiDevRequestDbContext _db;

    public PreferenceService(AiDevRequestDbContext db)
    {
        _db = db;
    }

    public async Task<UserPreference> SetPreferenceAsync(
        string userId, string category, string key, string value,
        double confidence = 0.8, string source = "manual")
    {
        var existing = await _db.UserPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Category == category && p.Key == key);

        if (existing != null)
        {
            existing.Value = value;
            existing.Confidence = Math.Max(existing.Confidence, confidence);
            existing.UpdatedAt = DateTime.UtcNow;
            if (source == "manual") existing.Source = source;
        }
        else
        {
            existing = new UserPreference
            {
                UserId = userId,
                Category = category,
                Key = key,
                Value = value,
                Confidence = confidence,
                Source = source
            };
            _db.UserPreferences.Add(existing);
        }

        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task<List<UserPreference>> GetPreferencesAsync(string userId, string? category = null)
    {
        var query = _db.UserPreferences.Where(p => p.UserId == userId);
        if (!string.IsNullOrEmpty(category))
            query = query.Where(p => p.Category == category);
        return await query.OrderBy(p => p.Category).ThenBy(p => p.Key).ToListAsync();
    }

    public async Task<int> GetPreferenceCountAsync(string userId)
    {
        return await _db.UserPreferences.CountAsync(p => p.UserId == userId);
    }

    public async Task DeletePreferenceAsync(string userId, int preferenceId)
    {
        var pref = await _db.UserPreferences
            .FirstOrDefaultAsync(p => p.Id == preferenceId && p.UserId == userId);
        if (pref != null)
        {
            _db.UserPreferences.Remove(pref);
            await _db.SaveChangesAsync();
        }
    }

    public async Task DeleteAllPreferencesAsync(string userId)
    {
        var prefs = await _db.UserPreferences.Where(p => p.UserId == userId).ToListAsync();
        _db.UserPreferences.RemoveRange(prefs);

        var summary = await _db.UserPreferenceSummaries.FirstOrDefaultAsync(s => s.UserId == userId);
        if (summary != null) _db.UserPreferenceSummaries.Remove(summary);

        await _db.SaveChangesAsync();
    }

    public async Task<UserPreferenceSummary?> GetSummaryAsync(string userId)
    {
        return await _db.UserPreferenceSummaries.FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public async Task<UserPreferenceSummary> RegenerateSummaryAsync(string userId)
    {
        var prefs = await GetPreferencesAsync(userId);

        var grouped = prefs.GroupBy(p => p.Category);
        var parts = new List<string>();
        foreach (var group in grouped)
        {
            var items = group.Select(p => $"{p.Key}: {p.Value}").ToList();
            parts.Add($"[{group.Key}] {string.Join(", ", items)}");
        }

        var summaryText = parts.Count > 0
            ? string.Join("; ", parts)
            : "No preferences detected yet.";

        var existing = await _db.UserPreferenceSummaries.FirstOrDefaultAsync(s => s.UserId == userId);
        if (existing != null)
        {
            existing.SummaryText = summaryText;
            existing.LastUpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new UserPreferenceSummary
            {
                UserId = userId,
                SummaryText = summaryText
            };
            _db.UserPreferenceSummaries.Add(existing);
        }

        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task<List<UserPreference>> DetectPreferencesAsync(string userId, string text)
    {
        var detected = new List<(string category, string key, string value, double confidence)>();
        var lower = text.ToLowerInvariant();

        // Budget signals
        if (lower.Contains("cheap") || lower.Contains("affordable") || lower.Contains("budget") || lower.Contains("저렴") || lower.Contains("싼"))
            detected.Add(("budget", "sensitivity", "conservative", 0.7));
        else if (lower.Contains("premium") || lower.Contains("expensive") || lower.Contains("luxury") || lower.Contains("비싼") || lower.Contains("고급"))
            detected.Add(("budget", "sensitivity", "premium", 0.7));
        else if (lower.Contains("reasonable") || lower.Contains("value for money") || lower.Contains("합리적"))
            detected.Add(("budget", "sensitivity", "moderate", 0.6));

        // Tech preference signals
        if (lower.Contains("latest") || lower.Contains("cutting edge") || lower.Contains("bleeding edge") || lower.Contains("최신"))
            detected.Add(("tech", "preference", "bleeding_edge", 0.7));
        else if (lower.Contains("stable") || lower.Contains("reliable") || lower.Contains("proven") || lower.Contains("안정"))
            detected.Add(("tech", "preference", "stable", 0.7));

        // Platform signals
        if (lower.Contains("mobile") || lower.Contains("ios") || lower.Contains("android") || lower.Contains("모바일"))
            detected.Add(("platform", "preferred", "mobile", 0.6));
        if (lower.Contains("web") || lower.Contains("website") || lower.Contains("웹"))
            detected.Add(("platform", "preferred", "web", 0.6));
        if (lower.Contains("cross-platform") || lower.Contains("크로스플랫폼"))
            detected.Add(("platform", "preferred", "cross_platform", 0.6));

        // Design preference signals
        if (lower.Contains("simple") || lower.Contains("minimal") || lower.Contains("clean") || lower.Contains("심플") || lower.Contains("깔끔"))
            detected.Add(("design", "style", "minimal", 0.6));
        else if (lower.Contains("feature-rich") || lower.Contains("full-featured") || lower.Contains("기능이 많"))
            detected.Add(("design", "style", "feature_rich", 0.6));

        // Framework signals
        if (lower.Contains("react"))
            detected.Add(("tech", "framework", "react", 0.8));
        if (lower.Contains("vue"))
            detected.Add(("tech", "framework", "vue", 0.8));
        if (lower.Contains("angular"))
            detected.Add(("tech", "framework", "angular", 0.8));
        if (lower.Contains("nextjs") || lower.Contains("next.js"))
            detected.Add(("tech", "framework", "nextjs", 0.8));
        if (lower.Contains("flutter"))
            detected.Add(("tech", "framework", "flutter", 0.8));
        if (lower.Contains("typescript"))
            detected.Add(("tech", "language", "typescript", 0.8));
        if (lower.Contains("python"))
            detected.Add(("tech", "language", "python", 0.8));

        // Decision style signals
        if (lower.Contains("research") || lower.Contains("compare") || lower.Contains("비교") || lower.Contains("조사"))
            detected.Add(("decision_style", "approach", "research_heavy", 0.5));
        if (lower.Contains("quick") || lower.Contains("fast") || lower.Contains("asap") || lower.Contains("빨리"))
            detected.Add(("decision_style", "approach", "quick_decision", 0.5));

        var saved = new List<UserPreference>();
        foreach (var (category, key, value, confidence) in detected)
        {
            var pref = await SetPreferenceAsync(userId, category, key, value, confidence, "auto");
            saved.Add(pref);
        }

        if (saved.Count > 0)
        {
            await RegenerateSummaryAsync(userId);
        }

        return saved;
    }

    public async Task<string> BuildPreferenceContextAsync(string userId, string? query = null)
    {
        var prefs = await GetPreferencesAsync(userId);
        if (prefs.Count == 0) return "";

        List<UserPreference> relevant;
        if (!string.IsNullOrEmpty(query))
        {
            var queryLower = query.ToLowerInvariant();
            var categoryScores = new Dictionary<string, int>();

            if (queryLower.Contains("price") || queryLower.Contains("cost") || queryLower.Contains("budget") ||
                queryLower.Contains("가격") || queryLower.Contains("비용") || queryLower.Contains("예산"))
                categoryScores["budget"] = 10;

            if (queryLower.Contains("tech") || queryLower.Contains("framework") || queryLower.Contains("language") ||
                queryLower.Contains("기술") || queryLower.Contains("프레임워크"))
                categoryScores["tech"] = 10;

            if (queryLower.Contains("design") || queryLower.Contains("ui") || queryLower.Contains("ux") ||
                queryLower.Contains("디자인"))
                categoryScores["design"] = 10;

            if (queryLower.Contains("mobile") || queryLower.Contains("web") || queryLower.Contains("platform") ||
                queryLower.Contains("플랫폼") || queryLower.Contains("모바일"))
                categoryScores["platform"] = 10;

            relevant = prefs
                .OrderByDescending(p => categoryScores.GetValueOrDefault(p.Category, 0))
                .ThenByDescending(p => p.Confidence)
                .Take(10)
                .ToList();
        }
        else
        {
            relevant = prefs
                .OrderByDescending(p => p.Confidence)
                .Take(10)
                .ToList();
        }

        var grouped = relevant.GroupBy(p => p.Category);
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("## User Preferences");
        foreach (var group in grouped)
        {
            sb.AppendLine($"### {group.Key}");
            foreach (var pref in group)
            {
                sb.AppendLine($"- {pref.Key}: {pref.Value} (confidence: {pref.Confidence:F1})");
            }
        }

        return sb.ToString();
    }
}

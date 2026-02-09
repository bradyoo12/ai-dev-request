using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TranslationsController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<TranslationsController> _logger;

    public TranslationsController(AiDevRequestDbContext context, ILogger<TranslationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all translations for a locale (used by i18next-http-backend)
    /// Returns flat key-value JSON: { "hero.title": "...", "hero.subtitle": "..." }
    /// Supports locale fallback: en-AU -> en, ko-KR -> ko
    /// </summary>
    [HttpGet("{locale}")]
    public async Task<ActionResult<Dictionary<string, string>>> GetTranslations(string locale)
    {
        try
        {
            var translations = await _context.Translations
                .Where(t => t.LanguageCode == locale)
                .ToDictionaryAsync(
                    t => $"{t.Namespace}.{t.Key}",
                    t => t.Value
                );

            // If no translations found and the locale has a region code (e.g., en-AU),
            // fall back to the base language (e.g., en)
            if (translations.Count == 0 && locale.Contains('-'))
            {
                var baseLang = locale.Split('-')[0];
                _logger.LogInformation("No translations for '{Locale}', falling back to '{BaseLang}'", locale, baseLang);
                translations = await _context.Translations
                    .Where(t => t.LanguageCode == baseLang)
                    .ToDictionaryAsync(
                        t => $"{t.Namespace}.{t.Key}",
                        t => t.Value
                    );
            }

            return Ok(translations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load translations for locale '{Locale}'", locale);
            // Return empty translations instead of 500 so i18next can fall back gracefully
            return Ok(new Dictionary<string, string>());
        }
    }

    /// <summary>
    /// Get translations grouped by namespace for admin editing
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/{locale}")]
    public async Task<ActionResult<IEnumerable<TranslationEntryDto>>> GetTranslationsForAdmin(
        string locale,
        [FromQuery] string? ns = null,
        [FromQuery] bool? missingOnly = null)
    {
        // Get default language translations as reference
        var defaultLang = await _context.Languages.FirstOrDefaultAsync(l => l.IsDefault);
        if (defaultLang == null)
        {
            return Ok(Array.Empty<TranslationEntryDto>());
        }

        var defaultTranslations = await _context.Translations
            .Where(t => t.LanguageCode == defaultLang.Code)
            .Where(t => ns == null || t.Namespace == ns)
            .ToListAsync();

        var localeTranslations = await _context.Translations
            .Where(t => t.LanguageCode == locale)
            .Where(t => ns == null || t.Namespace == ns)
            .ToDictionaryAsync(t => $"{t.Namespace}:{t.Key}", t => t.Value);

        var result = defaultTranslations.Select(dt =>
        {
            var compositeKey = $"{dt.Namespace}:{dt.Key}";
            var hasTranslation = localeTranslations.TryGetValue(compositeKey, out var translatedValue);

            return new TranslationEntryDto
            {
                Namespace = dt.Namespace,
                Key = dt.Key,
                ReferenceValue = dt.Value,
                Value = hasTranslation ? translatedValue! : "",
                IsMissing = !hasTranslation || string.IsNullOrEmpty(translatedValue)
            };
        });

        if (missingOnly == true)
        {
            result = result.Where(t => t.IsMissing);
        }

        return Ok(result.OrderBy(t => t.Namespace).ThenBy(t => t.Key));
    }

    /// <summary>
    /// Bulk update translations for a locale (admin)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("admin/{locale}")]
    public async Task<ActionResult> UpdateTranslations(string locale, [FromBody] BulkUpdateTranslationsDto dto)
    {
        var language = await _context.Languages.FirstOrDefaultAsync(l => l.Code == locale);
        if (language == null)
        {
            return NotFound(new { error = $"Language '{locale}' not found." });
        }

        foreach (var entry in dto.Translations)
        {
            var existing = await _context.Translations
                .FirstOrDefaultAsync(t => t.LanguageCode == locale && t.Namespace == entry.Namespace && t.Key == entry.Key);

            if (existing != null)
            {
                existing.Value = entry.Value;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.Translations.Add(new Translation
                {
                    LanguageCode = locale,
                    Namespace = entry.Namespace,
                    Key = entry.Key,
                    Value = entry.Value
                });
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated {Count} translations for locale {Locale}", dto.Translations.Count, locale);

        return NoContent();
    }

    /// <summary>
    /// Import translations from JSON (admin)
    /// Format: { "namespace.key": "value", ... }
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("admin/{locale}/import")]
    public async Task<ActionResult<ImportResultDto>> ImportTranslations(string locale, [FromBody] Dictionary<string, string> translations)
    {
        var language = await _context.Languages.FirstOrDefaultAsync(l => l.Code == locale);
        if (language == null)
        {
            return NotFound(new { error = $"Language '{locale}' not found." });
        }

        var imported = 0;
        var updated = 0;

        foreach (var (fullKey, value) in translations)
        {
            var dotIndex = fullKey.IndexOf('.');
            if (dotIndex < 0) continue;

            var ns = fullKey[..dotIndex];
            var key = fullKey[(dotIndex + 1)..];

            var existing = await _context.Translations
                .FirstOrDefaultAsync(t => t.LanguageCode == locale && t.Namespace == ns && t.Key == key);

            if (existing != null)
            {
                existing.Value = value;
                existing.UpdatedAt = DateTime.UtcNow;
                updated++;
            }
            else
            {
                _context.Translations.Add(new Translation
                {
                    LanguageCode = locale,
                    Namespace = ns,
                    Key = key,
                    Value = value
                });
                imported++;
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Imported translations for {Locale}: {Imported} new, {Updated} updated", locale, imported, updated);

        return Ok(new ImportResultDto { Imported = imported, Updated = updated });
    }

    /// <summary>
    /// Export all translations for a locale as flat JSON
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/{locale}/export")]
    public async Task<ActionResult<Dictionary<string, string>>> ExportTranslations(string locale)
    {
        var translations = await _context.Translations
            .Where(t => t.LanguageCode == locale)
            .OrderBy(t => t.Namespace)
            .ThenBy(t => t.Key)
            .ToDictionaryAsync(
                t => $"{t.Namespace}.{t.Key}",
                t => t.Value
            );

        return Ok(translations);
    }

    /// <summary>
    /// Get list of all translation namespaces
    /// </summary>
    [HttpGet("namespaces")]
    public async Task<ActionResult<IEnumerable<string>>> GetNamespaces()
    {
        var namespaces = await _context.Translations
            .Select(t => t.Namespace)
            .Distinct()
            .OrderBy(n => n)
            .ToListAsync();

        return Ok(namespaces);
    }
}

public record TranslationEntryDto
{
    public string Namespace { get; init; } = "";
    public string Key { get; init; } = "";
    public string ReferenceValue { get; init; } = "";
    public string Value { get; init; } = "";
    public bool IsMissing { get; init; }
}

public record BulkUpdateTranslationsDto
{
    public List<TranslationUpdateItem> Translations { get; init; } = new();
}

public record TranslationUpdateItem
{
    public string Namespace { get; init; } = "";
    public string Key { get; init; } = "";
    public string Value { get; init; } = "";
}

public record ImportResultDto
{
    public int Imported { get; init; }
    public int Updated { get; init; }
}

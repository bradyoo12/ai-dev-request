using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/translations/seed")]
public class TranslationSeedController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<TranslationSeedController> _logger;

    public TranslationSeedController(AiDevRequestDbContext context, ILogger<TranslationSeedController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Seed translations from flat JSON. Only works if no translations exist yet.
    /// Format: { "namespace.key": "value", ... }
    /// </summary>
    [HttpPost("{locale}")]
    public async Task<ActionResult> SeedTranslations(string locale, [FromBody] Dictionary<string, string> translations)
    {
        var existingCount = await _context.Translations.CountAsync(t => t.LanguageCode == locale);
        if (existingCount > 0)
        {
            return Ok(new { message = $"Locale '{locale}' already has {existingCount} translations. Skipping seed." });
        }

        var count = 0;
        foreach (var (fullKey, value) in translations)
        {
            var dotIndex = fullKey.IndexOf('.');
            if (dotIndex < 0) continue;

            var ns = fullKey[..dotIndex];
            var key = fullKey[(dotIndex + 1)..];

            _context.Translations.Add(new Translation
            {
                LanguageCode = locale,
                Namespace = ns,
                Key = key,
                Value = value
            });
            count++;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Seeded {Count} translations for locale {Locale}", count, locale);

        return Ok(new { message = $"Seeded {count} translations for '{locale}'." });
    }
}

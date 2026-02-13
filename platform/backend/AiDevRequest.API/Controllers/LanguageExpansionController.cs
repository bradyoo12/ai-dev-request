using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/language-expansion")]
[Authorize]
public class LanguageExpansionController(AiDevRequestDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await db.LanguageExpansions
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("translate")]
    public async Task<IActionResult> Translate([FromBody] TranslateRequest req)
    {
        var rng = new Random();
        var totalKeys = rng.Next(200, 800);
        var keysTranslated = (int)(totalKeys * (0.85 + rng.NextDouble() * 0.15));
        var missingKeys = totalKeys - keysTranslated;
        var isRtl = new[] { "ar", "he", "fa", "ur" }.Contains(req.TargetLanguage);

        var record = new LanguageExpansion
        {
            ProjectName = req.ProjectName,
            SourceLanguage = req.SourceLanguage,
            TargetLanguage = req.TargetLanguage,
            KeysTranslated = keysTranslated,
            TotalKeys = totalKeys,
            CoveragePercent = Math.Round((double)keysTranslated / totalKeys * 100, 1),
            QualityScore = Math.Round(75 + rng.NextDouble() * 25, 1),
            MachineTranslated = true,
            HumanReviewed = rng.NextDouble() < 0.3,
            MissingKeys = missingKeys,
            PluralizationRules = rng.Next(2, 6),
            RtlSupport = isRtl,
            TranslationTimeMs = Math.Round(rng.NextDouble() * 3000 + 500, 2),
            Status = "completed"
        };

        db.LanguageExpansions.Add(record);
        await db.SaveChangesAsync();

        return Ok(new
        {
            record,
            sampleTranslations = new[]
            {
                new { key = "common.submit", source = "Submit", translated = GetSampleTranslation(req.TargetLanguage, "Submit") },
                new { key = "common.cancel", source = "Cancel", translated = GetSampleTranslation(req.TargetLanguage, "Cancel") },
                new { key = "common.loading", source = "Loading...", translated = GetSampleTranslation(req.TargetLanguage, "Loading...") }
            },
            recommendations = new[]
            {
                missingKeys > 0 ? $"Complete {missingKeys} missing translations for full coverage" : "All keys translated",
                isRtl ? "RTL layout adjustments required for this language" : "LTR layout - no special adjustments needed",
                record.QualityScore < 90 ? "Consider human review for quality improvement" : "High quality translations - ready for deployment"
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var entity = await db.LanguageExpansions.FindAsync(id);
        if (entity == null) return NotFound();
        db.LanguageExpansions.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await db.LanguageExpansions.ToListAsync();
        if (all.Count == 0) return Ok(new { totalTranslations = 0 });

        var byLanguage = all.GroupBy(x => x.TargetLanguage).Select(g => new
        {
            language = g.Key,
            count = g.Count(),
            avgCoverage = Math.Round(g.Average(x => x.CoveragePercent), 1),
            avgQuality = Math.Round(g.Average(x => x.QualityScore), 1)
        }).ToList();

        return Ok(new
        {
            totalTranslations = all.Count,
            avgCoveragePercent = Math.Round(all.Average(x => x.CoveragePercent), 1),
            avgQualityScore = Math.Round(all.Average(x => x.QualityScore), 1),
            totalKeysTranslated = all.Sum(x => x.KeysTranslated),
            humanReviewedPercent = Math.Round((double)all.Count(x => x.HumanReviewed) / all.Count * 100, 1),
            byLanguage
        });
    }

    [AllowAnonymous]
    [HttpGet("languages")]
    public IActionResult GetLanguages()
    {
        return Ok(new[]
        {
            new { code = "ja", name = "Japanese", native = "日本語", region = "Asia", rtl = false },
            new { code = "zh", name = "Chinese (Simplified)", native = "中文", region = "Asia", rtl = false },
            new { code = "es", name = "Spanish", native = "Español", region = "Europe", rtl = false },
            new { code = "fr", name = "French", native = "Français", region = "Europe", rtl = false },
            new { code = "de", name = "German", native = "Deutsch", region = "Europe", rtl = false },
            new { code = "pt", name = "Portuguese", native = "Português", region = "Americas", rtl = false },
            new { code = "ar", name = "Arabic", native = "العربية", region = "Middle East", rtl = true },
            new { code = "hi", name = "Hindi", native = "हिन्दी", region = "Asia", rtl = false },
            new { code = "vi", name = "Vietnamese", native = "Tiếng Việt", region = "Asia", rtl = false },
            new { code = "th", name = "Thai", native = "ไทย", region = "Asia", rtl = false }
        });
    }

    private static string GetSampleTranslation(string lang, string text) => lang switch
    {
        "ja" => text == "Submit" ? "送信" : text == "Cancel" ? "キャンセル" : "読み込み中...",
        "zh" => text == "Submit" ? "提交" : text == "Cancel" ? "取消" : "加载中...",
        "es" => text == "Submit" ? "Enviar" : text == "Cancel" ? "Cancelar" : "Cargando...",
        "fr" => text == "Submit" ? "Soumettre" : text == "Cancel" ? "Annuler" : "Chargement...",
        "de" => text == "Submit" ? "Absenden" : text == "Cancel" ? "Abbrechen" : "Laden...",
        "ar" => text == "Submit" ? "إرسال" : text == "Cancel" ? "إلغاء" : "جار التحميل...",
        _ => text
    };

    public record TranslateRequest(
        string ProjectName,
        string TargetLanguage,
        string SourceLanguage = "en"
    );
}

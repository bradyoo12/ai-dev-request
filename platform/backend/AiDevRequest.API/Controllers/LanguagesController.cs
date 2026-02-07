using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LanguagesController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<LanguagesController> _logger;

    public LanguagesController(AiDevRequestDbContext context, ILogger<LanguagesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all active languages (public endpoint for language selector)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LanguageDto>>> GetLanguages()
    {
        try
        {
            var languages = await _context.Languages
                .Where(l => l.IsActive)
                .OrderByDescending(l => l.IsDefault)
                .ThenBy(l => l.Name)
                .Select(l => new LanguageDto
                {
                    Code = l.Code,
                    Name = l.Name,
                    NativeName = l.NativeName,
                    IsDefault = l.IsDefault
                })
                .ToListAsync();

            return Ok(languages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load languages");
            // Return default languages so the frontend can still function
            return Ok(new List<LanguageDto>
            {
                new() { Code = "ko", Name = "Korean", NativeName = "\ud55c\uad6d\uc5b4", IsDefault = true },
                new() { Code = "en", Name = "English", NativeName = "English", IsDefault = false }
            });
        }
    }

    /// <summary>
    /// Get all languages including inactive (admin endpoint)
    /// </summary>
    [HttpGet("admin")]
    public async Task<ActionResult<IEnumerable<AdminLanguageDto>>> GetAllLanguages()
    {
        var languages = await _context.Languages
            .OrderByDescending(l => l.IsDefault)
            .ThenBy(l => l.Name)
            .ToListAsync();

        var totalKeys = await _context.Translations
            .Where(t => t.LanguageCode == languages.FirstOrDefault(l => l.IsDefault)!.Code)
            .CountAsync();

        var result = new List<AdminLanguageDto>();
        foreach (var lang in languages)
        {
            var translatedKeys = await _context.Translations
                .Where(t => t.LanguageCode == lang.Code)
                .CountAsync();

            result.Add(new AdminLanguageDto
            {
                Id = lang.Id,
                Code = lang.Code,
                Name = lang.Name,
                NativeName = lang.NativeName,
                IsDefault = lang.IsDefault,
                IsActive = lang.IsActive,
                TranslationProgress = totalKeys > 0 ? (double)translatedKeys / totalKeys * 100 : 0,
                TranslatedKeys = translatedKeys,
                TotalKeys = totalKeys,
                CreatedAt = lang.CreatedAt
            });
        }

        return Ok(result);
    }

    /// <summary>
    /// Add a new language (admin)
    /// </summary>
    [HttpPost("admin")]
    public async Task<ActionResult<AdminLanguageDto>> CreateLanguage([FromBody] CreateLanguageDto dto)
    {
        if (await _context.Languages.AnyAsync(l => l.Code == dto.Code))
        {
            return Conflict(new { error = $"Language with code '{dto.Code}' already exists." });
        }

        var language = new Language
        {
            Code = dto.Code,
            Name = dto.Name,
            NativeName = dto.NativeName,
            IsDefault = false,
            IsActive = dto.IsActive
        };

        _context.Languages.Add(language);

        // Copy translations from source language if specified
        if (!string.IsNullOrEmpty(dto.CopyFromCode))
        {
            var sourceTranslations = await _context.Translations
                .Where(t => t.LanguageCode == dto.CopyFromCode)
                .ToListAsync();

            foreach (var source in sourceTranslations)
            {
                _context.Translations.Add(new Translation
                {
                    LanguageCode = dto.Code,
                    Namespace = source.Namespace,
                    Key = source.Key,
                    Value = source.Value
                });
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Language created: {Code} ({Name})", dto.Code, dto.Name);

        return CreatedAtAction(nameof(GetLanguages), new AdminLanguageDto
        {
            Id = language.Id,
            Code = language.Code,
            Name = language.Name,
            NativeName = language.NativeName,
            IsDefault = language.IsDefault,
            IsActive = language.IsActive,
            TranslationProgress = 0,
            TranslatedKeys = 0,
            TotalKeys = 0,
            CreatedAt = language.CreatedAt
        });
    }

    /// <summary>
    /// Update a language (admin)
    /// </summary>
    [HttpPut("admin/{code}")]
    public async Task<ActionResult> UpdateLanguage(string code, [FromBody] UpdateLanguageDto dto)
    {
        var language = await _context.Languages.FirstOrDefaultAsync(l => l.Code == code);
        if (language == null)
        {
            return NotFound();
        }

        if (dto.Name != null) language.Name = dto.Name;
        if (dto.NativeName != null) language.NativeName = dto.NativeName;
        if (dto.IsActive.HasValue) language.IsActive = dto.IsActive.Value;
        language.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Delete a language (admin) - cannot delete default language
    /// </summary>
    [HttpDelete("admin/{code}")]
    public async Task<ActionResult> DeleteLanguage(string code)
    {
        var language = await _context.Languages.FirstOrDefaultAsync(l => l.Code == code);
        if (language == null)
        {
            return NotFound();
        }

        if (language.IsDefault)
        {
            return BadRequest(new { error = "Cannot delete the default language." });
        }

        // Delete all translations for this language
        var translations = await _context.Translations
            .Where(t => t.LanguageCode == code)
            .ToListAsync();
        _context.Translations.RemoveRange(translations);

        _context.Languages.Remove(language);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Language deleted: {Code}", code);

        return NoContent();
    }
}

public record LanguageDto
{
    public string Code { get; init; } = "";
    public string Name { get; init; } = "";
    public string NativeName { get; init; } = "";
    public bool IsDefault { get; init; }
}

public record AdminLanguageDto
{
    public int Id { get; init; }
    public string Code { get; init; } = "";
    public string Name { get; init; } = "";
    public string NativeName { get; init; } = "";
    public bool IsDefault { get; init; }
    public bool IsActive { get; init; }
    public double TranslationProgress { get; init; }
    public int TranslatedKeys { get; init; }
    public int TotalKeys { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CreateLanguageDto
{
    public string Code { get; init; } = "";
    public string Name { get; init; } = "";
    public string NativeName { get; init; } = "";
    public bool IsActive { get; init; } = true;
    public string? CopyFromCode { get; init; }
}

public record UpdateLanguageDto
{
    public string? Name { get; init; }
    public string? NativeName { get; init; }
    public bool? IsActive { get; init; }
}

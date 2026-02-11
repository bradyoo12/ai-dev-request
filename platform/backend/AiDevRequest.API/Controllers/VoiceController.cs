using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VoiceController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public VoiceController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get or create the user's voice configuration
    /// </summary>
    [HttpGet("config")]
    public async Task<ActionResult<VoiceConfigDto>> GetConfig()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.VoiceConfigs.FirstOrDefaultAsync(v => v.UserId == userId);
        if (config == null)
        {
            config = new VoiceConfig { UserId = userId };
            _db.VoiceConfigs.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Update voice configuration
    /// </summary>
    [HttpPut("config")]
    public async Task<ActionResult<VoiceConfigDto>> UpdateConfig([FromBody] UpdateVoiceConfigDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.VoiceConfigs.FirstOrDefaultAsync(v => v.UserId == userId);
        if (config == null)
        {
            config = new VoiceConfig { UserId = userId };
            _db.VoiceConfigs.Add(config);
        }

        if (dto.Language != null) config.Language = dto.Language;
        if (dto.ContinuousMode.HasValue) config.ContinuousMode = dto.ContinuousMode.Value;
        if (dto.AutoPunctuate.HasValue) config.AutoPunctuate = dto.AutoPunctuate.Value;
        if (dto.TtsEnabled.HasValue) config.TtsEnabled = dto.TtsEnabled.Value;
        if (dto.TtsVoice != null) config.TtsVoice = dto.TtsVoice;
        if (dto.TtsRate.HasValue) config.TtsRate = Math.Clamp(dto.TtsRate.Value, 0.5, 2.0);

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Log a voice transcription session
    /// </summary>
    [HttpPost("transcription")]
    public async Task<ActionResult<TranscriptionResultDto>> LogTranscription([FromBody] LogTranscriptionDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.VoiceConfigs.FirstOrDefaultAsync(v => v.UserId == userId);
        if (config == null)
        {
            config = new VoiceConfig { UserId = userId };
            _db.VoiceConfigs.Add(config);
        }

        config.SessionCount++;
        config.TotalDurationSeconds += dto.DurationSeconds;
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new TranscriptionResultDto
        {
            SessionCount = config.SessionCount,
            TotalDurationSeconds = config.TotalDurationSeconds,
            Text = dto.Text,
            Language = dto.Language ?? config.Language,
            DurationSeconds = dto.DurationSeconds,
        });
    }

    /// <summary>
    /// Get voice usage statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<VoiceStatsDto>> GetStats()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.VoiceConfigs.FirstOrDefaultAsync(v => v.UserId == userId);

        return Ok(new VoiceStatsDto
        {
            SessionCount = config?.SessionCount ?? 0,
            TotalDurationSeconds = config?.TotalDurationSeconds ?? 0,
            AverageDurationSeconds = config != null && config.SessionCount > 0
                ? config.TotalDurationSeconds / config.SessionCount
                : 0,
            Language = config?.Language ?? "en-US",
            ContinuousMode = config?.ContinuousMode ?? true,
            TtsEnabled = config?.TtsEnabled ?? false,
        });
    }

    /// <summary>
    /// Get supported voice languages
    /// </summary>
    [HttpGet("languages")]
    public ActionResult<IEnumerable<VoiceLanguageDto>> GetLanguages()
    {
        var languages = new[]
        {
            new VoiceLanguageDto { Code = "en-US", Name = "English (US)", Flag = "US" },
            new VoiceLanguageDto { Code = "en-GB", Name = "English (UK)", Flag = "GB" },
            new VoiceLanguageDto { Code = "ko-KR", Name = "Korean", Flag = "KR" },
            new VoiceLanguageDto { Code = "ja-JP", Name = "Japanese", Flag = "JP" },
            new VoiceLanguageDto { Code = "zh-CN", Name = "Chinese (Simplified)", Flag = "CN" },
            new VoiceLanguageDto { Code = "de-DE", Name = "German", Flag = "DE" },
            new VoiceLanguageDto { Code = "fr-FR", Name = "French", Flag = "FR" },
            new VoiceLanguageDto { Code = "es-ES", Name = "Spanish", Flag = "ES" },
        };
        return Ok(languages);
    }

    private static VoiceConfigDto ToDto(VoiceConfig config) => new()
    {
        Id = config.Id,
        Language = config.Language,
        ContinuousMode = config.ContinuousMode,
        AutoPunctuate = config.AutoPunctuate,
        TtsEnabled = config.TtsEnabled,
        TtsVoice = config.TtsVoice,
        TtsRate = config.TtsRate,
        SessionCount = config.SessionCount,
        TotalDurationSeconds = config.TotalDurationSeconds,
        CreatedAt = config.CreatedAt,
        UpdatedAt = config.UpdatedAt,
    };
}

public class VoiceConfigDto
{
    public Guid Id { get; set; }
    public string Language { get; set; } = "";
    public bool ContinuousMode { get; set; }
    public bool AutoPunctuate { get; set; }
    public bool TtsEnabled { get; set; }
    public string? TtsVoice { get; set; }
    public double TtsRate { get; set; }
    public int SessionCount { get; set; }
    public int TotalDurationSeconds { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateVoiceConfigDto
{
    public string? Language { get; set; }
    public bool? ContinuousMode { get; set; }
    public bool? AutoPunctuate { get; set; }
    public bool? TtsEnabled { get; set; }
    public string? TtsVoice { get; set; }
    public double? TtsRate { get; set; }
}

public class LogTranscriptionDto
{
    public string Text { get; set; } = "";
    public string? Language { get; set; }
    public int DurationSeconds { get; set; }
}

public class TranscriptionResultDto
{
    public int SessionCount { get; set; }
    public int TotalDurationSeconds { get; set; }
    public string Text { get; set; } = "";
    public string Language { get; set; } = "";
    public int DurationSeconds { get; set; }
}

public class VoiceStatsDto
{
    public int SessionCount { get; set; }
    public int TotalDurationSeconds { get; set; }
    public int AverageDurationSeconds { get; set; }
    public string Language { get; set; } = "";
    public bool ContinuousMode { get; set; }
    public bool TtsEnabled { get; set; }
}

public class VoiceLanguageDto
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Flag { get; set; } = "";
}

using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/ai-elements")]
[Authorize]
public class AiElementsController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public AiElementsController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get or create the user's AI Elements configuration
    /// </summary>
    [HttpGet("config")]
    public async Task<ActionResult<AiElementsConfigDto>> GetConfig()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiElementsConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new AiElementsConfig { UserId = userId };
            _db.AiElementsConfigs.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Update AI Elements configuration settings
    /// </summary>
    [HttpPut("config")]
    public async Task<ActionResult<AiElementsConfigDto>> UpdateConfig([FromBody] UpdateAiElementsConfigDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiElementsConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new AiElementsConfig { UserId = userId };
            _db.AiElementsConfigs.Add(config);
        }

        if (dto.StreamingEnabled.HasValue) config.StreamingEnabled = dto.StreamingEnabled.Value;
        if (dto.ReasoningPanelEnabled.HasValue) config.ReasoningPanelEnabled = dto.ReasoningPanelEnabled.Value;
        if (dto.LivePreviewEnabled.HasValue) config.LivePreviewEnabled = dto.LivePreviewEnabled.Value;
        if (dto.ResponseActionsEnabled.HasValue) config.ResponseActionsEnabled = dto.ResponseActionsEnabled.Value;
        if (dto.ThemeMode != null) config.ThemeMode = dto.ThemeMode;
        if (dto.ActiveModel != null) config.ActiveModel = dto.ActiveModel;

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(config));
    }

    /// <summary>
    /// List available AI Element components
    /// </summary>
    [HttpGet("components")]
    public ActionResult<IEnumerable<AiElementComponentDto>> GetComponents()
    {
        var components = new[]
        {
            new AiElementComponentDto
            {
                Id = "message-thread",
                Name = "Message Thread",
                Description = "Streaming conversation thread with real-time token-by-token output and markdown rendering",
                Category = "display",
                Icon = "message-square",
                Status = "stable"
            },
            new AiElementComponentDto
            {
                Id = "reasoning-panel",
                Name = "Reasoning Panel",
                Description = "Collapsible panel showing AI thought process, chain-of-thought reasoning, and decision steps",
                Category = "insight",
                Icon = "brain",
                Status = "stable"
            },
            new AiElementComponentDto
            {
                Id = "code-block",
                Name = "Code Block",
                Description = "Syntax-highlighted code display with streaming animation, line numbers, and language detection",
                Category = "display",
                Icon = "code",
                Status = "stable"
            },
            new AiElementComponentDto
            {
                Id = "response-actions",
                Name = "Response Actions",
                Description = "Action bar with copy, edit, deploy, and add-to-project buttons for generated code output",
                Category = "action",
                Icon = "zap",
                Status = "stable"
            },
            new AiElementComponentDto
            {
                Id = "streaming-input",
                Name = "Streaming Input",
                Description = "Rich text input with code mode, file attachment support, and streaming submission",
                Category = "input",
                Icon = "edit-3",
                Status = "beta"
            },
        };

        return Ok(components);
    }

    /// <summary>
    /// Start a simulated streaming session (returns stream ID + metadata)
    /// </summary>
    [HttpPost("stream/start")]
    public async Task<ActionResult<StreamSessionDto>> StartStream([FromBody] StartStreamDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiElementsConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new AiElementsConfig { UserId = userId };
            _db.AiElementsConfigs.Add(config);
        }

        var streamId = Guid.NewGuid();
        var estimatedTokens = (dto.Prompt?.Length ?? 50) * 3;

        config.TotalStreams++;
        config.TotalTokensStreamed += estimatedTokens;
        config.TotalComponentPreviews++;
        config.UpdatedAt = DateTime.UtcNow;

        // Track in preview history
        var history = string.IsNullOrEmpty(config.PreviewHistoryJson)
            ? new List<PreviewHistoryEntry>()
            : JsonSerializer.Deserialize<List<PreviewHistoryEntry>>(config.PreviewHistoryJson) ?? new List<PreviewHistoryEntry>();

        history.Add(new PreviewHistoryEntry
        {
            StreamId = streamId.ToString(),
            Prompt = dto.Prompt ?? "",
            Language = dto.Language ?? "typescript",
            TokenCount = estimatedTokens,
            StartedAt = DateTime.UtcNow,
        });

        if (history.Count > 50)
            history = history.Skip(history.Count - 50).ToList();

        config.PreviewHistoryJson = JsonSerializer.Serialize(history);
        await _db.SaveChangesAsync();

        return Ok(new StreamSessionDto
        {
            StreamId = streamId,
            Status = "streaming",
            Model = config.ActiveModel,
            EstimatedTokens = estimatedTokens,
            Language = dto.Language ?? "typescript",
            Prompt = dto.Prompt ?? "",
            StreamingEnabled = config.StreamingEnabled,
            ReasoningPanelEnabled = config.ReasoningPanelEnabled,
            LivePreviewEnabled = config.LivePreviewEnabled,
            StartedAt = DateTime.UtcNow,
        });
    }

    /// <summary>
    /// Get stream status
    /// </summary>
    [HttpGet("stream/{streamId}/status")]
    public ActionResult<StreamStatusDto> GetStreamStatus(Guid streamId)
    {
        return Ok(new StreamStatusDto
        {
            StreamId = streamId,
            Status = "completed",
            Progress = 100,
            TokensStreamed = 0,
            CompletedAt = DateTime.UtcNow,
        });
    }

    /// <summary>
    /// Get aggregate stats (total streams, tokens, previews, avg stream time)
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AiElementsStatsDto>> GetStats()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiElementsConfigs.FirstOrDefaultAsync(c => c.UserId == userId);

        var recentStreams = new List<PreviewHistoryEntry>();
        if (config?.PreviewHistoryJson != null)
        {
            recentStreams = JsonSerializer.Deserialize<List<PreviewHistoryEntry>>(config.PreviewHistoryJson) ?? new List<PreviewHistoryEntry>();
        }

        return Ok(new AiElementsStatsDto
        {
            TotalStreams = config?.TotalStreams ?? 0,
            TotalTokensStreamed = config?.TotalTokensStreamed ?? 0,
            TotalComponentPreviews = config?.TotalComponentPreviews ?? 0,
            AverageStreamTokens = config != null && config.TotalStreams > 0
                ? (int)(config.TotalTokensStreamed / config.TotalStreams)
                : 0,
            ActiveModel = config?.ActiveModel ?? "claude-sonnet-4-20250514",
            ThemeMode = config?.ThemeMode ?? "dark",
            RecentStreams = recentStreams.TakeLast(10).Reverse().ToList(),
        });
    }

    private static AiElementsConfigDto ToDto(AiElementsConfig config) => new()
    {
        Id = config.Id,
        StreamingEnabled = config.StreamingEnabled,
        ReasoningPanelEnabled = config.ReasoningPanelEnabled,
        LivePreviewEnabled = config.LivePreviewEnabled,
        ResponseActionsEnabled = config.ResponseActionsEnabled,
        ThemeMode = config.ThemeMode,
        ActiveModel = config.ActiveModel,
        TotalStreams = config.TotalStreams,
        TotalTokensStreamed = config.TotalTokensStreamed,
        TotalComponentPreviews = config.TotalComponentPreviews,
        CreatedAt = config.CreatedAt,
        UpdatedAt = config.UpdatedAt,
    };
}

// === DTOs ===

public class AiElementsConfigDto
{
    public Guid Id { get; set; }
    public bool StreamingEnabled { get; set; }
    public bool ReasoningPanelEnabled { get; set; }
    public bool LivePreviewEnabled { get; set; }
    public bool ResponseActionsEnabled { get; set; }
    public string ThemeMode { get; set; } = "";
    public string ActiveModel { get; set; } = "";
    public int TotalStreams { get; set; }
    public long TotalTokensStreamed { get; set; }
    public int TotalComponentPreviews { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateAiElementsConfigDto
{
    public bool? StreamingEnabled { get; set; }
    public bool? ReasoningPanelEnabled { get; set; }
    public bool? LivePreviewEnabled { get; set; }
    public bool? ResponseActionsEnabled { get; set; }
    public string? ThemeMode { get; set; }
    public string? ActiveModel { get; set; }
}

public class AiElementComponentDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public string Icon { get; set; } = "";
    public string Status { get; set; } = "";
}

public class StartStreamDto
{
    public string? Prompt { get; set; }
    public string? Language { get; set; }
}

public class StreamSessionDto
{
    public Guid StreamId { get; set; }
    public string Status { get; set; } = "";
    public string Model { get; set; } = "";
    public int EstimatedTokens { get; set; }
    public string Language { get; set; } = "";
    public string Prompt { get; set; } = "";
    public bool StreamingEnabled { get; set; }
    public bool ReasoningPanelEnabled { get; set; }
    public bool LivePreviewEnabled { get; set; }
    public DateTime StartedAt { get; set; }
}

public class StreamStatusDto
{
    public Guid StreamId { get; set; }
    public string Status { get; set; } = "";
    public int Progress { get; set; }
    public int TokensStreamed { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class AiElementsStatsDto
{
    public int TotalStreams { get; set; }
    public long TotalTokensStreamed { get; set; }
    public int TotalComponentPreviews { get; set; }
    public int AverageStreamTokens { get; set; }
    public string ActiveModel { get; set; } = "";
    public string ThemeMode { get; set; } = "";
    public List<PreviewHistoryEntry> RecentStreams { get; set; } = new();
}

public class PreviewHistoryEntry
{
    public string StreamId { get; set; } = "";
    public string Prompt { get; set; } = "";
    public string Language { get; set; } = "";
    public int TokenCount { get; set; }
    public DateTime StartedAt { get; set; }
}

using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/generative-ui")]
[Authorize]
public class GenerativeUiController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public GenerativeUiController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException();

    [HttpGet("session/{projectId}")]
    public async Task<IActionResult> GetSession(Guid projectId)
    {
        var userId = GetUserId();
        var session = await _db.GenerativeUiSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == projectId);

        if (session == null)
        {
            session = new GenerativeUiSession
            {
                UserId = userId,
                DevRequestId = projectId,
                SessionName = "Chat Session"
            };
            _db.GenerativeUiSessions.Add(session);
            await _db.SaveChangesAsync();
        }

        return Ok(new GenerativeUiSessionDto
        {
            Id = session.Id,
            DevRequestId = session.DevRequestId,
            SessionName = session.SessionName,
            Status = session.Status,
            TotalMessages = session.TotalMessages,
            AiMessages = session.AiMessages,
            UserMessages = session.UserMessages,
            GeneratedComponents = session.GeneratedComponents,
            ToolCallCount = session.ToolCallCount,
            StreamingEnabled = session.StreamingEnabled,
            GenerativeUiEnabled = session.GenerativeUiEnabled,
            ActiveModel = session.ActiveModel,
            TotalTokensUsed = session.TotalTokensUsed,
            EstimatedCost = session.EstimatedCost,
            LastMessageAt = session.LastMessageAt,
            CreatedAt = session.CreatedAt
        });
    }

    [HttpPut("session/{projectId}")]
    public async Task<IActionResult> UpdateSession(Guid projectId, [FromBody] UpdateGenerativeUiSessionDto dto)
    {
        var userId = GetUserId();
        var session = await _db.GenerativeUiSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == projectId);

        if (session == null)
            return NotFound();

        if (dto.SessionName != null) session.SessionName = dto.SessionName;
        if (dto.StreamingEnabled.HasValue) session.StreamingEnabled = dto.StreamingEnabled.Value;
        if (dto.GenerativeUiEnabled.HasValue) session.GenerativeUiEnabled = dto.GenerativeUiEnabled.Value;
        if (dto.ActiveModel != null) session.ActiveModel = dto.ActiveModel;
        session.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        var userId = GetUserId();
        var session = await _db.GenerativeUiSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == dto.ProjectId);

        if (session == null)
            return NotFound();

        session.UserMessages++;
        session.TotalMessages++;
        session.LastMessageAt = DateTime.UtcNow;

        var messages = string.IsNullOrEmpty(session.MessagesJson)
            ? new List<ChatMessage>()
            : JsonSerializer.Deserialize<List<ChatMessage>>(session.MessagesJson) ?? new List<ChatMessage>();

        messages.Add(new ChatMessage
        {
            Role = "user",
            Content = dto.Content,
            Timestamp = DateTime.UtcNow
        });

        var aiResponse = new ChatMessage
        {
            Role = "assistant",
            Content = $"I'll help you with that. Based on your request: \"{dto.Content}\", here's my analysis and generated component.",
            Timestamp = DateTime.UtcNow,
            ComponentType = dto.ExpectComponent ? "code-preview" : null,
            ToolCalls = dto.EnableToolUse ? new List<ToolCallRecord>
            {
                new() { Name = "analyze_request", Arguments = dto.Content, Result = "Analysis complete" }
            } : null
        };

        messages.Add(aiResponse);
        session.AiMessages++;
        session.TotalMessages++;

        if (dto.ExpectComponent)
            session.GeneratedComponents++;

        if (dto.EnableToolUse)
            session.ToolCallCount++;

        session.TotalTokensUsed += dto.Content.Length * 1.3;
        session.EstimatedCost += dto.Content.Length * 0.00001;

        if (messages.Count > 200)
            messages = messages.Skip(messages.Count - 200).ToList();

        session.MessagesJson = JsonSerializer.Serialize(messages);
        session.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new MessageResponseDto
        {
            MessageId = Guid.NewGuid(),
            Role = "assistant",
            Content = aiResponse.Content,
            ComponentType = aiResponse.ComponentType,
            ToolCalls = aiResponse.ToolCalls,
            TokensUsed = (int)(dto.Content.Length * 1.3),
            Timestamp = aiResponse.Timestamp
        });
    }

    [HttpGet("messages/{projectId}")]
    public async Task<IActionResult> GetMessages(Guid projectId, [FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var session = await _db.GenerativeUiSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == projectId);

        if (session == null)
            return Ok(new { messages = Array.Empty<ChatMessage>() });

        var messages = string.IsNullOrEmpty(session.MessagesJson)
            ? new List<ChatMessage>()
            : JsonSerializer.Deserialize<List<ChatMessage>>(session.MessagesJson) ?? new List<ChatMessage>();

        return Ok(new { messages = messages.TakeLast(limit) });
    }

    [HttpGet("components/{projectId}")]
    public async Task<IActionResult> GetGeneratedComponents(Guid projectId)
    {
        var userId = GetUserId();
        var session = await _db.GenerativeUiSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == projectId);

        if (session == null)
            return Ok(new { components = Array.Empty<object>() });

        var components = string.IsNullOrEmpty(session.GeneratedComponentsJson)
            ? new List<GeneratedComponent>()
            : JsonSerializer.Deserialize<List<GeneratedComponent>>(session.GeneratedComponentsJson) ?? new List<GeneratedComponent>();

        return Ok(new { components });
    }

    [HttpGet("tools/{projectId}")]
    public async Task<IActionResult> GetToolDefinitions(Guid projectId)
    {
        var userId = GetUserId();
        var session = await _db.GenerativeUiSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == projectId);

        if (session == null)
            return Ok(new { tools = Array.Empty<object>() });

        var tools = string.IsNullOrEmpty(session.ToolDefinitionsJson)
            ? GetDefaultTools()
            : JsonSerializer.Deserialize<List<ToolDefinition>>(session.ToolDefinitionsJson) ?? GetDefaultTools();

        return Ok(new { tools });
    }

    private static List<ToolDefinition> GetDefaultTools() => new()
    {
        new() { Name = "analyze_request", Description = "Analyze development request requirements", Category = "analysis" },
        new() { Name = "generate_code", Description = "Generate code based on specifications", Category = "generation" },
        new() { Name = "preview_component", Description = "Render a preview of generated UI component", Category = "preview" },
        new() { Name = "validate_schema", Description = "Validate database schema design", Category = "validation" },
        new() { Name = "suggest_architecture", Description = "Suggest system architecture patterns", Category = "architecture" }
    };
}

public record GenerativeUiSessionDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string SessionName { get; init; } = "";
    public string Status { get; init; } = "";
    public int TotalMessages { get; init; }
    public int AiMessages { get; init; }
    public int UserMessages { get; init; }
    public int GeneratedComponents { get; init; }
    public int ToolCallCount { get; init; }
    public bool StreamingEnabled { get; init; }
    public bool GenerativeUiEnabled { get; init; }
    public string ActiveModel { get; init; } = "";
    public double TotalTokensUsed { get; init; }
    public double EstimatedCost { get; init; }
    public DateTime? LastMessageAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record UpdateGenerativeUiSessionDto
{
    public string? SessionName { get; init; }
    public bool? StreamingEnabled { get; init; }
    public bool? GenerativeUiEnabled { get; init; }
    public string? ActiveModel { get; init; }
}

public record SendMessageDto
{
    public Guid ProjectId { get; init; }
    public string Content { get; init; } = "";
    public bool ExpectComponent { get; init; } = false;
    public bool EnableToolUse { get; init; } = true;
}

public record MessageResponseDto
{
    public Guid MessageId { get; init; }
    public string Role { get; init; } = "";
    public string Content { get; init; } = "";
    public string? ComponentType { get; init; }
    public List<ToolCallRecord>? ToolCalls { get; init; }
    public int TokensUsed { get; init; }
    public DateTime Timestamp { get; init; }
}

public class ChatMessage
{
    public string Role { get; set; } = "";
    public string Content { get; set; } = "";
    public string? ComponentType { get; set; }
    public List<ToolCallRecord>? ToolCalls { get; set; }
    public DateTime Timestamp { get; set; }
}

public class ToolCallRecord
{
    public string Name { get; set; } = "";
    public string Arguments { get; set; } = "";
    public string Result { get; set; } = "";
}

public class GeneratedComponent
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string Code { get; set; } = "";
    public DateTime GeneratedAt { get; set; }
}

public class ToolDefinition
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
}

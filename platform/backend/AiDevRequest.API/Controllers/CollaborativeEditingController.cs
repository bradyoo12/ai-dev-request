using System.Text.Json;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/projects/{projectId:int}/collab")]
public class CollaborativeEditingController : ControllerBase
{
    private readonly ICollaborativeEditingService _service;
    private readonly ILogger<CollaborativeEditingController> _logger;

    public CollaborativeEditingController(
        ICollaborativeEditingService service,
        ILogger<CollaborativeEditingController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost("session")]
    public async Task<IActionResult> CreateSession(int projectId, [FromBody] CreateSessionRequest request)
    {
        try
        {
            var userId = User.Identity?.Name ?? "anonymous";
            var session = await _service.CreateSessionAsync(projectId, request.SessionName ?? "", userId);
            return Ok(MapDto(session));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create collaborative session for project {ProjectId}", projectId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("session")]
    public async Task<IActionResult> GetSession(int projectId)
    {
        try
        {
            var session = await _service.GetActiveSessionAsync(projectId);
            if (session == null) return NotFound(new { error = "No active session" });
            return Ok(MapDto(session));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get session for project {ProjectId}", projectId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinSession(int projectId, [FromBody] JoinSessionRequest request)
    {
        try
        {
            var userId = User.Identity?.Name ?? "anonymous";
            var session = await _service.JoinSessionAsync(projectId, userId, request.DisplayName ?? userId);
            return Ok(MapDto(session));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to join session for project {ProjectId}", projectId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("document")]
    public async Task<IActionResult> UpdateDocument(int projectId, [FromBody] UpdateDocumentRequest request)
    {
        try
        {
            var userId = User.Identity?.Name ?? "anonymous";
            var session = await _service.UpdateDocumentAsync(projectId, userId, request.Content ?? "");
            return Ok(MapDto(session));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update document for project {ProjectId}", projectId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("end")]
    public async Task<IActionResult> EndSession(int projectId)
    {
        try
        {
            var session = await _service.EndSessionAsync(projectId);
            return Ok(MapDto(session));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to end session for project {ProjectId}", projectId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(int projectId)
    {
        try
        {
            var sessions = await _service.GetSessionHistoryAsync(projectId);
            return Ok(sessions.Select(MapDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get session history for project {ProjectId}", projectId);
            return BadRequest(new { error = ex.Message });
        }
    }

    private static CollaborativeSessionDto MapDto(CollaborativeSession s) => new()
    {
        Id = s.Id,
        ProjectId = s.ProjectId,
        Status = s.Status,
        SessionName = s.SessionName,
        Participants = ParseJson<List<ParticipantDto>>(s.ParticipantsJson) ?? new(),
        ParticipantCount = s.ParticipantCount,
        DocumentContent = s.DocumentContent,
        DocumentVersion = s.DocumentVersion,
        ActivityFeed = ParseJson<List<ActivityEntryDto>>(s.ActivityFeedJson) ?? new(),
        CreatedBy = s.CreatedBy,
        CreatedAt = s.CreatedAt,
        EndedAt = s.EndedAt,
        LastActivityAt = s.LastActivityAt,
    };

    private static T? ParseJson<T>(string? json) where T : class
    {
        if (string.IsNullOrEmpty(json)) return null;
        return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }
}

public record CreateSessionRequest
{
    public string? SessionName { get; init; }
}

public record JoinSessionRequest
{
    public string? DisplayName { get; init; }
}

public record UpdateDocumentRequest
{
    public string? Content { get; init; }
}

public record CollaborativeSessionDto
{
    public Guid Id { get; init; }
    public int ProjectId { get; init; }
    public string Status { get; init; } = "";
    public string SessionName { get; init; } = "";
    public List<ParticipantDto> Participants { get; init; } = new();
    public int ParticipantCount { get; init; }
    public string? DocumentContent { get; init; }
    public int DocumentVersion { get; init; }
    public List<ActivityEntryDto> ActivityFeed { get; init; } = new();
    public string CreatedBy { get; init; } = "";
    public DateTime CreatedAt { get; init; }
    public DateTime? EndedAt { get; init; }
    public DateTime LastActivityAt { get; init; }
}

public record ParticipantDto
{
    public string UserId { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public string Color { get; init; } = "";
    public string JoinedAt { get; init; } = "";
}

public record ActivityEntryDto
{
    public string UserId { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public string Action { get; init; } = "";
    public string Detail { get; init; } = "";
    public string Timestamp { get; init; } = "";
}

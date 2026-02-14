using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/streaming-codegen")]
public class StreamingCodeGenController : ControllerBase
{
    private readonly IStreamingCodeGenService _service;
    private readonly ILogger<StreamingCodeGenController> _logger;

    public StreamingCodeGenController(IStreamingCodeGenService service, ILogger<StreamingCodeGenController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>Create a new streaming code generation session.</summary>
    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateCodeGenSessionDto input)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
        try
        {
            var session = await _service.CreateSessionAsync(userId, input.Prompt, input.DevRequestId);
            return Ok(MapDto(session));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Get a session by ID.</summary>
    [HttpGet("sessions/{sessionId:guid}")]
    public async Task<IActionResult> GetSession(Guid sessionId)
    {
        var session = await _service.GetSessionAsync(sessionId);
        if (session == null) return NotFound();
        return Ok(MapDto(session));
    }

    /// <summary>List recent sessions for the current user.</summary>
    [HttpGet("sessions")]
    public async Task<IActionResult> GetUserSessions()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
        var sessions = await _service.GetUserSessionsAsync(userId);
        return Ok(sessions.Select(MapDto));
    }

    /// <summary>Cancel an active session.</summary>
    [HttpPost("sessions/{sessionId:guid}/cancel")]
    public async Task<IActionResult> CancelSession(Guid sessionId)
    {
        try
        {
            var session = await _service.CancelSessionAsync(sessionId);
            return Ok(MapDto(session));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>SSE endpoint: stream code generation events in real-time.</summary>
    [HttpGet("sessions/{sessionId:guid}/stream")]
    [Produces("text/event-stream")]
    public async Task StreamCodeGeneration(Guid sessionId, CancellationToken cancellationToken)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        try
        {
            await foreach (var streamEvent in _service.StreamCodeGenerationAsync(sessionId, cancellationToken))
            {
                if (cancellationToken.IsCancellationRequested) break;

                await Response.WriteAsync($"event: {streamEvent.Type}\n", cancellationToken);
                await Response.WriteAsync($"data: {streamEvent.Data}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("SSE stream cancelled for session {SessionId}", sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SSE stream for session {SessionId}", sessionId);
            await Response.WriteAsync($"event: error\ndata: {ex.Message}\n\n", CancellationToken.None);
            await Response.Body.FlushAsync(CancellationToken.None);
        }
    }

    private static StreamingCodeGenSessionDto MapDto(Entities.StreamingCodeGenSession s) => new()
    {
        Id = s.Id,
        UserId = s.UserId,
        DevRequestId = s.DevRequestId,
        Prompt = s.Prompt,
        Status = s.Status,
        CurrentFile = s.CurrentFile,
        TotalFiles = s.TotalFiles,
        CompletedFiles = s.CompletedFiles,
        TotalTokens = s.TotalTokens,
        StreamedTokens = s.StreamedTokens,
        ProgressPercent = s.ProgressPercent,
        GeneratedFilesJson = s.GeneratedFilesJson,
        BuildProgressJson = s.BuildProgressJson,
        PreviewUrl = s.PreviewUrl,
        ErrorMessage = s.ErrorMessage,
        CreatedAt = s.CreatedAt,
        StartedAt = s.StartedAt,
        CompletedAt = s.CompletedAt,
    };
}

// === DTOs ===

public record CreateCodeGenSessionDto
{
    public string? Prompt { get; init; }
    public int? DevRequestId { get; init; }
}

public record StreamingCodeGenSessionDto
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = "";
    public int? DevRequestId { get; init; }
    public string? Prompt { get; init; }
    public string Status { get; init; } = "";
    public string? CurrentFile { get; init; }
    public int TotalFiles { get; init; }
    public int CompletedFiles { get; init; }
    public int TotalTokens { get; init; }
    public int StreamedTokens { get; init; }
    public double ProgressPercent { get; init; }
    public string? GeneratedFilesJson { get; init; }
    public string? BuildProgressJson { get; init; }
    public string? PreviewUrl { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

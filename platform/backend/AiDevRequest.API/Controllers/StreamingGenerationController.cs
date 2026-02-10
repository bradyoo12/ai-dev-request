using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/requests/{id:int}/generate")]
public class StreamingGenerationController : ControllerBase
{
    private readonly IStreamingGenerationService _streamingService;
    private readonly ILogger<StreamingGenerationController> _logger;

    public StreamingGenerationController(IStreamingGenerationService streamingService, ILogger<StreamingGenerationController> logger)
    {
        _streamingService = streamingService;
        _logger = logger;
    }

    [HttpGet("stream")]
    [Produces("text/event-stream")]
    public async Task StreamGeneration(int id, CancellationToken cancellationToken)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        try
        {
            await foreach (var streamEvent in _streamingService.StreamGenerationAsync(id, cancellationToken))
            {
                if (cancellationToken.IsCancellationRequested) break;

                await Response.WriteAsync($"event: {streamEvent.Type}\n", cancellationToken);
                await Response.WriteAsync($"data: {streamEvent.Data}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("SSE stream cancelled for request {Id}", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SSE stream for request {Id}", id);
            await Response.WriteAsync($"event: error\ndata: {ex.Message}\n\n", CancellationToken.None);
            await Response.Body.FlushAsync(CancellationToken.None);
        }
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartGeneration(int id)
    {
        try
        {
            var result = await _streamingService.StartStreamAsync(id);
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> CancelGeneration(int id)
    {
        try
        {
            var result = await _streamingService.CancelStreamAsync(id);
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStreamStatus(int id)
    {
        var result = await _streamingService.GetStreamStatusAsync(id);
        if (result == null) return NotFound();
        return Ok(MapDto(result));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetStreamHistory(int id)
    {
        var history = await _streamingService.GetStreamHistoryAsync(id);
        return Ok(history.Select(MapDto));
    }

    private static GenerationStreamDto MapDto(Entities.GenerationStream s) => new()
    {
        Id = s.Id,
        DevRequestId = s.DevRequestId,
        Status = s.Status,
        CurrentFile = s.CurrentFile,
        TotalFiles = s.TotalFiles,
        CompletedFiles = s.CompletedFiles,
        TotalTokens = s.TotalTokens,
        StreamedTokens = s.StreamedTokens,
        ProgressPercent = s.ProgressPercent,
        GeneratedFiles = s.GeneratedFiles,
        ErrorMessage = s.ErrorMessage,
        CreatedAt = s.CreatedAt,
        StartedAt = s.StartedAt,
        CompletedAt = s.CompletedAt,
    };
}

// === DTOs ===

public record GenerationStreamDto
{
    public Guid Id { get; init; }
    public int DevRequestId { get; init; }
    public string Status { get; init; } = "";
    public string? CurrentFile { get; init; }
    public int TotalFiles { get; init; }
    public int CompletedFiles { get; init; }
    public int TotalTokens { get; init; }
    public int StreamedTokens { get; init; }
    public double ProgressPercent { get; init; }
    public string? GeneratedFiles { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

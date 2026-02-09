using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/requests/{requestId}/chat")]
public class RefinementController : ControllerBase
{
    private readonly IRefinementService _refinementService;
    private readonly ITokenService _tokenService;
    private readonly AiDevRequestDbContext _db;

    public RefinementController(
        IRefinementService refinementService,
        ITokenService tokenService,
        AiDevRequestDbContext db)
    {
        _refinementService = refinementService;
        _tokenService = tokenService;
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Get chat history for a request
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetHistory(Guid requestId)
    {
        var request = await _db.DevRequests.FindAsync(requestId);
        if (request == null) return NotFound();

        var messages = await _refinementService.GetHistoryAsync(requestId);
        return Ok(messages.Select(m => new
        {
            m.Id,
            m.Role,
            m.Content,
            m.TokensUsed,
            createdAt = m.CreatedAt
        }));
    }

    /// <summary>
    /// Send a chat message and get AI response
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> SendMessage(Guid requestId, [FromBody] SendMessageRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Message))
            return BadRequest(new { error = "Message is required" });

        var request = await _db.DevRequests.FindAsync(requestId);
        if (request == null) return NotFound();

        // Check tokens (10 tokens per refinement message)
        var userId = GetUserId();
        var tokenBalance = await _tokenService.GetOrCreateBalance(userId);
        if (tokenBalance.Balance < 10)
        {
            return Ok(new
            {
                error = "insufficient_tokens",
                required = 10,
                balance = tokenBalance.Balance
            });
        }

        var response = await _refinementService.SendMessageAsync(requestId, body.Message);

        // Deduct tokens
        if (response.TokensUsed > 0)
        {
            await _tokenService.DebitTokens(userId, "refinement", requestId.ToString()[..8]);
        }

        var updatedBalance = await _tokenService.GetOrCreateBalance(userId);

        return Ok(new
        {
            message = new
            {
                response.Id,
                response.Role,
                response.Content,
                response.TokensUsed,
                createdAt = response.CreatedAt
            },
            tokensUsed = response.TokensUsed ?? 0,
            newBalance = updatedBalance.Balance
        });
    }
    /// <summary>
    /// Apply code changes from an AI message to the project files
    /// </summary>
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyChanges(Guid requestId, [FromBody] ApplyChangesRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.MessageContent))
            return BadRequest(new { error = "Message content is required" });

        var request = await _db.DevRequests.FindAsync(requestId);
        if (request == null) return NotFound();

        try
        {
            var result = await _refinementService.ApplyChangesAsync(requestId, body.MessageContent);
            return Ok(new
            {
                result.ModifiedFiles,
                result.CreatedFiles,
                result.TotalChanges
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Send a chat message and get AI response via SSE streaming
    /// </summary>
    [HttpPost("stream")]
    public async Task StreamChat(Guid requestId, [FromBody] SendMessageRequest body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(body.Message))
        {
            Response.StatusCode = 400;
            return;
        }

        var request = await _db.DevRequests.FindAsync(requestId);
        if (request == null)
        {
            Response.StatusCode = 404;
            return;
        }

        // Check tokens (10 tokens per refinement message)
        var userId = GetUserId();
        var tokenBalance = await _tokenService.GetOrCreateBalance(userId);
        if (tokenBalance.Balance < 10)
        {
            Response.ContentType = "text/event-stream";
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");
            await Response.WriteAsync($"event: error\ndata: {{\"error\":\"insufficient_tokens\",\"required\":10,\"balance\":{tokenBalance.Balance}}}\n\n", cancellationToken);
            return;
        }

        Response.ContentType = "text/event-stream";
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        try
        {
            await foreach (var token in _refinementService.StreamMessageAsync(requestId, body.Message, cancellationToken))
            {
                var escaped = System.Text.Json.JsonSerializer.Serialize(token);
                await Response.WriteAsync($"data: {{\"token\":{escaped}}}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }

            // Deduct tokens
            await _tokenService.DebitTokens(userId, "refinement", requestId.ToString()[..8]);
            var updatedBalance = await _tokenService.GetOrCreateBalance(userId);

            await Response.WriteAsync($"event: done\ndata: {{\"tokensUsed\":10,\"newBalance\":{updatedBalance.Balance}}}\n\n", cancellationToken);
        }
        catch (Exception ex)
        {
            await Response.WriteAsync($"event: error\ndata: {{\"error\":\"{System.Text.Json.JsonSerializer.Serialize(ex.Message)}\"}}\n\n", cancellationToken);
        }
    }
}

public class SendMessageRequest
{
    public string Message { get; set; } = "";
}

public class ApplyChangesRequest
{
    public string MessageContent { get; set; } = "";
}

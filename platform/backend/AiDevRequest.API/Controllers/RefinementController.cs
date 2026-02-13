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

        var response = messages.Select(m =>
        {
            var fileChanges = new List<object>();

            if (!string.IsNullOrEmpty(m.FileChangesJson))
            {
                try
                {
                    var changes = System.Text.Json.JsonSerializer.Deserialize<List<FileChangeSummary>>(m.FileChangesJson);
                    if (changes != null)
                    {
                        fileChanges = changes.Select(c => new
                        {
                            file = c.File,
                            operation = c.Operation,
                            diff = c.Diff, // Full file content
                            explanation = c.Explanation,
                            status = m.Status
                        }).Cast<object>().ToList();
                    }
                }
                catch
                {
                    // Ignore JSON parse errors
                }
            }

            return new
            {
                id = m.Id,
                role = m.Role,
                content = m.Content,
                fileChanges,
                tokensUsed = m.TokensUsed,
                createdAt = m.CreatedAt
            };
        });

        return Ok(response);
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

            // Get the last assistant message to extract file changes
            var lastMessage = await _db.RefinementMessages
                .Where(m => m.DevRequestId == requestId && m.Role == "assistant")
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            // Emit file_changes event if file changes exist
            if (lastMessage != null && !string.IsNullOrEmpty(lastMessage.FileChangesJson))
            {
                try
                {
                    var fileChanges = System.Text.Json.JsonSerializer.Deserialize<List<FileChangeSummary>>(lastMessage.FileChangesJson);
                    if (fileChanges != null && fileChanges.Any())
                    {
                        var fileChangesData = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            changes = fileChanges.Select(fc => new
                            {
                                file = fc.File,
                                operation = fc.Operation,
                                diff = fc.Diff,
                                explanation = fc.Explanation
                            })
                        });

                        await Response.WriteAsync($"event: file_changes\ndata: {fileChangesData}\n\n", cancellationToken);
                        await Response.Body.FlushAsync(cancellationToken);
                    }
                }
                catch
                {
                    // Ignore JSON parse errors
                }
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

    /// <summary>
    /// Get diff preview without applying changes
    /// </summary>
    [HttpPost("diff")]
    public async Task<IActionResult> GetDiffPreview(Guid requestId, [FromBody] SendMessageRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Message))
            return BadRequest(new { error = "Message is required" });

        var request = await _db.DevRequests.FindAsync(requestId);
        if (request == null) return NotFound();

        var userId = GetUserId();
        if (request.UserId != userId)
            return StatusCode(403, new { error = "Access denied" });

        var result = await _refinementService.GetDiffPreviewAsync(requestId, body.Message);

        return Ok(new
        {
            fileChanges = result.Changes.Select(c => new
            {
                file = c.File,
                operation = c.Operation,
                diff = c.Diff, // Full file content
                explanation = c.Explanation
            })
        });
    }

    /// <summary>
    /// Undo the last iteration
    /// </summary>
    [HttpPost("undo")]
    public async Task<IActionResult> UndoLastIteration(Guid requestId)
    {
        var request = await _db.DevRequests.FindAsync(requestId);
        if (request == null) return NotFound();

        var userId = GetUserId();
        if (request.UserId != userId)
            return StatusCode(403, new { error = "Access denied" });

        var success = await _refinementService.UndoLastIterationAsync(requestId);

        if (!success)
            return BadRequest(new { error = "No previous version to undo to" });

        return Ok(new { success = true, message = "Successfully undid last iteration" });
    }

    /// <summary>
    /// Accept changes from a specific message
    /// </summary>
    [HttpPost("accept")]
    public async Task<IActionResult> AcceptChanges(Guid requestId, [FromBody] MessageActionRequest body)
    {
        var request = await _db.DevRequests.FindAsync(requestId);
        if (request == null) return NotFound();

        var userId = GetUserId();
        if (request.UserId != userId)
            return StatusCode(403, new { error = "access_denied", message = "Access denied" });

        try
        {
            var result = await _refinementService.AcceptChangesAsync(requestId, body.MessageId);

            return Ok(new
            {
                appliedChanges = result.AppliedChanges,
                modifiedFiles = result.ModifiedFiles,
                createdFiles = result.CreatedFiles
            });
        }
        catch (ArgumentException ex) when (ex.Message == "invalid_message_id")
        {
            return BadRequest(new { error = "invalid_message_id", message = "Message ID does not belong to this request" });
        }
    }

    /// <summary>
    /// Revert changes from a specific message
    /// </summary>
    [HttpPost("revert")]
    public async Task<IActionResult> RevertChanges(Guid requestId, [FromBody] MessageActionRequest body)
    {
        var request = await _db.DevRequests.FindAsync(requestId);
        if (request == null) return NotFound();

        var userId = GetUserId();
        if (request.UserId != userId)
            return StatusCode(403, new { error = "access_denied", message = "Access denied" });

        try
        {
            var result = await _refinementService.RevertChangesAsync(requestId, body.MessageId);

            return Ok(new
            {
                success = result.Success,
                restoredFiles = result.RestoredFiles
            });
        }
        catch (ArgumentException ex) when (ex.Message == "invalid_message_id")
        {
            return BadRequest(new { error = "invalid_message_id", message = "Message ID does not belong to this request" });
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

public class MessageActionRequest
{
    public int MessageId { get; set; }
}

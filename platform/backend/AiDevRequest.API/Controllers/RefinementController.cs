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
}

public class SendMessageRequest
{
    public string Message { get; set; } = "";
}

using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/dev-request")]
public class IterationController : ControllerBase
{
    private readonly IIterationService _iterationService;
    private readonly AiDevRequestDbContext _db;

    public IterationController(
        IIterationService iterationService,
        AiDevRequestDbContext db)
    {
        _iterationService = iterationService;
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Iterate on the dev request with a user message
    /// POST /api/dev-request/{id}/iterate
    /// </summary>
    [HttpPost("{id}/iterate")]
    [ProducesResponseType(typeof(IterationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IterationResponse>> Iterate(Guid id, [FromBody] IterateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            throw new ArgumentException("Message is required");

        var devRequest = await _db.DevRequests.FindAsync(id);
        if (devRequest == null)
            throw new KeyNotFoundException("DevRequest not found");

        var userId = GetUserId();

        // Validate user owns the DevRequest
        if (devRequest.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this DevRequest");

        var result = await _iterationService.IterateAsync(id, request.Message, userId);

        return Ok(new IterationResponse
        {
            Success = true,
            Message = result.AssistantMessage,
            ChangedFiles = result.ChangedFiles,
            TotalChanges = result.TotalChanges,
            TokensUsed = result.TokensUsed
        });
    }
}

public class IterateRequest
{
    public string Message { get; set; } = "";
}

public class IterationResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = "";
    public List<string> ChangedFiles { get; set; } = new();
    public int TotalChanges { get; set; }
    public int TokensUsed { get; set; }
}

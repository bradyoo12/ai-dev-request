using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId:int}/github")]
public class GitHubSyncController : ControllerBase
{
    private readonly IGitHubSyncService _syncService;
    private readonly ILogger<GitHubSyncController> _logger;

    public GitHubSyncController(IGitHubSyncService syncService, ILogger<GitHubSyncController> logger)
    {
        _syncService = syncService;
        _logger = logger;
    }

    [HttpPost("connect")]
    public async Task<IActionResult> ConnectRepo(int projectId, [FromBody] ConnectRepoDto dto)
    {
        try
        {
            var sync = await _syncService.ConnectRepoAsync(projectId, dto.RepoOwner, dto.RepoName);
            return Ok(MapDto(sync));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("disconnect")]
    public async Task<IActionResult> DisconnectRepo(int projectId)
    {
        try
        {
            await _syncService.DisconnectRepoAsync(projectId);
            return Ok(new { message = "Disconnected from GitHub repository." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("push")]
    public async Task<IActionResult> PushToRepo(int projectId)
    {
        try
        {
            var sync = await _syncService.PushToRepoAsync(projectId);
            return Ok(MapDto(sync));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("pull")]
    public async Task<IActionResult> PullFromRepo(int projectId)
    {
        try
        {
            var sync = await _syncService.PullFromRepoAsync(projectId);
            return Ok(MapDto(sync));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetSyncStatus(int projectId)
    {
        var sync = await _syncService.GetSyncStatusAsync(projectId);
        if (sync == null) return NotFound();
        return Ok(MapDto(sync));
    }

    [HttpPost("resolve")]
    public async Task<IActionResult> ResolveConflicts(int projectId, [FromBody] ResolveConflictsDto dto)
    {
        try
        {
            var sync = await _syncService.ResolveConflictsAsync(projectId, dto.Resolution);
            return Ok(MapDto(sync));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetSyncHistory(int projectId)
    {
        var history = await _syncService.GetSyncHistoryAsync(projectId);
        return Ok(history);
    }

    private static GitHubSyncDto MapDto(Entities.GitHubSync s) => new()
    {
        Id = s.Id,
        ProjectId = s.ProjectId,
        GitHubRepoOwner = s.GitHubRepoOwner,
        GitHubRepoName = s.GitHubRepoName,
        GitHubRepoUrl = s.GitHubRepoUrl,
        Branch = s.Branch,
        Status = s.Status,
        LastSyncCommitSha = s.LastSyncCommitSha,
        ConflictDetails = s.ConflictDetails,
        CreatedAt = s.CreatedAt,
        LastSyncedAt = s.LastSyncedAt,
        LastPushAt = s.LastPushAt,
        LastPullAt = s.LastPullAt,
    };
}

// Webhook endpoint — separate controller with no auth (GitHub calls it)
[ApiController]
[Route("api/webhooks")]
public class GitHubWebhookController : ControllerBase
{
    private readonly IGitHubSyncService _syncService;
    private readonly ILogger<GitHubWebhookController> _logger;

    public GitHubWebhookController(IGitHubSyncService syncService, ILogger<GitHubWebhookController> logger)
    {
        _syncService = syncService;
        _logger = logger;
    }

    [HttpPost("github")]
    public async Task<IActionResult> HandleWebhook()
    {
        try
        {
            using var reader = new StreamReader(Request.Body);
            var payload = await reader.ReadToEndAsync();
            var signature = Request.Headers["X-Hub-Signature-256"].FirstOrDefault() ?? "";

            await _syncService.HandleWebhookAsync(payload, signature);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Webhook processing failed");
            return StatusCode(500, new { error = "Webhook processing failed." });
        }
    }
}

// === DTOs ===

public record ConnectRepoDto
{
    public string RepoOwner { get; init; } = "";
    public string RepoName { get; init; } = "";
}

public record ResolveConflictsDto
{
    public string Resolution { get; init; } = "";
}

public record GitHubSyncDto
{
    public Guid Id { get; init; }
    public int ProjectId { get; init; }
    public string GitHubRepoOwner { get; init; } = "";
    public string GitHubRepoName { get; init; } = "";
    public string GitHubRepoUrl { get; init; } = "";
    public string Branch { get; init; } = "";
    public string Status { get; init; } = "";
    public string? LastSyncCommitSha { get; init; }
    public string? ConflictDetails { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastSyncedAt { get; init; }
    public DateTime? LastPushAt { get; init; }
    public DateTime? LastPullAt { get; init; }
}

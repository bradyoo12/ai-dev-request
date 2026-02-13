using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

/// <summary>
/// API controller for managing git branches per dev request (v0-style workflow)
/// </summary>
[ApiController]
[Route("api/git-branch")]
[Authorize]
public class GitBranchController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly GitBranchService _branchService;

    public GitBranchController(AiDevRequestDbContext db, GitBranchService branchService)
    {
        _db = db;
        _branchService = branchService;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get or create branch for a dev request
    /// </summary>
    [HttpGet("{devRequestId:guid}")]
    public async Task<ActionResult<DevRequestBranchDto>> GetOrCreateBranch(Guid devRequestId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Verify user owns this dev request
        var devRequest = await _db.DevRequests
            .FirstOrDefaultAsync(r => r.Id == devRequestId && r.UserId == userId);

        if (devRequest == null)
        {
            return NotFound(new { error = "Dev request not found" });
        }

        var branch = await _branchService.GetByDevRequestIdAsync(devRequestId);

        if (branch == null)
        {
            // Auto-create branch for this dev request
            branch = await _branchService.CreateBranchAsync(devRequestId);
        }

        return Ok(ToDto(branch));
    }

    /// <summary>
    /// Create a new branch for a dev request
    /// </summary>
    [HttpPost("create")]
    public async Task<ActionResult<DevRequestBranchDto>> CreateBranch([FromBody] CreateBranchDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Verify user owns this dev request
        var devRequest = await _db.DevRequests
            .FirstOrDefaultAsync(r => r.Id == dto.DevRequestId && r.UserId == userId);

        if (devRequest == null)
        {
            return NotFound(new { error = "Dev request not found" });
        }

        var branch = await _branchService.CreateBranchAsync(dto.DevRequestId, dto.BranchName);

        return Ok(ToDto(branch));
    }

    /// <summary>
    /// Auto-commit changes to a branch
    /// </summary>
    [HttpPost("commit")]
    public async Task<ActionResult<CommitResultDto>> AutoCommit([FromBody] AutoCommitDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Verify user owns this branch
        var branch = await _db.DevRequestBranches
            .Include(b => b.DevRequestId)
            .FirstOrDefaultAsync(b => b.Id == dto.BranchId);

        if (branch == null)
        {
            return NotFound(new { error = "Branch not found" });
        }

        var devRequest = await _db.DevRequests
            .FirstOrDefaultAsync(r => r.Id == branch.DevRequestId && r.UserId == userId);

        if (devRequest == null)
        {
            return Unauthorized(new { error = "Access denied" });
        }

        var result = await _branchService.AutoCommitAsync(dto.BranchId, dto.CommitMessage, dto.ChangedFiles);

        return Ok(new CommitResultDto
        {
            Success = result.Success,
            CommitSha = result.CommitSha,
            Message = result.Message,
            FilesChanged = result.FilesChanged
        });
    }

    /// <summary>
    /// Sync from remote (pull changes)
    /// </summary>
    [HttpPost("sync/pull")]
    public async Task<ActionResult<SyncResultDto>> SyncFromRemote([FromBody] SyncRequestDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var branch = await _db.DevRequestBranches.FindAsync(dto.BranchId);
        if (branch == null)
        {
            return NotFound(new { error = "Branch not found" });
        }

        var devRequest = await _db.DevRequests
            .FirstOrDefaultAsync(r => r.Id == branch.DevRequestId && r.UserId == userId);

        if (devRequest == null)
        {
            return Unauthorized(new { error = "Access denied" });
        }

        var result = await _branchService.SyncFromRemoteAsync(dto.BranchId);

        return Ok(new SyncResultDto
        {
            Success = result.Success,
            Direction = result.Direction,
            ChangedFiles = result.ChangedFiles,
            CommitSha = result.CommitSha
        });
    }

    /// <summary>
    /// Sync to remote (push changes)
    /// </summary>
    [HttpPost("sync/push")]
    public async Task<ActionResult<SyncResultDto>> SyncToRemote([FromBody] SyncRequestDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var branch = await _db.DevRequestBranches.FindAsync(dto.BranchId);
        if (branch == null)
        {
            return NotFound(new { error = "Branch not found" });
        }

        var devRequest = await _db.DevRequests
            .FirstOrDefaultAsync(r => r.Id == branch.DevRequestId && r.UserId == userId);

        if (devRequest == null)
        {
            return Unauthorized(new { error = "Access denied" });
        }

        var result = await _branchService.SyncToRemoteAsync(dto.BranchId);

        return Ok(new SyncResultDto
        {
            Success = result.Success,
            Direction = result.Direction,
            ChangedFiles = result.ChangedFiles,
            CommitSha = result.CommitSha
        });
    }

    /// <summary>
    /// Create a pull request for the branch
    /// </summary>
    [HttpPost("pull-request")]
    public async Task<ActionResult<PullRequestResultDto>> CreatePullRequest([FromBody] CreatePullRequestDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var branch = await _db.DevRequestBranches.FindAsync(dto.BranchId);
        if (branch == null)
        {
            return NotFound(new { error = "Branch not found" });
        }

        var devRequest = await _db.DevRequests
            .FirstOrDefaultAsync(r => r.Id == branch.DevRequestId && r.UserId == userId);

        if (devRequest == null)
        {
            return Unauthorized(new { error = "Access denied" });
        }

        var result = await _branchService.CreatePullRequestAsync(dto.BranchId, dto.Title, dto.Description);

        return Ok(new PullRequestResultDto
        {
            Success = result.Success,
            PullRequestUrl = result.PullRequestUrl,
            PullRequestNumber = result.PullRequestNumber,
            AlreadyExists = result.AlreadyExists
        });
    }

    /// <summary>
    /// Get commit history for a branch
    /// </summary>
    [HttpGet("{branchId:guid}/commits")]
    public async Task<ActionResult<List<CommitHistoryEntryDto>>> GetCommitHistory(Guid branchId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var branch = await _db.DevRequestBranches.FindAsync(branchId);
        if (branch == null)
        {
            return NotFound(new { error = "Branch not found" });
        }

        var devRequest = await _db.DevRequests
            .FirstOrDefaultAsync(r => r.Id == branch.DevRequestId && r.UserId == userId);

        if (devRequest == null)
        {
            return Unauthorized(new { error = "Access denied" });
        }

        var history = await _branchService.GetCommitHistoryAsync(branchId);

        return Ok(history.Select(c => new CommitHistoryEntryDto
        {
            Sha = c.Sha,
            Message = c.Message,
            Timestamp = c.Timestamp,
            Author = c.Author,
            FilesChanged = c.FilesChanged ?? Array.Empty<string>()
        }));
    }

    /// <summary>
    /// Mark branch as merged
    /// </summary>
    [HttpPost("{branchId:guid}/merge")]
    public async Task<ActionResult> MarkAsMerged(Guid branchId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var branch = await _db.DevRequestBranches.FindAsync(branchId);
        if (branch == null)
        {
            return NotFound(new { error = "Branch not found" });
        }

        var devRequest = await _db.DevRequests
            .FirstOrDefaultAsync(r => r.Id == branch.DevRequestId && r.UserId == userId);

        if (devRequest == null)
        {
            return Unauthorized(new { error = "Access denied" });
        }

        await _branchService.MarkAsMergedAsync(branchId);

        return Ok(new { message = "Branch marked as merged" });
    }

    private static DevRequestBranchDto ToDto(DevRequestBranch b) => new()
    {
        Id = b.Id,
        DevRequestId = b.DevRequestId,
        BranchName = b.BranchName,
        BaseBranch = b.BaseBranch,
        Status = b.Status.ToString(),
        LastSyncedCommitSha = b.LastSyncedCommitSha,
        LastLocalCommitSha = b.LastLocalCommitSha,
        TotalCommits = b.TotalCommits,
        TotalSyncs = b.TotalSyncs,
        HasPullRequest = b.HasPullRequest,
        PullRequestUrl = b.PullRequestUrl,
        PullRequestNumber = b.PullRequestNumber,
        PreviewUrl = b.PreviewUrl,
        LastPushedAt = b.LastPushedAt,
        LastPulledAt = b.LastPulledAt,
        LastSyncedAt = b.LastSyncedAt,
        MergedAt = b.MergedAt,
        CreatedAt = b.CreatedAt,
        UpdatedAt = b.UpdatedAt
    };
}

// === DTOs ===

public class DevRequestBranchDto
{
    public Guid Id { get; set; }
    public Guid DevRequestId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string BaseBranch { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? LastSyncedCommitSha { get; set; }
    public string? LastLocalCommitSha { get; set; }
    public int TotalCommits { get; set; }
    public int TotalSyncs { get; set; }
    public bool HasPullRequest { get; set; }
    public string? PullRequestUrl { get; set; }
    public int? PullRequestNumber { get; set; }
    public string? PreviewUrl { get; set; }
    public DateTime? LastPushedAt { get; set; }
    public DateTime? LastPulledAt { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public DateTime? MergedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateBranchDto
{
    public Guid DevRequestId { get; set; }
    public string? BranchName { get; set; }
}

public class AutoCommitDto
{
    public Guid BranchId { get; set; }
    public string CommitMessage { get; set; } = string.Empty;
    public string[] ChangedFiles { get; set; } = Array.Empty<string>();
}

public class CommitResultDto
{
    public bool Success { get; set; }
    public string CommitSha { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int FilesChanged { get; set; }
}

public class SyncRequestDto
{
    public Guid BranchId { get; set; }
}

public class SyncResultDto
{
    public bool Success { get; set; }
    public string Direction { get; set; } = string.Empty;
    public string[] ChangedFiles { get; set; } = Array.Empty<string>();
    public string? CommitSha { get; set; }
}

public class CreatePullRequestDto
{
    public Guid BranchId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class PullRequestResultDto
{
    public bool Success { get; set; }
    public string PullRequestUrl { get; set; } = string.Empty;
    public int PullRequestNumber { get; set; }
    public bool AlreadyExists { get; set; }
}

public class CommitHistoryEntryDto
{
    public string Sha { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string[] FilesChanged { get; set; } = Array.Empty<string>();
}

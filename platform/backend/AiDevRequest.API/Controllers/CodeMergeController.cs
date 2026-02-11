using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CodeMergeController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<CodeMergeController> _logger;

    public CodeMergeController(AiDevRequestDbContext context, ILogger<CodeMergeController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// List all code snapshots for a specific dev request
    /// </summary>
    [HttpGet("snapshots")]
    public async Task<ActionResult<List<CodeSnapshotDto>>> ListSnapshots([FromQuery] Guid? devRequestId)
    {
        var userId = GetUserId();
        var query = _context.CodeSnapshots.Where(s => s.UserId == userId);

        if (devRequestId.HasValue)
            query = query.Where(s => s.DevRequestId == devRequestId.Value);

        var entities = await query
            .OrderBy(s => s.FilePath)
            .ToListAsync();

        var snapshots = entities.Select(ToDto).ToList();
        return Ok(snapshots);
    }

    /// <summary>
    /// Get a single snapshot by ID
    /// </summary>
    [HttpGet("snapshots/{id:guid}")]
    public async Task<ActionResult<CodeSnapshotDto>> GetSnapshot(Guid id)
    {
        var userId = GetUserId();
        var snapshot = await _context.CodeSnapshots
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (snapshot == null)
            return NotFound(new { error = "Snapshot not found." });

        return Ok(ToDto(snapshot));
    }

    /// <summary>
    /// Save user modifications to a file
    /// </summary>
    [HttpPut("snapshots/{id:guid}/user-content")]
    public async Task<ActionResult<CodeSnapshotDto>> UpdateUserContent(Guid id, [FromBody] UpdateUserContentDto request)
    {
        var userId = GetUserId();
        var snapshot = await _context.CodeSnapshots
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (snapshot == null)
            return NotFound(new { error = "Snapshot not found." });

        snapshot.UserContent = request.Content;
        snapshot.Status = string.IsNullOrEmpty(request.Content) || request.Content == snapshot.BaselineContent
            ? SnapshotStatus.Synced
            : SnapshotStatus.UserModified;
        snapshot.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ToDto(snapshot));
    }

    /// <summary>
    /// Toggle file lock status (prevents AI from regenerating this file)
    /// </summary>
    [HttpPut("snapshots/{id:guid}/lock")]
    public async Task<ActionResult<CodeSnapshotDto>> ToggleLock(Guid id, [FromBody] ToggleLockDto request)
    {
        var userId = GetUserId();
        var snapshot = await _context.CodeSnapshots
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (snapshot == null)
            return NotFound(new { error = "Snapshot not found." });

        snapshot.IsLocked = request.Locked;
        snapshot.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Snapshot {Id} lock set to {Locked} by user {UserId}", id, request.Locked, userId);

        return Ok(ToDto(snapshot));
    }

    /// <summary>
    /// Accept a merge resolution (user picks which version to keep)
    /// </summary>
    [HttpPost("snapshots/{id:guid}/resolve")]
    public async Task<ActionResult<CodeSnapshotDto>> ResolveConflict(Guid id, [FromBody] ResolveConflictDto request)
    {
        var userId = GetUserId();
        var snapshot = await _context.CodeSnapshots
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (snapshot == null)
            return NotFound(new { error = "Snapshot not found." });

        switch (request.Resolution)
        {
            case "keep-user":
                snapshot.BaselineContent = snapshot.UserContent ?? snapshot.BaselineContent;
                snapshot.UserContent = null;
                break;
            case "keep-ai":
                snapshot.UserContent = null;
                break;
            case "custom":
                if (string.IsNullOrEmpty(request.MergedContent))
                    return BadRequest(new { error = "Merged content is required for custom resolution." });
                snapshot.BaselineContent = request.MergedContent;
                snapshot.UserContent = null;
                break;
            default:
                return BadRequest(new { error = "Invalid resolution type. Use 'keep-user', 'keep-ai', or 'custom'." });
        }

        snapshot.Status = SnapshotStatus.Merged;
        snapshot.Version++;
        snapshot.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Conflict resolved for snapshot {Id} with {Resolution} by user {UserId}", id, request.Resolution, userId);

        return Ok(ToDto(snapshot));
    }

    /// <summary>
    /// Get merge statistics for a dev request
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<MergeStatsDto>> GetStats([FromQuery] Guid? devRequestId)
    {
        var userId = GetUserId();
        var query = _context.CodeSnapshots.Where(s => s.UserId == userId);

        if (devRequestId.HasValue)
            query = query.Where(s => s.DevRequestId == devRequestId.Value);

        var stats = new MergeStatsDto
        {
            TotalFiles = await query.CountAsync(),
            SyncedFiles = await query.CountAsync(s => s.Status == SnapshotStatus.Synced),
            ModifiedFiles = await query.CountAsync(s => s.Status == SnapshotStatus.UserModified),
            ConflictedFiles = await query.CountAsync(s => s.Status == SnapshotStatus.Conflicted),
            MergedFiles = await query.CountAsync(s => s.Status == SnapshotStatus.Merged),
            LockedFiles = await query.CountAsync(s => s.IsLocked),
        };

        return Ok(stats);
    }

    /// <summary>
    /// Create a snapshot (used during code generation to store baseline)
    /// </summary>
    [HttpPost("snapshots")]
    public async Task<ActionResult<CodeSnapshotDto>> CreateSnapshot([FromBody] CreateSnapshotDto request)
    {
        var userId = GetUserId();

        var existing = await _context.CodeSnapshots
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == request.DevRequestId && s.FilePath == request.FilePath);

        if (existing != null)
        {
            // Update existing snapshot with new AI generation
            if (!existing.IsLocked)
            {
                if (existing.UserContent != null && existing.UserContent != existing.BaselineContent)
                {
                    existing.Status = SnapshotStatus.Conflicted;
                }
                else
                {
                    existing.Status = SnapshotStatus.Synced;
                    existing.UserContent = null;
                }
                existing.BaselineContent = request.Content;
                existing.Version++;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
            return Ok(ToDto(existing));
        }

        var snapshot = new CodeSnapshot
        {
            UserId = userId,
            DevRequestId = request.DevRequestId,
            FilePath = request.FilePath.Trim(),
            BaselineContent = request.Content,
        };

        _context.CodeSnapshots.Add(snapshot);
        await _context.SaveChangesAsync();

        return Ok(ToDto(snapshot));
    }

    private static CodeSnapshotDto ToDto(CodeSnapshot s) => new()
    {
        Id = s.Id,
        DevRequestId = s.DevRequestId,
        FilePath = s.FilePath,
        BaselineContent = s.BaselineContent,
        UserContent = s.UserContent,
        IsLocked = s.IsLocked,
        Version = s.Version,
        Status = s.Status.ToString(),
        HasUserChanges = s.UserContent != null && s.UserContent != s.BaselineContent,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
    };
}

public class CodeSnapshotDto
{
    public Guid Id { get; set; }
    public Guid DevRequestId { get; set; }
    public string FilePath { get; set; } = "";
    public string BaselineContent { get; set; } = "";
    public string? UserContent { get; set; }
    public bool IsLocked { get; set; }
    public int Version { get; set; }
    public string Status { get; set; } = "";
    public bool HasUserChanges { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class MergeStatsDto
{
    public int TotalFiles { get; set; }
    public int SyncedFiles { get; set; }
    public int ModifiedFiles { get; set; }
    public int ConflictedFiles { get; set; }
    public int MergedFiles { get; set; }
    public int LockedFiles { get; set; }
}

public class UpdateUserContentDto
{
    public string? Content { get; set; }
}

public class ToggleLockDto
{
    public bool Locked { get; set; }
}

public class ResolveConflictDto
{
    public string Resolution { get; set; } = "";
    public string? MergedContent { get; set; }
}

public class CreateSnapshotDto
{
    public Guid DevRequestId { get; set; }
    public string FilePath { get; set; } = "";
    public string Content { get; set; } = "";
}

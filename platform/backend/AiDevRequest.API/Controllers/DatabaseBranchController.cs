using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{id:guid}/db/branches")]
public class DatabaseBranchController : ControllerBase
{
    private readonly IDatabaseBranchService _branchService;
    private readonly ILogger<DatabaseBranchController> _logger;

    public DatabaseBranchController(IDatabaseBranchService branchService, ILogger<DatabaseBranchController> logger)
    {
        _branchService = branchService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreateBranch(Guid id, [FromBody] CreateBranchRequest request)
    {
        try
        {
            _logger.LogInformation("Creating database branch '{BranchName}' for project {ProjectId}", request.BranchName, id);
            var branch = await _branchService.CreateBranch(id, request.BranchName);
            return Ok(MapDto(branch));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while creating branch '{BranchName}' for project {ProjectId}", request.BranchName, id);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create branch '{BranchName}' for project {ProjectId}", request.BranchName, id);
            return StatusCode(500, new { error = "Failed to create database branch" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> ListBranches(Guid id)
    {
        try
        {
            var branches = await _branchService.ListBranches(id);
            return Ok(branches.Select(MapDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list branches for project {ProjectId}", id);
            return StatusCode(500, new { error = "Failed to retrieve database branches" });
        }
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetActiveSessions(Guid id)
    {
        try
        {
            var sessions = await _branchService.GetActiveBranchSessions(id);
            return Ok(sessions.Select(MapDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get active branch sessions for project {ProjectId}", id);
            return StatusCode(500, new { error = "Failed to retrieve database branch sessions" });
        }
    }

    [HttpGet("{branchId:guid}")]
    public async Task<IActionResult> GetBranch(Guid id, Guid branchId)
    {
        try
        {
            var branch = await _branchService.GetBranch(branchId);
            if (branch == null)
            {
                _logger.LogWarning("Branch {BranchId} not found for project {ProjectId}", branchId, id);
                return NotFound(new { error = "Branch not found" });
            }
            return Ok(MapDto(branch));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get branch {BranchId} for project {ProjectId}", branchId, id);
            return StatusCode(500, new { error = "Failed to retrieve database branch" });
        }
    }

    [HttpPost("{branchId:guid}/merge")]
    public async Task<IActionResult> MergeBranch(Guid id, Guid branchId)
    {
        try
        {
            _logger.LogInformation("Merging database branch {BranchId} for project {ProjectId}", branchId, id);
            var branch = await _branchService.MergeBranch(branchId);
            return Ok(MapDto(branch));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while merging branch {BranchId} for project {ProjectId}", branchId, id);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to merge branch {BranchId} for project {ProjectId}", branchId, id);
            return StatusCode(500, new { error = "Failed to merge database branch" });
        }
    }

    [HttpDelete("{branchId:guid}")]
    public async Task<IActionResult> DiscardBranch(Guid id, Guid branchId)
    {
        try
        {
            _logger.LogInformation("Discarding database branch {BranchId} for project {ProjectId}", branchId, id);
            var branch = await _branchService.DiscardBranch(branchId);
            return Ok(MapDto(branch));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while discarding branch {BranchId} for project {ProjectId}", branchId, id);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to discard branch {BranchId} for project {ProjectId}", branchId, id);
            return StatusCode(500, new { error = "Failed to discard database branch" });
        }
    }

    [HttpGet("{branchId:guid}/diff")]
    public async Task<IActionResult> GetSchemaDiff(Guid id, Guid branchId)
    {
        try
        {
            var diff = await _branchService.GetSchemaDiff(branchId);
            return Ok(diff);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while getting schema diff for branch {BranchId} in project {ProjectId}", branchId, id);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get schema diff for branch {BranchId} in project {ProjectId}", branchId, id);
            return StatusCode(500, new { error = "Failed to retrieve schema diff" });
        }
    }

    private static DatabaseBranchDto MapDto(Entities.DatabaseBranch b) => new()
    {
        Id = b.Id,
        DevRequestId = b.DevRequestId,
        BranchName = b.BranchName,
        SourceBranch = b.SourceBranch,
        Status = b.Status,
        SchemaVersion = b.SchemaVersion,
        TablesJson = b.TablesJson,
        MigrationsJson = b.MigrationsJson,
        CreatedAt = b.CreatedAt,
        MergedAt = b.MergedAt,
        DiscardedAt = b.DiscardedAt,
    };
}

public record CreateBranchRequest
{
    public string BranchName { get; init; } = "";
}

public record DatabaseBranchDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string BranchName { get; init; } = "";
    public string SourceBranch { get; init; } = "";
    public string Status { get; init; } = "";
    public string SchemaVersion { get; init; } = "";
    public string? TablesJson { get; init; }
    public string? MigrationsJson { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? MergedAt { get; init; }
    public DateTime? DiscardedAt { get; init; }
}

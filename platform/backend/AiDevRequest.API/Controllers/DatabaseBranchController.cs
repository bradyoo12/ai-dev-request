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
            var branch = await _branchService.CreateBranch(id, request.BranchName);
            return Ok(MapDto(branch));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
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
            _logger.LogError(ex, "Error listing branches for project {ProjectId}", id);
            return Ok(Array.Empty<DatabaseBranchDto>());
        }
    }

    [HttpGet("{branchId:guid}")]
    public async Task<IActionResult> GetBranch(Guid id, Guid branchId)
    {
        try
        {
            var branch = await _branchService.GetBranch(branchId);
            if (branch == null) return NotFound();
            return Ok(MapDto(branch));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting branch {BranchId} for project {ProjectId}", branchId, id);
            return NotFound();
        }
    }

    [HttpPost("{branchId:guid}/merge")]
    public async Task<IActionResult> MergeBranch(Guid id, Guid branchId)
    {
        try
        {
            var branch = await _branchService.MergeBranch(branchId);
            return Ok(MapDto(branch));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{branchId:guid}")]
    public async Task<IActionResult> DiscardBranch(Guid id, Guid branchId)
    {
        try
        {
            var branch = await _branchService.DiscardBranch(branchId);
            return Ok(MapDto(branch));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
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
            return BadRequest(new { error = ex.Message });
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

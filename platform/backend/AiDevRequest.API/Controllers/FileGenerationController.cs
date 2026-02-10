using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId:guid}/generation")]
public class FileGenerationController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly IFileGenerationService _fileGenerationService;
    private readonly ILogger<FileGenerationController> _logger;

    public FileGenerationController(
        AiDevRequestDbContext context,
        IFileGenerationService fileGenerationService,
        ILogger<FileGenerationController> logger)
    {
        _context = context;
        _fileGenerationService = fileGenerationService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Create a generation manifest with file specifications and dependency mapping
    /// </summary>
    [HttpPost("manifest")]
    [ProducesResponseType(typeof(ManifestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ManifestResponse>> CreateManifest(
        Guid projectId,
        [FromBody] CreateManifestRequest request)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        if (request.Files == null || request.Files.Count == 0)
            return BadRequest(new { error = "At least one file specification is required." });

        _logger.LogInformation("Creating generation manifest for project {ProjectId}", projectId);

        try
        {
            var manifest = await _fileGenerationService.CreateManifestAsync(projectId, request.Files);
            return Ok(MapToResponse(manifest));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create manifest for project {ProjectId}", projectId);
            return StatusCode(500, new { error = "Failed to create generation manifest." });
        }
    }

    /// <summary>
    /// Get the generation manifest for a project
    /// </summary>
    [HttpGet("manifest")]
    [ProducesResponseType(typeof(ManifestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ManifestResponse>> GetManifest(Guid projectId)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var manifest = await _fileGenerationService.GetManifestAsync(projectId);
        if (manifest == null)
            return NotFound(new { error = "No generation manifest found. Create one first." });

        return Ok(MapToResponse(manifest));
    }

    /// <summary>
    /// Trigger cross-file consistency validation
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(ManifestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ManifestResponse>> ValidateConsistency(Guid projectId)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var manifest = await _fileGenerationService.GetManifestAsync(projectId);
        if (manifest == null)
            return NotFound(new { error = "No generation manifest found. Create one first." });

        _logger.LogInformation("Triggering validation for project {ProjectId}", projectId);

        try
        {
            var result = await _fileGenerationService.ValidateConsistencyAsync(manifest.Id);
            return Ok(MapToResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Validation failed for project {ProjectId}", projectId);
            return StatusCode(500, new { error = "Validation failed." });
        }
    }

    /// <summary>
    /// Resolve validation conflicts with AI-assisted suggestions
    /// </summary>
    [HttpPost("resolve")]
    [ProducesResponseType(typeof(ManifestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ManifestResponse>> ResolveConflicts(Guid projectId)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var manifest = await _fileGenerationService.GetManifestAsync(projectId);
        if (manifest == null)
            return NotFound(new { error = "No generation manifest found. Create one first." });

        _logger.LogInformation("Resolving conflicts for project {ProjectId}", projectId);

        try
        {
            var result = await _fileGenerationService.ResolveConflictsAsync(manifest.Id);
            return Ok(MapToResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Conflict resolution failed for project {ProjectId}", projectId);
            return StatusCode(500, new { error = "Conflict resolution failed." });
        }
    }

    /// <summary>
    /// List generated files with metadata
    /// </summary>
    [HttpGet("files")]
    [ProducesResponseType(typeof(List<GeneratedFileInfo>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<GeneratedFileInfo>>> GetFiles(Guid projectId)
    {
        var entity = await _context.DevRequests.FindAsync(projectId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var files = await _fileGenerationService.GetFilesAsync(projectId);
        return Ok(files);
    }

    private static ManifestResponse MapToResponse(Entities.GenerationManifest manifest)
    {
        return new ManifestResponse
        {
            Id = manifest.Id,
            DevRequestId = manifest.DevRequestId,
            FilesJson = manifest.FilesJson,
            CrossReferencesJson = manifest.CrossReferencesJson,
            ValidationResultsJson = manifest.ValidationResultsJson,
            ValidationStatus = manifest.ValidationStatus,
            FileCount = manifest.FileCount,
            CrossReferenceCount = manifest.CrossReferenceCount,
            IssueCount = manifest.IssueCount,
            CreatedAt = manifest.CreatedAt,
            UpdatedAt = manifest.UpdatedAt
        };
    }
}

#region Request/Response DTOs

public record CreateManifestRequest
{
    public List<FileSpec> Files { get; init; } = new();
}

public record ManifestResponse
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string FilesJson { get; init; } = "[]";
    public string CrossReferencesJson { get; init; } = "[]";
    public string ValidationResultsJson { get; init; } = "[]";
    public string ValidationStatus { get; init; } = "pending";
    public int FileCount { get; init; }
    public int CrossReferenceCount { get; init; }
    public int IssueCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

#endregion

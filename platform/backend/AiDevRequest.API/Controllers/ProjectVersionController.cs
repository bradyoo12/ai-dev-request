using System.Text.Json;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId:guid}/versions")]
public class ProjectVersionController : ControllerBase
{
    private readonly IProjectVersionService _versionService;

    public ProjectVersionController(IProjectVersionService versionService)
    {
        _versionService = versionService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProjectVersionDto>>> GetVersions(Guid projectId)
    {
        var versions = await _versionService.GetVersionsAsync(projectId);
        return Ok(versions.Select(MapToDto).ToList());
    }

    [HttpGet("{versionId:guid}")]
    public async Task<ActionResult<ProjectVersionDto>> GetVersion(Guid projectId, Guid versionId)
    {
        var version = await _versionService.GetVersionAsync(projectId, versionId);
        if (version == null) return NotFound(new { error = "Version not found" });
        return Ok(MapToDto(version));
    }

    [HttpGet("latest")]
    public async Task<ActionResult<ProjectVersionDto>> GetLatestVersion(Guid projectId)
    {
        var version = await _versionService.GetLatestVersionAsync(projectId);
        if (version == null) return NotFound(new { error = "No versions found" });
        return Ok(MapToDto(version));
    }

    [HttpGet("{fromId:guid}/diff/{toId:guid}")]
    public async Task<ActionResult<VersionDiffDto>> GetDiff(Guid projectId, Guid fromId, Guid toId)
    {
        var diff = await _versionService.GetDiffAsync(projectId, fromId, toId);
        return Ok(new VersionDiffDto
        {
            FromVersionId = diff.FromVersionId.ToString(),
            ToVersionId = diff.ToVersionId.ToString(),
            FromVersionNumber = diff.FromVersionNumber,
            ToVersionNumber = diff.ToVersionNumber,
            AddedFiles = diff.AddedFiles,
            RemovedFiles = diff.RemovedFiles,
            ModifiedFiles = diff.ModifiedFiles,
            TotalChanges = diff.TotalChanges
        });
    }

    [HttpPost("{versionId:guid}/rollback")]
    public async Task<ActionResult<ProjectVersionDto>> Rollback(Guid projectId, Guid versionId)
    {
        var version = await _versionService.RollbackAsync(projectId, versionId);
        if (version == null) return NotFound(new { error = "Version not found or snapshot unavailable" });
        return Ok(MapToDto(version));
    }

    private static ProjectVersionDto MapToDto(ProjectVersion v) => new()
    {
        Id = v.Id.ToString(),
        ProjectId = v.DevRequestId.ToString(),
        VersionNumber = v.VersionNumber,
        Label = v.Label,
        Source = v.Source,
        FileCount = v.FileCount,
        ChangedFiles = string.IsNullOrEmpty(v.ChangedFilesJson)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(v.ChangedFilesJson) ?? new(),
        CreatedAt = v.CreatedAt
    };
}

public record ProjectVersionDto
{
    public string Id { get; init; } = "";
    public string ProjectId { get; init; } = "";
    public int VersionNumber { get; init; }
    public string Label { get; init; } = "";
    public string Source { get; init; } = "";
    public int FileCount { get; init; }
    public List<string> ChangedFiles { get; init; } = new();
    public DateTime CreatedAt { get; init; }
}

public record VersionDiffDto
{
    public string FromVersionId { get; init; } = "";
    public string ToVersionId { get; init; } = "";
    public int FromVersionNumber { get; init; }
    public int ToVersionNumber { get; init; }
    public List<string> AddedFiles { get; init; } = new();
    public List<string> RemovedFiles { get; init; } = new();
    public List<string> ModifiedFiles { get; init; } = new();
    public int TotalChanges { get; init; }
}

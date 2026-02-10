using System.IO.Compression;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IProjectVersionService
{
    Task<ProjectVersion> CreateSnapshotAsync(Guid devRequestId, string projectPath, string label, string source = "build");
    Task<List<ProjectVersion>> GetVersionsAsync(Guid devRequestId);
    Task<ProjectVersion?> GetVersionAsync(Guid devRequestId, Guid versionId);
    Task<ProjectVersion?> GetLatestVersionAsync(Guid devRequestId);
    Task<VersionDiff> GetDiffAsync(Guid devRequestId, Guid fromVersionId, Guid toVersionId);
    Task<ProjectVersion?> RollbackAsync(Guid devRequestId, Guid versionId);
}

public class VersionDiff
{
    public Guid FromVersionId { get; set; }
    public Guid ToVersionId { get; set; }
    public int FromVersionNumber { get; set; }
    public int ToVersionNumber { get; set; }
    public List<string> AddedFiles { get; set; } = new();
    public List<string> RemovedFiles { get; set; } = new();
    public List<string> ModifiedFiles { get; set; } = new();
    public int TotalChanges => AddedFiles.Count + RemovedFiles.Count + ModifiedFiles.Count;
}

public class ProjectVersionService : IProjectVersionService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<ProjectVersionService> _logger;
    private readonly string _snapshotsBasePath;

    public ProjectVersionService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<ProjectVersionService> logger)
    {
        _context = context;
        _logger = logger;
        _snapshotsBasePath = Path.Combine(
            configuration["Projects:BasePath"] ?? "./projects",
            "_snapshots");
        Directory.CreateDirectory(_snapshotsBasePath);
    }

    public async Task<ProjectVersion> CreateSnapshotAsync(Guid devRequestId, string projectPath, string label, string source = "build")
    {
        // Get next version number
        var lastVersion = await _context.ProjectVersions
            .Where(v => v.DevRequestId == devRequestId)
            .OrderByDescending(v => v.VersionNumber)
            .FirstOrDefaultAsync();

        var versionNumber = (lastVersion?.VersionNumber ?? 0) + 1;

        // Create snapshot zip
        var snapshotFileName = $"{devRequestId:N}_v{versionNumber}.zip";
        var snapshotPath = Path.Combine(_snapshotsBasePath, snapshotFileName);

        // Count files and detect changed files
        var currentFiles = new List<string>();
        if (Directory.Exists(projectPath))
        {
            currentFiles = Directory.GetFiles(projectPath, "*", SearchOption.AllDirectories)
                .Select(f => Path.GetRelativePath(projectPath, f))
                .ToList();

            // Create zip snapshot
            if (File.Exists(snapshotPath))
                File.Delete(snapshotPath);
            ZipFile.CreateFromDirectory(projectPath, snapshotPath);
        }

        // Detect changed files (compare with previous snapshot)
        var changedFiles = currentFiles; // First version: all files are "changed"
        if (lastVersion?.SnapshotPath != null && File.Exists(lastVersion.SnapshotPath))
        {
            var previousFiles = new HashSet<string>();
            using var previousZip = ZipFile.OpenRead(lastVersion.SnapshotPath);
            foreach (var entry in previousZip.Entries)
            {
                if (!string.IsNullOrEmpty(entry.Name))
                    previousFiles.Add(entry.FullName);
            }

            changedFiles = currentFiles
                .Where(f => !previousFiles.Contains(f))
                .ToList();

            // Also include files that exist in both but might have changed (by comparing sizes)
            // For simplicity, we mark all files as potentially changed on rebuild
            if (source == "build" || source == "rebuild")
                changedFiles = currentFiles;
        }

        var version = new ProjectVersion
        {
            DevRequestId = devRequestId,
            VersionNumber = versionNumber,
            Label = label,
            Source = source,
            FileCount = currentFiles.Count,
            SnapshotPath = snapshotPath,
            ChangedFilesJson = JsonSerializer.Serialize(changedFiles)
        };

        _context.ProjectVersions.Add(version);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created snapshot v{Version} for request {RequestId}: {FileCount} files",
            versionNumber, devRequestId, currentFiles.Count);

        return version;
    }

    public async Task<List<ProjectVersion>> GetVersionsAsync(Guid devRequestId)
    {
        return await _context.ProjectVersions
            .Where(v => v.DevRequestId == devRequestId)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync();
    }

    public async Task<ProjectVersion?> GetVersionAsync(Guid devRequestId, Guid versionId)
    {
        return await _context.ProjectVersions
            .FirstOrDefaultAsync(v => v.Id == versionId && v.DevRequestId == devRequestId);
    }

    public async Task<ProjectVersion?> GetLatestVersionAsync(Guid devRequestId)
    {
        return await _context.ProjectVersions
            .Where(v => v.DevRequestId == devRequestId)
            .OrderByDescending(v => v.VersionNumber)
            .FirstOrDefaultAsync();
    }

    public async Task<VersionDiff> GetDiffAsync(Guid devRequestId, Guid fromVersionId, Guid toVersionId)
    {
        var fromVersion = await _context.ProjectVersions
            .FirstOrDefaultAsync(v => v.Id == fromVersionId && v.DevRequestId == devRequestId)
            ?? throw new InvalidOperationException("From version not found");
        var toVersion = await _context.ProjectVersions
            .FirstOrDefaultAsync(v => v.Id == toVersionId && v.DevRequestId == devRequestId)
            ?? throw new InvalidOperationException("To version not found");

        var fromFiles = DeserializeFiles(fromVersion.ChangedFilesJson);
        var toFiles = DeserializeFiles(toVersion.ChangedFilesJson);

        var fromSet = new HashSet<string>(fromFiles);
        var toSet = new HashSet<string>(toFiles);

        return new VersionDiff
        {
            FromVersionId = fromVersionId,
            ToVersionId = toVersionId,
            FromVersionNumber = fromVersion.VersionNumber,
            ToVersionNumber = toVersion.VersionNumber,
            AddedFiles = toFiles.Where(f => !fromSet.Contains(f)).ToList(),
            RemovedFiles = fromFiles.Where(f => !toSet.Contains(f)).ToList(),
            ModifiedFiles = toFiles.Where(f => fromSet.Contains(f)).ToList()
        };
    }

    private static List<string> DeserializeFiles(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new List<string>();
        return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
    }

    public async Task<ProjectVersion?> RollbackAsync(Guid devRequestId, Guid versionId)
    {
        var version = await _context.ProjectVersions
            .FirstOrDefaultAsync(v => v.Id == versionId && v.DevRequestId == devRequestId);

        if (version?.SnapshotPath == null || !File.Exists(version.SnapshotPath))
            return null;

        // Find the project path from the DevRequest
        var devRequest = await _context.DevRequests.FindAsync(devRequestId);
        if (devRequest?.ProjectPath == null)
            return null;

        // Restore snapshot
        if (Directory.Exists(devRequest.ProjectPath))
            Directory.Delete(devRequest.ProjectPath, recursive: true);

        Directory.CreateDirectory(devRequest.ProjectPath);
        ZipFile.ExtractToDirectory(version.SnapshotPath, devRequest.ProjectPath);

        // Create a new version entry for the rollback
        var rollbackVersion = await CreateSnapshotAsync(
            devRequestId,
            devRequest.ProjectPath,
            $"Rollback to v{version.VersionNumber}",
            "rollback");

        _logger.LogInformation("Rolled back request {RequestId} to v{Version}",
            devRequestId, version.VersionNumber);

        return rollbackVersion;
    }
}

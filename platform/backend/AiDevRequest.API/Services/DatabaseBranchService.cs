using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IDatabaseBranchService
{
    Task<DatabaseBranch> CreateBranch(Guid devRequestId, string branchName);
    Task<List<DatabaseBranch>> ListBranches(Guid devRequestId);
    Task<DatabaseBranch?> GetBranch(Guid branchId);
    Task<DatabaseBranch> MergeBranch(Guid branchId);
    Task<DatabaseBranch> DiscardBranch(Guid branchId);
    Task<SchemaDiffResult> GetSchemaDiff(Guid branchId);
    Task<List<DatabaseBranch>> GetActiveBranchSessions(Guid devRequestId);
}

public class DatabaseBranchService : IDatabaseBranchService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<DatabaseBranchService> _logger;

    public DatabaseBranchService(
        AiDevRequestDbContext context,
        ILogger<DatabaseBranchService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DatabaseBranch> CreateBranch(Guid devRequestId, string branchName)
    {
        // Check for duplicate branch name
        var existing = await _context.DatabaseBranches
            .Where(b => b.DevRequestId == devRequestId && b.BranchName == branchName && b.Status == "active")
            .FirstOrDefaultAsync();

        if (existing != null)
            throw new InvalidOperationException($"An active branch named '{branchName}' already exists for this project.");

        // Simulate schema snapshot from main
        var tables = new[] { "users", "dev_requests", "deployments", "tokens", "payments" };
        var migrations = new[] { $"M_{DateTime.UtcNow:yyyyMMddHHmmss}_create_branch_{branchName}" };

        var branch = new DatabaseBranch
        {
            DevRequestId = devRequestId,
            BranchName = branchName,
            SourceBranch = "main",
            Status = "active",
            SchemaVersion = $"1.0.0-{branchName}",
            TablesJson = JsonSerializer.Serialize(tables),
            MigrationsJson = JsonSerializer.Serialize(migrations),
        };

        _context.DatabaseBranches.Add(branch);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created database branch '{BranchName}' for dev request {DevRequestId}",
            branchName, devRequestId);

        return branch;
    }

    public async Task<List<DatabaseBranch>> ListBranches(Guid devRequestId)
    {
        return await _context.DatabaseBranches
            .Where(b => b.DevRequestId == devRequestId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<DatabaseBranch?> GetBranch(Guid branchId)
    {
        return await _context.DatabaseBranches.FindAsync(branchId);
    }

    public async Task<DatabaseBranch> MergeBranch(Guid branchId)
    {
        var branch = await _context.DatabaseBranches.FindAsync(branchId)
            ?? throw new InvalidOperationException("Branch not found.");

        if (branch.Status != "active")
            throw new InvalidOperationException($"Cannot merge a branch with status '{branch.Status}'.");

        branch.Status = "merged";
        branch.MergedAt = DateTime.UtcNow;

        // Simulate: clear pending migrations after merge
        branch.MigrationsJson = JsonSerializer.Serialize(Array.Empty<string>());

        await _context.SaveChangesAsync();

        _logger.LogInformation("Merged database branch '{BranchName}' (ID: {BranchId})",
            branch.BranchName, branchId);

        return branch;
    }

    public async Task<DatabaseBranch> DiscardBranch(Guid branchId)
    {
        var branch = await _context.DatabaseBranches.FindAsync(branchId)
            ?? throw new InvalidOperationException("Branch not found.");

        if (branch.Status != "active")
            throw new InvalidOperationException($"Cannot discard a branch with status '{branch.Status}'.");

        branch.Status = "discarded";
        branch.DiscardedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Discarded database branch '{BranchName}' (ID: {BranchId})",
            branch.BranchName, branchId);

        return branch;
    }

    public async Task<SchemaDiffResult> GetSchemaDiff(Guid branchId)
    {
        var branch = await _context.DatabaseBranches.FindAsync(branchId)
            ?? throw new InvalidOperationException("Branch not found.");

        // Simulate schema diff: main vs branch
        var mainTables = new[] { "users", "dev_requests", "deployments", "tokens", "payments" };
        var branchTables = branch.TablesJson != null
            ? JsonSerializer.Deserialize<string[]>(branch.TablesJson) ?? mainTables
            : mainTables;

        var added = branchTables.Except(mainTables).ToArray();
        var removed = mainTables.Except(branchTables).ToArray();
        var unchanged = mainTables.Intersect(branchTables).ToArray();

        // Simulate a modified table for demo purposes
        var modified = branch.Status == "active"
            ? new[] { new ModifiedTable { TableName = "dev_requests", ChangeDescription = $"Added column 'branch_ref' (varchar) in branch '{branch.BranchName}'" } }
            : Array.Empty<ModifiedTable>();

        var migrations = branch.MigrationsJson != null
            ? JsonSerializer.Deserialize<string[]>(branch.MigrationsJson) ?? Array.Empty<string>()
            : Array.Empty<string>();

        return new SchemaDiffResult
        {
            BranchId = branch.Id,
            BranchName = branch.BranchName,
            SourceBranch = branch.SourceBranch,
            SchemaVersion = branch.SchemaVersion,
            AddedTables = added,
            RemovedTables = removed,
            ModifiedTables = modified,
            UnchangedTables = unchanged,
            PendingMigrations = migrations,
        };
    }

    public async Task<List<DatabaseBranch>> GetActiveBranchSessions(Guid devRequestId)
    {
        _logger.LogInformation("Retrieving active database branch sessions for project {ProjectId}", devRequestId);

        return await _context.DatabaseBranches
            .Where(b => b.DevRequestId == devRequestId && b.Status == "active")
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }
}

public class SchemaDiffResult
{
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = "";
    public string SourceBranch { get; set; } = "";
    public string SchemaVersion { get; set; } = "";
    public string[] AddedTables { get; set; } = Array.Empty<string>();
    public string[] RemovedTables { get; set; } = Array.Empty<string>();
    public ModifiedTable[] ModifiedTables { get; set; } = Array.Empty<ModifiedTable>();
    public string[] UnchangedTables { get; set; } = Array.Empty<string>();
    public string[] PendingMigrations { get; set; } = Array.Empty<string>();
}

public class ModifiedTable
{
    public string TableName { get; set; } = "";
    public string ChangeDescription { get; set; } = "";
}

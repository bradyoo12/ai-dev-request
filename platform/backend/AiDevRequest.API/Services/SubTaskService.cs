using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISubTaskService
{
    Task<List<SubTask>> GetByRequestIdAsync(Guid requestId);
    Task<SubTask?> GetByIdAsync(Guid id);
    Task<SubTask> CreateAsync(SubTask subTask);
    Task<List<SubTask>> CreateBatchAsync(Guid requestId, List<SubTask> subTasks);
    Task<SubTask?> UpdateAsync(Guid id, SubTask update);
    Task<bool> DeleteAsync(Guid id);
    Task<SubTask?> ApproveAsync(Guid id);
    Task<SubTask?> RejectAsync(Guid id);
    Task<List<SubTask>> ApproveAllAsync(Guid requestId);
    bool ValidateDependencies(List<SubTask> subTasks);
}

public class SubTaskService : ISubTaskService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SubTaskService> _logger;

    public SubTaskService(AiDevRequestDbContext context, ILogger<SubTaskService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<SubTask>> GetByRequestIdAsync(Guid requestId)
    {
        return await _context.SubTasks
            .Where(s => s.DevRequestId == requestId)
            .OrderBy(s => s.Order)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<SubTask?> GetByIdAsync(Guid id)
    {
        return await _context.SubTasks.FindAsync(id);
    }

    public async Task<SubTask> CreateAsync(SubTask subTask)
    {
        subTask.Id = Guid.NewGuid();
        subTask.CreatedAt = DateTime.UtcNow;
        subTask.UpdatedAt = DateTime.UtcNow;

        _context.SubTasks.Add(subTask);
        await _context.SaveChangesAsync();

        _logger.LogInformation("SubTask created: {Title} for request {RequestId}", subTask.Title, subTask.DevRequestId);
        return subTask;
    }

    public async Task<List<SubTask>> CreateBatchAsync(Guid requestId, List<SubTask> subTasks)
    {
        if (!ValidateDependencies(subTasks))
            throw new InvalidOperationException("Circular dependency detected in subtasks.");

        var created = new List<SubTask>();
        // Map temporary IDs to real IDs for dependency resolution
        var idMap = new Dictionary<Guid, Guid>();

        foreach (var subTask in subTasks.OrderBy(s => s.Order))
        {
            var originalId = subTask.Id;
            subTask.Id = Guid.NewGuid();
            subTask.DevRequestId = requestId;
            subTask.CreatedAt = DateTime.UtcNow;
            subTask.UpdatedAt = DateTime.UtcNow;

            // Resolve dependency ID if it references a previously created subtask
            if (subTask.DependsOnSubTaskId.HasValue && idMap.ContainsKey(subTask.DependsOnSubTaskId.Value))
            {
                subTask.DependsOnSubTaskId = idMap[subTask.DependsOnSubTaskId.Value];
            }

            idMap[originalId] = subTask.Id;
            _context.SubTasks.Add(subTask);
            created.Add(subTask);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Batch created {Count} subtasks for request {RequestId}", created.Count, requestId);
        return created;
    }

    public async Task<SubTask?> UpdateAsync(Guid id, SubTask update)
    {
        var existing = await _context.SubTasks.FindAsync(id);
        if (existing == null) return null;

        existing.Title = update.Title;
        existing.Description = update.Description;
        existing.Status = update.Status;
        existing.Order = update.Order;
        existing.DependsOnSubTaskId = update.DependsOnSubTaskId;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("SubTask updated: {Id} - {Title}", id, existing.Title);
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var subTask = await _context.SubTasks.FindAsync(id);
        if (subTask == null) return false;

        _context.SubTasks.Remove(subTask);
        await _context.SaveChangesAsync();
        _logger.LogInformation("SubTask deleted: {Id} - {Title}", id, subTask.Title);
        return true;
    }

    public async Task<SubTask?> ApproveAsync(Guid id)
    {
        var subTask = await _context.SubTasks.FindAsync(id);
        if (subTask == null) return null;

        subTask.Status = SubTaskStatus.Approved;
        subTask.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("SubTask approved: {Id} - {Title}", id, subTask.Title);
        return subTask;
    }

    public async Task<SubTask?> RejectAsync(Guid id)
    {
        var subTask = await _context.SubTasks.FindAsync(id);
        if (subTask == null) return null;

        subTask.Status = SubTaskStatus.Rejected;
        subTask.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("SubTask rejected: {Id} - {Title}", id, subTask.Title);
        return subTask;
    }

    public async Task<List<SubTask>> ApproveAllAsync(Guid requestId)
    {
        var pendingTasks = await _context.SubTasks
            .Where(s => s.DevRequestId == requestId && s.Status == SubTaskStatus.Pending)
            .ToListAsync();

        foreach (var task in pendingTasks)
        {
            task.Status = SubTaskStatus.Approved;
            task.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Approved all {Count} pending subtasks for request {RequestId}", pendingTasks.Count, requestId);
        return pendingTasks;
    }

    public bool ValidateDependencies(List<SubTask> subTasks)
    {
        // Build adjacency for cycle detection
        var idToIndex = new Dictionary<Guid, int>();
        for (int i = 0; i < subTasks.Count; i++)
            idToIndex[subTasks[i].Id] = i;

        var visited = new int[subTasks.Count]; // 0=unvisited, 1=visiting, 2=done

        bool HasCycle(int idx)
        {
            if (visited[idx] == 1) return true;
            if (visited[idx] == 2) return false;
            visited[idx] = 1;

            var depId = subTasks[idx].DependsOnSubTaskId;
            if (depId.HasValue && idToIndex.TryGetValue(depId.Value, out var depIdx))
            {
                if (HasCycle(depIdx)) return true;
            }

            visited[idx] = 2;
            return false;
        }

        for (int i = 0; i < subTasks.Count; i++)
        {
            if (visited[i] == 0 && HasCycle(i)) return false;
        }

        return true;
    }
}

using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IMemoryService
{
    Task<UserMemory> AddMemoryAsync(string userId, string content, string category, MemoryScope scope = MemoryScope.User, string? sessionId = null);
    Task<List<UserMemory>> SearchMemoriesAsync(string userId, string? query = null, MemoryScope? scope = null, string? sessionId = null, int limit = 20);
    Task<List<UserMemory>> GetAllMemoriesAsync(string userId, int page = 1, int pageSize = 50);
    Task<int> GetMemoryCountAsync(string userId);
    Task DeleteMemoryAsync(string userId, int memoryId);
    Task DeleteAllMemoriesAsync(string userId);
    Task<string> BuildMemoryContextAsync(string userId, string? sessionId = null);
    Task ExtractAndStoreMemoriesAsync(string userId, string aiResponse, string? sessionId = null);
}

public class MemoryService : IMemoryService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<MemoryService> _logger;

    public MemoryService(AiDevRequestDbContext context, ILogger<MemoryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<UserMemory> AddMemoryAsync(
        string userId, string content, string category,
        MemoryScope scope = MemoryScope.User, string? sessionId = null)
    {
        // Check for duplicate memories (same user, same content)
        var existing = await _context.UserMemories
            .FirstOrDefaultAsync(m => m.UserId == userId && m.Content == content && m.Scope == scope);

        if (existing != null)
        {
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return existing;
        }

        var memory = new UserMemory
        {
            UserId = userId,
            Content = content,
            Category = category,
            Scope = scope,
            SessionId = sessionId,
        };

        _context.UserMemories.Add(memory);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Memory added for user {UserId}: [{Category}] {ContentPreview}",
            userId, category, content.Length > 50 ? content[..50] + "..." : content);

        return memory;
    }

    public async Task<List<UserMemory>> SearchMemoriesAsync(
        string userId, string? query = null, MemoryScope? scope = null,
        string? sessionId = null, int limit = 20)
    {
        var queryable = _context.UserMemories
            .Where(m => m.UserId == userId);

        if (scope.HasValue)
            queryable = queryable.Where(m => m.Scope == scope.Value);

        if (sessionId != null)
            queryable = queryable.Where(m => m.SessionId == sessionId || m.Scope == MemoryScope.User);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var lowerQuery = query.ToLower();
            queryable = queryable.Where(m =>
                m.Content.ToLower().Contains(lowerQuery) ||
                m.Category.ToLower().Contains(lowerQuery));
        }

        return await queryable
            .OrderByDescending(m => m.UpdatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<UserMemory>> GetAllMemoriesAsync(string userId, int page = 1, int pageSize = 50)
    {
        return await _context.UserMemories
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetMemoryCountAsync(string userId)
    {
        return await _context.UserMemories.CountAsync(m => m.UserId == userId);
    }

    public async Task DeleteMemoryAsync(string userId, int memoryId)
    {
        var memory = await _context.UserMemories
            .FirstOrDefaultAsync(m => m.Id == memoryId && m.UserId == userId);

        if (memory != null)
        {
            _context.UserMemories.Remove(memory);
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeleteAllMemoriesAsync(string userId)
    {
        var memories = await _context.UserMemories
            .Where(m => m.UserId == userId)
            .ToListAsync();

        _context.UserMemories.RemoveRange(memories);
        await _context.SaveChangesAsync();

        _logger.LogInformation("All memories deleted for user {UserId} ({Count} memories)", userId, memories.Count);
    }

    public async Task<string> BuildMemoryContextAsync(string userId, string? sessionId = null)
    {
        var memories = await SearchMemoriesAsync(userId, sessionId: sessionId, limit: 30);

        if (memories.Count == 0)
            return "";

        var grouped = memories.GroupBy(m => m.Category).OrderBy(g => g.Key);

        var lines = new List<string> { "## User Memory Context" };

        foreach (var group in grouped)
        {
            lines.Add($"\n### {group.Key}");
            foreach (var mem in group.OrderByDescending(m => m.UpdatedAt))
            {
                lines.Add($"- {mem.Content}");
            }
        }

        return string.Join("\n", lines);
    }

    public async Task ExtractAndStoreMemoriesAsync(string userId, string aiResponse, string? sessionId = null)
    {
        // Extract preferences and facts from AI response using simple heuristics
        var memories = ExtractMemoriesFromText(aiResponse);

        foreach (var (content, category) in memories)
        {
            await AddMemoryAsync(userId, content, category, MemoryScope.User, sessionId);
        }

        if (memories.Count > 0)
        {
            _logger.LogInformation("Extracted {Count} memories from AI response for user {UserId}",
                memories.Count, userId);
        }
    }

    private static List<(string Content, string Category)> ExtractMemoriesFromText(string text)
    {
        var memories = new List<(string, string)>();
        var lowerText = text.ToLower();

        // Tech stack detection
        var techPatterns = new Dictionary<string, string>
        {
            ["react"] = "Prefers React for frontend",
            ["next.js"] = "Prefers Next.js framework",
            ["vue"] = "Prefers Vue.js for frontend",
            ["angular"] = "Prefers Angular for frontend",
            ["typescript"] = "Uses TypeScript",
            [".net"] = "Uses .NET for backend",
            ["node.js"] = "Uses Node.js for backend",
            ["python"] = "Uses Python for backend",
            ["postgresql"] = "Uses PostgreSQL database",
            ["mongodb"] = "Uses MongoDB database",
            ["tailwind"] = "Uses Tailwind CSS for styling",
        };

        foreach (var (pattern, memory) in techPatterns)
        {
            if (lowerText.Contains(pattern) && !memories.Any(m => m.Item1 == memory))
            {
                memories.Add((memory, "tech_stack"));
            }
        }

        // Limit to avoid excessive memory creation
        return memories.Take(5).ToList();
    }
}

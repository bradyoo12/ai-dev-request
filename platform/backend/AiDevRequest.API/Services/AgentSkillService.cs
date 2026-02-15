using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AiDevRequest.API.Services;

public interface IAgentSkillService
{
    Task<List<AgentSkill>> GetUserSkillsAsync(string userId);
    Task<AgentSkill?> GetByIdAsync(Guid id);
    Task<AgentSkill> CreateAsync(AgentSkill skill);
    Task<AgentSkill?> UpdateAsync(Guid id, AgentSkill update);
    Task<bool> DeleteAsync(Guid id);
    Task<List<AgentSkill>> GetPublicSkillsAsync(string? search, string? category);
    Task<List<AgentSkill>> GetBuiltInSkillsAsync();
    Task<List<AgentSkill>> DetectRelevantSkillsAsync(string requestText);
    Task<string> ExportSkillAsync(Guid id);
    Task<AgentSkill> ImportSkillAsync(string json, string userId);
    Task<AgentSkill?> ForkSkillAsync(Guid id, string userId);
}

public class AgentSkillService : IAgentSkillService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<AgentSkillService> _logger;

    public AgentSkillService(AiDevRequestDbContext context, ILogger<AgentSkillService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<AgentSkill>> GetUserSkillsAsync(string userId)
    {
        return await _context.AgentSkills
            .Where(s => s.UserId == userId || s.IsBuiltIn)
            .OrderByDescending(s => s.UpdatedAt)
            .ToListAsync();
    }

    public async Task<AgentSkill?> GetByIdAsync(Guid id)
    {
        return await _context.AgentSkills.FindAsync(id);
    }

    public async Task<AgentSkill> CreateAsync(AgentSkill skill)
    {
        skill.Id = Guid.NewGuid();
        skill.CreatedAt = DateTime.UtcNow;
        skill.UpdatedAt = DateTime.UtcNow;

        _context.AgentSkills.Add(skill);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Agent skill created: {Name} by user {UserId}", skill.Name, skill.UserId);
        return skill;
    }

    public async Task<AgentSkill?> UpdateAsync(Guid id, AgentSkill update)
    {
        var existing = await _context.AgentSkills.FindAsync(id);
        if (existing == null) return null;

        existing.Name = update.Name;
        existing.Description = update.Description;
        existing.Category = update.Category;
        existing.InstructionContent = update.InstructionContent;
        existing.ScriptsJson = update.ScriptsJson;
        existing.ResourcesJson = update.ResourcesJson;
        existing.TagsJson = update.TagsJson;
        existing.SkillType = update.SkillType;
        existing.IsPublic = update.IsPublic;
        existing.Version = update.Version;
        existing.Author = update.Author;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Agent skill updated: {Id} - {Name}", id, existing.Name);
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var skill = await _context.AgentSkills.FindAsync(id);
        if (skill == null) return false;

        _context.AgentSkills.Remove(skill);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Agent skill deleted: {Id} - {Name}", id, skill.Name);
        return true;
    }

    public async Task<List<AgentSkill>> GetPublicSkillsAsync(string? search, string? category)
    {
        var query = _context.AgentSkills.Where(s => s.IsPublic);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(s => s.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(searchLower) ||
                (s.Description != null && s.Description.ToLower().Contains(searchLower)) ||
                (s.TagsJson != null && s.TagsJson.ToLower().Contains(searchLower)));
        }

        return await query
            .OrderByDescending(s => s.DownloadCount)
            .ToListAsync();
    }

    public async Task<List<AgentSkill>> GetBuiltInSkillsAsync()
    {
        return await _context.AgentSkills
            .Where(s => s.IsBuiltIn)
            .OrderBy(s => s.Name)
            .ToListAsync();
    }

    public async Task<List<AgentSkill>> DetectRelevantSkillsAsync(string requestText)
    {
        if (string.IsNullOrWhiteSpace(requestText))
            return [];

        var textLower = requestText.ToLower();

        var allSkills = await _context.AgentSkills
            .Where(s => s.IsBuiltIn || s.IsPublic)
            .ToListAsync();

        var matched = new List<AgentSkill>();

        foreach (var skill in allSkills)
        {
            if (!string.IsNullOrWhiteSpace(skill.Category) &&
                textLower.Contains(skill.Category.ToLower()))
            {
                matched.Add(skill);
                continue;
            }

            if (!string.IsNullOrWhiteSpace(skill.TagsJson))
            {
                try
                {
                    var tags = JsonSerializer.Deserialize<List<string>>(skill.TagsJson);
                    if (tags != null && tags.Any(tag => textLower.Contains(tag.ToLower())))
                    {
                        matched.Add(skill);
                        continue;
                    }
                }
                catch
                {
                    // Ignore malformed JSON
                }
            }

            if (textLower.Contains(skill.Name.ToLower()) ||
                (!string.IsNullOrWhiteSpace(skill.Description) &&
                 textLower.Contains(skill.Description.ToLower())))
            {
                matched.Add(skill);
            }
        }

        return matched;
    }

    public async Task<string> ExportSkillAsync(Guid id)
    {
        var skill = await _context.AgentSkills.FindAsync(id);
        if (skill == null) return "{}";

        var exportData = new
        {
            skill.Name,
            skill.Description,
            skill.Category,
            skill.InstructionContent,
            skill.ScriptsJson,
            skill.ResourcesJson,
            skill.TagsJson,
            skill.Version,
            skill.Author,
        };

        return JsonSerializer.Serialize(exportData, new JsonSerializerOptions { WriteIndented = true });
    }

    public async Task<AgentSkill> ImportSkillAsync(string json, string userId)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var skill = new AgentSkill
        {
            UserId = userId,
            Name = root.TryGetProperty("name", out var name) ? name.GetString() ?? "Imported Skill" : "Imported Skill",
            Description = root.TryGetProperty("description", out var desc) ? desc.GetString() : null,
            Category = root.TryGetProperty("category", out var cat) ? cat.GetString() : null,
            InstructionContent = root.TryGetProperty("instructionContent", out var instr) ? instr.GetString() : null,
            ScriptsJson = root.TryGetProperty("scriptsJson", out var scripts) ? scripts.GetString() : null,
            ResourcesJson = root.TryGetProperty("resourcesJson", out var res) ? res.GetString() : null,
            TagsJson = root.TryGetProperty("tagsJson", out var tags) ? tags.GetString() : null,
            Version = root.TryGetProperty("version", out var ver) ? ver.GetString() : null,
            Author = root.TryGetProperty("author", out var author) ? author.GetString() : null,
            IsBuiltIn = false,
            IsPublic = false,
        };

        return await CreateAsync(skill);
    }

    public async Task<AgentSkill?> ForkSkillAsync(Guid id, string userId)
    {
        var source = await _context.AgentSkills.FindAsync(id);
        if (source == null) return null;

        source.DownloadCount++;
        await _context.SaveChangesAsync();

        var forked = new AgentSkill
        {
            UserId = userId,
            Name = source.Name + " (fork)",
            Description = source.Description,
            Category = source.Category,
            InstructionContent = source.InstructionContent,
            ScriptsJson = source.ScriptsJson,
            ResourcesJson = source.ResourcesJson,
            TagsJson = source.TagsJson,
            Version = source.Version,
            Author = source.Author,
            IsBuiltIn = false,
            IsPublic = false,
        };

        return await CreateAsync(forked);
    }
}

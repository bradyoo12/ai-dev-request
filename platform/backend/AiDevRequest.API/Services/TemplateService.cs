using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ITemplateService
{
    Task<List<ProjectTemplate>> GetTemplatesAsync(string? category = null, string? framework = null);
    Task<ProjectTemplate?> GetTemplateAsync(Guid id);
    Task IncrementUsageAsync(Guid id);
}

public class TemplateService : ITemplateService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<TemplateService> _logger;

    public TemplateService(AiDevRequestDbContext context, ILogger<TemplateService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<ProjectTemplate>> GetTemplatesAsync(string? category = null, string? framework = null)
    {
        var query = _context.ProjectTemplates
            .Where(t => t.IsPublished)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(t => t.Category == category);

        if (!string.IsNullOrEmpty(framework))
            query = query.Where(t => t.Framework == framework);

        return await query
            .OrderByDescending(t => t.UsageCount)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<ProjectTemplate?> GetTemplateAsync(Guid id)
    {
        return await _context.ProjectTemplates.FindAsync(id);
    }

    public async Task IncrementUsageAsync(Guid id)
    {
        var template = await _context.ProjectTemplates.FindAsync(id);
        if (template != null)
        {
            template.UsageCount++;
            await _context.SaveChangesAsync();
        }
    }
}

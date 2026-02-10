using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ITemplateMarketplaceService
{
    Task<MarketplaceBrowseResult> BrowseTemplatesAsync(string? category, string? techStack, string? search, string sortBy);
    Task<MarketplaceTemplate?> GetTemplateAsync(Guid id);
    Task<MarketplaceTemplate> SubmitTemplateAsync(MarketplaceTemplate template);
    Task<MarketplaceTemplate?> UpdateTemplateAsync(Guid id, MarketplaceTemplate template);
    Task<MarketplaceImportResult> ImportTemplateAsync(Guid templateId, int userId);
    Task<MarketplaceRateResult> RateTemplateAsync(Guid templateId, int userId, int rating);
    Task<List<MarketplaceCategoryCount>> GetCategoriesAsync();
    Task<List<MarketplaceTemplate>> GetPopularAsync(int limit);
}

public class TemplateMarketplaceService : ITemplateMarketplaceService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<TemplateMarketplaceService> _logger;

    public TemplateMarketplaceService(AiDevRequestDbContext context, ILogger<TemplateMarketplaceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<MarketplaceBrowseResult> BrowseTemplatesAsync(string? category, string? techStack, string? search, string sortBy)
    {
        var query = _context.MarketplaceTemplates
            .Where(t => t.Status == "published");

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(t => t.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(techStack))
        {
            query = query.Where(t => t.TechStack.Contains(techStack));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(searchLower) ||
                t.Description.ToLower().Contains(searchLower) ||
                (t.Tags != null && t.Tags.ToLower().Contains(searchLower)));
        }

        query = sortBy switch
        {
            "newest" => query.OrderByDescending(t => t.CreatedAt),
            "rating" => query.OrderByDescending(t => t.Rating).ThenByDescending(t => t.RatingCount),
            "popular" => query.OrderByDescending(t => t.DownloadCount),
            _ => query.OrderByDescending(t => t.DownloadCount),
        };

        var templates = await query.ToListAsync();

        return new MarketplaceBrowseResult
        {
            Templates = templates,
            TotalCount = templates.Count,
        };
    }

    public async Task<MarketplaceTemplate?> GetTemplateAsync(Guid id)
    {
        return await _context.MarketplaceTemplates.FindAsync(id);
    }

    public async Task<MarketplaceTemplate> SubmitTemplateAsync(MarketplaceTemplate template)
    {
        template.Id = Guid.NewGuid();
        template.CreatedAt = DateTime.UtcNow;
        template.Status = "draft";
        template.Rating = 0;
        template.RatingCount = 0;
        template.DownloadCount = 0;

        _context.MarketplaceTemplates.Add(template);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Template submitted: {Name} by author {AuthorId}", template.Name, template.AuthorId);
        return template;
    }

    public async Task<MarketplaceTemplate?> UpdateTemplateAsync(Guid id, MarketplaceTemplate update)
    {
        var existing = await _context.MarketplaceTemplates.FindAsync(id);
        if (existing == null) return null;

        existing.Name = update.Name;
        existing.Description = update.Description;
        existing.Category = update.Category;
        existing.TechStack = update.TechStack;
        existing.Tags = update.Tags;
        existing.TemplateData = update.TemplateData;
        existing.PreviewImageUrl = update.PreviewImageUrl;
        existing.Status = update.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Template updated: {Id} - {Name}", id, existing.Name);
        return existing;
    }

    public async Task<MarketplaceImportResult> ImportTemplateAsync(Guid templateId, int userId)
    {
        var template = await _context.MarketplaceTemplates.FindAsync(templateId);
        if (template == null)
        {
            return new MarketplaceImportResult { Success = false, Error = "Template not found" };
        }

        // Increment download count
        template.DownloadCount++;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Template imported: {Id} by user {UserId}", templateId, userId);

        return new MarketplaceImportResult
        {
            Success = true,
            TemplateId = templateId,
            TemplateName = template.Name,
            TemplateData = template.TemplateData,
        };
    }

    public async Task<MarketplaceRateResult> RateTemplateAsync(Guid templateId, int userId, int rating)
    {
        if (rating < 1 || rating > 5)
        {
            return new MarketplaceRateResult { Success = false, Error = "Rating must be between 1 and 5" };
        }

        var template = await _context.MarketplaceTemplates.FindAsync(templateId);
        if (template == null)
        {
            return new MarketplaceRateResult { Success = false, Error = "Template not found" };
        }

        // Recalculate average rating (weighted average with new rating)
        var totalRatingSum = template.Rating * template.RatingCount;
        template.RatingCount++;
        template.Rating = Math.Round((totalRatingSum + rating) / template.RatingCount, 2);
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Template rated: {Id} with {Rating} by user {UserId}", templateId, rating, userId);

        return new MarketplaceRateResult
        {
            Success = true,
            NewRating = template.Rating,
            NewRatingCount = template.RatingCount,
        };
    }

    public async Task<List<MarketplaceCategoryCount>> GetCategoriesAsync()
    {
        var categories = await _context.MarketplaceTemplates
            .Where(t => t.Status == "published")
            .GroupBy(t => t.Category)
            .Select(g => new MarketplaceCategoryCount
            {
                Category = g.Key,
                Count = g.Count(),
            })
            .OrderByDescending(c => c.Count)
            .ToListAsync();

        return categories;
    }

    public async Task<List<MarketplaceTemplate>> GetPopularAsync(int limit)
    {
        if (limit <= 0) limit = 10;
        if (limit > 50) limit = 50;

        return await _context.MarketplaceTemplates
            .Where(t => t.Status == "published")
            .OrderByDescending(t => t.DownloadCount)
            .Take(limit)
            .ToListAsync();
    }
}

// === Supporting Types ===

public class MarketplaceBrowseResult
{
    public List<MarketplaceTemplate> Templates { get; set; } = [];
    public int TotalCount { get; set; }
}

public class MarketplaceImportResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public Guid? TemplateId { get; set; }
    public string? TemplateName { get; set; }
    public string? TemplateData { get; set; }
}

public class MarketplaceRateResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public double NewRating { get; set; }
    public int NewRatingCount { get; set; }
}

public class MarketplaceCategoryCount
{
    public string Category { get; set; } = "";
    public int Count { get; set; }
}

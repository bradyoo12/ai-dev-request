using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IPreviewDeploymentService
{
    Task<PreviewDeployment> DeployPreviewAsync(Guid devRequestId, string userId);
    Task<PreviewDeployment?> GetPreviewStatusAsync(Guid devRequestId);
    Task<string?> GetPreviewUrlAsync(Guid devRequestId);
    Task<PreviewDeployment> ExpirePreviewAsync(Guid devRequestId);
    Task<List<PreviewDeployment>> ListPreviewsAsync(Guid devRequestId);
}

public class PreviewDeploymentService : IPreviewDeploymentService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<PreviewDeploymentService> _logger;

    public PreviewDeploymentService(
        AiDevRequestDbContext context,
        ILogger<PreviewDeploymentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PreviewDeployment> DeployPreviewAsync(Guid devRequestId, string userId)
    {
        var preview = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = userId,
            Status = PreviewDeploymentStatus.Deploying,
        };

        _context.PreviewDeployments.Add(preview);
        await _context.SaveChangesAsync();

        // Simulate edge deployment (sub-5-second)
        var slug = preview.Id.ToString()[..8];
        var previewUrl = $"https://{slug}-preview.azurestaticapps.net";

        preview.Status = PreviewDeploymentStatus.Deployed;
        preview.PreviewUrl = previewUrl;
        preview.DeployedAt = DateTime.UtcNow;
        preview.ExpiresAt = DateTime.UtcNow.AddHours(24);
        preview.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Preview deployed for request {DevRequestId}: {PreviewUrl}",
            devRequestId, previewUrl);

        return preview;
    }

    public async Task<PreviewDeployment?> GetPreviewStatusAsync(Guid devRequestId)
    {
        return await _context.PreviewDeployments
            .Where(p => p.DevRequestId == devRequestId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<string?> GetPreviewUrlAsync(Guid devRequestId)
    {
        var preview = await _context.PreviewDeployments
            .Where(p => p.DevRequestId == devRequestId && p.Status == PreviewDeploymentStatus.Deployed)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        return preview?.PreviewUrl;
    }

    public async Task<PreviewDeployment> ExpirePreviewAsync(Guid devRequestId)
    {
        var preview = await _context.PreviewDeployments
            .Where(p => p.DevRequestId == devRequestId && p.Status == PreviewDeploymentStatus.Deployed)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No active preview found for this project");

        preview.Status = PreviewDeploymentStatus.Expired;
        preview.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Preview expired for request {DevRequestId}: {PreviewUrl}",
            devRequestId, preview.PreviewUrl);

        return preview;
    }

    public async Task<List<PreviewDeployment>> ListPreviewsAsync(Guid devRequestId)
    {
        return await _context.PreviewDeployments
            .Where(p => p.DevRequestId == devRequestId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }
}

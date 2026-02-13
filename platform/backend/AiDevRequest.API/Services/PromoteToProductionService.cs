using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IPromoteToProductionService
{
    Task<Deployment> PromotePreviewAsync(Guid previewId);
    Task<bool> CanPromoteAsync(Guid previewId);
    Task<(bool isValid, string? errorMessage)> ValidatePreviewAsync(Guid previewId);
}

public class PromoteToProductionService : IPromoteToProductionService
{
    private readonly AiDevRequestDbContext _context;
    private readonly IDeploymentService _deploymentService;
    private readonly ILogger<PromoteToProductionService> _logger;

    public PromoteToProductionService(
        AiDevRequestDbContext context,
        IDeploymentService deploymentService,
        ILogger<PromoteToProductionService> logger)
    {
        _context = context;
        _deploymentService = deploymentService;
        _logger = logger;
    }

    public async Task<Deployment> PromotePreviewAsync(Guid previewId)
    {
        var preview = await _context.PreviewDeployments.FindAsync(previewId)
            ?? throw new InvalidOperationException($"Preview {previewId} not found");

        // Validate preview status
        var (isValid, errorMessage) = await ValidatePreviewAsync(previewId);
        if (!isValid)
        {
            throw new InvalidOperationException(errorMessage ?? "Preview validation failed");
        }

        _logger.LogInformation("Starting promotion of preview {PreviewId} to production", previewId);

        // Get the associated DevRequest
        var devRequest = await _context.DevRequests.FindAsync(preview.DevRequestId)
            ?? throw new InvalidOperationException($"DevRequest {preview.DevRequestId} not found");

        // Determine project type from framework or category
        var projectType = devRequest.Framework ?? devRequest.Category.ToString().ToLower();

        // Create production deployment entity
        var deployment = await _deploymentService.CreateDeploymentAsync(
            preview.DevRequestId,
            preview.UserId,
            $"prod-{preview.DevRequestId.ToString()[..8]}",
            projectType,
            devRequest.ProjectPath
        );

        try
        {
            // Check if preview has a real container image (not simulated)
            // Pattern: preview-{preview.Id}
            var containerImageTag = $"preview-{preview.Id}";
            var hasRealImage = !string.IsNullOrEmpty(preview.PreviewUrl) &&
                               preview.Status == PreviewDeploymentStatus.Deployed;

            // For now, all previews are simulated, so fall back to fresh build
            // In the future, when we have real container images, we'll use DeployExistingImageAsync
            if (hasRealImage && _deploymentService is AzureDeploymentService azureService)
            {
                _logger.LogInformation("Promoting preview image: {Tag}", containerImageTag);

                // Use the DeployExistingImageAsync method when available
                // For now, fall back to regular deploy
                deployment = await _deploymentService.DeployAsync(deployment.Id);
            }
            else
            {
                _logger.LogInformation("Preview has no real container image. Falling back to fresh build.");
                deployment = await _deploymentService.DeployAsync(deployment.Id);
            }

            _logger.LogInformation(
                "Successfully promoted preview {PreviewId} to production deployment {DeploymentId}",
                previewId, deployment.Id);

            return deployment;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to promote preview {PreviewId}", previewId);
            throw;
        }
    }

    public async Task<bool> CanPromoteAsync(Guid previewId)
    {
        var (isValid, _) = await ValidatePreviewAsync(previewId);
        return isValid;
    }

    public async Task<(bool isValid, string? errorMessage)> ValidatePreviewAsync(Guid previewId)
    {
        var preview = await _context.PreviewDeployments.FindAsync(previewId);

        if (preview == null)
        {
            return (false, $"Preview {previewId} not found");
        }

        // Check if preview is deployed
        if (preview.Status != PreviewDeploymentStatus.Deployed)
        {
            return (false, $"Preview status is {preview.Status}, must be Deployed to promote");
        }

        // Check if preview is expired
        if (preview.ExpiresAt.HasValue && preview.ExpiresAt.Value < DateTime.UtcNow)
        {
            return (false, "Preview has expired and cannot be promoted");
        }

        return (true, null);
    }
}

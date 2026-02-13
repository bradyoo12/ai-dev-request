using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Azure;
using Azure.Core;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.ContainerInstance;
using Azure.ResourceManager.ContainerInstance.Models;
using Azure.ResourceManager.Resources;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IPreviewDeploymentService
{
    Task<PreviewDeployment> DeployPreviewAsync(Guid devRequestId, string userId);
    Task<PreviewDeployment?> GetPreviewStatusAsync(Guid devRequestId);
    Task<string?> GetPreviewUrlAsync(Guid devRequestId);
    Task<PreviewDeployment> ExpirePreviewAsync(Guid devRequestId);
    Task<List<PreviewDeployment>> ListPreviewsAsync(Guid devRequestId);
    Task<string> GetContainerLogsAsync(Guid devRequestId);
}

public class PreviewDeploymentService : IPreviewDeploymentService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<PreviewDeploymentService> _logger;
    private readonly IConfiguration _configuration;
    private readonly ArmClient _armClient;
    private readonly string _subscriptionId;
    private readonly string _resourceGroupName;
    private readonly string _region;
    private readonly string _acrServer;
    private readonly string _acrName;
    private readonly int _defaultPort;
    private readonly double _defaultCpu;
    private readonly double _defaultMemoryGb;
    private readonly int _retentionHours;

    public PreviewDeploymentService(
        AiDevRequestDbContext context,
        ILogger<PreviewDeploymentService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;

        // Initialize Azure SDK client
        _armClient = new ArmClient(new DefaultAzureCredential());

        // Load Azure configuration
        _subscriptionId = _configuration["Azure:SubscriptionId"] ?? "";
        _resourceGroupName = _configuration["Azure:ResourceGroupName"] ?? "rg-ai-dev-request-previews";
        _region = _configuration["Azure:Region"] ?? "eastus";
        _acrServer = _configuration["Azure:ContainerRegistry:Server"] ?? "aidevreqacr.azurecr.io";
        _acrName = _configuration["Azure:ContainerRegistry:Name"] ?? "aidevreqacr";
        _defaultPort = _configuration.GetValue<int>("Azure:ContainerInstances:DefaultPort", 3000);
        _defaultCpu = _configuration.GetValue<double>("Azure:ContainerInstances:DefaultCpu", 1.0);
        _defaultMemoryGb = _configuration.GetValue<double>("Azure:ContainerInstances:DefaultMemoryGb", 1.5);
        _retentionHours = _configuration.GetValue<int>("Azure:ContainerInstances:RetentionHours", 24);
    }

    public async Task<PreviewDeployment> DeployPreviewAsync(Guid devRequestId, string userId)
    {
        var preview = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = userId,
            Status = PreviewDeploymentStatus.Deploying,
            Region = _region,
            ResourceGroupName = _resourceGroupName,
            Port = _defaultPort
        };

        _context.PreviewDeployments.Add(preview);
        await _context.SaveChangesAsync();

        try
        {
            // Step 1: Build and push Docker image
            var imageName = await BuildAndPushDockerImageAsync(devRequestId);
            preview.ImageUri = $"{_acrServer}/{imageName}";

            // Step 2: Create container group
            var dnsLabel = $"preview-{preview.Id.ToString()[..8]}";
            var containerGroupName = $"aci-{dnsLabel}";
            var containerName = "app";

            preview.ContainerGroupName = containerGroupName;
            preview.ContainerName = containerName;
            await _context.SaveChangesAsync();

            var fqdn = await CreateContainerGroupAsync(imageName, dnsLabel, containerGroupName, containerName);
            preview.Fqdn = fqdn;

            // Step 3: Generate preview URL
            var previewUrl = $"http://{fqdn}:{_defaultPort}";
            preview.PreviewUrl = previewUrl;
            preview.Status = PreviewDeploymentStatus.Deployed;
            preview.DeployedAt = DateTime.UtcNow;
            preview.ExpiresAt = DateTime.UtcNow.AddHours(_retentionHours);
            preview.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Preview deployed for request {DevRequestId}: {PreviewUrl}",
                devRequestId, previewUrl);

            return preview;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deploy preview for request {DevRequestId}", devRequestId);
            preview.Status = PreviewDeploymentStatus.Failed;
            preview.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            throw;
        }
    }

    private async Task<string> BuildAndPushDockerImageAsync(Guid devRequestId)
    {
        // TODO: Implement Docker image build and push
        // For now, simulate the process
        var imageName = $"preview-{devRequestId.ToString()[..8]}:latest";

        _logger.LogInformation("Building Docker image: {ImageName}", imageName);

        // In production, this would:
        // 1. Read project files from DevRequest
        // 2. Detect project type (React, .NET, etc.)
        // 3. Generate appropriate Dockerfile
        // 4. Build image using Docker CLI or Azure Container Registry tasks
        // 5. Push to ACR

        await Task.Delay(100); // Simulate build time

        return imageName;
    }

    private async Task<string> CreateContainerGroupAsync(
        string imageName,
        string dnsLabel,
        string containerGroupName,
        string containerName)
    {
        _logger.LogInformation("Creating container group: {ContainerGroupName}", containerGroupName);

        if (string.IsNullOrEmpty(_subscriptionId))
        {
            throw new InvalidOperationException("Azure subscription ID is not configured");
        }

        try
        {
            var subscription = _armClient.GetSubscriptionResource(new ResourceIdentifier($"/subscriptions/{_subscriptionId}"));
            var resourceGroup = await subscription.GetResourceGroups().GetAsync(_resourceGroupName);

            var containerGroupData = new ContainerGroupData(
                new AzureLocation(_region),
                new[]
                {
                    new ContainerInstanceContainer(
                        containerName,
                        $"{_acrServer}/{imageName}",
                        new ContainerResourceRequirements(
                            new ContainerResourceRequestsContent(_defaultMemoryGb, _defaultCpu)))
                    {
                        Ports =
                        {
                            new ContainerPort(_defaultPort)
                        }
                    }
                },
                ContainerInstanceOperatingSystemType.Linux)
            {
                IPAddress = new ContainerGroupIPAddress(
                    new[]
                    {
                        new ContainerGroupPort(_defaultPort)
                    },
                    ContainerGroupIPAddressType.Public)
                {
                    DnsNameLabel = dnsLabel
                },
                RestartPolicy = ContainerGroupRestartPolicy.Never,
                ImageRegistryCredentials =
                {
                    new ContainerGroupImageRegistryCredential(_acrServer)
                    {
                        Username = _acrName,
                        // In production, use managed identity or Azure Key Vault
                        Password = _configuration["Azure:ContainerRegistry:Password"]
                    }
                }
            };

            var containerGroups = resourceGroup.Value.GetContainerGroups();
            var operation = await containerGroups.CreateOrUpdateAsync(
                WaitUntil.Completed,
                containerGroupName,
                containerGroupData);

            var containerGroup = operation.Value;
            var fqdn = containerGroup.Data.IPAddress?.Fqdn ?? "";

            _logger.LogInformation("Container group created with FQDN: {Fqdn}", fqdn);

            return fqdn;
        }
        catch (RequestFailedException ex)
        {
            _logger.LogError(ex, "Azure API request failed while creating container group");
            throw new InvalidOperationException($"Failed to create Azure Container Instance: {ex.Message}", ex);
        }
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

        try
        {
            // Delete container group from Azure
            if (!string.IsNullOrEmpty(preview.ContainerGroupName))
            {
                await DeleteContainerGroupAsync(preview.ContainerGroupName);
            }

            preview.Status = PreviewDeploymentStatus.Expired;
            preview.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Preview expired for request {DevRequestId}: {PreviewUrl}",
                devRequestId, preview.PreviewUrl);

            return preview;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to expire preview for request {DevRequestId}", devRequestId);
            throw;
        }
    }

    private async Task DeleteContainerGroupAsync(string containerGroupName)
    {
        _logger.LogInformation("Deleting container group: {ContainerGroupName}", containerGroupName);

        if (string.IsNullOrEmpty(_subscriptionId))
        {
            _logger.LogWarning("Azure subscription ID not configured, skipping container group deletion");
            return;
        }

        try
        {
            var subscription = _armClient.GetSubscriptionResource(new ResourceIdentifier($"/subscriptions/{_subscriptionId}"));
            var resourceGroup = await subscription.GetResourceGroups().GetAsync(_resourceGroupName);
            var containerGroups = resourceGroup.Value.GetContainerGroups();

            var containerGroup = await containerGroups.GetAsync(containerGroupName);
            await containerGroup.Value.DeleteAsync(WaitUntil.Completed);

            _logger.LogInformation("Container group deleted: {ContainerGroupName}", containerGroupName);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogWarning("Container group not found: {ContainerGroupName}", containerGroupName);
        }
        catch (RequestFailedException ex)
        {
            _logger.LogError(ex, "Azure API request failed while deleting container group");
            throw new InvalidOperationException($"Failed to delete Azure Container Instance: {ex.Message}", ex);
        }
    }

    public async Task<List<PreviewDeployment>> ListPreviewsAsync(Guid devRequestId)
    {
        return await _context.PreviewDeployments
            .Where(p => p.DevRequestId == devRequestId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<string> GetContainerLogsAsync(Guid devRequestId)
    {
        var preview = await _context.PreviewDeployments
            .Where(p => p.DevRequestId == devRequestId && p.Status == PreviewDeploymentStatus.Deployed)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No active preview found for this project");

        if (string.IsNullOrEmpty(preview.ContainerGroupName) || string.IsNullOrEmpty(preview.ContainerName))
        {
            throw new InvalidOperationException("Container information not available");
        }

        if (string.IsNullOrEmpty(_subscriptionId))
        {
            throw new InvalidOperationException("Azure subscription ID is not configured");
        }

        try
        {
            // TODO: Implement actual container logs retrieval using Azure SDK
            // The Azure Container Instance SDK requires using the REST API directly for logs
            // For now, return a placeholder that can be implemented later

            _logger.LogInformation("Retrieving logs for container {ContainerGroupName}/{ContainerName}",
                preview.ContainerGroupName, preview.ContainerName);

            // In production, this would use:
            // GET https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContainerInstance/containerGroups/{containerGroupName}/containers/{containerName}/logs?api-version=2021-09-01

            return $"Container logs for {preview.ContainerName} in {preview.ContainerGroupName}\n" +
                   $"Subscription: {_subscriptionId}\n" +
                   $"Resource Group: {_resourceGroupName}\n" +
                   $"Region: {_region}\n" +
                   $"TODO: Implement actual log retrieval via Azure Management REST API";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve container logs for {ContainerGroupName}/{ContainerName}",
                preview.ContainerGroupName, preview.ContainerName);
            throw new InvalidOperationException($"Failed to retrieve container logs: {ex.Message}", ex);
        }
    }
}

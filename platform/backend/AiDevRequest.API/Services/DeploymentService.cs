using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.AppContainers;
using Azure.ResourceManager.AppContainers.Models;
using Azure.ResourceManager.Resources;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IDeploymentService
{
    Task<Deployment> CreateDeploymentAsync(Guid devRequestId, string userId, string siteName, string projectType, string? projectPath);
    Task<Deployment?> GetDeploymentAsync(Guid deploymentId);
    Task<List<Deployment>> GetUserDeploymentsAsync(string userId);
    Task<Deployment> DeployAsync(Guid deploymentId);
    Task<Deployment> DeployExistingImageAsync(Guid deploymentId, string containerImageTag);
    Task<Deployment> RedeployAsync(Guid deploymentId);
    Task DeleteDeploymentAsync(Guid deploymentId);
    Task<List<DeploymentLogEntry>> GetLogsAsync(Guid deploymentId);
}

public class DeploymentLogEntry
{
    public DateTime Timestamp { get; set; }
    public string Message { get; set; } = "";
    public string Level { get; set; } = "info";
}

public class AzureDeploymentService : IDeploymentService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AzureDeploymentService> _logger;

    public AzureDeploymentService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<AzureDeploymentService> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<Deployment> CreateDeploymentAsync(Guid devRequestId, string userId, string siteName, string projectType, string? projectPath)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();

        var sanitizedName = SanitizeSiteName(siteName);
        var resourceGroupName = $"rg-{DateTime.UtcNow:yyyyMMdd}-{sanitizedName}";

        var deployment = new Deployment
        {
            DevRequestId = devRequestId,
            UserId = userId,
            SiteName = sanitizedName,
            ResourceGroupName = resourceGroupName,
            ContainerAppName = $"ca-{sanitizedName}",
            ProjectType = projectType,
            Region = _configuration["Azure:Region"] ?? "koreacentral",
            Status = DeploymentStatus.Pending
        };

        context.Deployments.Add(deployment);
        await context.SaveChangesAsync();

        _logger.LogInformation("Deployment created: {DeploymentId} for request {DevRequestId}", deployment.Id, devRequestId);

        return deployment;
    }

    public async Task<Deployment?> GetDeploymentAsync(Guid deploymentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();
        return await context.Deployments.FindAsync(deploymentId);
    }

    public async Task<List<Deployment>> GetUserDeploymentsAsync(string userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();

        return await context.Deployments
            .Where(d => d.UserId == userId && d.Status != DeploymentStatus.Deleted)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<Deployment> DeployAsync(Guid deploymentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();
        var deployment = await context.Deployments.FindAsync(deploymentId)
            ?? throw new InvalidOperationException($"Deployment {deploymentId} not found");

        var logs = new List<DeploymentLogEntry>();

        try
        {
            // Step 1: Provisioning resource group
            deployment.Status = DeploymentStatus.Provisioning;
            deployment.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
            AddLog(logs, "Creating resource group: " + deployment.ResourceGroupName);

            var subscriptionId = _configuration["Azure:SubscriptionId"];
            if (string.IsNullOrEmpty(subscriptionId))
            {
                // Simulation mode when Azure is not configured
                _logger.LogWarning("Azure SubscriptionId not configured. Running in simulation mode.");
                return await SimulateDeploymentAsync(context, deployment, logs);
            }

            var credential = new DefaultAzureCredential();
            var armClient = new ArmClient(credential);
            var subscription = armClient.GetSubscriptionResource(new Azure.Core.ResourceIdentifier($"/subscriptions/{subscriptionId}"));

            // Create resource group
            var rgData = new Azure.ResourceManager.Resources.ResourceGroupData(new Azure.Core.AzureLocation(deployment.Region));
            rgData.Tags.Add("project", deployment.DevRequestId.ToString());
            rgData.Tags.Add("user", deployment.UserId);
            rgData.Tags.Add("created-by", "ai-dev-request");
            var rgOperation = await subscription.GetResourceGroups().CreateOrUpdateAsync(Azure.WaitUntil.Completed, deployment.ResourceGroupName!, rgData);
            var resourceGroup = rgOperation.Value;
            AddLog(logs, "Resource group created successfully");

            // Step 2: Building
            deployment.Status = DeploymentStatus.Building;
            deployment.UpdatedAt = DateTime.UtcNow;
            deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
            await context.SaveChangesAsync();
            AddLog(logs, "Building Docker image...");

            // Step 3: Deploying
            deployment.Status = DeploymentStatus.Deploying;
            deployment.UpdatedAt = DateTime.UtcNow;
            deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
            await context.SaveChangesAsync();
            AddLog(logs, "Creating Container App...");

            // Create Container Apps managed environment
            var envName = $"env-{deployment.SiteName}";
            var envData = new ContainerAppManagedEnvironmentData(new Azure.Core.AzureLocation(deployment.Region));
            var envOperation = await resourceGroup.GetContainerAppManagedEnvironments()
                .CreateOrUpdateAsync(Azure.WaitUntil.Completed, envName, envData);
            var environment = envOperation.Value;
            AddLog(logs, "Container Apps environment created");

            // Create Container App with a default nginx image for now
            var containerAppName = deployment.ContainerAppName!;
            var containerImage = GetContainerImage(deployment.ProjectType);
            var containerAppData = new ContainerAppData(new Azure.Core.AzureLocation(deployment.Region))
            {
                ManagedEnvironmentId = environment.Id,
                Configuration = new ContainerAppConfiguration
                {
                    Ingress = new ContainerAppIngressConfiguration
                    {
                        External = true,
                        TargetPort = GetTargetPort(deployment.ProjectType),
                        Transport = ContainerAppIngressTransportMethod.Auto
                    }
                },
                Template = new ContainerAppTemplate()
            };

            containerAppData.Template.Containers.Add(new ContainerAppContainer
            {
                Name = containerAppName,
                Image = containerImage,
                Resources = new AppContainerResources
                {
                    Cpu = 0.25,
                    Memory = "0.5Gi"
                }
            });

            var appOperation = await resourceGroup.GetContainerApps()
                .CreateOrUpdateAsync(Azure.WaitUntil.Completed, containerAppName, containerAppData);
            var containerApp = appOperation.Value;

            // Get the FQDN
            var fqdn = containerApp.Data.Configuration?.Ingress?.Fqdn;
            var previewUrl = fqdn != null ? $"https://{fqdn}" : null;

            AddLog(logs, $"Container App created. URL: {previewUrl}");
            AddLog(logs, "Deployment complete");

            // Step 4: Running
            deployment.Status = DeploymentStatus.Running;
            deployment.PreviewUrl = previewUrl;
            deployment.ContainerImageTag = containerImage;
            deployment.DeployedAt = DateTime.UtcNow;
            deployment.UpdatedAt = DateTime.UtcNow;
            deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
            await context.SaveChangesAsync();

            _logger.LogInformation("Deployment {DeploymentId} completed. URL: {PreviewUrl}", deploymentId, previewUrl);
            return deployment;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Deployment {DeploymentId} failed", deploymentId);
            AddLog(logs, $"Deployment failed: {ex.Message}", "error");

            deployment.Status = DeploymentStatus.Failed;
            deployment.UpdatedAt = DateTime.UtcNow;
            deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
            await context.SaveChangesAsync();

            return deployment;
        }
    }

    public async Task<Deployment> DeployExistingImageAsync(Guid deploymentId, string containerImageTag)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();
        var deployment = await context.Deployments.FindAsync(deploymentId)
            ?? throw new InvalidOperationException($"Deployment {deploymentId} not found");

        var logs = new List<DeploymentLogEntry>();

        try
        {
            _logger.LogInformation("Promoting preview image: {Tag}", containerImageTag);
            AddLog(logs, $"Promoting preview image: {containerImageTag}");
            AddLog(logs, "Skipping build phase (reusing tested image)");

            deployment.Status = DeploymentStatus.Deploying;
            deployment.UpdatedAt = DateTime.UtcNow;
            deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
            await context.SaveChangesAsync();

            var subscriptionId = _configuration["Azure:SubscriptionId"];
            if (string.IsNullOrEmpty(subscriptionId))
            {
                // Simulation mode when Azure is not configured
                _logger.LogWarning("Azure SubscriptionId not configured. Running in simulation mode.");
                return await SimulatePromotionAsync(context, deployment, logs, containerImageTag);
            }

            var credential = new DefaultAzureCredential();
            var armClient = new ArmClient(credential);
            var subscription = armClient.GetSubscriptionResource(new Azure.Core.ResourceIdentifier($"/subscriptions/{subscriptionId}"));

            // Get or create resource group
            AddLog(logs, "Getting resource group: " + deployment.ResourceGroupName);
            var rgId = ResourceGroupResource.CreateResourceIdentifier(subscriptionId, deployment.ResourceGroupName!);
            var resourceGroup = armClient.GetResourceGroupResource(rgId);

            try
            {
                await resourceGroup.GetAsync();
                AddLog(logs, "Resource group found");
            }
            catch
            {
                // Create resource group if it doesn't exist
                var rgData = new Azure.ResourceManager.Resources.ResourceGroupData(new Azure.Core.AzureLocation(deployment.Region));
                rgData.Tags.Add("project", deployment.DevRequestId.ToString());
                rgData.Tags.Add("user", deployment.UserId);
                rgData.Tags.Add("created-by", "ai-dev-request");
                var rgOperation = await subscription.GetResourceGroups().CreateOrUpdateAsync(Azure.WaitUntil.Completed, deployment.ResourceGroupName!, rgData);
                resourceGroup = rgOperation.Value;
                AddLog(logs, "Resource group created");
            }

            deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
            await context.SaveChangesAsync();
            AddLog(logs, "Creating Container App with existing image...");

            // Create Container Apps managed environment
            var envName = $"env-{deployment.SiteName}";
            var envData = new ContainerAppManagedEnvironmentData(new Azure.Core.AzureLocation(deployment.Region));
            var envOperation = await resourceGroup.GetContainerAppManagedEnvironments()
                .CreateOrUpdateAsync(Azure.WaitUntil.Completed, envName, envData);
            var environment = envOperation.Value;
            AddLog(logs, "Container Apps environment created");

            // Create Container App with the existing container image
            var containerAppName = deployment.ContainerAppName!;
            var containerAppData = new ContainerAppData(new Azure.Core.AzureLocation(deployment.Region))
            {
                ManagedEnvironmentId = environment.Id,
                Configuration = new ContainerAppConfiguration
                {
                    Ingress = new ContainerAppIngressConfiguration
                    {
                        External = true,
                        TargetPort = GetTargetPort(deployment.ProjectType),
                        Transport = ContainerAppIngressTransportMethod.Auto
                    }
                },
                Template = new ContainerAppTemplate()
            };

            containerAppData.Template.Containers.Add(new ContainerAppContainer
            {
                Name = containerAppName,
                Image = containerImageTag, // Use the provided container image tag
                Resources = new AppContainerResources
                {
                    Cpu = 0.25,
                    Memory = "0.5Gi"
                }
            });

            var appOperation = await resourceGroup.GetContainerApps()
                .CreateOrUpdateAsync(Azure.WaitUntil.Completed, containerAppName, containerAppData);
            var containerApp = appOperation.Value;

            // Get the FQDN
            var fqdn = containerApp.Data.Configuration?.Ingress?.Fqdn;
            var previewUrl = fqdn != null ? $"https://{fqdn}" : null;

            AddLog(logs, $"Container App created. URL: {previewUrl}");
            AddLog(logs, "Deployment complete");

            // Step 4: Running (skip Provisioning and Building)
            deployment.Status = DeploymentStatus.Running;
            deployment.PreviewUrl = previewUrl;
            deployment.ContainerImageTag = containerImageTag;
            deployment.DeployedAt = DateTime.UtcNow;
            deployment.UpdatedAt = DateTime.UtcNow;
            deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
            await context.SaveChangesAsync();

            _logger.LogInformation("Deployment {DeploymentId} completed with existing image. URL: {PreviewUrl}", deploymentId, previewUrl);
            return deployment;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Deployment {DeploymentId} failed", deploymentId);
            AddLog(logs, $"Deployment failed: {ex.Message}", "error");

            deployment.Status = DeploymentStatus.Failed;
            deployment.UpdatedAt = DateTime.UtcNow;
            deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
            await context.SaveChangesAsync();

            return deployment;
        }
    }

    public async Task<Deployment> RedeployAsync(Guid deploymentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();
        var deployment = await context.Deployments.FindAsync(deploymentId)
            ?? throw new InvalidOperationException($"Deployment {deploymentId} not found");

        deployment.Status = DeploymentStatus.Pending;
        deployment.DeploymentLogJson = null;
        deployment.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return await DeployAsync(deploymentId);
    }

    public async Task DeleteDeploymentAsync(Guid deploymentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();
        var deployment = await context.Deployments.FindAsync(deploymentId)
            ?? throw new InvalidOperationException($"Deployment {deploymentId} not found");

        var subscriptionId = _configuration["Azure:SubscriptionId"];
        if (!string.IsNullOrEmpty(subscriptionId) && !string.IsNullOrEmpty(deployment.ResourceGroupName))
        {
            try
            {
                var credential = new DefaultAzureCredential();
                var armClient = new ArmClient(credential);
                var rgId = ResourceGroupResource.CreateResourceIdentifier(subscriptionId, deployment.ResourceGroupName);
                var rg = armClient.GetResourceGroupResource(rgId);
                await rg.DeleteAsync(Azure.WaitUntil.Started);
                _logger.LogInformation("Resource group {ResourceGroup} deletion started", deployment.ResourceGroupName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete resource group {ResourceGroup}", deployment.ResourceGroupName);
            }
        }

        deployment.Status = DeploymentStatus.Deleted;
        deployment.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
    }

    public async Task<List<DeploymentLogEntry>> GetLogsAsync(Guid deploymentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();
        var deployment = await context.Deployments.FindAsync(deploymentId);

        if (deployment?.DeploymentLogJson == null)
            return [];

        return JsonSerializer.Deserialize<List<DeploymentLogEntry>>(
            deployment.DeploymentLogJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        ) ?? [];
    }

    private async Task<Deployment> SimulateDeploymentAsync(AiDevRequestDbContext context, Deployment deployment, List<DeploymentLogEntry> logs)
    {
        AddLog(logs, "[SIMULATION] Resource group created: " + deployment.ResourceGroupName);

        deployment.Status = DeploymentStatus.Building;
        deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
        deployment.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        await Task.Delay(500);
        AddLog(logs, "[SIMULATION] Docker image built");

        deployment.Status = DeploymentStatus.Deploying;
        deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
        deployment.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        await Task.Delay(500);
        var simulatedFqdn = $"{deployment.SiteName}-{Guid.NewGuid().ToString()[..8]}.azurecontainerapps.io";
        var previewUrl = $"https://{simulatedFqdn}";
        AddLog(logs, $"[SIMULATION] Container App created. URL: {previewUrl}");
        AddLog(logs, "[SIMULATION] Deployment complete");

        deployment.Status = DeploymentStatus.Running;
        deployment.PreviewUrl = previewUrl;
        deployment.ContainerImageTag = GetContainerImage(deployment.ProjectType);
        deployment.DeployedAt = DateTime.UtcNow;
        deployment.UpdatedAt = DateTime.UtcNow;
        deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
        await context.SaveChangesAsync();

        _logger.LogInformation("[SIMULATION] Deployment {DeploymentId} completed. URL: {PreviewUrl}", deployment.Id, previewUrl);
        return deployment;
    }

    private async Task<Deployment> SimulatePromotionAsync(AiDevRequestDbContext context, Deployment deployment, List<DeploymentLogEntry> logs, string containerImageTag)
    {
        AddLog(logs, "[SIMULATION] Deploying with existing image: " + containerImageTag);

        await Task.Delay(500);
        var simulatedFqdn = $"{deployment.SiteName}-{Guid.NewGuid().ToString()[..8]}.azurecontainerapps.io";
        var previewUrl = $"https://{simulatedFqdn}";
        AddLog(logs, $"[SIMULATION] Container App created. URL: {previewUrl}");
        AddLog(logs, "[SIMULATION] Deployment complete");

        deployment.Status = DeploymentStatus.Running;
        deployment.PreviewUrl = previewUrl;
        deployment.ContainerImageTag = containerImageTag;
        deployment.DeployedAt = DateTime.UtcNow;
        deployment.UpdatedAt = DateTime.UtcNow;
        deployment.DeploymentLogJson = JsonSerializer.Serialize(logs);
        await context.SaveChangesAsync();

        _logger.LogInformation("[SIMULATION] Deployment {DeploymentId} completed with existing image. URL: {PreviewUrl}", deployment.Id, previewUrl);
        return deployment;
    }

    private static string SanitizeSiteName(string name)
    {
        var sanitized = name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("_", "-");

        // Keep only alphanumeric and hyphens
        sanitized = new string(sanitized.Where(c => char.IsLetterOrDigit(c) || c == '-').ToArray());

        // Remove leading/trailing hyphens and collapse multiple hyphens
        while (sanitized.Contains("--"))
            sanitized = sanitized.Replace("--", "-");
        sanitized = sanitized.Trim('-');

        // Max 40 chars
        if (sanitized.Length > 40)
            sanitized = sanitized[..40].TrimEnd('-');

        return string.IsNullOrEmpty(sanitized) ? "site" : sanitized;
    }

    private static string GetContainerImage(string? projectType)
    {
        return projectType?.ToLower() switch
        {
            "react" or "nextjs" or "vite" => "nginx:alpine",
            "dotnet" or ".net" => "mcr.microsoft.com/dotnet/aspnet:9.0",
            "python" => "python:3.12-slim",
            "node" or "express" => "node:22-alpine",
            _ => "nginx:alpine"
        };
    }

    private static int GetTargetPort(string? projectType)
    {
        return projectType?.ToLower() switch
        {
            "dotnet" or ".net" => 8080,
            "python" => 8000,
            "node" or "express" => 3000,
            _ => 80
        };
    }

    private static void AddLog(List<DeploymentLogEntry> logs, string message, string level = "info")
    {
        logs.Add(new DeploymentLogEntry
        {
            Timestamp = DateTime.UtcNow,
            Message = message,
            Level = level
        });
    }
}

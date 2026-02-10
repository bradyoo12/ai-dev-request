using System.IO.Compression;
using System.Text;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IInfrastructureService
{
    Task<InfrastructureConfig> AnalyzeRequirementsAsync(Guid devRequestId);
    Task<InfrastructureConfig?> GetConfigAsync(Guid devRequestId);
    Task<InfrastructureConfig> UpdateConfigAsync(Guid devRequestId, List<string> selectedServices, string tier);
    Task<InfrastructureConfig> GenerateBicepAsync(Guid devRequestId);
    Task<CostEstimation> EstimateCostAsync(List<string> selectedServices, string tier);
    Task<byte[]> ExportTemplatesAsync(Guid devRequestId);
}

public class InfrastructureService : IInfrastructureService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<InfrastructureService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static readonly string[] AllServices =
    {
        "container_apps", "postgresql", "blob_storage", "app_insights", "static_web_apps"
    };

    public InfrastructureService(
        AiDevRequestDbContext context,
        ILogger<InfrastructureService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<InfrastructureConfig> AnalyzeRequirementsAsync(Guid devRequestId)
    {
        var devRequest = await _context.DevRequests.FindAsync(devRequestId);
        if (devRequest == null)
            throw new InvalidOperationException("Dev request not found.");

        _logger.LogInformation("Analyzing infrastructure requirements for request {RequestId}", devRequestId);

        // Determine recommended services based on project characteristics
        var recommendedServices = new List<string> { "container_apps" };
        var description = devRequest.Description?.ToLowerInvariant() ?? "";
        var framework = devRequest.Framework?.ToLowerInvariant() ?? "";

        // Database needed for most apps
        if (description.Contains("database") || description.Contains("data") ||
            description.Contains("user") || description.Contains("auth") ||
            description.Contains("crud") || description.Contains("store") ||
            description.Contains("api") || description.Contains("backend"))
        {
            recommendedServices.Add("postgresql");
        }

        // Storage for file upload, media, etc.
        if (description.Contains("upload") || description.Contains("file") ||
            description.Contains("image") || description.Contains("media") ||
            description.Contains("storage") || description.Contains("blob"))
        {
            recommendedServices.Add("blob_storage");
        }

        // Monitoring is always recommended
        recommendedServices.Add("app_insights");

        // Static Web Apps for frontend frameworks
        if (framework is "react" or "nextjs" or "vue" or "angular" ||
            description.Contains("frontend") || description.Contains("landing") ||
            description.Contains("website") || description.Contains("spa"))
        {
            recommendedServices.Add("static_web_apps");
        }

        var tier = "Basic";
        var summary = BuildAnalysisSummary(devRequest.Description ?? "", recommendedServices);
        var cost = CalculateCost(recommendedServices, tier);

        // Check for existing config
        var existing = await _context.InfrastructureConfigs
            .Where(c => c.DevRequestId == devRequestId)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            existing.SelectedServicesJson = JsonSerializer.Serialize(recommendedServices, JsonOptions);
            existing.Tier = tier;
            existing.EstimatedMonthlyCostUsd = cost.TotalMonthlyCostUsd;
            existing.AnalysisSummary = summary;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new InfrastructureConfig
            {
                DevRequestId = devRequestId,
                SelectedServicesJson = JsonSerializer.Serialize(recommendedServices, JsonOptions),
                Tier = tier,
                EstimatedMonthlyCostUsd = cost.TotalMonthlyCostUsd,
                AnalysisSummary = summary
            };
            _context.InfrastructureConfigs.Add(existing);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Infrastructure analysis complete for request {RequestId}: {Services}",
            devRequestId, string.Join(", ", recommendedServices));

        return existing;
    }

    public async Task<InfrastructureConfig?> GetConfigAsync(Guid devRequestId)
    {
        return await _context.InfrastructureConfigs
            .Where(c => c.DevRequestId == devRequestId)
            .FirstOrDefaultAsync();
    }

    public async Task<InfrastructureConfig> UpdateConfigAsync(Guid devRequestId, List<string> selectedServices, string tier)
    {
        var config = await _context.InfrastructureConfigs
            .Where(c => c.DevRequestId == devRequestId)
            .FirstOrDefaultAsync();

        if (config == null)
        {
            config = new InfrastructureConfig { DevRequestId = devRequestId };
            _context.InfrastructureConfigs.Add(config);
        }

        // Validate services
        var validServices = selectedServices
            .Where(s => AllServices.Contains(s))
            .ToList();

        // Validate tier
        if (tier is not ("Free" or "Basic" or "Standard"))
            tier = "Basic";

        var cost = CalculateCost(validServices, tier);

        config.SelectedServicesJson = JsonSerializer.Serialize(validServices, JsonOptions);
        config.Tier = tier;
        config.EstimatedMonthlyCostUsd = cost.TotalMonthlyCostUsd;
        config.GeneratedBicepMain = null; // Invalidate generated templates on config change
        config.GeneratedBicepParameters = null;
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return config;
    }

    public async Task<InfrastructureConfig> GenerateBicepAsync(Guid devRequestId)
    {
        var config = await _context.InfrastructureConfigs
            .Where(c => c.DevRequestId == devRequestId)
            .FirstOrDefaultAsync();

        if (config == null)
            throw new InvalidOperationException("No infrastructure config found. Run analysis first.");

        var services = JsonSerializer.Deserialize<List<string>>(config.SelectedServicesJson, JsonOptions)
            ?? new List<string>();

        _logger.LogInformation("Generating Bicep templates for request {RequestId} with services: {Services}",
            devRequestId, string.Join(", ", services));

        config.GeneratedBicepMain = GenerateMainBicep(services, config.Tier);
        config.GeneratedBicepParameters = GenerateParametersBicep(config.Tier);
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return config;
    }

    public Task<CostEstimation> EstimateCostAsync(List<string> selectedServices, string tier)
    {
        var estimation = CalculateCost(selectedServices, tier);
        return Task.FromResult(estimation);
    }

    public async Task<byte[]> ExportTemplatesAsync(Guid devRequestId)
    {
        var config = await _context.InfrastructureConfigs
            .Where(c => c.DevRequestId == devRequestId)
            .FirstOrDefaultAsync();

        if (config == null || string.IsNullOrEmpty(config.GeneratedBicepMain))
            throw new InvalidOperationException("No generated templates found. Generate Bicep first.");

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            var mainEntry = archive.CreateEntry("main.bicep");
            using (var writer = new StreamWriter(mainEntry.Open()))
            {
                await writer.WriteAsync(config.GeneratedBicepMain);
            }

            if (!string.IsNullOrEmpty(config.GeneratedBicepParameters))
            {
                var paramEntry = archive.CreateEntry("main.bicepparam");
                using (var writer = new StreamWriter(paramEntry.Open()))
                {
                    await writer.WriteAsync(config.GeneratedBicepParameters);
                }
            }

            // Add azure.yaml for azd
            var azdEntry = archive.CreateEntry("azure.yaml");
            using (var writer = new StreamWriter(azdEntry.Open()))
            {
                await writer.WriteAsync(GenerateAzdYaml());
            }
        }

        return memoryStream.ToArray();
    }

    #region Bicep Template Generation

    private static string GenerateMainBicep(List<string> services, string tier)
    {
        var sb = new StringBuilder();

        sb.AppendLine("// Auto-generated by AI Dev Request Platform");
        sb.AppendLine("// Infrastructure-as-Code (Bicep) template");
        sb.AppendLine();
        sb.AppendLine("targetScope = 'resourceGroup'");
        sb.AppendLine();
        sb.AppendLine("@description('The location for all resources')");
        sb.AppendLine("param location string = resourceGroup().location");
        sb.AppendLine();
        sb.AppendLine("@description('Environment name (dev, staging, prod)')");
        sb.AppendLine("param environmentName string = 'dev'");
        sb.AppendLine();
        sb.AppendLine("@description('Project name used as resource prefix')");
        sb.AppendLine("param projectName string");
        sb.AppendLine();
        sb.AppendLine("var resourcePrefix = '${projectName}-${environmentName}'");
        sb.AppendLine();

        if (services.Contains("app_insights"))
        {
            sb.AppendLine(BicepSnippets.LogAnalyticsWorkspace);
            sb.AppendLine();
            sb.AppendLine(BicepSnippets.ApplicationInsights);
            sb.AppendLine();
        }

        if (services.Contains("container_apps"))
        {
            sb.AppendLine(BicepSnippets.ContainerAppsEnvironment(tier, services.Contains("app_insights")));
            sb.AppendLine();
            sb.AppendLine(BicepSnippets.ContainerApp(tier));
            sb.AppendLine();
        }

        if (services.Contains("postgresql"))
        {
            sb.AppendLine(BicepSnippets.PostgreSqlFlexibleServer(tier));
            sb.AppendLine();
        }

        if (services.Contains("blob_storage"))
        {
            sb.AppendLine(BicepSnippets.BlobStorage(tier));
            sb.AppendLine();
        }

        if (services.Contains("static_web_apps"))
        {
            sb.AppendLine(BicepSnippets.StaticWebApp(tier));
            sb.AppendLine();
        }

        // Outputs
        sb.AppendLine("// Outputs");
        if (services.Contains("container_apps"))
        {
            sb.AppendLine("output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn");
        }
        if (services.Contains("postgresql"))
        {
            sb.AppendLine("output postgresqlFqdn string = postgresServer.properties.fullyQualifiedDomainName");
        }
        if (services.Contains("blob_storage"))
        {
            sb.AppendLine("output storageAccountName string = storageAccount.name");
        }
        if (services.Contains("static_web_apps"))
        {
            sb.AppendLine("output staticWebAppUrl string = staticWebApp.properties.defaultHostname");
        }
        if (services.Contains("app_insights"))
        {
            sb.AppendLine("output appInsightsConnectionString string = appInsights.properties.ConnectionString");
        }

        return sb.ToString();
    }

    private static string GenerateParametersBicep(string tier)
    {
        var sb = new StringBuilder();
        sb.AppendLine("using 'main.bicep'");
        sb.AppendLine();
        sb.AppendLine("param projectName = 'myproject'");
        sb.AppendLine("param environmentName = 'dev'");
        sb.AppendLine("param location = 'koreacentral'");
        return sb.ToString();
    }

    private static string GenerateAzdYaml()
    {
        return """
            name: ai-dev-request-project
            services:
              api:
                host: containerApps
                project: ./
            infra:
              provider: bicep
              path: ./
            """.Replace("            ", "");
    }

    #endregion

    #region Cost Estimation

    private static CostEstimation CalculateCost(List<string> services, string tier)
    {
        var items = new List<CostLineItem>();

        foreach (var service in services)
        {
            var (name, cost) = GetServiceCost(service, tier);
            items.Add(new CostLineItem
            {
                Service = service,
                DisplayName = name,
                MonthlyCostUsd = cost,
                Tier = tier
            });
        }

        return new CostEstimation
        {
            LineItems = items,
            TotalMonthlyCostUsd = items.Sum(i => i.MonthlyCostUsd),
            Tier = tier,
            Currency = "USD"
        };
    }

    private static (string Name, decimal Cost) GetServiceCost(string service, string tier)
    {
        return (service, tier) switch
        {
            ("container_apps", "Free") => ("Azure Container Apps", 0m),
            ("container_apps", "Basic") => ("Azure Container Apps", 10m),
            ("container_apps", "Standard") => ("Azure Container Apps", 50m),

            ("postgresql", "Free") => ("PostgreSQL Flexible Server", 0m),
            ("postgresql", "Basic") => ("PostgreSQL Flexible Server", 15m),
            ("postgresql", "Standard") => ("PostgreSQL Flexible Server", 65m),

            ("blob_storage", "Free") => ("Azure Blob Storage", 0m),
            ("blob_storage", "Basic") => ("Azure Blob Storage", 2m),
            ("blob_storage", "Standard") => ("Azure Blob Storage", 10m),

            ("app_insights", "Free") => ("Application Insights", 0m),
            ("app_insights", "Basic") => ("Application Insights", 5m),
            ("app_insights", "Standard") => ("Application Insights", 15m),

            ("static_web_apps", "Free") => ("Azure Static Web Apps", 0m),
            ("static_web_apps", "Basic") => ("Azure Static Web Apps", 9m),
            ("static_web_apps", "Standard") => ("Azure Static Web Apps", 9m),

            _ => (service, 0m)
        };
    }

    #endregion

    #region Helpers

    private static string BuildAnalysisSummary(string description, List<string> services)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Based on the project requirements, the following Azure services are recommended:");
        sb.AppendLine();

        foreach (var service in services)
        {
            var reason = service switch
            {
                "container_apps" => "Container Apps for hosting the backend API with auto-scaling support.",
                "postgresql" => "PostgreSQL Flexible Server for relational data storage.",
                "blob_storage" => "Blob Storage for file uploads and static assets.",
                "app_insights" => "Application Insights for monitoring, logging, and diagnostics.",
                "static_web_apps" => "Static Web Apps for hosting the frontend SPA with global CDN.",
                _ => service
            };
            sb.AppendLine($"- {reason}");
        }

        sb.AppendLine();
        sb.AppendLine("Use the tier selector to adjust between Free (development), Basic (small production), and Standard (production with SLA) configurations.");

        return sb.ToString();
    }

    #endregion
}

#region Bicep Snippets

internal static class BicepSnippets
{
    public const string LogAnalyticsWorkspace = """
        // Log Analytics Workspace (required for Application Insights)
        resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
          name: '${resourcePrefix}-logs'
          location: location
          properties: {
            sku: {
              name: 'PerGB2018'
            }
            retentionInDays: 30
          }
        }
        """;

    public const string ApplicationInsights = """
        // Application Insights
        resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
          name: '${resourcePrefix}-insights'
          location: location
          kind: 'web'
          properties: {
            Application_Type: 'web'
            WorkspaceResourceId: logAnalytics.id
          }
        }
        """;

    public static string ContainerAppsEnvironment(string tier, bool hasAppInsights) => $"""
        // Container Apps Environment
        resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {{
          name: '${{resourcePrefix}}-env'
          location: location
          properties: {{
            workloadProfiles: [
              {{
                name: 'Consumption'
                workloadProfileType: 'Consumption'
              }}
            ]{(hasAppInsights ? @"
            appLogsConfiguration: {
              destination: 'log-analytics'
              logAnalyticsConfiguration: {
                customerId: logAnalytics.properties.customerId
                sharedKey: logAnalytics.listKeys().primarySharedKey
              }
            }" : "")}
          }}
        }}
        """;

    public static string ContainerApp(string tier)
    {
        var cpu = tier switch { "Standard" => "1.0", "Basic" => "0.5", _ => "0.25" };
        var memory = tier switch { "Standard" => "2Gi", "Basic" => "1Gi", _ => "0.5Gi" };
        var minReplicas = tier == "Standard" ? 1 : 0;
        var maxReplicas = tier switch { "Standard" => 5, "Basic" => 2, _ => 1 };

        return $"""
            // Container App
            resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {{
              name: '${{resourcePrefix}}-app'
              location: location
              properties: {{
                managedEnvironmentId: containerEnv.id
                configuration: {{
                  ingress: {{
                    external: true
                    targetPort: 8080
                    transport: 'http'
                  }}
                }}
                template: {{
                  containers: [
                    {{
                      name: 'api'
                      image: 'mcr.microsoft.com/dotnet/samples:aspnetapp'
                      resources: {{
                        cpu: json('{cpu}')
                        memory: '{memory}'
                      }}
                    }}
                  ]
                  scale: {{
                    minReplicas: {minReplicas}
                    maxReplicas: {maxReplicas}
                  }}
                }}
              }}
            }}
            """;
    }

    public static string PostgreSqlFlexibleServer(string tier)
    {
        var sku = tier switch
        {
            "Standard" => "Standard_D2ds_v4",
            "Basic" => "Standard_B1ms",
            _ => "Standard_B1ms"
        };
        var skuTier = tier switch
        {
            "Standard" => "GeneralPurpose",
            _ => "Burstable"
        };
        var storageGb = tier switch { "Standard" => 64, "Basic" => 32, _ => 32 };

        return $"""
            // PostgreSQL Flexible Server
            @secure()
            param postgresAdminPassword string

            resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {{
              name: '${{resourcePrefix}}-pg'
              location: location
              sku: {{
                name: '{sku}'
                tier: '{skuTier}'
              }}
              properties: {{
                version: '16'
                administratorLogin: 'pgadmin'
                administratorLoginPassword: postgresAdminPassword
                storage: {{
                  storageSizeGB: {storageGb}
                }}
                backup: {{
                  backupRetentionDays: 7
                  geoRedundantBackup: 'Disabled'
                }}
                highAvailability: {{
                  mode: 'Disabled'
                }}
              }}
            }}

            resource postgresDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {{
              parent: postgresServer
              name: '${{projectName}}-db'
              properties: {{
                charset: 'UTF8'
                collation: 'en_US.utf8'
              }}
            }}
            """;
    }

    public static string BlobStorage(string tier)
    {
        var skuName = tier == "Standard" ? "Standard_GRS" : "Standard_LRS";

        return $"""
            // Azure Blob Storage
            resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {{
              name: replace('${{resourcePrefix}}stor', '-', '')
              location: location
              sku: {{
                name: '{skuName}'
              }}
              kind: 'StorageV2'
              properties: {{
                accessTier: 'Hot'
                supportsHttpsTrafficOnly: true
                minimumTlsVersion: 'TLS1_2'
              }}
            }}

            resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {{
              parent: storageAccount
              name: 'default'
            }}

            resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {{
              parent: blobService
              name: 'uploads'
              properties: {{
                publicAccess: 'None'
              }}
            }}
            """;
    }

    public static string StaticWebApp(string tier)
    {
        var skuName = tier == "Free" ? "Free" : "Standard";

        return $"""
            // Azure Static Web Apps
            resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {{
              name: '${{resourcePrefix}}-web'
              location: location
              sku: {{
                name: '{skuName}'
                tier: '{skuName}'
              }}
              properties: {{
                buildProperties: {{
                  appLocation: '/'
                  outputLocation: 'dist'
                }}
              }}
            }}
            """;
    }
}

#endregion

#region DTOs

public class CostEstimation
{
    public List<CostLineItem> LineItems { get; set; } = new();
    public decimal TotalMonthlyCostUsd { get; set; }
    public string Tier { get; set; } = "Basic";
    public string Currency { get; set; } = "USD";
}

public class CostLineItem
{
    public string Service { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public decimal MonthlyCostUsd { get; set; }
    public string Tier { get; set; } = "Basic";
}

#endregion

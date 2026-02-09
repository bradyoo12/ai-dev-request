using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IMicroserviceService
{
    Task<List<ServiceBlueprint>> GetBlueprintsAsync(string userId);
    Task<ServiceBlueprint?> GetBlueprintAsync(int id, string userId);
    Task<ServiceBlueprint> GenerateBlueprintAsync(Guid devRequestId, string userId);
    Task<bool> DeleteBlueprintAsync(int id, string userId);
}

public class MicroserviceService : IMicroserviceService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<MicroserviceService> _logger;

    public MicroserviceService(AiDevRequestDbContext db, ILogger<MicroserviceService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<ServiceBlueprint>> GetBlueprintsAsync(string userId)
    {
        return await _db.ServiceBlueprints
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<ServiceBlueprint?> GetBlueprintAsync(int id, string userId)
    {
        return await _db.ServiceBlueprints
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
    }

    public async Task<ServiceBlueprint> GenerateBlueprintAsync(Guid devRequestId, string userId)
    {
        var devRequest = await _db.DevRequests.FindAsync(devRequestId);
        if (devRequest == null || devRequest.UserId != userId)
            throw new InvalidOperationException("Project not found or unauthorized.");

        var desc = (devRequest.Description ?? "").ToLower();
        var services = GenerateServices(desc, devRequest.Framework);
        var dependencies = GenerateDependencies(services);
        var gateway = GenerateGatewayConfig(services);
        var dockerCompose = GenerateDockerCompose(services);
        var k8sManifest = GenerateK8sManifest(services);

        var blueprint = new ServiceBlueprint
        {
            DevRequestId = devRequestId,
            UserId = userId,
            Name = devRequest.Description?[..Math.Min(60, devRequest.Description.Length)] ?? "Untitled",
            ServicesJson = JsonSerializer.Serialize(services),
            DependenciesJson = JsonSerializer.Serialize(dependencies),
            GatewayConfigJson = JsonSerializer.Serialize(gateway),
            DockerComposeYaml = dockerCompose,
            K8sManifestYaml = k8sManifest,
            ServiceCount = services.Count,
        };

        _db.ServiceBlueprints.Add(blueprint);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Generated blueprint for {DevRequestId}: {Count} services",
            devRequestId, services.Count);

        return blueprint;
    }

    public async Task<bool> DeleteBlueprintAsync(int id, string userId)
    {
        var bp = await _db.ServiceBlueprints.FindAsync(id);
        if (bp == null || bp.UserId != userId) return false;
        _db.ServiceBlueprints.Remove(bp);
        await _db.SaveChangesAsync();
        return true;
    }

    // -- Template generators --

    private record ServiceDef(string Name, string Type, string Tech, int Port, string Description, string[] Endpoints);
    private record DependencyEdge(string From, string To, string Protocol, string Description);
    private record GatewayRoute(string Path, string Service, int Port);

    private static List<ServiceDef> GenerateServices(string desc, string? framework)
    {
        var services = new List<ServiceDef>
        {
            new("api-gateway", "gateway", "nginx", 80,
                "API Gateway - routes and load balances traffic across services",
                new[] { "GET /health", "GET /api/*" }),
            new("user-service", "backend", framework ?? "dotnet", 5001,
                "Handles authentication, user profiles, and authorization",
                new[] { "POST /api/auth/login", "POST /api/auth/register", "GET /api/users/me", "PUT /api/users/me" }),
        };

        if (desc.Contains("payment") || desc.Contains("billing") || desc.Contains("결제") || desc.Contains("commerce"))
        {
            services.Add(new("payment-service", "backend", "dotnet", 5002,
                "Processes payments, subscriptions, and invoicing",
                new[] { "POST /api/payments/charge", "GET /api/payments/history", "POST /api/subscriptions" }));
        }

        if (desc.Contains("notification") || desc.Contains("email") || desc.Contains("알림") || desc.Contains("push"))
        {
            services.Add(new("notification-service", "backend", "node", 5003,
                "Sends emails, push notifications, and SMS",
                new[] { "POST /api/notifications/send", "GET /api/notifications", "PUT /api/notifications/preferences" }));
        }

        if (desc.Contains("file") || desc.Contains("upload") || desc.Contains("storage") || desc.Contains("media"))
        {
            services.Add(new("media-service", "backend", "dotnet", 5004,
                "Handles file uploads, image processing, and storage",
                new[] { "POST /api/media/upload", "GET /api/media/:id", "DELETE /api/media/:id" }));
        }

        // Core business service (always included)
        services.Add(new("core-service", "backend", framework ?? "dotnet", 5010,
            "Core business logic and data processing",
            new[] { "GET /api/data", "POST /api/data", "PUT /api/data/:id", "DELETE /api/data/:id" }));

        // Frontend
        services.Add(new("web-frontend", "frontend", "react", 3000,
            "React web application with responsive UI",
            new[] { "GET /" }));

        // Database
        services.Add(new("postgres-db", "database", "postgresql", 5432,
            "Primary PostgreSQL database with connection pooling",
            Array.Empty<string>()));

        // Cache
        services.Add(new("redis-cache", "cache", "redis", 6379,
            "Redis cache for session storage and rate limiting",
            Array.Empty<string>()));

        return services;
    }

    private static List<DependencyEdge> GenerateDependencies(List<ServiceDef> services)
    {
        var edges = new List<DependencyEdge>
        {
            new("web-frontend", "api-gateway", "HTTP", "Frontend routes API calls through gateway"),
            new("api-gateway", "user-service", "HTTP/REST", "Routes auth and user requests"),
            new("api-gateway", "core-service", "HTTP/REST", "Routes core business requests"),
            new("user-service", "postgres-db", "TCP", "User data persistence"),
            new("user-service", "redis-cache", "TCP", "Session caching"),
            new("core-service", "postgres-db", "TCP", "Business data persistence"),
            new("core-service", "redis-cache", "TCP", "Query result caching"),
        };

        var serviceNames = services.Select(s => s.Name).ToHashSet();

        if (serviceNames.Contains("payment-service"))
        {
            edges.Add(new("api-gateway", "payment-service", "HTTP/REST", "Routes payment requests"));
            edges.Add(new("payment-service", "postgres-db", "TCP", "Payment data persistence"));
        }

        if (serviceNames.Contains("notification-service"))
        {
            edges.Add(new("api-gateway", "notification-service", "HTTP/REST", "Routes notification requests"));
            edges.Add(new("user-service", "notification-service", "HTTP/REST", "Triggers welcome emails"));
            edges.Add(new("notification-service", "redis-cache", "TCP", "Notification queue"));
        }

        if (serviceNames.Contains("media-service"))
        {
            edges.Add(new("api-gateway", "media-service", "HTTP/REST", "Routes media requests"));
            edges.Add(new("media-service", "postgres-db", "TCP", "Media metadata persistence"));
        }

        return edges;
    }

    private static List<GatewayRoute> GenerateGatewayConfig(List<ServiceDef> services)
    {
        return services
            .Where(s => s.Type == "backend")
            .Select(s => new GatewayRoute($"/api/{s.Name.Replace("-service", "")}", s.Name, s.Port))
            .ToList();
    }

    private static string GenerateDockerCompose(List<ServiceDef> services)
    {
        var lines = new List<string> { "version: '3.8'", "", "services:" };

        foreach (var svc in services)
        {
            lines.Add($"  {svc.Name}:");

            switch (svc.Type)
            {
                case "database":
                    lines.Add($"    image: postgres:16-alpine");
                    lines.Add($"    environment:");
                    lines.Add($"      POSTGRES_DB: appdb");
                    lines.Add($"      POSTGRES_USER: appuser");
                    lines.Add($"      POSTGRES_PASSWORD: ${{DB_PASSWORD}}");
                    lines.Add($"    ports:");
                    lines.Add($"      - \"{svc.Port}:{svc.Port}\"");
                    lines.Add($"    volumes:");
                    lines.Add($"      - postgres_data:/var/lib/postgresql/data");
                    break;
                case "cache":
                    lines.Add($"    image: redis:7-alpine");
                    lines.Add($"    ports:");
                    lines.Add($"      - \"{svc.Port}:{svc.Port}\"");
                    break;
                case "gateway":
                    lines.Add($"    image: nginx:alpine");
                    lines.Add($"    ports:");
                    lines.Add($"      - \"80:80\"");
                    lines.Add($"    depends_on:");
                    foreach (var dep in services.Where(s => s.Type == "backend"))
                        lines.Add($"      - {dep.Name}");
                    break;
                case "frontend":
                    lines.Add($"    build:");
                    lines.Add($"      context: ./{svc.Name}");
                    lines.Add($"      dockerfile: Dockerfile");
                    lines.Add($"    ports:");
                    lines.Add($"      - \"{svc.Port}:{svc.Port}\"");
                    lines.Add($"    depends_on:");
                    lines.Add($"      - api-gateway");
                    break;
                default: // backend
                    lines.Add($"    build:");
                    lines.Add($"      context: ./{svc.Name}");
                    lines.Add($"      dockerfile: Dockerfile");
                    lines.Add($"    ports:");
                    lines.Add($"      - \"{svc.Port}:{svc.Port}\"");
                    lines.Add($"    environment:");
                    lines.Add($"      - DATABASE_URL=postgresql://appuser:${{DB_PASSWORD}}@postgres-db:5432/appdb");
                    lines.Add($"      - REDIS_URL=redis://redis-cache:6379");
                    lines.Add($"    depends_on:");
                    lines.Add($"      - postgres-db");
                    lines.Add($"      - redis-cache");
                    break;
            }
            lines.Add("");
        }

        lines.Add("volumes:");
        lines.Add("  postgres_data:");

        return string.Join("\n", lines);
    }

    private static string GenerateK8sManifest(List<ServiceDef> services)
    {
        var parts = new List<string>();

        foreach (var svc in services.Where(s => s.Type == "backend" || s.Type == "frontend"))
        {
            parts.Add($@"apiVersion: apps/v1
kind: Deployment
metadata:
  name: {svc.Name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: {svc.Name}
  template:
    metadata:
      labels:
        app: {svc.Name}
    spec:
      containers:
      - name: {svc.Name}
        image: ${{REGISTRY}}/{svc.Name}:latest
        ports:
        - containerPort: {svc.Port}
        resources:
          requests:
            memory: 128Mi
            cpu: 100m
          limits:
            memory: 256Mi
            cpu: 250m
---
apiVersion: v1
kind: Service
metadata:
  name: {svc.Name}
spec:
  selector:
    app: {svc.Name}
  ports:
  - port: {svc.Port}
    targetPort: {svc.Port}
  type: ClusterIP");
        }

        return string.Join("\n---\n", parts);
    }
}

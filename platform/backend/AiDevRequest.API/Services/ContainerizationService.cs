using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AiDevRequest.API.Services;

public interface IContainerizationService
{
    Task<ContainerConfig> GenerateDockerfileAsync(int projectId);
    Task<ContainerConfig?> GetConfigAsync(int projectId);
    Task<ContainerConfig?> TriggerBuildAsync(int projectId);
    Task<ContainerBuildStatus?> GetBuildStatusAsync(int projectId);
    Task<ContainerBuildLogs?> GetBuildLogsAsync(int projectId);
    Task<ContainerConfig?> DeployAsync(int projectId);
    Task<ContainerConfig?> GenerateK8sManifestAsync(int projectId);
}

public class ContainerizationService : IContainerizationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<ContainerizationService> _logger;

    public ContainerizationService(AiDevRequestDbContext context, ILogger<ContainerizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ContainerConfig> GenerateDockerfileAsync(int projectId)
    {
        // Check if a config already exists for this project
        var existing = await _context.ContainerConfigs.FirstOrDefaultAsync(c => c.ProjectId == projectId);
        if (existing != null)
        {
            // Regenerate for existing config
            var detectedStack = await DetectStackAsync(projectId);
            existing.DetectedStack = detectedStack;
            existing.Dockerfile = GenerateDockerfileForStack(detectedStack, projectId);
            existing.ComposeFile = GenerateComposeFile(detectedStack, projectId);
            existing.ImageName = $"project-{projectId}";
            existing.ImageTag = "latest";
            existing.BuildStatus = "pending";

            await _context.SaveChangesAsync();
            _logger.LogInformation("Regenerated Dockerfile for project {ProjectId}, stack: {Stack}", projectId, detectedStack);
            return existing;
        }

        // Create new container config
        var stack = await DetectStackAsync(projectId);
        var config = new ContainerConfig
        {
            ProjectId = projectId,
            DetectedStack = stack,
            Dockerfile = GenerateDockerfileForStack(stack, projectId),
            ComposeFile = GenerateComposeFile(stack, projectId),
            ImageName = $"project-{projectId}",
            ImageTag = "latest",
            BuildStatus = "pending",
        };

        _context.ContainerConfigs.Add(config);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Generated Dockerfile for project {ProjectId}, stack: {Stack}", projectId, stack);
        return config;
    }

    public async Task<ContainerConfig?> GetConfigAsync(int projectId)
    {
        return await _context.ContainerConfigs.FirstOrDefaultAsync(c => c.ProjectId == projectId);
    }

    public async Task<ContainerConfig?> TriggerBuildAsync(int projectId)
    {
        var config = await _context.ContainerConfigs.FirstOrDefaultAsync(c => c.ProjectId == projectId);
        if (config == null) return null;

        config.BuildStatus = "building";
        config.BuildLogs = JsonSerializer.Serialize(new[]
        {
            new { timestamp = DateTime.UtcNow, message = "Build started..." },
            new { timestamp = DateTime.UtcNow, message = $"Using base image for {config.DetectedStack}" },
            new { timestamp = DateTime.UtcNow, message = "Copying project files..." },
            new { timestamp = DateTime.UtcNow, message = "Installing dependencies..." },
            new { timestamp = DateTime.UtcNow, message = "Building application..." },
        });

        await _context.SaveChangesAsync();

        // Simulate build completion (in production this would be async via a background job)
        config.BuildStatus = "built";
        config.BuiltAt = DateTime.UtcNow;
        config.BuildDurationMs = 12500;
        config.BuildLogs = JsonSerializer.Serialize(new[]
        {
            new { timestamp = DateTime.UtcNow, message = "Build started..." },
            new { timestamp = DateTime.UtcNow, message = $"Using base image for {config.DetectedStack}" },
            new { timestamp = DateTime.UtcNow, message = "Copying project files..." },
            new { timestamp = DateTime.UtcNow, message = "Installing dependencies..." },
            new { timestamp = DateTime.UtcNow, message = "Building application..." },
            new { timestamp = DateTime.UtcNow, message = $"Successfully built {config.ImageName}:{config.ImageTag}" },
            new { timestamp = DateTime.UtcNow, message = "Build completed in 12.5s" },
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("Build completed for project {ProjectId}, image: {Image}:{Tag}",
            projectId, config.ImageName, config.ImageTag);
        return config;
    }

    public async Task<ContainerBuildStatus?> GetBuildStatusAsync(int projectId)
    {
        var config = await _context.ContainerConfigs.FirstOrDefaultAsync(c => c.ProjectId == projectId);
        if (config == null) return null;

        return new ContainerBuildStatus
        {
            ProjectId = config.ProjectId,
            Status = config.BuildStatus,
            ImageName = config.ImageName,
            ImageTag = config.ImageTag,
            BuildDurationMs = config.BuildDurationMs,
            ErrorMessage = config.ErrorMessage,
            BuiltAt = config.BuiltAt,
            DeployedAt = config.DeployedAt,
        };
    }

    public async Task<ContainerBuildLogs?> GetBuildLogsAsync(int projectId)
    {
        var config = await _context.ContainerConfigs.FirstOrDefaultAsync(c => c.ProjectId == projectId);
        if (config == null) return null;

        return new ContainerBuildLogs
        {
            ProjectId = config.ProjectId,
            Status = config.BuildStatus,
            Logs = config.BuildLogs ?? "[]",
        };
    }

    public async Task<ContainerConfig?> DeployAsync(int projectId)
    {
        var config = await _context.ContainerConfigs.FirstOrDefaultAsync(c => c.ProjectId == projectId);
        if (config == null) return null;

        if (config.BuildStatus != "built" && config.BuildStatus != "pushed")
        {
            config.ErrorMessage = "Cannot deploy: image has not been built yet";
            await _context.SaveChangesAsync();
            return config;
        }

        config.BuildStatus = "deploying";
        await _context.SaveChangesAsync();

        // Simulate deployment
        config.BuildStatus = "deployed";
        config.DeployedAt = DateTime.UtcNow;
        config.ErrorMessage = null;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Deployed container for project {ProjectId}", projectId);
        return config;
    }

    public async Task<ContainerConfig?> GenerateK8sManifestAsync(int projectId)
    {
        var config = await _context.ContainerConfigs.FirstOrDefaultAsync(c => c.ProjectId == projectId);
        if (config == null) return null;

        config.K8sManifest = GenerateK8sManifestForConfig(config);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Generated K8s manifest for project {ProjectId}", projectId);
        return config;
    }

    // === Private helpers ===

    private async Task<string> DetectStackAsync(int projectId)
    {
        // In production, this would analyze project files
        var devRequest = await _context.DevRequests.FindAsync(projectId);
        if (devRequest == null) return "nodejs";

        var framework = devRequest.Framework?.ToLower() ?? "";
        return framework switch
        {
            "react" or "nextjs" or "vue" or "angular" => "nodejs",
            "dotnet" or "blazor" or "aspnet" => "dotnet",
            "django" or "flask" or "fastapi" => "python",
            "flutter" => "static",
            _ => "nodejs",
        };
    }

    private static string GenerateDockerfileForStack(string stack, int projectId)
    {
        return stack switch
        {
            "nodejs" => $"""
                # Multi-stage build for Node.js application
                FROM node:20-alpine AS builder
                WORKDIR /app
                COPY package*.json ./
                RUN npm ci --only=production
                COPY . .
                RUN npm run build

                FROM node:20-alpine AS runner
                WORKDIR /app
                ENV NODE_ENV=production
                COPY --from=builder /app/package*.json ./
                COPY --from=builder /app/node_modules ./node_modules
                COPY --from=builder /app/dist ./dist
                EXPOSE 3000
                CMD ["node", "dist/index.js"]
                """,

            "dotnet" => $"""
                # Multi-stage build for .NET application
                FROM mcr.microsoft.com/dotnet/sdk:9.0 AS builder
                WORKDIR /src
                COPY *.csproj ./
                RUN dotnet restore
                COPY . .
                RUN dotnet publish -c Release -o /app/publish

                FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runner
                WORKDIR /app
                COPY --from=builder /app/publish .
                EXPOSE 8080
                ENV ASPNETCORE_URLS=http://+:8080
                ENTRYPOINT ["dotnet", "App.dll"]
                """,

            "python" => $"""
                # Multi-stage build for Python application
                FROM python:3.12-slim AS builder
                WORKDIR /app
                COPY requirements.txt ./
                RUN pip install --no-cache-dir --user -r requirements.txt
                COPY . .

                FROM python:3.12-slim AS runner
                WORKDIR /app
                COPY --from=builder /root/.local /root/.local
                COPY --from=builder /app .
                ENV PATH=/root/.local/bin:$PATH
                EXPOSE 8000
                CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
                """,

            "static" => $"""
                # Static file serving with Nginx
                FROM node:20-alpine AS builder
                WORKDIR /app
                COPY package*.json ./
                RUN npm ci
                COPY . .
                RUN npm run build

                FROM nginx:alpine AS runner
                COPY --from=builder /app/dist /usr/share/nginx/html
                COPY nginx.conf /etc/nginx/conf.d/default.conf
                EXPOSE 80
                CMD ["nginx", "-g", "daemon off;"]
                """,

            _ => $"""
                FROM node:20-alpine
                WORKDIR /app
                COPY . .
                RUN npm install
                EXPOSE 3000
                CMD ["npm", "start"]
                """,
        };
    }

    private static string GenerateComposeFile(string stack, int projectId)
    {
        var dbService = stack switch
        {
            "nodejs" or "python" => """
                  db:
                    image: postgres:16-alpine
                    environment:
                      POSTGRES_DB: appdb
                      POSTGRES_USER: app
                      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
                    ports:
                      - "5432:5432"
                    volumes:
                      - pgdata:/var/lib/postgresql/data
                    healthcheck:
                      test: ["CMD-SHELL", "pg_isready -U app"]
                      interval: 5s
                      timeout: 5s
                      retries: 5
                """,
            "dotnet" => """
                  db:
                    image: postgres:16-alpine
                    environment:
                      POSTGRES_DB: appdb
                      POSTGRES_USER: app
                      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
                    ports:
                      - "5432:5432"
                    volumes:
                      - pgdata:/var/lib/postgresql/data
                    healthcheck:
                      test: ["CMD-SHELL", "pg_isready -U app"]
                      interval: 5s
                      timeout: 5s
                      retries: 5
                """,
            _ => "",
        };

        var port = stack switch
        {
            "nodejs" => "3000",
            "dotnet" => "8080",
            "python" => "8000",
            "static" => "80",
            _ => "3000",
        };

        var volumes = string.IsNullOrEmpty(dbService) ? "" : """

            volumes:
              pgdata:
            """;

        var dependsOn = string.IsNullOrEmpty(dbService) ? "" : """
                depends_on:
                  db:
                    condition: service_healthy
            """;

        return $"""
            version: "3.8"

            services:
              app:
                build: .
                ports:
                  - "{port}:{port}"
                environment:
                  - NODE_ENV=production
                {dependsOn}
            {dbService}
            {volumes}
            """;
    }

    private static string GenerateK8sManifestForConfig(ContainerConfig config)
    {
        var port = config.DetectedStack switch
        {
            "nodejs" => 3000,
            "dotnet" => 8080,
            "python" => 8000,
            "static" => 80,
            _ => 3000,
        };

        var registry = string.IsNullOrEmpty(config.RegistryUrl) ? "" : $"{config.RegistryUrl}/";

        return $"""
            apiVersion: apps/v1
            kind: Deployment
            metadata:
              name: {config.ImageName}
              labels:
                app: {config.ImageName}
            spec:
              replicas: 2
              selector:
                matchLabels:
                  app: {config.ImageName}
              template:
                metadata:
                  labels:
                    app: {config.ImageName}
                spec:
                  containers:
                    - name: {config.ImageName}
                      image: {registry}{config.ImageName}:{config.ImageTag}
                      ports:
                        - containerPort: {port}
                      resources:
                        requests:
                          cpu: "100m"
                          memory: "128Mi"
                        limits:
                          cpu: "500m"
                          memory: "512Mi"
                      readinessProbe:
                        httpGet:
                          path: /health
                          port: {port}
                        initialDelaySeconds: 5
                        periodSeconds: 10
                      livenessProbe:
                        httpGet:
                          path: /health
                          port: {port}
                        initialDelaySeconds: 15
                        periodSeconds: 20
            ---
            apiVersion: v1
            kind: Service
            metadata:
              name: {config.ImageName}-svc
            spec:
              selector:
                app: {config.ImageName}
              ports:
                - protocol: TCP
                  port: 80
                  targetPort: {port}
              type: ClusterIP
            ---
            apiVersion: networking.k8s.io/v1
            kind: Ingress
            metadata:
              name: {config.ImageName}-ingress
              annotations:
                nginx.ingress.kubernetes.io/rewrite-target: /
            spec:
              rules:
                - host: {config.ImageName}.example.com
                  http:
                    paths:
                      - path: /
                        pathType: Prefix
                        backend:
                          service:
                            name: {config.ImageName}-svc
                            port:
                              number: 80
            """;
    }
}

// === Supporting Types ===

public class ContainerBuildStatus
{
    public int ProjectId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ImageName { get; set; } = string.Empty;
    public string ImageTag { get; set; } = string.Empty;
    public int BuildDurationMs { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? BuiltAt { get; set; }
    public DateTime? DeployedAt { get; set; }
}

public class ContainerBuildLogs
{
    public int ProjectId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Logs { get; set; } = "[]";
}

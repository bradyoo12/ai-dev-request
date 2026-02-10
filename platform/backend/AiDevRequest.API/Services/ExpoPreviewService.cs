using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IExpoPreviewService
{
    Task<ExpoPreviewResult> GeneratePreviewAsync(Guid requestId);
}

public class ExpoPreviewService : IExpoPreviewService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<ExpoPreviewService> _logger;

    public ExpoPreviewService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<ExpoPreviewService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ExpoPreviewResult> GeneratePreviewAsync(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null)
        {
            return new ExpoPreviewResult
            {
                PreviewUrl = "",
                SnackUrl = "",
                Success = false,
                Error = "Request not found."
            };
        }

        // Check if this is a mobile project
        if (entity.Category != RequestCategory.MobileApp && !IsMobileProject(entity))
        {
            return new ExpoPreviewResult
            {
                PreviewUrl = "",
                SnackUrl = "",
                Success = false,
                Error = "This is not a mobile project. Expo preview is only available for mobile projects."
            };
        }

        if (string.IsNullOrEmpty(entity.ProjectPath) || !Directory.Exists(entity.ProjectPath))
        {
            return new ExpoPreviewResult
            {
                PreviewUrl = "",
                SnackUrl = "",
                Success = false,
                Error = "Project has not been built yet."
            };
        }

        try
        {
            // Find App.tsx or App.js in the project
            var appCode = await FindAndReadAppEntryAsync(entity.ProjectPath);

            if (string.IsNullOrEmpty(appCode))
            {
                return new ExpoPreviewResult
                {
                    PreviewUrl = "",
                    SnackUrl = "",
                    Success = false,
                    Error = "Could not find App.tsx or App.js in the project."
                };
            }

            // Build the Expo Snack URL
            var projectName = entity.ProjectId ?? $"project-{requestId.ToString()[..8]}";
            var encodedCode = Uri.EscapeDataString(appCode);
            var encodedName = Uri.EscapeDataString(projectName);
            var snackUrl = $"https://snack.expo.dev/?code={encodedCode}&platform=web&name={encodedName}";

            // Save preview URL to entity
            entity.PreviewUrl = snackUrl;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Expo preview generated for request {RequestId}: {SnackUrl}", requestId, snackUrl);

            return new ExpoPreviewResult
            {
                PreviewUrl = snackUrl,
                SnackUrl = snackUrl,
                Success = true,
                Error = null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Expo preview for request {RequestId}", requestId);
            return new ExpoPreviewResult
            {
                PreviewUrl = "",
                SnackUrl = "",
                Success = false,
                Error = $"Failed to generate preview: {ex.Message}"
            };
        }
    }

    private bool IsMobileProject(DevRequest entity)
    {
        // Check analysis result for platform info
        if (!string.IsNullOrEmpty(entity.AnalysisResultJson))
        {
            try
            {
                var analysis = JsonSerializer.Deserialize<JsonElement>(entity.AnalysisResultJson);
                if (analysis.TryGetProperty("platform", out var platform) ||
                    analysis.TryGetProperty("Platform", out platform))
                {
                    var platformStr = platform.GetString()?.ToLowerInvariant() ?? "";
                    if (platformStr is "mobile" or "fullstack")
                        return true;
                }
            }
            catch
            {
                // Ignore parse errors
            }
        }

        // Check framework
        var framework = entity.Framework?.ToLowerInvariant() ?? "";
        return framework is "react-native" or "expo" or "flutter";
    }

    private static async Task<string?> FindAndReadAppEntryAsync(string projectPath)
    {
        // Look for common entry points in order of preference
        string[] candidates = { "App.tsx", "App.js", "app/App.tsx", "app/App.js", "src/App.tsx", "src/App.js" };

        foreach (var candidate in candidates)
        {
            var filePath = Path.Combine(projectPath, candidate);
            if (File.Exists(filePath))
            {
                return await File.ReadAllTextAsync(filePath);
            }
        }

        // Fallback: search recursively for App.tsx
        var appFiles = Directory.GetFiles(projectPath, "App.tsx", SearchOption.AllDirectories);
        if (appFiles.Length > 0)
        {
            return await File.ReadAllTextAsync(appFiles[0]);
        }

        appFiles = Directory.GetFiles(projectPath, "App.js", SearchOption.AllDirectories);
        if (appFiles.Length > 0)
        {
            return await File.ReadAllTextAsync(appFiles[0]);
        }

        return null;
    }
}

public record ExpoPreviewResult
{
    public string PreviewUrl { get; init; } = "";
    public string SnackUrl { get; init; } = "";
    public bool Success { get; init; }
    public string? Error { get; init; }
}

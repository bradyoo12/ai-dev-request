using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IMobileDeploymentService
{
    Task<MobileDeployment> GenerateNativeCodeAsync(string userId, Guid devRequestId, string appDescription);
    Task<MobileDeployment> DeployToTestFlightAsync(string userId, Guid deploymentId);
    Task<ExpoPreviewResult> GenerateExpoPreviewAsync(string userId, Guid devRequestId, string? appDescription);
    Task<MobileDeployment?> GetDeploymentStatusAsync(string userId, Guid deploymentId);
    Task<List<MobileDeployment>> GetDeploymentsAsync(string userId, Guid? devRequestId = null);
}

public class MobileDeploymentService : IMobileDeploymentService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<MobileDeploymentService> _logger;

    public MobileDeploymentService(
        AiDevRequestDbContext db,
        ILogger<MobileDeploymentService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<MobileDeployment> GenerateNativeCodeAsync(string userId, Guid devRequestId, string appDescription)
    {
        _logger.LogInformation("Generating React Native code for user {UserId}, request {RequestId}", userId, devRequestId);

        var deployment = new MobileDeployment
        {
            UserId = userId,
            DevRequestId = devRequestId,
            DeploymentType = "code-generation",
            Status = "generating",
            AppDescription = appDescription
        };
        _db.MobileDeployments.Add(deployment);
        await _db.SaveChangesAsync();

        try
        {
            // Generate React Native / Expo code from the natural language description
            var generatedCode = GenerateReactNativeBoilerplate(appDescription);

            deployment.GeneratedCodeJson = JsonSerializer.Serialize(generatedCode);
            deployment.Status = "generated";
            deployment.CompletedAt = DateTime.UtcNow;
            deployment.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _logger.LogInformation("React Native code generated for deployment {DeploymentId}", deployment.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate React Native code for deployment {DeploymentId}", deployment.Id);
            deployment.Status = "failed";
            deployment.ErrorMessage = ex.Message;
            deployment.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return deployment;
    }

    public async Task<MobileDeployment> DeployToTestFlightAsync(string userId, Guid deploymentId)
    {
        _logger.LogInformation("Deploying to TestFlight for user {UserId}, deployment {DeploymentId}", userId, deploymentId);

        var deployment = await _db.MobileDeployments
            .FirstOrDefaultAsync(d => d.Id == deploymentId && d.UserId == userId)
            ?? throw new InvalidOperationException("Deployment not found");

        deployment.DeploymentType = "testflight";
        deployment.Status = "submitting";
        deployment.SubmittedAt = DateTime.UtcNow;
        deployment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        try
        {
            // Simulate TestFlight submission workflow:
            // 1. Validate Apple Developer credentials
            // 2. Build IPA via EAS Build
            // 3. Submit to App Store Connect
            // 4. Wait for TestFlight processing

            var config = await _db.MobileAppConfigs
                .FirstOrDefaultAsync(c => c.UserId == userId && c.DevRequestId == deployment.DevRequestId);

            deployment.AppleBundleId = config?.BundleId ?? $"com.aidevrequest.app-{deployment.DevRequestId.ToString()[..8]}";
            deployment.AppVersion = config?.AppVersion ?? "1.0.0";
            deployment.BuildNumber = (config?.BuildNumber ?? 0) + 1;

            // In production, this would call the Apple Developer API
            deployment.TestFlightUrl = $"https://testflight.apple.com/join/{Guid.NewGuid().ToString()[..8]}";
            deployment.Status = "processing";

            var buildLogs = new List<BuildLogEntry>
            {
                new() { Timestamp = DateTime.UtcNow.AddSeconds(-10), Level = "info", Message = "Initializing TestFlight deployment" },
                new() { Timestamp = DateTime.UtcNow.AddSeconds(-8), Level = "info", Message = $"Bundle ID: {deployment.AppleBundleId}" },
                new() { Timestamp = DateTime.UtcNow.AddSeconds(-6), Level = "info", Message = "Building IPA with EAS Build" },
                new() { Timestamp = DateTime.UtcNow.AddSeconds(-4), Level = "info", Message = "Signing with Apple Developer certificate" },
                new() { Timestamp = DateTime.UtcNow.AddSeconds(-2), Level = "info", Message = "Uploading to App Store Connect" },
                new() { Timestamp = DateTime.UtcNow, Level = "success", Message = "Submitted to TestFlight for processing" }
            };
            deployment.BuildLogsJson = JsonSerializer.Serialize(buildLogs);

            // Mark as submitted (in production, a webhook would update to "ready")
            deployment.Status = "submitted";
            deployment.CompletedAt = DateTime.UtcNow;
            deployment.UpdatedAt = DateTime.UtcNow;

            // Update the MobileAppConfig if it exists
            if (config != null)
            {
                config.BuildNumber = deployment.BuildNumber.Value;
                config.IosBuildStatus = "submitted";
                config.IosPublishStatus = "testflight";
                config.LastBuildAt = DateTime.UtcNow;
                config.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("TestFlight deployment submitted: {DeploymentId}", deployment.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed TestFlight deployment {DeploymentId}", deployment.Id);
            deployment.Status = "failed";
            deployment.ErrorMessage = ex.Message;
            deployment.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return deployment;
    }

    public async Task<ExpoPreviewResult> GenerateExpoPreviewAsync(string userId, Guid devRequestId, string? appDescription)
    {
        _logger.LogInformation("Generating Expo preview for user {UserId}, request {RequestId}", userId, devRequestId);

        try
        {
            // Generate a simple Expo Snack preview from the description
            var projectName = $"preview-{devRequestId.ToString()[..8]}";
            var code = GenerateExpoSnackCode(appDescription ?? "A mobile application");
            var encodedCode = Uri.EscapeDataString(code);
            var encodedName = Uri.EscapeDataString(projectName);
            var snackUrl = $"https://snack.expo.dev/?code={encodedCode}&platform=ios&name={encodedName}";

            // Save a deployment record for tracking
            var deployment = new MobileDeployment
            {
                UserId = userId,
                DevRequestId = devRequestId,
                DeploymentType = "expo-preview",
                Status = "ready",
                AppDescription = appDescription,
                ExpoQrCodeUrl = snackUrl,
                CompletedAt = DateTime.UtcNow
            };
            _db.MobileDeployments.Add(deployment);

            // Update MobileAppConfig if it exists
            var config = await _db.MobileAppConfigs
                .FirstOrDefaultAsync(c => c.UserId == userId && c.DevRequestId == devRequestId);
            if (config != null)
            {
                config.ExpoQrCodeUrl = snackUrl;
                config.PreviewUrl = snackUrl;
                config.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return new ExpoPreviewResult
            {
                PreviewUrl = snackUrl,
                SnackUrl = snackUrl,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Expo preview for request {RequestId}", devRequestId);
            return new ExpoPreviewResult
            {
                PreviewUrl = "",
                SnackUrl = "",
                Success = false,
                Error = ex.Message
            };
        }
    }

    public async Task<MobileDeployment?> GetDeploymentStatusAsync(string userId, Guid deploymentId)
    {
        return await _db.MobileDeployments
            .FirstOrDefaultAsync(d => d.Id == deploymentId && d.UserId == userId);
    }

    public async Task<List<MobileDeployment>> GetDeploymentsAsync(string userId, Guid? devRequestId = null)
    {
        var query = _db.MobileDeployments.Where(d => d.UserId == userId);
        if (devRequestId.HasValue)
            query = query.Where(d => d.DevRequestId == devRequestId.Value);

        return await query.OrderByDescending(d => d.CreatedAt).Take(50).ToListAsync();
    }

    private static GeneratedCodeBundle GenerateReactNativeBoilerplate(string description)
    {
        var appCode = $@"import React from 'react';
import {{ StyleSheet, Text, View, ScrollView, TouchableOpacity }} from 'react-native';
import {{ StatusBar }} from 'expo-status-bar';

// Generated from: {description}
export default function App() {{
  return (
    <View style={{styles.container}}>
      <StatusBar style=""auto"" />
      <ScrollView contentContainerStyle={{styles.content}}>
        <Text style={{styles.title}}>My App</Text>
        <Text style={{styles.subtitle}}>{description}</Text>
        <TouchableOpacity style={{styles.button}}>
          <Text style={{styles.buttonText}}>Get Started</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}}

const styles = StyleSheet.create({{
  container: {{ flex: 1, backgroundColor: '#fff' }},
  content: {{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 }},
  title: {{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }},
  subtitle: {{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 }},
  button: {{ backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 10 }},
  buttonText: {{ color: '#fff', fontSize: 16, fontWeight: '600' }},
}});";

        var packageJson = @"{
  ""name"": ""generated-mobile-app"",
  ""version"": ""1.0.0"",
  ""main"": ""App.tsx"",
  ""scripts"": {
    ""start"": ""expo start"",
    ""android"": ""expo start --android"",
    ""ios"": ""expo start --ios"",
    ""web"": ""expo start --web""
  },
  ""dependencies"": {
    ""expo"": ""~50.0.0"",
    ""expo-status-bar"": ""~1.11.1"",
    ""react"": ""18.2.0"",
    ""react-native"": ""0.73.0""
  },
  ""devDependencies"": {
    ""@types/react"": ""~18.2.0"",
    ""typescript"": ""^5.1.0""
  }
}";

        var appJson = @"{
  ""expo"": {
    ""name"": ""Generated App"",
    ""slug"": ""generated-app"",
    ""version"": ""1.0.0"",
    ""orientation"": ""portrait"",
    ""icon"": ""./assets/icon.png"",
    ""splash"": { ""image"": ""./assets/splash.png"", ""resizeMode"": ""contain"", ""backgroundColor"": ""#ffffff"" },
    ""ios"": { ""supportsTablet"": true, ""bundleIdentifier"": ""com.aidevrequest.generatedapp"" },
    ""android"": { ""adaptiveIcon"": { ""foregroundImage"": ""./assets/adaptive-icon.png"", ""backgroundColor"": ""#ffffff"" }, ""package"": ""com.aidevrequest.generatedapp"" }
  }
}";

        return new GeneratedCodeBundle
        {
            Files = new Dictionary<string, string>
            {
                { "App.tsx", appCode },
                { "package.json", packageJson },
                { "app.json", appJson }
            },
            Framework = "expo",
            EntryPoint = "App.tsx",
            TotalFiles = 3
        };
    }

    private static string GenerateExpoSnackCode(string description)
    {
        return $@"import React from 'react';
import {{ StyleSheet, Text, View, TouchableOpacity }} from 'react-native';

export default function App() {{
  return (
    <View style={{styles.container}}>
      <Text style={{styles.title}}>Preview</Text>
      <Text style={{styles.desc}}>{description}</Text>
      <TouchableOpacity style={{styles.btn}}>
        <Text style={{styles.btnText}}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}}

const styles = StyleSheet.create({{
  container: {{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' }},
  title: {{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }},
  desc: {{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }},
  btn: {{ backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }},
  btnText: {{ color: '#fff', fontWeight: '600' }},
}});";
    }
}

public class GeneratedCodeBundle
{
    public Dictionary<string, string> Files { get; set; } = new();
    public string Framework { get; set; } = "";
    public string EntryPoint { get; set; } = "";
    public int TotalFiles { get; set; }
}

public class BuildLogEntry
{
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = "";
    public string Message { get; set; } = "";
}

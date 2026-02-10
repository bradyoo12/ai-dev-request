using System.Text;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISecureConfigService
{
    Task<string> GenerateEnvTemplateAsync(Guid devRequestId, string projectPath);
    Task<string> GenerateGitignoreAsync(Guid devRequestId);
    Task<string> GenerateConfigModuleAsync(Guid devRequestId, string language);
    Task<string> GenerateKeyVaultConfigAsync(Guid devRequestId);
    Task<SecretScanResult> SaveGeneratedConfigAsync(Guid devRequestId, string envTemplate, string gitignore, string configModule, string keyVaultConfig);
}

public class SecureConfigService : ISecureConfigService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SecureConfigService> _logger;

    public SecureConfigService(
        AiDevRequestDbContext context,
        ILogger<SecureConfigService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public Task<string> GenerateEnvTemplateAsync(Guid devRequestId, string projectPath)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# ====================================");
        sb.AppendLine("# Environment Configuration Template");
        sb.AppendLine("# ====================================");
        sb.AppendLine("# Copy this file to .env and fill in actual values.");
        sb.AppendLine("# NEVER commit the .env file to version control.");
        sb.AppendLine();

        sb.AppendLine("# --- Application ---");
        sb.AppendLine("NODE_ENV=development");
        sb.AppendLine("PORT=3000");
        sb.AppendLine("APP_SECRET=<your-app-secret>");
        sb.AppendLine();

        sb.AppendLine("# --- Database ---");
        sb.AppendLine("DATABASE_URL=<your-database-connection-string>");
        sb.AppendLine("# Example: postgres://user:password@localhost:5432/mydb");
        sb.AppendLine();

        sb.AppendLine("# --- Authentication ---");
        sb.AppendLine("JWT_SECRET=<your-jwt-secret-min-32-chars>");
        sb.AppendLine("# JWT_ISSUER=your-app-name");
        sb.AppendLine("# JWT_AUDIENCE=your-app-name");
        sb.AppendLine();

        sb.AppendLine("# --- OAuth Providers (optional) ---");
        sb.AppendLine("# GOOGLE_CLIENT_ID=<your-google-client-id>");
        sb.AppendLine("# GOOGLE_CLIENT_SECRET=<your-google-client-secret>");
        sb.AppendLine();

        sb.AppendLine("# --- AI / API Keys ---");
        sb.AppendLine("# OPENAI_API_KEY=<your-openai-api-key>");
        sb.AppendLine("# ANTHROPIC_API_KEY=<your-anthropic-api-key>");
        sb.AppendLine();

        sb.AppendLine("# --- Cloud Provider ---");
        sb.AppendLine("# AWS_ACCESS_KEY_ID=<your-aws-access-key>");
        sb.AppendLine("# AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>");
        sb.AppendLine("# AWS_REGION=us-east-1");
        sb.AppendLine();

        sb.AppendLine("# --- Payments ---");
        sb.AppendLine("# STRIPE_SECRET_KEY=<your-stripe-secret-key>");
        sb.AppendLine("# STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>");
        sb.AppendLine("# STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>");
        sb.AppendLine();

        sb.AppendLine("# --- Azure Key Vault (production) ---");
        sb.AppendLine("# AZURE_KEY_VAULT_URL=https://<vault-name>.vault.azure.net/");
        sb.AppendLine("# AZURE_CLIENT_ID=<your-azure-client-id>");
        sb.AppendLine("# AZURE_TENANT_ID=<your-azure-tenant-id>");

        return Task.FromResult(sb.ToString());
    }

    public Task<string> GenerateGitignoreAsync(Guid devRequestId)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# ====================================");
        sb.AppendLine("# Secret & Configuration Files");
        sb.AppendLine("# ====================================");
        sb.AppendLine();
        sb.AppendLine("# Environment files");
        sb.AppendLine(".env");
        sb.AppendLine(".env.local");
        sb.AppendLine(".env.*.local");
        sb.AppendLine(".env.production");
        sb.AppendLine(".env.staging");
        sb.AppendLine();
        sb.AppendLine("# Secret files");
        sb.AppendLine("*.pem");
        sb.AppendLine("*.key");
        sb.AppendLine("*.p12");
        sb.AppendLine("*.pfx");
        sb.AppendLine("*.jks");
        sb.AppendLine("*.keystore");
        sb.AppendLine();
        sb.AppendLine("# Credential files");
        sb.AppendLine("credentials.json");
        sb.AppendLine("service-account.json");
        sb.AppendLine("*-credentials.json");
        sb.AppendLine("**/secrets/");
        sb.AppendLine();
        sb.AppendLine("# Azure");
        sb.AppendLine("appsettings.Local.json");
        sb.AppendLine("appsettings.Production.json");
        sb.AppendLine();
        sb.AppendLine("# AWS");
        sb.AppendLine(".aws/credentials");
        sb.AppendLine();
        sb.AppendLine("# IDE & OS");
        sb.AppendLine(".vs/");
        sb.AppendLine(".idea/");
        sb.AppendLine(".vscode/settings.json");
        sb.AppendLine("Thumbs.db");
        sb.AppendLine(".DS_Store");

        return Task.FromResult(sb.ToString());
    }

    public Task<string> GenerateConfigModuleAsync(Guid devRequestId, string language)
    {
        string content;

        if (language.Equals("csharp", StringComparison.OrdinalIgnoreCase) ||
            language.Equals("dotnet", StringComparison.OrdinalIgnoreCase))
        {
            content = GenerateCSharpConfigModule();
        }
        else if (language.Equals("python", StringComparison.OrdinalIgnoreCase))
        {
            content = GeneratePythonConfigModule();
        }
        else
        {
            // Default to TypeScript
            content = GenerateTypeScriptConfigModule();
        }

        return Task.FromResult(content);
    }

    public Task<string> GenerateKeyVaultConfigAsync(Guid devRequestId)
    {
        var sb = new StringBuilder();
        sb.AppendLine("// Azure Key Vault Integration Configuration");
        sb.AppendLine("// ==========================================");
        sb.AppendLine("//");
        sb.AppendLine("// Prerequisites:");
        sb.AppendLine("//   1. Create an Azure Key Vault instance");
        sb.AppendLine("//   2. Enable Managed Identity on your Azure Container App");
        sb.AppendLine("//   3. Grant 'Key Vault Secrets User' role to the managed identity");
        sb.AppendLine("//");
        sb.AppendLine("// Bicep snippet for Key Vault:");
        sb.AppendLine("//");
        sb.AppendLine("// resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {");
        sb.AppendLine("//   name: 'kv-${projectName}'");
        sb.AppendLine("//   location: location");
        sb.AppendLine("//   properties: {");
        sb.AppendLine("//     sku: { family: 'A', name: 'standard' }");
        sb.AppendLine("//     tenantId: subscription().tenantId");
        sb.AppendLine("//     enableRbacAuthorization: true");
        sb.AppendLine("//   }");
        sb.AppendLine("// }");
        sb.AppendLine("//");
        sb.AppendLine();
        sb.AppendLine("// .NET Configuration (Program.cs):");
        sb.AppendLine("// --------------------------------");
        sb.AppendLine("// var keyVaultUrl = builder.Configuration[\"AZURE_KEY_VAULT_URL\"];");
        sb.AppendLine("// if (!string.IsNullOrEmpty(keyVaultUrl))");
        sb.AppendLine("// {");
        sb.AppendLine("//     builder.Configuration.AddAzureKeyVault(");
        sb.AppendLine("//         new Uri(keyVaultUrl),");
        sb.AppendLine("//         new DefaultAzureCredential());");
        sb.AppendLine("// }");
        sb.AppendLine();
        sb.AppendLine("// Secret naming convention in Key Vault:");
        sb.AppendLine("// Key Vault secret names use hyphens instead of underscores/colons.");
        sb.AppendLine("//   .env name           -> Key Vault name");
        sb.AppendLine("//   DATABASE_URL         -> database-url");
        sb.AppendLine("//   JWT_SECRET           -> jwt-secret");
        sb.AppendLine("//   STRIPE_SECRET_KEY    -> stripe-secret-key");
        sb.AppendLine("//   OPENAI_API_KEY       -> openai-api-key");
        sb.AppendLine();
        sb.AppendLine("// Recommended secrets to store in Key Vault:");
        sb.AppendLine("// - database-url");
        sb.AppendLine("// - jwt-secret");
        sb.AppendLine("// - stripe-secret-key");
        sb.AppendLine("// - openai-api-key");
        sb.AppendLine("// - anthropic-api-key");
        sb.AppendLine("// - google-client-secret");

        return Task.FromResult(sb.ToString());
    }

    public async Task<SecretScanResult> SaveGeneratedConfigAsync(
        Guid devRequestId,
        string envTemplate,
        string gitignore,
        string configModule,
        string keyVaultConfig)
    {
        var existing = await _context.SecretScanResults
            .Where(r => r.DevRequestId == devRequestId)
            .OrderByDescending(r => r.ScannedAt)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            existing.EnvTemplateContent = envTemplate;
            existing.GitignoreContent = gitignore;
            existing.ConfigModuleContent = configModule;
            existing.KeyVaultConfigContent = keyVaultConfig;
        }
        else
        {
            existing = new SecretScanResult
            {
                DevRequestId = devRequestId,
                FindingsJson = "[]",
                FindingCount = 0,
                Status = "completed",
                EnvTemplateContent = envTemplate,
                GitignoreContent = gitignore,
                ConfigModuleContent = configModule,
                KeyVaultConfigContent = keyVaultConfig,
                ScannedAt = DateTime.UtcNow
            };
            _context.SecretScanResults.Add(existing);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Saved generated config for {DevRequestId}", devRequestId);

        return existing;
    }

    #region Private Helpers

    private static string GenerateTypeScriptConfigModule()
    {
        return @"// config.ts - Type-safe environment variable access
// ================================================

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}

export const config = {
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  appSecret: requireEnv('APP_SECRET'),

  database: {
    url: requireEnv('DATABASE_URL'),
  },

  auth: {
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtIssuer: optionalEnv('JWT_ISSUER', 'my-app'),
    jwtAudience: optionalEnv('JWT_AUDIENCE', 'my-app'),
  },

  stripe: {
    secretKey: optionalEnv('STRIPE_SECRET_KEY'),
    publishableKey: optionalEnv('STRIPE_PUBLISHABLE_KEY'),
    webhookSecret: optionalEnv('STRIPE_WEBHOOK_SECRET'),
  },

  ai: {
    openaiApiKey: optionalEnv('OPENAI_API_KEY'),
    anthropicApiKey: optionalEnv('ANTHROPIC_API_KEY'),
  },

  azure: {
    keyVaultUrl: optionalEnv('AZURE_KEY_VAULT_URL'),
  },
} as const;
";
    }

    private static string GenerateCSharpConfigModule()
    {
        return @"// AppConfig.cs - Type-safe configuration access
// ==============================================

public class AppConfig
{
    public string AppSecret { get; init; } = """";
    public DatabaseConfig Database { get; init; } = new();
    public AuthConfig Auth { get; init; } = new();
    public StripeConfig Stripe { get; init; } = new();
    public AiConfig Ai { get; init; } = new();
    public AzureConfig Azure { get; init; } = new();
}

public class DatabaseConfig
{
    public string ConnectionString { get; init; } = """";
}

public class AuthConfig
{
    public string JwtSecret { get; init; } = """";
    public string JwtIssuer { get; init; } = ""my-app"";
    public string JwtAudience { get; init; } = ""my-app"";
}

public class StripeConfig
{
    public string SecretKey { get; init; } = """";
    public string PublishableKey { get; init; } = """";
    public string WebhookSecret { get; init; } = """";
}

public class AiConfig
{
    public string OpenAiApiKey { get; init; } = """";
    public string AnthropicApiKey { get; init; } = """";
}

public class AzureConfig
{
    public string KeyVaultUrl { get; init; } = """";
}

// Registration in Program.cs:
// builder.Services.Configure<AppConfig>(builder.Configuration.GetSection(""App""));
";
    }

    private static string GeneratePythonConfigModule()
    {
        return @"# config.py - Type-safe environment variable access
# ================================================
import os
from dataclasses import dataclass


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f""Missing required environment variable: {name}"")
    return value


def optional_env(name: str, default: str = """") -> str:
    return os.getenv(name, default)


@dataclass(frozen=True)
class DatabaseConfig:
    url: str


@dataclass(frozen=True)
class AuthConfig:
    jwt_secret: str
    jwt_issuer: str = ""my-app""
    jwt_audience: str = ""my-app""


@dataclass(frozen=True)
class Config:
    node_env: str
    port: int
    app_secret: str
    database: DatabaseConfig
    auth: AuthConfig


def load_config() -> Config:
    return Config(
        node_env=optional_env(""NODE_ENV"", ""development""),
        port=int(optional_env(""PORT"", ""3000"")),
        app_secret=require_env(""APP_SECRET""),
        database=DatabaseConfig(url=require_env(""DATABASE_URL"")),
        auth=AuthConfig(jwt_secret=require_env(""JWT_SECRET"")),
    )


config = load_config()
";
    }

    #endregion
}

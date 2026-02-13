using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/production-sandboxes")]
[Authorize]
public class ProductionSandboxController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public ProductionSandboxController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListSandboxes([FromQuery] string? provider = null)
    {
        var userId = GetUserId();
        var query = _db.ProductionSandboxes.Where(s => s.UserId == userId);
        if (!string.IsNullOrEmpty(provider))
            query = query.Where(s => s.Provider == provider);
        var sandboxes = await query.OrderByDescending(s => s.UpdatedAt).Take(50).ToListAsync();
        return Ok(sandboxes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSandbox(Guid id)
    {
        var userId = GetUserId();
        var sandbox = await _db.ProductionSandboxes.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (sandbox == null) return NotFound();
        return Ok(sandbox);
    }

    public record CreateSandboxRequest(string? SandboxName, string? Provider, string? Region, int? DevRequestId);

    [HttpPost]
    public async Task<IActionResult> CreateSandbox([FromBody] CreateSandboxRequest req)
    {
        var userId = GetUserId();
        var activeCount = await _db.ProductionSandboxes.CountAsync(s => s.UserId == userId && (s.Status == "running" || s.Status == "provisioning"));
        if (activeCount >= 5) return BadRequest("Maximum 5 active sandboxes");

        var rng = new Random();
        var provider = req.Provider ?? "azure";

        var envVarTemplates = new Dictionary<string, string[]>
        {
            ["azure"] = new[] { "AZURE_CLIENT_ID", "AZURE_TENANT_ID", "AZURE_SUBSCRIPTION_ID", "AZURE_STORAGE_CONNECTION", "APPLICATIONINSIGHTS_KEY", "AZURE_SQL_CONNECTION" },
            ["aws"] = new[] { "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "AWS_S3_BUCKET", "AWS_DYNAMODB_TABLE", "AWS_SQS_QUEUE_URL" },
            ["vercel"] = new[] { "VERCEL_TOKEN", "VERCEL_PROJECT_ID", "VERCEL_ORG_ID", "DATABASE_URL", "NEXT_PUBLIC_API_URL", "REDIS_URL" },
        };

        var serviceTemplates = new Dictionary<string, string[]>
        {
            ["azure"] = new[] { "Azure SQL Database", "Blob Storage", "App Service", "Application Insights", "Key Vault" },
            ["aws"] = new[] { "RDS PostgreSQL", "S3 Bucket", "Lambda Functions", "CloudWatch", "Secrets Manager" },
            ["vercel"] = new[] { "Vercel Postgres", "Vercel Blob", "Edge Functions", "Analytics", "KV Store" },
        };

        var envVars = envVarTemplates.GetValueOrDefault(provider, envVarTemplates["azure"]);
        var services = serviceTemplates.GetValueOrDefault(provider, serviceTemplates["azure"]);
        var selectedEnvVars = envVars.Take(rng.Next(3, envVars.Length + 1)).ToArray();
        var selectedServices = services.Take(rng.Next(2, services.Length + 1)).ToArray();

        var sandbox = new ProductionSandbox
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SandboxName = req.SandboxName ?? $"sandbox-{DateTime.UtcNow:yyyyMMdd-HHmmss}",
            Provider = provider,
            Status = "running",
            EnvVarsJson = System.Text.Json.JsonSerializer.Serialize(selectedEnvVars),
            EnvVarCount = selectedEnvVars.Length,
            ServicesJson = System.Text.Json.JsonSerializer.Serialize(selectedServices),
            ServiceCount = selectedServices.Length,
            Region = req.Region ?? (provider == "azure" ? "eastus" : provider == "aws" ? "us-east-1" : "iad1"),
            OAuthConnected = true,
            UptimeMinutes = 0,
            CostUsd = 0,
            DevRequestId = req.DevRequestId,
        };

        _db.ProductionSandboxes.Add(sandbox);
        await _db.SaveChangesAsync();
        return Ok(sandbox);
    }

    [HttpPost("{id}/stop")]
    public async Task<IActionResult> StopSandbox(Guid id)
    {
        var userId = GetUserId();
        var sandbox = await _db.ProductionSandboxes.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (sandbox == null) return NotFound();

        sandbox.Status = "stopped";
        sandbox.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(sandbox);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSandbox(Guid id)
    {
        var userId = GetUserId();
        var sandbox = await _db.ProductionSandboxes.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (sandbox == null) return NotFound();

        _db.ProductionSandboxes.Remove(sandbox);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var sandboxes = await _db.ProductionSandboxes.Where(s => s.UserId == userId).ToListAsync();
        if (sandboxes.Count == 0)
            return Ok(new
            {
                totalSandboxes = 0, activeSandboxes = 0, totalEnvVars = 0, totalServices = 0,
                totalUptimeMinutes = 0.0, totalCostUsd = 0.0,
                byProvider = Array.Empty<object>(), byStatus = Array.Empty<object>()
            });

        var byProvider = sandboxes.GroupBy(s => s.Provider).Select(g => new
        {
            provider = g.Key,
            count = g.Count(),
            envVars = g.Sum(s => s.EnvVarCount),
            services = g.Sum(s => s.ServiceCount)
        }).ToList();

        var byStatus = sandboxes.GroupBy(s => s.Status).Select(g => new
        {
            status = g.Key,
            count = g.Count()
        }).ToList();

        return Ok(new
        {
            totalSandboxes = sandboxes.Count,
            activeSandboxes = sandboxes.Count(s => s.Status == "running"),
            totalEnvVars = sandboxes.Sum(s => s.EnvVarCount),
            totalServices = sandboxes.Sum(s => s.ServiceCount),
            totalUptimeMinutes = Math.Round(sandboxes.Sum(s => s.UptimeMinutes), 1),
            totalCostUsd = Math.Round(sandboxes.Sum(s => s.CostUsd), 2),
            byProvider,
            byStatus
        });
    }

    [AllowAnonymous]
    [HttpGet("providers")]
    public IActionResult GetProviders()
    {
        var providers = new[]
        {
            new { id = "azure", name = "Microsoft Azure", description = "Azure App Service, SQL, Storage, Key Vault", color = "#0078D4" },
            new { id = "aws", name = "Amazon Web Services", description = "EC2, RDS, S3, Lambda, CloudWatch", color = "#FF9900" },
            new { id = "vercel", name = "Vercel", description = "Edge Functions, Postgres, Blob, KV Store", color = "#000000" },
        };
        return Ok(providers);
    }
}

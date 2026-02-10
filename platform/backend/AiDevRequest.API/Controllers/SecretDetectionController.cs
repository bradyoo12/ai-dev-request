using System.Security.Claims;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
public class SecretDetectionController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ISecretDetectionService _secretDetectionService;
    private readonly ISecureConfigService _secureConfigService;
    private readonly ILogger<SecretDetectionController> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public SecretDetectionController(
        AiDevRequestDbContext context,
        ISecretDetectionService secretDetectionService,
        ISecureConfigService secureConfigService,
        ILogger<SecretDetectionController> logger)
    {
        _context = context;
        _secretDetectionService = secretDetectionService;
        _secureConfigService = secureConfigService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Trigger a secret scan on project code
    /// </summary>
    [HttpPost("api/projects/{requestId:guid}/secrets/scan")]
    [ProducesResponseType(typeof(SecretScanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SecretScanResponse>> TriggerScan(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        if (string.IsNullOrEmpty(entity.ProjectPath))
            return BadRequest(new { error = "Project has not been built yet." });

        _logger.LogInformation("Triggering secret scan for request {RequestId}", requestId);

        try
        {
            var result = await _secretDetectionService.ScanCodeAsync(requestId, entity.ProjectPath);
            var findings = JsonSerializer.Deserialize<List<SecretFinding>>(result.FindingsJson, JsonOptions)
                ?? new List<SecretFinding>();

            return Ok(new SecretScanResponse
            {
                ScanResultId = result.Id,
                FindingCount = result.FindingCount,
                CriticalCount = findings.Count(f => f.Severity == "critical"),
                HighCount = findings.Count(f => f.Severity == "high"),
                MediumCount = findings.Count(f => f.Severity == "medium"),
                LowCount = findings.Count(f => f.Severity == "low"),
                Status = result.Status,
                ScannedAt = result.ScannedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Secret scan failed for request {RequestId}", requestId);
            return StatusCode(500, new { error = "Secret scan failed." });
        }
    }

    /// <summary>
    /// Get secret scan results for a project
    /// </summary>
    [HttpGet("api/projects/{requestId:guid}/secrets/results")]
    [ProducesResponseType(typeof(SecretScanDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SecretScanDetailResponse>> GetResults(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var result = await _context.SecretScanResults
            .Where(r => r.DevRequestId == requestId)
            .OrderByDescending(r => r.ScannedAt)
            .FirstOrDefaultAsync();

        if (result == null)
            return NotFound(new { error = "No scan results found. Run a secret scan first." });

        var findings = JsonSerializer.Deserialize<List<SecretFinding>>(result.FindingsJson, JsonOptions)
            ?? new List<SecretFinding>();

        return Ok(new SecretScanDetailResponse
        {
            Id = result.Id,
            DevRequestId = result.DevRequestId,
            Findings = findings,
            FindingCount = result.FindingCount,
            Status = result.Status,
            ScannedAt = result.ScannedAt
        });
    }

    /// <summary>
    /// Get list of secret detection patterns
    /// </summary>
    [HttpGet("api/secrets/patterns")]
    [ProducesResponseType(typeof(List<SecretPatternResponse>), StatusCodes.Status200OK)]
    public ActionResult<List<SecretPatternResponse>> GetPatterns()
    {
        var patterns = _secretDetectionService.GetPatterns()
            .Select(p => new SecretPatternResponse
            {
                Id = p.Id,
                Name = p.Name,
                Severity = p.Severity,
                Description = p.Description
            })
            .ToList();

        return Ok(patterns);
    }

    /// <summary>
    /// Generate secure configuration files for a project
    /// </summary>
    [HttpPost("api/projects/{requestId:guid}/secrets/config/generate")]
    [ProducesResponseType(typeof(SecureConfigResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SecureConfigResponse>> GenerateConfig(
        Guid requestId,
        [FromQuery] string language = "typescript")
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        _logger.LogInformation("Generating secure config for request {RequestId} (language: {Language})",
            requestId, language);

        try
        {
            var envTemplate = await _secureConfigService.GenerateEnvTemplateAsync(requestId, entity.ProjectPath ?? "");
            var gitignore = await _secureConfigService.GenerateGitignoreAsync(requestId);
            var configModule = await _secureConfigService.GenerateConfigModuleAsync(requestId, language);
            var keyVaultConfig = await _secureConfigService.GenerateKeyVaultConfigAsync(requestId);

            var result = await _secureConfigService.SaveGeneratedConfigAsync(
                requestId, envTemplate, gitignore, configModule, keyVaultConfig);

            return Ok(new SecureConfigResponse
            {
                Id = result.Id,
                EnvTemplate = envTemplate,
                Gitignore = gitignore,
                ConfigModule = configModule,
                KeyVaultConfig = keyVaultConfig,
                Language = language
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Config generation failed for request {RequestId}", requestId);
            return StatusCode(500, new { error = "Config generation failed." });
        }
    }

    /// <summary>
    /// Get previously generated secure configuration for a project
    /// </summary>
    [HttpGet("api/projects/{requestId:guid}/secrets/config")]
    [ProducesResponseType(typeof(SecureConfigResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SecureConfigResponse>> GetConfig(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var result = await _context.SecretScanResults
            .Where(r => r.DevRequestId == requestId && r.EnvTemplateContent != null)
            .OrderByDescending(r => r.ScannedAt)
            .FirstOrDefaultAsync();

        if (result == null)
            return NotFound(new { error = "No generated config found. Generate config first." });

        return Ok(new SecureConfigResponse
        {
            Id = result.Id,
            EnvTemplate = result.EnvTemplateContent ?? "",
            Gitignore = result.GitignoreContent ?? "",
            ConfigModule = result.ConfigModuleContent ?? "",
            KeyVaultConfig = result.KeyVaultConfigContent ?? "",
            Language = "unknown"
        });
    }
}

#region Response DTOs

public record SecretScanResponse
{
    public Guid ScanResultId { get; init; }
    public int FindingCount { get; init; }
    public int CriticalCount { get; init; }
    public int HighCount { get; init; }
    public int MediumCount { get; init; }
    public int LowCount { get; init; }
    public string Status { get; init; } = "";
    public DateTime ScannedAt { get; init; }
}

public record SecretScanDetailResponse
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public List<SecretFinding> Findings { get; init; } = new();
    public int FindingCount { get; init; }
    public string Status { get; init; } = "";
    public DateTime ScannedAt { get; init; }
}

public record SecretPatternResponse
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string Severity { get; init; } = "";
    public string Description { get; init; } = "";
}

public record SecureConfigResponse
{
    public Guid Id { get; init; }
    public string EnvTemplate { get; init; } = "";
    public string Gitignore { get; init; } = "";
    public string ConfigModule { get; init; } = "";
    public string KeyVaultConfig { get; init; } = "";
    public string Language { get; init; } = "";
}

#endregion

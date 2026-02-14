using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/local-models")]
[Authorize]
public class LocalModelController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILocalModelInferenceService _inferenceService;

    public LocalModelController(AiDevRequestDbContext db, ILocalModelInferenceService inferenceService)
    {
        _db = db;
        _inferenceService = inferenceService;
    }

    /// <summary>
    /// List all configured local models.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LocalModelConfigDto>>> GetAll()
    {
        var models = await _db.LocalModelConfigs
            .OrderByDescending(m => m.IsActive)
            .ThenBy(m => m.ModelName)
            .Select(m => ToDto(m))
            .ToListAsync();

        return Ok(models);
    }

    /// <summary>
    /// Get a specific local model configuration by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LocalModelConfigDto>> GetById(Guid id)
    {
        var model = await _db.LocalModelConfigs.FindAsync(id);
        if (model == null) return NotFound();

        return Ok(ToDto(model));
    }

    /// <summary>
    /// Add a new local model configuration.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<LocalModelConfigDto>> Create([FromBody] CreateLocalModelConfigDto dto)
    {
        var existing = await _db.LocalModelConfigs
            .AnyAsync(m => m.ModelName == dto.ModelName);
        if (existing)
            return Conflict(new { error = $"A model with name '{dto.ModelName}' already exists." });

        var model = new LocalModelConfig
        {
            ModelName = dto.ModelName,
            Endpoint = dto.Endpoint,
            DisplayName = dto.DisplayName,
            ModelLocation = dto.ModelLocation ?? "LocalGPU",
            GpuType = dto.GpuType,
            GpuCount = dto.GpuCount ?? 1,
            IsActive = dto.IsActive ?? true,
            CostPerSecond = dto.CostPerSecond ?? 0,
            MaxTokens = dto.MaxTokens ?? 8192,
            CapabilitiesJson = dto.CapabilitiesJson,
            HealthCheckUrl = dto.HealthCheckUrl
        };

        _db.LocalModelConfigs.Add(model);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = model.Id }, ToDto(model));
    }

    /// <summary>
    /// Update an existing local model configuration.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LocalModelConfigDto>> Update(Guid id, [FromBody] UpdateLocalModelConfigDto dto)
    {
        var model = await _db.LocalModelConfigs.FindAsync(id);
        if (model == null) return NotFound();

        if (dto.ModelName != null) model.ModelName = dto.ModelName;
        if (dto.Endpoint != null) model.Endpoint = dto.Endpoint;
        if (dto.DisplayName != null) model.DisplayName = dto.DisplayName;
        if (dto.ModelLocation != null) model.ModelLocation = dto.ModelLocation;
        if (dto.GpuType != null) model.GpuType = dto.GpuType;
        if (dto.GpuCount.HasValue) model.GpuCount = dto.GpuCount.Value;
        if (dto.IsActive.HasValue) model.IsActive = dto.IsActive.Value;
        if (dto.CostPerSecond.HasValue) model.CostPerSecond = dto.CostPerSecond.Value;
        if (dto.MaxTokens.HasValue) model.MaxTokens = dto.MaxTokens.Value;
        if (dto.CapabilitiesJson != null) model.CapabilitiesJson = dto.CapabilitiesJson;
        if (dto.HealthCheckUrl != null) model.HealthCheckUrl = dto.HealthCheckUrl;

        model.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(model));
    }

    /// <summary>
    /// Remove a local model configuration.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var model = await _db.LocalModelConfigs.FindAsync(id);
        if (model == null) return NotFound();

        _db.LocalModelConfigs.Remove(model);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Check the health of a specific local model endpoint.
    /// </summary>
    [HttpGet("{id:guid}/health")]
    public async Task<ActionResult<LocalModelHealthResult>> CheckHealth(Guid id)
    {
        var model = await _db.LocalModelConfigs.FindAsync(id);
        if (model == null) return NotFound();

        var result = await _inferenceService.CheckHealthAsync(model.ModelName);
        return Ok(result);
    }

    /// <summary>
    /// Test inference with a sample prompt on a local model.
    /// </summary>
    [HttpPost("{id:guid}/test")]
    public async Task<ActionResult<LocalModelTestResultDto>> TestInference(Guid id, [FromBody] LocalModelTestRequestDto? request = null)
    {
        var model = await _db.LocalModelConfigs.FindAsync(id);
        if (model == null) return NotFound();

        var prompt = request?.Prompt ?? "Hello, what is 2 + 2?";

        try
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var response = await _inferenceService.GenerateAsync(prompt, model.ModelName);
            sw.Stop();

            return Ok(new LocalModelTestResultDto
            {
                ModelName = model.ModelName,
                Prompt = prompt,
                Response = response,
                LatencyMs = (int)sw.ElapsedMilliseconds,
                Success = true
            });
        }
        catch (Exception ex)
        {
            return Ok(new LocalModelTestResultDto
            {
                ModelName = model.ModelName,
                Prompt = prompt,
                Response = null,
                Error = ex.Message,
                Success = false
            });
        }
    }

    private static LocalModelConfigDto ToDto(LocalModelConfig m) => new()
    {
        Id = m.Id,
        ModelName = m.ModelName,
        Endpoint = m.Endpoint,
        DisplayName = m.DisplayName,
        ModelLocation = m.ModelLocation,
        GpuType = m.GpuType,
        GpuCount = m.GpuCount,
        IsActive = m.IsActive,
        CostPerSecond = m.CostPerSecond,
        MaxTokens = m.MaxTokens,
        CapabilitiesJson = m.CapabilitiesJson,
        HealthCheckUrl = m.HealthCheckUrl,
        CreatedAt = m.CreatedAt,
        UpdatedAt = m.UpdatedAt
    };
}

// --- DTOs ---

public class LocalModelConfigDto
{
    public Guid Id { get; set; }
    public string ModelName { get; set; } = "";
    public string Endpoint { get; set; } = "";
    public string? DisplayName { get; set; }
    public string ModelLocation { get; set; } = "LocalGPU";
    public string? GpuType { get; set; }
    public int GpuCount { get; set; }
    public bool IsActive { get; set; }
    public decimal CostPerSecond { get; set; }
    public int MaxTokens { get; set; }
    public string? CapabilitiesJson { get; set; }
    public string? HealthCheckUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateLocalModelConfigDto
{
    public required string ModelName { get; set; }
    public required string Endpoint { get; set; }
    public string? DisplayName { get; set; }
    public string? ModelLocation { get; set; }
    public string? GpuType { get; set; }
    public int? GpuCount { get; set; }
    public bool? IsActive { get; set; }
    public decimal? CostPerSecond { get; set; }
    public int? MaxTokens { get; set; }
    public string? CapabilitiesJson { get; set; }
    public string? HealthCheckUrl { get; set; }
}

public class UpdateLocalModelConfigDto
{
    public string? ModelName { get; set; }
    public string? Endpoint { get; set; }
    public string? DisplayName { get; set; }
    public string? ModelLocation { get; set; }
    public string? GpuType { get; set; }
    public int? GpuCount { get; set; }
    public bool? IsActive { get; set; }
    public decimal? CostPerSecond { get; set; }
    public int? MaxTokens { get; set; }
    public string? CapabilitiesJson { get; set; }
    public string? HealthCheckUrl { get; set; }
}

public class LocalModelTestRequestDto
{
    public string? Prompt { get; set; }
}

public class LocalModelTestResultDto
{
    public string ModelName { get; set; } = "";
    public string Prompt { get; set; } = "";
    public string? Response { get; set; }
    public string? Error { get; set; }
    public int LatencyMs { get; set; }
    public bool Success { get; set; }
}

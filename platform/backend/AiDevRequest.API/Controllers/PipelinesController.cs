using System.Security.Claims;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PipelinesController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<PipelinesController> _logger;

    public PipelinesController(AiDevRequestDbContext context, ILogger<PipelinesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// List all pipelines for the current user plus public templates
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PipelineDto>>> ListPipelines()
    {
        var userId = GetUserId();
        var entities = await _context.DevPipelines
            .Where(p => p.UserId == userId || p.IsTemplate)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

        var pipelines = entities.Select(p => ToDto(p, userId)).ToList();
        return Ok(pipelines);
    }

    /// <summary>
    /// Get a single pipeline by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PipelineDto>> GetPipeline(Guid id)
    {
        var userId = GetUserId();
        var p = await _context.DevPipelines
            .FirstOrDefaultAsync(p => p.Id == id && (p.UserId == userId || p.IsTemplate));

        if (p == null)
            return NotFound(new { error = "Pipeline not found." });

        return Ok(ToDto(p, userId));
    }

    /// <summary>
    /// Create a new pipeline
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PipelineDto>> CreatePipeline([FromBody] CreatePipelineRequestDto request)
    {
        var userId = GetUserId();

        // Limit to 20 pipelines per user
        var count = await _context.DevPipelines.CountAsync(p => p.UserId == userId);
        if (count >= 20)
            return BadRequest(new { error = "Maximum of 20 pipelines per user." });

        if (request.Steps == null || request.Steps.Count == 0)
            return BadRequest(new { error = "Pipeline must have at least one step." });

        var pipeline = new DevPipeline
        {
            UserId = userId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? "Untitled Pipeline" : request.Name.Trim(),
            Description = request.Description?.Trim(),
            StepsJson = JsonSerializer.Serialize(request.Steps),
            Status = PipelineStatus.Active,
        };

        _context.DevPipelines.Add(pipeline);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Pipeline created for user {UserId}: {PipelineId}", userId, pipeline.Id);

        return Ok(ToDto(pipeline, userId));
    }

    /// <summary>
    /// Update an existing pipeline
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PipelineDto>> UpdatePipeline(Guid id, [FromBody] UpdatePipelineRequestDto request)
    {
        var userId = GetUserId();
        var pipeline = await _context.DevPipelines
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

        if (pipeline == null)
            return NotFound(new { error = "Pipeline not found." });

        if (request.Name != null)
            pipeline.Name = request.Name.Trim();

        if (request.Description != null)
            pipeline.Description = request.Description.Trim();

        if (request.Steps != null && request.Steps.Count > 0)
            pipeline.StepsJson = JsonSerializer.Serialize(request.Steps);

        pipeline.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ToDto(pipeline, userId));
    }

    /// <summary>
    /// Delete a pipeline
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeletePipeline(Guid id)
    {
        var userId = GetUserId();
        var pipeline = await _context.DevPipelines
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

        if (pipeline == null)
            return NotFound(new { error = "Pipeline not found." });

        _context.DevPipelines.Remove(pipeline);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Pipeline deleted for user {UserId}: {PipelineId}", userId, id);

        return Ok(new { message = "Pipeline deleted." });
    }

    private static PipelineDto ToDto(DevPipeline p, string userId) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        Steps = JsonSerializer.Deserialize<List<PipelineStepDto>>(p.StepsJson) ?? new(),
        Status = p.Status.ToString(),
        IsTemplate = p.IsTemplate,
        TemplateCategory = p.TemplateCategory,
        ExecutionCount = p.ExecutionCount,
        IsOwner = p.UserId == userId,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
    };
}

public class PipelineStepDto
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? CustomPrompt { get; set; }
    public bool Enabled { get; set; } = true;
}

public class PipelineDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public List<PipelineStepDto> Steps { get; set; } = new();
    public string Status { get; set; } = "";
    public bool IsTemplate { get; set; }
    public string? TemplateCategory { get; set; }
    public int ExecutionCount { get; set; }
    public bool IsOwner { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreatePipelineRequestDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public List<PipelineStepDto> Steps { get; set; } = new();
}

public class UpdatePipelineRequestDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public List<PipelineStepDto>? Steps { get; set; }
}

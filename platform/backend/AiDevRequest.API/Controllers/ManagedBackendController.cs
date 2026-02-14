using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/managed-backend")]
public class ManagedBackendController : ControllerBase
{
    private readonly IManagedBackendService _service;
    private readonly ILogger<ManagedBackendController> _logger;

    public ManagedBackendController(IManagedBackendService service, ILogger<ManagedBackendController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var backends = await _service.GetAllAsync();
            return Ok(backends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing managed backends");
            return Ok(Array.Empty<object>());
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var backend = await _service.GetByIdAsync(id);
            if (backend == null) return NotFound();
            return Ok(backend);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting managed backend {Id}", id);
            return NotFound();
        }
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetByProject(Guid projectId)
    {
        try
        {
            var backend = await _service.GetByProjectIdAsync(projectId);
            if (backend == null) return NotFound();
            return Ok(backend);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting managed backend for project {ProjectId}", projectId);
            return NotFound();
        }
    }

    [HttpPost("provision")]
    public async Task<IActionResult> Provision([FromBody] ProvisionRequest request)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value ?? "anonymous";
            var backend = await _service.ProvisionAsync(request.ProjectId, userId, request.Tier ?? "Free");
            return Ok(backend);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/deprovision")]
    public async Task<IActionResult> Deprovision(Guid id)
    {
        try
        {
            var backend = await _service.DeprovisionAsync(id);
            return Ok(backend);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var stats = await _service.GetStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting managed backend stats");
            return Ok(new { total = 0 });
        }
    }

    [HttpPost("{id:guid}/health-check")]
    public async Task<IActionResult> HealthCheck(Guid id)
    {
        try
        {
            var backend = await _service.HealthCheckAsync(id);
            return Ok(backend);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}/tier")]
    public async Task<IActionResult> UpdateTier(Guid id, [FromBody] UpdateTierRequest request)
    {
        try
        {
            var backend = await _service.UpdateTierAsync(id, request.Tier);
            return Ok(backend);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public record ProvisionRequest
{
    public Guid ProjectId { get; init; }
    public string? Tier { get; init; }
}

public record UpdateTierRequest
{
    public string Tier { get; init; } = "Free";
}

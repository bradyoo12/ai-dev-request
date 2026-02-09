using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/microservices")]
[Authorize]
public class MicroserviceController : ControllerBase
{
    private readonly IMicroserviceService _microserviceService;

    public MicroserviceController(IMicroserviceService microserviceService)
    {
        _microserviceService = microserviceService;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    // GET /api/microservices/blueprints
    [HttpGet("blueprints")]
    public async Task<IActionResult> GetBlueprints()
    {
        var userId = GetUserId();
        var blueprints = await _microserviceService.GetBlueprintsAsync(userId);
        return Ok(blueprints.Select(b => new BlueprintSummaryDto
        {
            Id = b.Id,
            Name = b.Name,
            ServiceCount = b.ServiceCount,
            CreatedAt = b.CreatedAt,
        }));
    }

    // GET /api/microservices/blueprints/{id}
    [HttpGet("blueprints/{id}")]
    public async Task<IActionResult> GetBlueprint(int id)
    {
        var userId = GetUserId();
        var bp = await _microserviceService.GetBlueprintAsync(id, userId);
        if (bp == null) return NotFound(new { error = "Blueprint not found." });
        return Ok(new BlueprintDetailDto
        {
            Id = bp.Id,
            Name = bp.Name,
            ServicesJson = bp.ServicesJson,
            DependenciesJson = bp.DependenciesJson,
            GatewayConfigJson = bp.GatewayConfigJson,
            DockerComposeYaml = bp.DockerComposeYaml,
            K8sManifestYaml = bp.K8sManifestYaml,
            ServiceCount = bp.ServiceCount,
            CreatedAt = bp.CreatedAt,
        });
    }

    // POST /api/microservices/blueprints/generate
    [HttpPost("blueprints/generate")]
    public async Task<IActionResult> GenerateBlueprint([FromBody] GenerateBlueprintDto dto)
    {
        var userId = GetUserId();
        try
        {
            var bp = await _microserviceService.GenerateBlueprintAsync(dto.DevRequestId, userId);
            return Ok(new BlueprintDetailDto
            {
                Id = bp.Id,
                Name = bp.Name,
                ServicesJson = bp.ServicesJson,
                DependenciesJson = bp.DependenciesJson,
                GatewayConfigJson = bp.GatewayConfigJson,
                DockerComposeYaml = bp.DockerComposeYaml,
                K8sManifestYaml = bp.K8sManifestYaml,
                ServiceCount = bp.ServiceCount,
                CreatedAt = bp.CreatedAt,
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE /api/microservices/blueprints/{id}
    [HttpDelete("blueprints/{id}")]
    public async Task<IActionResult> DeleteBlueprint(int id)
    {
        var userId = GetUserId();
        var result = await _microserviceService.DeleteBlueprintAsync(id, userId);
        if (!result) return NotFound(new { error = "Blueprint not found." });
        return Ok(new { success = true });
    }
}

// DTOs
public record BlueprintSummaryDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public int ServiceCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record BlueprintDetailDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public required string ServicesJson { get; init; }
    public required string DependenciesJson { get; init; }
    public string? GatewayConfigJson { get; init; }
    public string? DockerComposeYaml { get; init; }
    public string? K8sManifestYaml { get; init; }
    public int ServiceCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record GenerateBlueprintDto
{
    public Guid DevRequestId { get; init; }
}

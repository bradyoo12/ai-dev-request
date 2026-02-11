using System.Security.Claims;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/requests/{requestId:guid}/schema")]
[Authorize]
public class SchemaDesignerController : ControllerBase
{
    private readonly ISchemaDesignerService _service;

    public SchemaDesignerController(ISchemaDesignerService service)
    {
        _service = service;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpPost("design")]
    public async Task<IActionResult> Design(Guid requestId, [FromBody] DesignSchemaRequest request)
    {
        var userId = GetUserId();
        var result = await _service.DesignAsync(requestId, userId, request.Prompt);
        return Ok(ToDto(result));
    }

    [HttpGet]
    public async Task<IActionResult> Get(Guid requestId)
    {
        var userId = GetUserId();
        var result = await _service.GetAsync(requestId, userId);
        if (result == null) return NotFound();
        return Ok(ToDto(result));
    }

    [HttpPut("{schemaId:guid}")]
    public async Task<IActionResult> Update(Guid requestId, Guid schemaId, [FromBody] UpdateSchemaRequest request)
    {
        var userId = GetUserId();
        var result = await _service.UpdateAsync(schemaId, userId, request.EntitiesJson, request.RelationshipsJson);
        return Ok(ToDto(result));
    }

    [HttpPost("{schemaId:guid}/validate")]
    public async Task<IActionResult> Validate(Guid requestId, Guid schemaId)
    {
        var userId = GetUserId();
        var result = await _service.ValidateAsync(schemaId, userId);
        return Ok(ToDto(result));
    }

    [HttpPost("{schemaId:guid}/generate")]
    public async Task<IActionResult> Generate(Guid requestId, Guid schemaId)
    {
        var userId = GetUserId();
        var result = await _service.GenerateCodeAsync(schemaId, userId);
        return Ok(ToDto(result));
    }

    private static DataSchemaDto ToDto(DataSchema s) => new(
        s.Id, s.DevRequestId, s.Prompt, s.EntitiesJson, s.RelationshipsJson,
        s.EntityCount, s.RelationshipCount, s.ValidationJson,
        s.GeneratedSql, s.GeneratedEntities, s.GeneratedControllers, s.GeneratedFrontend,
        s.Status, s.CreatedAt
    );
}

public record DesignSchemaRequest(string Prompt);
public record UpdateSchemaRequest(string EntitiesJson, string RelationshipsJson);

public record DataSchemaDto(
    Guid Id, Guid DevRequestId, string Prompt, string EntitiesJson, string RelationshipsJson,
    int EntityCount, int RelationshipCount, string ValidationJson,
    string GeneratedSql, string GeneratedEntities, string GeneratedControllers, string GeneratedFrontend,
    string Status, DateTime CreatedAt
);

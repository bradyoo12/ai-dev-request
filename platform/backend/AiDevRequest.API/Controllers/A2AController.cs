using System.Security.Claims;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/a2a")]
public class A2AController : ControllerBase
{
    private readonly IA2AService _a2aService;
    private readonly ILogger<A2AController> _logger;

    public A2AController(IA2AService a2aService, ILogger<A2AController> logger)
    {
        _a2aService = a2aService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    // === Agent Management ===

    [HttpPost("agents")]
    public async Task<ActionResult<AgentCardDto>> RegisterAgent([FromBody] RegisterAgentDto dto)
    {
        try
        {
            var agent = await _a2aService.RegisterAgentAsync(
                GetUserId(), dto.AgentKey, dto.Name, dto.Description,
                dto.InputSchemaJson, dto.OutputSchemaJson, dto.Scopes);

            return Ok(MapAgentDto(agent));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("agents")]
    public async Task<ActionResult<List<AgentCardDto>>> GetAgents([FromQuery] bool mine = false)
    {
        var ownerId = mine ? GetUserId() : null;
        var agents = await _a2aService.GetAgentsAsync(ownerId);
        return Ok(agents.Select(MapAgentDto).ToList());
    }

    [HttpGet("agents/{agentKey}")]
    public async Task<ActionResult<AgentCardDto>> GetAgent(string agentKey)
    {
        var agent = await _a2aService.GetAgentByKeyAsync(agentKey);
        if (agent == null) return NotFound();
        return Ok(MapAgentDto(agent));
    }

    [HttpPost("agents/{agentId:int}/credentials")]
    public async Task<ActionResult<CredentialsDto>> GenerateCredentials(int agentId)
    {
        try
        {
            var secret = await _a2aService.GenerateClientCredentialsAsync(agentId);
            return Ok(new CredentialsDto { ClientSecret = secret });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // === Consent Management ===

    [HttpPost("consents")]
    public async Task<ActionResult<ConsentDto>> GrantConsent([FromBody] GrantConsentDto dto)
    {
        try
        {
            var consent = await _a2aService.GrantConsentAsync(
                GetUserId(), dto.FromAgentId, dto.ToAgentId, dto.Scopes, dto.ExpiresAt);

            return Ok(MapConsentDto(consent));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("consents/{consentId:int}")]
    public async Task<IActionResult> RevokeConsent(int consentId)
    {
        try
        {
            await _a2aService.RevokeConsentAsync(GetUserId(), consentId);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("consents")]
    public async Task<ActionResult<List<ConsentDto>>> GetConsents()
    {
        var consents = await _a2aService.GetConsentsAsync(GetUserId());
        return Ok(consents.Select(MapConsentDto).ToList());
    }

    // === Task Management ===

    [HttpPost("tasks")]
    public async Task<ActionResult<TaskDto>> CreateTask([FromBody] CreateTaskDto dto)
    {
        try
        {
            var task = await _a2aService.CreateTaskAsync(
                GetUserId(), dto.FromAgentId, dto.ToAgentId, dto.ArtifactType, dto.DataJson);

            return Ok(MapTaskDto(task));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("tasks")]
    public async Task<ActionResult<List<TaskDto>>> GetTasks([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var tasks = await _a2aService.GetTasksAsync(GetUserId(), page, pageSize);
        return Ok(tasks.Select(MapTaskDto).ToList());
    }

    [HttpGet("tasks/{taskUid}")]
    public async Task<ActionResult<TaskDto>> GetTask(string taskUid)
    {
        var task = await _a2aService.GetTaskAsync(taskUid);
        if (task == null) return NotFound();
        return Ok(MapTaskDto(task));
    }

    [HttpPut("tasks/{taskId:int}/status")]
    public async Task<ActionResult<TaskDto>> UpdateTaskStatus(int taskId, [FromBody] UpdateTaskStatusDto dto)
    {
        try
        {
            var status = Enum.Parse<A2ATaskStatus>(dto.Status, ignoreCase: true);
            var task = await _a2aService.UpdateTaskStatusAsync(taskId, status, dto.ErrorMessage);
            return Ok(MapTaskDto(task));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("tasks/{taskId:int}/artifacts")]
    public async Task<ActionResult<List<ArtifactDto>>> GetArtifacts(int taskId)
    {
        var artifacts = await _a2aService.GetArtifactsAsync(taskId);
        return Ok(artifacts.Select(a => new ArtifactDto
        {
            Id = a.Id,
            TaskId = a.TaskId,
            ArtifactType = a.ArtifactType,
            SchemaVersion = a.SchemaVersion,
            DataJson = a.DataJson,
            Direction = a.Direction,
            CreatedAt = a.CreatedAt,
        }).ToList());
    }

    [HttpPost("tasks/{taskId:int}/artifacts")]
    public async Task<ActionResult<ArtifactDto>> AddArtifact(int taskId, [FromBody] AddArtifactDto dto)
    {
        try
        {
            var artifact = await _a2aService.AddArtifactAsync(taskId, dto.ArtifactType, dto.DataJson, dto.Direction ?? "response");
            return Ok(new ArtifactDto
            {
                Id = artifact.Id,
                TaskId = artifact.TaskId,
                ArtifactType = artifact.ArtifactType,
                SchemaVersion = artifact.SchemaVersion,
                DataJson = artifact.DataJson,
                Direction = artifact.Direction,
                CreatedAt = artifact.CreatedAt,
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // === DTO Mappers ===

    private static AgentCardDto MapAgentDto(AgentCard a) => new()
    {
        Id = a.Id,
        AgentKey = a.AgentKey,
        Name = a.Name,
        Description = a.Description,
        Scopes = a.Scopes,
        ClientId = a.ClientId,
        IsActive = a.IsActive,
        CreatedAt = a.CreatedAt,
    };

    private static ConsentDto MapConsentDto(A2AConsent c) => new()
    {
        Id = c.Id,
        FromAgentId = c.FromAgentId,
        ToAgentId = c.ToAgentId,
        Scopes = c.Scopes,
        IsGranted = c.IsGranted,
        GrantedAt = c.GrantedAt,
        RevokedAt = c.RevokedAt,
        ExpiresAt = c.ExpiresAt,
    };

    private static TaskDto MapTaskDto(A2ATask t) => new()
    {
        Id = t.Id,
        TaskUid = t.TaskUid,
        FromAgentId = t.FromAgentId,
        ToAgentId = t.ToAgentId,
        Status = t.Status.ToString(),
        ErrorMessage = t.ErrorMessage,
        CreatedAt = t.CreatedAt,
        CompletedAt = t.CompletedAt,
    };
}

// === DTOs ===

public record RegisterAgentDto
{
    public required string AgentKey { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public string? InputSchemaJson { get; init; }
    public string? OutputSchemaJson { get; init; }
    public string? Scopes { get; init; }
}

public record AgentCardDto
{
    public int Id { get; init; }
    public string AgentKey { get; init; } = "";
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string? Scopes { get; init; }
    public string? ClientId { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CredentialsDto
{
    public string ClientSecret { get; init; } = "";
}

public record GrantConsentDto
{
    public int FromAgentId { get; init; }
    public int ToAgentId { get; init; }
    public required string Scopes { get; init; }
    public DateTime? ExpiresAt { get; init; }
}

public record ConsentDto
{
    public int Id { get; init; }
    public int FromAgentId { get; init; }
    public int ToAgentId { get; init; }
    public string Scopes { get; init; } = "";
    public bool IsGranted { get; init; }
    public DateTime GrantedAt { get; init; }
    public DateTime? RevokedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
}

public record CreateTaskDto
{
    public int FromAgentId { get; init; }
    public int ToAgentId { get; init; }
    public required string ArtifactType { get; init; }
    public required string DataJson { get; init; }
}

public record TaskDto
{
    public int Id { get; init; }
    public string TaskUid { get; init; } = "";
    public int FromAgentId { get; init; }
    public int ToAgentId { get; init; }
    public string Status { get; init; } = "";
    public string? ErrorMessage { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public record UpdateTaskStatusDto
{
    public required string Status { get; init; }
    public string? ErrorMessage { get; init; }
}

public record ArtifactDto
{
    public int Id { get; init; }
    public int TaskId { get; init; }
    public string ArtifactType { get; init; } = "";
    public string SchemaVersion { get; init; } = "";
    public string DataJson { get; init; } = "";
    public string Direction { get; init; } = "";
    public DateTime CreatedAt { get; init; }
}

public record AddArtifactDto
{
    public required string ArtifactType { get; init; }
    public required string DataJson { get; init; }
    public string? Direction { get; init; }
}

using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/mcp")]
public class McpIntegrationController : ControllerBase
{
    private readonly IMcpIntegrationService _mcpService;
    private readonly ILogger<McpIntegrationController> _logger;

    public McpIntegrationController(IMcpIntegrationService mcpService, ILogger<McpIntegrationController> logger)
    {
        _mcpService = mcpService;
        _logger = logger;
    }

    /// <summary>List platform MCP tools</summary>
    [HttpGet("tools")]
    [ProducesResponseType(typeof(List<McpToolDto>), StatusCodes.Status200OK)]
    public ActionResult<List<McpToolDto>> GetPlatformTools()
    {
        var tools = _mcpService.GetPlatformToolsAsync();
        return Ok(tools.Select(t => new McpToolDto
        {
            Name = t.Name,
            Description = t.Description,
            InputSchema = t.InputSchema,
        }).ToList());
    }

    /// <summary>Execute a platform MCP tool</summary>
    [HttpPost("tools/call")]
    [ProducesResponseType(typeof(McpToolCallResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<McpToolCallResultDto>> CallPlatformTool([FromBody] McpToolCallRequestDto dto)
    {
        var result = await _mcpService.CallPlatformToolAsync(dto.ToolName, dto.Arguments);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return Ok(new McpToolCallResultDto
        {
            Success = result.Success,
            Result = result.Result,
            Error = result.Error,
        });
    }

    /// <summary>Register an external MCP server</summary>
    [HttpPost("servers")]
    [ProducesResponseType(typeof(McpConnectionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<McpConnectionDto>> RegisterServer([FromBody] RegisterMcpServerDto dto)
    {
        try
        {
            var connection = new McpConnection
            {
                ProjectId = dto.ProjectId,
                Name = dto.Name,
                ServerUrl = dto.ServerUrl,
                Transport = dto.Transport ?? "sse",
                AuthType = dto.AuthType,
                AuthToken = dto.AuthToken,
            };

            var result = await _mcpService.RegisterServerAsync(connection);
            _logger.LogInformation("Registered MCP server: {Name}", dto.Name);

            return CreatedAtAction(nameof(GetServerStatus), new { id = result.Id }, MapConnectionDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Unregister an external MCP server</summary>
    [HttpDelete("servers/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnregisterServer(Guid id)
    {
        try
        {
            await _mcpService.UnregisterServerAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { error = $"MCP server not found: {id}" });
        }
    }

    /// <summary>List all registered MCP servers (optional projectId filter)</summary>
    [HttpGet("servers")]
    [ProducesResponseType(typeof(List<McpConnectionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<McpConnectionDto>>> ListServers([FromQuery] int? projectId)
    {
        var servers = await _mcpService.ListServersAsync(projectId);
        return Ok(servers.Select(MapConnectionDto).ToList());
    }

    /// <summary>Check connection health for a server</summary>
    [HttpGet("servers/{id}/status")]
    [ProducesResponseType(typeof(McpServerStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<McpServerStatusDto>> GetServerStatus(Guid id)
    {
        try
        {
            var status = await _mcpService.GetServerStatusAsync(id);
            return Ok(new McpServerStatusDto
            {
                ConnectionId = status.ConnectionId,
                Name = status.Name,
                Status = status.Status,
                LastConnectedAt = status.LastConnectedAt,
                ToolCount = status.ToolCount,
                ResourceCount = status.ResourceCount,
                ToolCallCount = status.ToolCallCount,
                ErrorMessage = status.ErrorMessage,
            });
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { error = $"MCP server not found: {id}" });
        }
    }

    /// <summary>Discover tools from an external MCP server</summary>
    [HttpPost("servers/{id}/discover")]
    [ProducesResponseType(typeof(McpConnectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<McpConnectionDto>> DiscoverTools(Guid id)
    {
        try
        {
            var connection = await _mcpService.DiscoverToolsAsync(id);
            return Ok(MapConnectionDto(connection));
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { error = $"MCP server not found: {id}" });
        }
    }

    /// <summary>Call a tool on an external MCP server</summary>
    [HttpPost("servers/{id}/tools/call")]
    [ProducesResponseType(typeof(McpToolCallResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<McpToolCallResultDto>> CallExternalTool(Guid id, [FromBody] McpToolCallRequestDto dto)
    {
        var result = await _mcpService.CallExternalToolAsync(id, dto.ToolName, dto.Arguments);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return Ok(new McpToolCallResultDto
        {
            Success = result.Success,
            Result = result.Result,
            Error = result.Error,
        });
    }

    /// <summary>List MCP servers for a specific project</summary>
    [HttpGet("/api/projects/{id}/mcp/servers")]
    [ProducesResponseType(typeof(List<McpConnectionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<McpConnectionDto>>> ListProjectServers(int id)
    {
        var servers = await _mcpService.ListServersAsync(id);
        return Ok(servers.Select(MapConnectionDto).ToList());
    }

    private static McpConnectionDto MapConnectionDto(McpConnection c) => new()
    {
        Id = c.Id,
        ProjectId = c.ProjectId,
        Name = c.Name,
        ServerUrl = c.ServerUrl,
        Transport = c.Transport,
        Status = c.Status,
        AuthType = c.AuthType,
        AvailableTools = c.AvailableTools,
        AvailableResources = c.AvailableResources,
        ToolCallCount = c.ToolCallCount,
        LastConnectedAt = c.LastConnectedAt,
        ErrorMessage = c.ErrorMessage,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt,
    };
}

// === DTOs ===

public record McpToolDto
{
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string InputSchema { get; init; } = "{}";
}

public record McpToolCallRequestDto
{
    public string ToolName { get; init; } = "";
    public string Arguments { get; init; } = "{}";
}

public record McpToolCallResultDto
{
    public bool Success { get; init; }
    public string? Result { get; init; }
    public string? Error { get; init; }
}

public record RegisterMcpServerDto
{
    public int? ProjectId { get; init; }
    public string Name { get; init; } = "";
    public string ServerUrl { get; init; } = "";
    public string? Transport { get; init; } = "sse";
    public string? AuthType { get; init; }
    public string? AuthToken { get; init; }
}

public record McpConnectionDto
{
    public Guid Id { get; init; }
    public int? ProjectId { get; init; }
    public string Name { get; init; } = "";
    public string ServerUrl { get; init; } = "";
    public string Transport { get; init; } = "sse";
    public string Status { get; init; } = "disconnected";
    public string? AuthType { get; init; }
    public string? AvailableTools { get; init; }
    public string? AvailableResources { get; init; }
    public int ToolCallCount { get; init; }
    public DateTime? LastConnectedAt { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record McpServerStatusDto
{
    public Guid ConnectionId { get; init; }
    public string Name { get; init; } = "";
    public string Status { get; init; } = "";
    public DateTime? LastConnectedAt { get; init; }
    public int ToolCount { get; init; }
    public int ResourceCount { get; init; }
    public int ToolCallCount { get; init; }
    public string? ErrorMessage { get; init; }
}

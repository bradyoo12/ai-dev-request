using Microsoft.AspNetCore.Mvc;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/mcp-server")]
public class McpServerController : ControllerBase
{
    private readonly IMcpServerService _service;

    public McpServerController(IMcpServerService service)
    {
        _service = service;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    // GET /api/mcp-server?projectId={projectId}
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? projectId)
    {
        var userId = GetUserId();
        var servers = await _service.GetByProjectAsync(userId, projectId);
        return Ok(servers);
    }

    // GET /api/mcp-server/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var userId = GetUserId();
        var server = await _service.GetByIdAsync(id, userId);
        if (server == null) return NotFound();
        return Ok(server);
    }

    // POST /api/mcp-server
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] McpServer server)
    {
        var userId = GetUserId();
        var result = await _service.CreateServerAsync(userId, server);
        return Ok(result);
    }

    // PUT /api/mcp-server/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] McpServer updates)
    {
        var userId = GetUserId();
        var result = await _service.UpdateServerAsync(id, userId, updates);
        if (result == null) return NotFound();
        return Ok(result);
    }

    // DELETE /api/mcp-server/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var deleted = await _service.DeleteServerAsync(id, userId);
        if (!deleted) return NotFound();
        return Ok(new { deleted = true });
    }

    // GET /api/mcp-server/{id}/tools
    [HttpGet("{id}/tools")]
    public async Task<IActionResult> GetTools(Guid id)
    {
        var userId = GetUserId();
        var tools = await _service.GetToolDefinitionsAsync(id, userId);
        return Ok(tools);
    }

    // GET /api/mcp-server/{id}/resources
    [HttpGet("{id}/resources")]
    public async Task<IActionResult> GetResources(Guid id)
    {
        var userId = GetUserId();
        var resources = await _service.GetResourcesAsync(id, userId);
        return Ok(resources);
    }

    // POST /api/mcp-server/{id}/test
    [HttpPost("{id}/test")]
    public async Task<IActionResult> TestConnection(Guid id)
    {
        var userId = GetUserId();
        var result = await _service.TestConnectionAsync(id, userId);
        return Ok(result);
    }

    // GET /api/mcp-server/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var stats = await _service.GetServerStatsAsync(userId);
        return Ok(stats);
    }
}

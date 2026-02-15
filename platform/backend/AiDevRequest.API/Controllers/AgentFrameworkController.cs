using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/agent-framework")]
[Authorize]
public class AgentFrameworkController : ControllerBase
{
    private readonly IAgentFrameworkService _frameworkService;
    private readonly ILogger<AgentFrameworkController> _logger;

    public AgentFrameworkController(
        IAgentFrameworkService frameworkService,
        ILogger<AgentFrameworkController> logger)
    {
        _frameworkService = frameworkService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get the current status and health of the Microsoft Agent Framework
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        try
        {
            var userId = GetUserId();
            var status = await _frameworkService.GetFrameworkStatusAsync(userId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agent framework status");
            return StatusCode(500, new { error = "Failed to get framework status" });
        }
    }

    /// <summary>
    /// List all registered native agents for the current user
    /// </summary>
    [HttpGet("agents")]
    public async Task<IActionResult> ListAgents()
    {
        try
        {
            var userId = GetUserId();
            var agents = await _frameworkService.ListNativeAgentsAsync(userId);
            return Ok(agents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing native agents");
            return StatusCode(500, new { error = "Failed to list agents" });
        }
    }

    /// <summary>
    /// Register a new native agent using the Microsoft Agent Framework
    /// </summary>
    [HttpPost("agents")]
    public async Task<IActionResult> RegisterAgent([FromBody] RegisterNativeAgentRequest request)
    {
        try
        {
            var userId = GetUserId();
            var agent = await _frameworkService.RegisterAgentAsync(userId, request);
            return Ok(agent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering native agent");
            return StatusCode(500, new { error = "Failed to register agent" });
        }
    }

    /// <summary>
    /// Unregister a native agent
    /// </summary>
    [HttpDelete("agents/{agentId:guid}")]
    public async Task<IActionResult> UnregisterAgent(Guid agentId)
    {
        try
        {
            var userId = GetUserId();
            await _frameworkService.UnregisterAgentAsync(userId, agentId);
            return Ok(new { message = "Agent unregistered successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unregistering native agent {AgentId}", agentId);
            return StatusCode(500, new { error = "Failed to unregister agent" });
        }
    }

    /// <summary>
    /// Get the Agent Framework configuration for the current user
    /// </summary>
    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        try
        {
            var userId = GetUserId();
            var config = await _frameworkService.GetConfigAsync(userId);
            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agent framework config");
            return StatusCode(500, new { error = "Failed to get configuration" });
        }
    }

    /// <summary>
    /// Update the Agent Framework configuration
    /// </summary>
    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] UpdateAgentFrameworkConfigRequest request)
    {
        try
        {
            var userId = GetUserId();
            var config = await _frameworkService.UpdateConfigAsync(userId, request);
            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating agent framework config");
            return StatusCode(500, new { error = "Failed to update configuration" });
        }
    }

    /// <summary>
    /// Get agent pool metrics and execution statistics
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        try
        {
            var userId = GetUserId();
            var metrics = await _frameworkService.GetMetricsAsync(userId);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting agent framework metrics");
            return StatusCode(500, new { error = "Failed to get metrics" });
        }
    }
}

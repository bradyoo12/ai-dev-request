using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/multi-agent-test")]
public class MultiAgentTestController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly IMultiAgentTestService _testService;
    private readonly ILogger<MultiAgentTestController> _logger;

    public MultiAgentTestController(
        AiDevRequestDbContext context,
        IMultiAgentTestService testService,
        ILogger<MultiAgentTestController> logger)
    {
        _context = context;
        _testService = testService;
        _logger = logger;
    }

    [HttpPost("sessions")]
    public async Task<ActionResult<MultiAgentTestSession>> CreateSession([FromBody] CreateMultiAgentTestSessionRequest request)
    {
        if (request.PersonaTypes == null || request.PersonaTypes.Count == 0)
            return BadRequest("At least one persona type is required");

        if (request.ConcurrencyLevel < 1 || request.ConcurrencyLevel > 10)
            return BadRequest("Concurrency level must be between 1 and 10");

        var session = await _testService.CreateSessionAsync(
            request.DevRequestId,
            request.ScenarioType,
            request.ConcurrencyLevel,
            request.PersonaTypes);

        return Ok(session);
    }

    [HttpPost("sessions/{id}/start")]
    public async Task<ActionResult<MultiAgentTestSession>> StartSession(Guid id)
    {
        try
        {
            var session = await _testService.StartSimulationAsync(id);
            return Ok(session);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("sessions/{id}/status")]
    public async Task<ActionResult<MultiAgentTestSession>> GetSessionStatus(Guid id)
    {
        try
        {
            var session = await _testService.GetSessionStatusAsync(id);
            return Ok(session);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("sessions/{id}/report")]
    public async Task<ActionResult<MultiAgentTestSessionReport>> GetSessionReport(Guid id)
    {
        try
        {
            var report = await _testService.GetSessionReportAsync(id);
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("sessions")]
    public async Task<ActionResult<List<MultiAgentTestSession>>> GetSessions([FromQuery] Guid? devRequestId)
    {
        try
        {
            if (devRequestId.HasValue)
            {
                var sessions = await _testService.GetSessionsAsync(devRequestId.Value);
                return Ok(sessions);
            }

            // Return all sessions if no filter
            var allSessions = await _context.MultiAgentTestSessions
                .OrderByDescending(s => s.CreatedAt)
                .Take(50)
                .ToListAsync();

            return Ok(allSessions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve multi-agent test sessions");
            // Return empty list instead of 500 error to prevent UI from breaking
            return Ok(new List<MultiAgentTestSession>());
        }
    }

    [HttpGet("sessions/{id}/personas")]
    public async Task<ActionResult<List<TestPersona>>> GetSessionPersonas(Guid id)
    {
        try
        {
            var personas = await _context.TestPersonas
                .Where(p => p.SessionId == id)
                .OrderBy(p => p.PersonaType)
                .ToListAsync();

            return Ok(personas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve personas for session {SessionId}", id);
            return Ok(new List<TestPersona>());
        }
    }

    [HttpGet("sessions/{id}/issues")]
    public async Task<ActionResult<List<ConcurrencyIssue>>> GetSessionIssues(Guid id)
    {
        try
        {
            var issues = await _context.ConcurrencyIssues
                .Where(i => i.SessionId == id)
                .OrderByDescending(i => i.Severity == "critical" ? 4 : i.Severity == "high" ? 3 : i.Severity == "medium" ? 2 : 1)
                .ThenByDescending(i => i.DetectedAt)
                .ToListAsync();

            return Ok(issues);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve issues for session {SessionId}", id);
            return Ok(new List<ConcurrencyIssue>());
        }
    }

    [HttpPost("sessions/{id}/refine")]
    public async Task<ActionResult<RefineResult>> GenerateRefinement(Guid id)
    {
        try
        {
            var result = await _testService.GenerateRefinementAsync(id);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpDelete("sessions/{id}")]
    public async Task<ActionResult> DeleteSession(Guid id)
    {
        var session = await _context.MultiAgentTestSessions.FindAsync(id);
        if (session == null)
            return NotFound();

        // Delete related records
        var personas = await _context.TestPersonas.Where(p => p.SessionId == id).ToListAsync();
        var executions = await _context.AgentTestExecutions.Where(e => e.SessionId == id).ToListAsync();
        var issues = await _context.ConcurrencyIssues.Where(i => i.SessionId == id).ToListAsync();

        _context.TestPersonas.RemoveRange(personas);
        _context.AgentTestExecutions.RemoveRange(executions);
        _context.ConcurrencyIssues.RemoveRange(issues);
        _context.MultiAgentTestSessions.Remove(session);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateMultiAgentTestSessionRequest
{
    public Guid DevRequestId { get; set; }
    public string ScenarioType { get; set; } = "concurrent_crud";
    public int ConcurrencyLevel { get; set; } = 3;
    public List<string> PersonaTypes { get; set; } = new();
}

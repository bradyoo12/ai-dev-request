using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/playwright-mcp")]
public class PlaywrightMcpController : ControllerBase
{
    private readonly IPlaywrightMcpService _service;
    private readonly ILogger<PlaywrightMcpController> _logger;

    public PlaywrightMcpController(IPlaywrightMcpService service, ILogger<PlaywrightMcpController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetTestConfigs()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value ?? "";
        var configs = await _service.GetTestConfigsAsync(userId);
        return Ok(configs.Select(MapConfigDto));
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateTests([FromBody] GenerateTestsRequest request)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value ?? "";
        try
        {
            var config = await _service.GenerateTestsAsync(userId, request.TestScenario, request.ProjectId);
            return Ok(MapConfigDto(config));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/heal")]
    public async Task<IActionResult> HealFailedTest(Guid id, [FromBody] PlaywrightMcpHealRequest request)
    {
        try
        {
            var record = await _service.HealFailedTestAsync(id, request.FailureReason);
            return Ok(MapHealingDto(record));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/run")]
    public async Task<IActionResult> RunTest(Guid id)
    {
        try
        {
            var result = await _service.RunTestAsync(id);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}/healing-history")]
    public async Task<IActionResult> GetHealingHistory(Guid id)
    {
        var records = await _service.GetHealingHistoryAsync(id);
        return Ok(records.Select(MapHealingDto));
    }

    private static PlaywrightMcpConfigDto MapConfigDto(Entities.PlaywrightMcpTestConfig c) => new()
    {
        Id = c.Id,
        UserId = c.UserId,
        ProjectId = c.ProjectId,
        TestScenario = c.TestScenario,
        GeneratedTestCode = c.GeneratedTestCode,
        HealingHistoryJson = c.HealingHistoryJson,
        Status = c.Status,
        SuccessRate = c.SuccessRate,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt,
    };

    private static TestHealingRecordDto MapHealingDto(Entities.TestHealingRecord r) => new()
    {
        Id = r.Id,
        TestConfigId = r.TestConfigId,
        OriginalLocator = r.OriginalLocator,
        UpdatedLocator = r.UpdatedLocator,
        FailureReason = r.FailureReason,
        HealingStrategy = r.HealingStrategy,
        Success = r.Success,
        CreatedAt = r.CreatedAt,
    };
}

public record GenerateTestsRequest
{
    public string TestScenario { get; init; } = "";
    public Guid? ProjectId { get; init; }
}

public record PlaywrightMcpHealRequest
{
    public string FailureReason { get; init; } = "";
}

public record PlaywrightMcpConfigDto
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = "";
    public Guid? ProjectId { get; init; }
    public string TestScenario { get; init; } = "";
    public string? GeneratedTestCode { get; init; }
    public string? HealingHistoryJson { get; init; }
    public string Status { get; init; } = "";
    public double SuccessRate { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record TestHealingRecordDto
{
    public Guid Id { get; init; }
    public Guid TestConfigId { get; init; }
    public string OriginalLocator { get; init; } = "";
    public string UpdatedLocator { get; init; } = "";
    public string FailureReason { get; init; } = "";
    public string HealingStrategy { get; init; } = "";
    public bool Success { get; init; }
    public DateTime CreatedAt { get; init; }
}

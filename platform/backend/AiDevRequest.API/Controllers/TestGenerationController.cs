using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId:int}/tests")]
public class TestGenerationController : ControllerBase
{
    private readonly ITestGenerationService _testService;
    private readonly ILogger<TestGenerationController> _logger;

    public TestGenerationController(ITestGenerationService testService, ILogger<TestGenerationController> logger)
    {
        _testService = testService;
        _logger = logger;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> TriggerGeneration(int projectId)
    {
        try
        {
            var result = await _testService.TriggerGenerationAsync(projectId);
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetResults(int projectId)
    {
        var result = await _testService.GetResultAsync(projectId);
        if (result == null) return NotFound();
        return Ok(MapDto(result));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(int projectId)
    {
        var history = await _testService.GetHistoryAsync(projectId);
        return Ok(history.Select(MapDto));
    }

    [HttpPost("generate-from-nl")]
    public async Task<IActionResult> GenerateFromNaturalLanguage(int projectId, [FromBody] NaturalLanguageTestRequest request)
    {
        try
        {
            var result = await _testService.GenerateFromNaturalLanguageAsync(projectId, request.Scenario, request.TestType);
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("mcp-status")]
    public async Task<IActionResult> GetMcpStatus(int projectId)
    {
        var status = await _testService.GetMcpConnectionStatusAsync(projectId);
        return Ok(status);
    }

    [HttpPost("configure-mcp")]
    public async Task<IActionResult> ConfigureMcp(int projectId, [FromBody] McpConfigRequest request)
    {
        try
        {
            var config = await _testService.ConfigureMcpAsync(projectId, request.ServerUrl, request.Transport, request.AuthType, request.AuthToken);
            return Ok(new McpConfigDto
            {
                Id = config.Id,
                ProjectId = config.ProjectId,
                ServerUrl = config.ServerUrl,
                Transport = config.Transport,
                Status = config.Status,
                AutoHealEnabled = config.AutoHealEnabled,
                HealingConfidenceThreshold = config.HealingConfidenceThreshold,
                CapabilitiesJson = config.CapabilitiesJson,
                LastConnectedAt = config.LastConnectedAt,
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("coverage-analysis")]
    public async Task<IActionResult> AnalyzeCoverage(int projectId)
    {
        try
        {
            var analysis = await _testService.AnalyzeCoverageAsync(projectId);
            return Ok(analysis);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static TestGenerationDto MapDto(Entities.TestGenerationRecord r) => new()
    {
        Id = r.Id,
        ProjectId = r.ProjectId,
        Status = r.Status,
        TestFilesGenerated = r.TestFilesGenerated,
        TotalTestCount = r.TotalTestCount,
        CoverageEstimate = r.CoverageEstimate,
        TestFramework = r.TestFramework,
        Summary = r.Summary,
        TestFilesJson = r.TestFilesJson,
        GenerationVersion = r.GenerationVersion,
        CreatedAt = r.CreatedAt,
        CompletedAt = r.CompletedAt,
    };
}

public record TestGenerationDto
{
    public Guid Id { get; init; }
    public int ProjectId { get; init; }
    public string Status { get; init; } = "";
    public int TestFilesGenerated { get; init; }
    public int TotalTestCount { get; init; }
    public int CoverageEstimate { get; init; }
    public string TestFramework { get; init; } = "";
    public string Summary { get; init; } = "";
    public string? TestFilesJson { get; init; }
    public int GenerationVersion { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public record NaturalLanguageTestRequest
{
    public string Scenario { get; init; } = "";
    public string TestType { get; init; } = "e2e"; // e2e, unit, integration
}

public record McpConfigRequest
{
    public string ServerUrl { get; init; } = "";
    public string Transport { get; init; } = "sse";
    public string? AuthType { get; init; }
    public string? AuthToken { get; init; }
}

public record McpConfigDto
{
    public Guid Id { get; init; }
    public int ProjectId { get; init; }
    public string ServerUrl { get; init; } = "";
    public string Transport { get; init; } = "";
    public string Status { get; init; } = "";
    public bool AutoHealEnabled { get; init; }
    public int HealingConfidenceThreshold { get; init; }
    public string? CapabilitiesJson { get; init; }
    public DateTime? LastConnectedAt { get; init; }
}

public record CoverageAnalysisResult
{
    public int OverallCoverage { get; init; }
    public int LineCoverage { get; init; }
    public int BranchCoverage { get; init; }
    public int FunctionCoverage { get; init; }
    public List<UncoveredArea> UncoveredAreas { get; init; } = new();
    public List<string> Recommendations { get; init; } = new();
    public string Summary { get; init; } = "";
}

public record UncoveredArea
{
    public string FilePath { get; init; } = "";
    public string FunctionName { get; init; } = "";
    public string Reason { get; init; } = "";
    public int Priority { get; init; }
}

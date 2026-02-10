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

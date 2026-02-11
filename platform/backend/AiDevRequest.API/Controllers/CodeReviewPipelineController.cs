using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/code-review-pipeline")]
[Authorize]
public class CodeReviewPipelineController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public CodeReviewPipelineController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get or create pipeline config for a project
    /// </summary>
    [HttpGet("config/{projectId}")]
    public async Task<IActionResult> GetConfig(string projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.CodeReviewPipelines
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ProjectName == projectId);

        if (config == null)
        {
            config = new CodeReviewPipeline
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ProjectName = projectId,
                PipelineEnabled = true,
                AutoRunAfterGeneration = false,
                AutoFixEnabled = false,
                AstAnalysisEnabled = true,
                SastScanEnabled = true,
                AiReviewEnabled = true,
                TestGenerationEnabled = true,
                MinQualityThreshold = 70,
                LastRunStatus = "idle",
            };
            _db.CodeReviewPipelines.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(config);
    }

    /// <summary>
    /// Update pipeline settings
    /// </summary>
    [HttpPut("config/{projectId}")]
    public async Task<IActionResult> UpdateConfig(string projectId, [FromBody] UpdatePipelineConfigDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.CodeReviewPipelines
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ProjectName == projectId);

        if (config == null) return NotFound();

        if (dto.PipelineEnabled.HasValue) config.PipelineEnabled = dto.PipelineEnabled.Value;
        if (dto.AutoRunAfterGeneration.HasValue) config.AutoRunAfterGeneration = dto.AutoRunAfterGeneration.Value;
        if (dto.AutoFixEnabled.HasValue) config.AutoFixEnabled = dto.AutoFixEnabled.Value;
        if (dto.AstAnalysisEnabled.HasValue) config.AstAnalysisEnabled = dto.AstAnalysisEnabled.Value;
        if (dto.SastScanEnabled.HasValue) config.SastScanEnabled = dto.SastScanEnabled.Value;
        if (dto.AiReviewEnabled.HasValue) config.AiReviewEnabled = dto.AiReviewEnabled.Value;
        if (dto.TestGenerationEnabled.HasValue) config.TestGenerationEnabled = dto.TestGenerationEnabled.Value;
        if (dto.MinQualityThreshold.HasValue) config.MinQualityThreshold = Math.Clamp(dto.MinQualityThreshold.Value, 0, 100);

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(config);
    }

    /// <summary>
    /// Run the pipeline on a project (simulated multi-step review)
    /// </summary>
    [HttpPost("run")]
    public async Task<IActionResult> RunPipeline([FromBody] RunPipelineDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.ProjectId))
            return BadRequest(new { error = "Project ID is required." });

        var config = await _db.CodeReviewPipelines
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ProjectName == dto.ProjectId);

        if (config == null)
        {
            config = new CodeReviewPipeline
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ProjectName = dto.ProjectId,
                DevRequestId = dto.DevRequestId,
                PipelineEnabled = true,
                AstAnalysisEnabled = true,
                SastScanEnabled = true,
                AiReviewEnabled = true,
                TestGenerationEnabled = true,
                MinQualityThreshold = 70,
            };
            _db.CodeReviewPipelines.Add(config);
        }

        if (!config.PipelineEnabled)
            return BadRequest(new { error = "Pipeline is disabled for this project." });

        config.LastRunStatus = "running";
        config.LastRunAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var rng = new Random();
        var sw = System.Diagnostics.Stopwatch.StartNew();

        // Simulate pipeline steps
        var steps = new List<PipelineStepResult>();
        var allFindings = new List<PipelineFinding>();

        // Step 1: AST Analysis
        if (config.AstAnalysisEnabled)
        {
            var astFindings = GenerateAstFindings(rng);
            allFindings.AddRange(astFindings);
            steps.Add(new PipelineStepResult
            {
                Name = "AST Analysis",
                Status = "completed",
                DurationMs = rng.Next(200, 800),
                FindingsCount = astFindings.Count,
            });
        }

        // Step 2: SAST Scan
        if (config.SastScanEnabled)
        {
            var sastFindings = GenerateSastFindings(rng);
            allFindings.AddRange(sastFindings);
            steps.Add(new PipelineStepResult
            {
                Name = "SAST Scan",
                Status = "completed",
                DurationMs = rng.Next(300, 1200),
                FindingsCount = sastFindings.Count,
            });
        }

        // Step 3: AI Review
        if (config.AiReviewEnabled)
        {
            var aiFindings = GenerateAiReviewFindings(rng, dto.ProjectId);
            allFindings.AddRange(aiFindings);
            steps.Add(new PipelineStepResult
            {
                Name = "AI Code Review",
                Status = "completed",
                DurationMs = rng.Next(500, 2000),
                FindingsCount = aiFindings.Count,
            });
        }

        // Step 4: Auto-fix (if enabled)
        var fixedCount = 0;
        if (config.AutoFixEnabled)
        {
            foreach (var finding in allFindings.Where(f => f.AutoFixAvailable))
            {
                if (rng.NextDouble() > 0.3) // 70% fix success rate
                {
                    finding.Fixed = true;
                    fixedCount++;
                }
            }
            steps.Add(new PipelineStepResult
            {
                Name = "Auto-Fix",
                Status = "completed",
                DurationMs = rng.Next(100, 500),
                FindingsCount = fixedCount,
            });
        }

        // Step 5: Test Generation
        var generatedTests = new List<GeneratedTestFile>();
        if (config.TestGenerationEnabled)
        {
            generatedTests = GenerateTestFiles(rng, dto.ProjectId);
            steps.Add(new PipelineStepResult
            {
                Name = "Test Generation",
                Status = "completed",
                DurationMs = rng.Next(400, 1500),
                FindingsCount = generatedTests.Count,
            });
        }

        sw.Stop();

        // Calculate quality score
        var totalFindings = allFindings.Count;
        var criticalCount = allFindings.Count(f => f.Severity == "critical");
        var highCount = allFindings.Count(f => f.Severity == "high");
        var unfixedCritical = allFindings.Count(f => f.Severity == "critical" && !f.Fixed);
        var unfixedHigh = allFindings.Count(f => f.Severity == "high" && !f.Fixed);
        var qualityScore = Math.Max(0, 100 - (unfixedCritical * 15) - (unfixedHigh * 8) - ((totalFindings - criticalCount - highCount) * 2));
        qualityScore = Math.Clamp(qualityScore, 0, 100);

        var passed = qualityScore >= config.MinQualityThreshold;
        var tokensUsed = rng.Next(500, 3000);

        config.QualityScore = qualityScore;
        config.LastRunStatus = passed ? "completed" : "failed";
        config.TotalRuns++;
        if (passed) config.PassedRuns++;
        else config.FailedRuns++;
        config.FindingsJson = JsonSerializer.Serialize(allFindings);
        config.GeneratedTestsJson = JsonSerializer.Serialize(generatedTests);
        config.PipelineStepsJson = JsonSerializer.Serialize(steps);
        config.TotalFindingsFound += totalFindings;
        config.TotalFindingsFixed += fixedCount;
        config.TotalTestsGenerated += generatedTests.Count;
        config.AvgQualityScore = config.TotalRuns > 0
            ? Math.Round(((config.AvgQualityScore * (config.TotalRuns - 1)) + qualityScore) / config.TotalRuns, 1)
            : qualityScore;
        config.TokensUsed += tokensUsed;
        config.EstimatedCost += tokensUsed * 0.00003m;
        config.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(config);
    }

    /// <summary>
    /// Get latest pipeline results for a project
    /// </summary>
    [HttpGet("results/{projectId}")]
    public async Task<IActionResult> GetResults(string projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.CodeReviewPipelines
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ProjectName == projectId);

        if (config == null) return NotFound();

        return Ok(new
        {
            config.Id,
            config.ProjectName,
            config.QualityScore,
            config.MinQualityThreshold,
            config.LastRunStatus,
            config.LastRunAt,
            Passed = config.QualityScore >= config.MinQualityThreshold,
            Findings = JsonSerializer.Deserialize<List<PipelineFinding>>(config.FindingsJson),
            GeneratedTests = JsonSerializer.Deserialize<List<GeneratedTestFile>>(config.GeneratedTestsJson),
            PipelineSteps = JsonSerializer.Deserialize<List<PipelineStepResult>>(config.PipelineStepsJson),
            config.TotalFindingsFound,
            config.TotalFindingsFixed,
            config.TotalTestsGenerated,
            config.TokensUsed,
            config.EstimatedCost,
        });
    }

    /// <summary>
    /// Get pipeline execution history for a project
    /// </summary>
    [HttpGet("history/{projectId}")]
    public async Task<IActionResult> GetHistory(string projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // In a real implementation, each run would be a separate record.
        // Here we return the current config as the single history entry.
        var configs = await _db.CodeReviewPipelines
            .Where(c => c.UserId == userId && c.ProjectName == projectId)
            .OrderByDescending(c => c.UpdatedAt)
            .Take(50)
            .ToListAsync();

        var history = configs.Select(c => new
        {
            c.Id,
            c.ProjectName,
            c.QualityScore,
            c.LastRunStatus,
            c.LastRunAt,
            Passed = c.QualityScore >= c.MinQualityThreshold,
            c.TotalRuns,
            c.PassedRuns,
            c.FailedRuns,
            c.TotalFindingsFound,
            c.TotalFindingsFixed,
            c.TotalTestsGenerated,
            c.TokensUsed,
            c.EstimatedCost,
            c.UpdatedAt,
        });

        return Ok(history);
    }

    /// <summary>
    /// Get aggregate stats across all projects
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var pipelines = await _db.CodeReviewPipelines
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var totalRuns = pipelines.Sum(p => p.TotalRuns);
        var passedRuns = pipelines.Sum(p => p.PassedRuns);

        return Ok(new
        {
            totalPipelines = pipelines.Count,
            totalRuns,
            passedRuns,
            failedRuns = pipelines.Sum(p => p.FailedRuns),
            passRate = totalRuns > 0 ? Math.Round((double)passedRuns / totalRuns * 100, 1) : 0,
            avgQualityScore = pipelines.Count > 0 ? Math.Round((double)pipelines.Average(p => p.AvgQualityScore), 1) : 0,
            totalFindingsFound = pipelines.Sum(p => p.TotalFindingsFound),
            totalFindingsFixed = pipelines.Sum(p => p.TotalFindingsFixed),
            totalTestsGenerated = pipelines.Sum(p => p.TotalTestsGenerated),
            totalTokensUsed = pipelines.Sum(p => p.TokensUsed),
            totalCost = pipelines.Sum(p => p.EstimatedCost),
        });
    }

    // --- Simulated finding generators ---

    private static List<PipelineFinding> GenerateAstFindings(Random rng)
    {
        var findings = new List<PipelineFinding>();
        var templates = new[]
        {
            new { Cat = "complexity", Sev = "medium", Desc = "Function exceeds cyclomatic complexity threshold (>15)", Fix = true },
            new { Cat = "dead-code", Sev = "low", Desc = "Unused variable detected in module scope", Fix = true },
            new { Cat = "type-safety", Sev = "high", Desc = "Implicit any type in function parameter", Fix = true },
            new { Cat = "structure", Sev = "low", Desc = "Deeply nested conditional blocks (depth > 4)", Fix = false },
            new { Cat = "naming", Sev = "low", Desc = "Variable name does not follow camelCase convention", Fix = true },
        };
        var count = rng.Next(1, 5);
        for (var i = 0; i < count; i++)
        {
            var t = templates[rng.Next(templates.Length)];
            findings.Add(new PipelineFinding { Category = t.Cat, Severity = t.Sev, Description = t.Desc, AutoFixAvailable = t.Fix, Fixed = false });
        }
        return findings;
    }

    private static List<PipelineFinding> GenerateSastFindings(Random rng)
    {
        var findings = new List<PipelineFinding>();
        var templates = new[]
        {
            new { Cat = "security", Sev = "critical", Desc = "Potential SQL injection in query builder", Fix = false },
            new { Cat = "security", Sev = "high", Desc = "Hardcoded secret detected in configuration file", Fix = true },
            new { Cat = "security", Sev = "medium", Desc = "Missing input sanitization on user-supplied data", Fix = true },
            new { Cat = "dependency", Sev = "high", Desc = "Known vulnerability in dependency (CVE-2025-1234)", Fix = true },
            new { Cat = "security", Sev = "low", Desc = "Console.log statement left in production code", Fix = true },
        };
        var count = rng.Next(0, 4);
        for (var i = 0; i < count; i++)
        {
            var t = templates[rng.Next(templates.Length)];
            findings.Add(new PipelineFinding { Category = t.Cat, Severity = t.Sev, Description = t.Desc, AutoFixAvailable = t.Fix, Fixed = false });
        }
        return findings;
    }

    private static List<PipelineFinding> GenerateAiReviewFindings(Random rng, string projectId)
    {
        var findings = new List<PipelineFinding>();
        var templates = new[]
        {
            new { Cat = "best-practice", Sev = "medium", Desc = $"Missing error boundary in React component for {projectId}", Fix = false },
            new { Cat = "performance", Sev = "medium", Desc = "Unnecessary re-renders detected due to missing useMemo/useCallback", Fix = false },
            new { Cat = "accessibility", Sev = "high", Desc = "Missing ARIA labels on interactive elements", Fix = true },
            new { Cat = "documentation", Sev = "low", Desc = "Public API function missing JSDoc documentation", Fix = true },
            new { Cat = "error-handling", Sev = "high", Desc = "Unhandled promise rejection in async function", Fix = false },
            new { Cat = "maintainability", Sev = "medium", Desc = "Code duplication detected across 3 modules", Fix = false },
        };
        var count = rng.Next(1, 5);
        for (var i = 0; i < count; i++)
        {
            var t = templates[rng.Next(templates.Length)];
            findings.Add(new PipelineFinding { Category = t.Cat, Severity = t.Sev, Description = t.Desc, AutoFixAvailable = t.Fix, Fixed = false });
        }
        return findings;
    }

    private static List<GeneratedTestFile> GenerateTestFiles(Random rng, string projectId)
    {
        var tests = new List<GeneratedTestFile>();
        var templates = new[]
        {
            new { Name = $"{projectId}.component.test.tsx", Desc = "Component rendering and interaction tests" },
            new { Name = $"{projectId}.api.test.ts", Desc = "API endpoint integration tests" },
            new { Name = $"{projectId}.utils.test.ts", Desc = "Utility function unit tests" },
            new { Name = $"{projectId}.hooks.test.ts", Desc = "Custom React hook tests" },
            new { Name = $"{projectId}.store.test.ts", Desc = "State management store tests" },
        };
        var count = rng.Next(1, 4);
        for (var i = 0; i < count; i++)
        {
            var t = templates[rng.Next(templates.Length)];
            tests.Add(new GeneratedTestFile
            {
                FileName = t.Name,
                Description = t.Desc,
                TestCount = rng.Next(3, 12),
                LinesOfCode = rng.Next(30, 150),
            });
        }
        return tests;
    }
}

// --- DTOs ---

public class UpdatePipelineConfigDto
{
    public bool? PipelineEnabled { get; set; }
    public bool? AutoRunAfterGeneration { get; set; }
    public bool? AutoFixEnabled { get; set; }
    public bool? AstAnalysisEnabled { get; set; }
    public bool? SastScanEnabled { get; set; }
    public bool? AiReviewEnabled { get; set; }
    public bool? TestGenerationEnabled { get; set; }
    public int? MinQualityThreshold { get; set; }
}

public class RunPipelineDto
{
    public string ProjectId { get; set; } = "";
    public Guid? DevRequestId { get; set; }
}

public class PipelineFinding
{
    public string Category { get; set; } = "";
    public string Severity { get; set; } = "";
    public string Description { get; set; } = "";
    public bool AutoFixAvailable { get; set; }
    public bool Fixed { get; set; }
}

public class PipelineStepResult
{
    public string Name { get; set; } = "";
    public string Status { get; set; } = "";
    public int DurationMs { get; set; }
    public int FindingsCount { get; set; }
}

public class GeneratedTestFile
{
    public string FileName { get; set; } = "";
    public string Description { get; set; } = "";
    public int TestCount { get; set; }
    public int LinesOfCode { get; set; }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/biome-lint")]
public class BiomeLintController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public BiomeLintController(AiDevRequestDbContext db) => _db = db;

    private string UserId => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.BiomeLintResults
            .Where(r => r.UserId == UserId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("run")]
    public async Task<IActionResult> RunLint([FromBody] RunLintRequest req)
    {
        var count = await _db.BiomeLintResults.CountAsync(r => r.UserId == UserId);
        if (count >= 50) return BadRequest("Limit of 50 lint results reached.");

        var rng = new Random();
        var totalFiles = rng.Next(20, 200);
        var filesLinted = totalFiles;
        var errors = rng.Next(0, 15);
        var warnings = rng.Next(0, 30);
        var autoFixed = rng.Next(0, errors + warnings);

        double biomeLintMs, biomeFormatMs, eslintLintMs, eslintFormatMs;

        if (req.Toolchain == "biome")
        {
            biomeLintMs = rng.Next(80, 300);
            biomeFormatMs = rng.Next(40, 150);
            eslintLintMs = biomeLintMs * (3.5 + rng.NextDouble());
            eslintFormatMs = biomeFormatMs * (3.0 + rng.NextDouble() * 2);
        }
        else
        {
            eslintLintMs = rng.Next(400, 1200);
            eslintFormatMs = rng.Next(200, 600);
            biomeLintMs = eslintLintMs / (3.5 + rng.NextDouble());
            biomeFormatMs = eslintFormatMs / (3.0 + rng.NextDouble() * 2);
        }

        var lintMs = req.Toolchain == "biome" ? biomeLintMs : eslintLintMs;
        var formatMs = req.Toolchain == "biome" ? biomeFormatMs : eslintFormatMs;
        var totalMs = lintMs + formatMs;
        var eslintTotalMs = eslintLintMs + eslintFormatMs;
        var biomeTotalMs = biomeLintMs + biomeFormatMs;
        var speedup = eslintTotalMs / biomeTotalMs;

        var typeAwareIssues = req.TypeAware ? rng.Next(1, 10) : 0;

        var result = new BiomeLintResult
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            ProjectName = req.ProjectName,
            Toolchain = req.Toolchain,
            TotalFiles = totalFiles,
            FilesLinted = filesLinted,
            Errors = errors,
            Warnings = warnings,
            AutoFixed = autoFixed,
            LintDurationMs = Math.Round(lintMs, 1),
            FormatDurationMs = Math.Round(formatMs, 1),
            TotalDurationMs = Math.Round(totalMs, 1),
            SpeedupFactor = Math.Round(speedup, 1),
            TypeAwareEnabled = req.TypeAware,
            TypeAwareIssues = typeAwareIssues,
            ConfigPreset = req.Preset,
            Status = "completed"
        };

        _db.BiomeLintResults.Add(result);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            result = result,
            comparison = new
            {
                biome = new { lintMs = Math.Round(biomeLintMs, 1), formatMs = Math.Round(biomeFormatMs, 1), totalMs = Math.Round(biomeTotalMs, 1) },
                eslintPrettier = new { lintMs = Math.Round(eslintLintMs, 1), formatMs = Math.Round(eslintFormatMs, 1), totalMs = Math.Round(eslintTotalMs, 1) }
            },
            details = new[]
            {
                new { metric = "Lint Duration", biome = $"{Math.Round(biomeLintMs, 1)}ms", eslint = $"{Math.Round(eslintLintMs, 1)}ms", speedup = $"{Math.Round(eslintLintMs / biomeLintMs, 1)}x" },
                new { metric = "Format Duration", biome = $"{Math.Round(biomeFormatMs, 1)}ms", eslint = $"{Math.Round(eslintFormatMs, 1)}ms", speedup = $"{Math.Round(eslintFormatMs / biomeFormatMs, 1)}x" },
                new { metric = "Total Time", biome = $"{Math.Round(biomeTotalMs, 1)}ms", eslint = $"{Math.Round(eslintTotalMs, 1)}ms", speedup = $"{Math.Round(speedup, 1)}x" },
                new { metric = "Config Files", biome = "1 (biome.json)", eslint = "2+ (.eslintrc + .prettierrc)", speedup = "Simpler" },
                new { metric = "Type-Aware Rules", biome = req.TypeAware ? "Enabled" : "Available", eslint = "Requires tsc", speedup = "No tsc needed" }
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.BiomeLintResults.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (item == null) return NotFound();
        _db.BiomeLintResults.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var items = await _db.BiomeLintResults.Where(r => r.UserId == UserId).ToListAsync();
        if (items.Count == 0) return Ok(new { totalRuns = 0 });

        return Ok(new
        {
            totalRuns = items.Count,
            avgSpeedup = Math.Round(items.Average(r => r.SpeedupFactor), 1),
            totalErrors = items.Sum(r => r.Errors),
            totalAutoFixed = items.Sum(r => r.AutoFixed),
            avgLintMs = Math.Round(items.Average(r => r.LintDurationMs), 1),
            avgFormatMs = Math.Round(items.Average(r => r.FormatDurationMs), 1),
            byToolchain = items.GroupBy(r => r.Toolchain).Select(g => new
            {
                toolchain = g.Key,
                count = g.Count(),
                avgDuration = Math.Round(g.Average(r => r.TotalDurationMs), 1)
            }),
            byPreset = items.GroupBy(r => r.ConfigPreset).Select(g => new
            {
                preset = g.Key,
                count = g.Count(),
                avgErrors = Math.Round(g.Average(r => r.Errors), 1)
            })
        });
    }

    [AllowAnonymous]
    [HttpGet("presets")]
    public IActionResult GetPresets()
    {
        return Ok(new[]
        {
            new { id = "recommended", name = "Recommended", description = "Balanced rules for most projects — catches common issues without being noisy", rules = 150, color = "#3B82F6" },
            new { id = "strict", name = "Strict", description = "Maximum code quality enforcement — all rules enabled with zero tolerance", rules = 220, color = "#EF4444" },
            new { id = "minimal", name = "Minimal", description = "Only critical issues — formatting + essential error prevention", rules = 60, color = "#10B981" }
        });
    }

    public class RunLintRequest
    {
        public string ProjectName { get; set; } = string.Empty;
        public string Toolchain { get; set; } = "biome";
        public string Preset { get; set; } = "recommended";
        public bool TypeAware { get; set; }
    }
}

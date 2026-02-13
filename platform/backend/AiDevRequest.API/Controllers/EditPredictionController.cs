using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/edit-prediction")]
[Authorize]
public class EditPredictionController(AiDevRequestDbContext db) : ControllerBase
{
    private static readonly string[] FileExtensions = [".ts", ".tsx", ".cs", ".json", ".css", ".test.ts", ".spec.ts"];

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await db.EditPredictions
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze([FromBody] AnalyzeRequest req)
    {
        var rng = new Random();
        var affectedFiles = rng.Next(2, 12);
        var predictedEdits = affectedFiles + rng.Next(1, 8);
        var testFiles = rng.Next(0, Math.Max(1, affectedFiles / 2));
        var rippleDepth = Math.Round(1 + rng.NextDouble() * 3, 1);

        var entity = new EditPrediction
        {
            ProjectName = req.ProjectName,
            SourceFile = req.SourceFile,
            ChangeType = req.ChangeType,
            ChangeDescription = req.ChangeDescription,
            AffectedFiles = affectedFiles,
            PredictedEdits = predictedEdits,
            AcceptedEdits = 0,
            Confidence = Math.Round(70 + rng.NextDouble() * 28, 1),
            RippleDepth = rippleDepth,
            DependencyNodes = rng.Next(5, 30),
            ImportReferences = rng.Next(2, 15),
            TypeReferences = rng.Next(1, 10),
            TestFilesAffected = testFiles,
            AnalysisTimeMs = Math.Round(rng.NextDouble() * 500 + 50, 2),
            Status = "completed"
        };

        db.EditPredictions.Add(entity);
        await db.SaveChangesAsync();

        var predictions = Enumerable.Range(0, predictedEdits).Select(i =>
        {
            var ext = FileExtensions[rng.Next(FileExtensions.Length)];
            var dirs = new[] { "src/components", "src/pages", "src/api", "src/utils", "src/hooks", "tests", "src/types" };
            return new
            {
                file = $"{dirs[rng.Next(dirs.Length)]}/{req.SourceFile.Split('/').Last().Replace(".ts", "")}{(i > 0 ? $"_{i}" : "")}{ext}",
                editType = new[] { "update-import", "update-call-site", "update-type-reference", "update-test", "add-re-export" }[rng.Next(5)],
                confidence = Math.Round(50 + rng.NextDouble() * 48, 1),
                description = new[] {
                    "Update import statement to match renamed export",
                    "Update function call to match new signature",
                    "Update type annotation for changed interface",
                    "Update test assertion for modified behavior",
                    "Add re-export from barrel file"
                }[rng.Next(5)],
                lineRange = new { start = rng.Next(1, 50), end = rng.Next(50, 100) }
            };
        }).OrderByDescending(p => p.confidence).ToList();

        return Ok(new
        {
            prediction = entity,
            predictions,
            dependencyGraph = new
            {
                nodes = entity.DependencyNodes,
                edges = entity.DependencyNodes + rng.Next(3, 10),
                maxDepth = entity.RippleDepth,
                hotspots = rng.Next(1, 4)
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var entity = await db.EditPredictions.FindAsync(id);
        if (entity == null) return NotFound();
        db.EditPredictions.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await db.EditPredictions.ToListAsync();
        if (all.Count == 0) return Ok(new { totalAnalyses = 0 });

        var byChangeType = all.GroupBy(x => x.ChangeType).Select(g => new
        {
            changeType = g.Key,
            count = g.Count(),
            avgConfidence = Math.Round(g.Average(x => x.Confidence), 1)
        }).ToList();

        return Ok(new
        {
            totalAnalyses = all.Count,
            avgAffectedFiles = Math.Round(all.Average(x => (double)x.AffectedFiles), 1),
            avgConfidence = Math.Round(all.Average(x => x.Confidence), 1),
            avgRippleDepth = Math.Round(all.Average(x => x.RippleDepth), 1),
            avgAnalysisTimeMs = Math.Round(all.Average(x => x.AnalysisTimeMs), 2),
            totalPredictedEdits = all.Sum(x => x.PredictedEdits),
            byChangeType
        });
    }

    [AllowAnonymous]
    [HttpGet("change-types")]
    public IActionResult GetChangeTypes()
    {
        return Ok(new[]
        {
            new { id = "rename", name = "Rename Symbol", description = "Rename a function, variable, or type across the codebase", impact = "high" },
            new { id = "delete", name = "Delete Symbol", description = "Remove a function, component, or module and clean up references", impact = "high" },
            new { id = "modify-signature", name = "Modify Signature", description = "Change function parameters, return type, or interface shape", impact = "high" },
            new { id = "add-parameter", name = "Add Parameter", description = "Add a new parameter to an existing function or method", impact = "medium" },
            new { id = "change-type", name = "Change Type", description = "Change the type of a variable, parameter, or return value", impact = "medium" },
            new { id = "move", name = "Move Symbol", description = "Move a function or component to a different file or module", impact = "medium" }
        });
    }

    public record AnalyzeRequest(
        string ProjectName,
        string SourceFile,
        string ChangeType = "rename",
        string ChangeDescription = ""
    );
}

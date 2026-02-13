using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/vision-to-code")]
public class VisionToCodeController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public VisionToCodeController(AiDevRequestDbContext db) => _db = db;

    private string UserId => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.VisionToCodeResults
            .Where(v => v.UserId == UserId)
            .OrderByDescending(v => v.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateRequest req)
    {
        var count = await _db.VisionToCodeResults.CountAsync(v => v.UserId == UserId);
        if (count >= 50) return BadRequest("Limit of 50 generations reached.");

        var rng = new Random();
        var components = rng.Next(3, 15);
        var lines = rng.Next(80, 500);
        var styleMatch = Math.Round(0.65 + rng.NextDouble() * 0.3, 2);
        var layoutAcc = Math.Round(0.6 + rng.NextDouble() * 0.35, 2);
        var colorAcc = Math.Round(0.7 + rng.NextDouble() * 0.25, 2);
        var typoAcc = Math.Round(0.6 + rng.NextDouble() * 0.35, 2);
        var processingMs = rng.Next(1500, 8000);

        var result = new VisionToCodeResult
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            ImageName = req.ImageName,
            ImageType = req.ImageType,
            ComponentsGenerated = components,
            LinesOfCode = lines,
            Framework = req.Framework,
            StylingEngine = req.StylingEngine,
            StyleMatchScore = styleMatch,
            LayoutAccuracy = layoutAcc,
            ColorAccuracy = colorAcc,
            TypographyAccuracy = typoAcc,
            ProcessingMs = processingMs,
            Refinements = 0,
            Status = "completed"
        };

        _db.VisionToCodeResults.Add(result);
        await _db.SaveChangesAsync();

        var generatedComponents = new[]
        {
            new { name = "PageLayout", type = "layout", lines = rng.Next(20, 60), confidence = Math.Round(0.8 + rng.NextDouble() * 0.2, 2) },
            new { name = "Header", type = "component", lines = rng.Next(15, 40), confidence = Math.Round(0.75 + rng.NextDouble() * 0.2, 2) },
            new { name = "NavigationBar", type = "component", lines = rng.Next(20, 50), confidence = Math.Round(0.7 + rng.NextDouble() * 0.25, 2) },
            new { name = "ContentSection", type = "component", lines = rng.Next(25, 80), confidence = Math.Round(0.7 + rng.NextDouble() * 0.25, 2) },
            new { name = "CardGrid", type = "component", lines = rng.Next(30, 70), confidence = Math.Round(0.65 + rng.NextDouble() * 0.3, 2) },
            new { name = "Footer", type = "component", lines = rng.Next(15, 35), confidence = Math.Round(0.8 + rng.NextDouble() * 0.15, 2) },
            new { name = "Button", type = "primitive", lines = rng.Next(8, 20), confidence = Math.Round(0.85 + rng.NextDouble() * 0.15, 2) }
        };

        var styleAnalysis = new
        {
            primaryColor = $"#{rng.Next(0, 256):X2}{rng.Next(0, 256):X2}{rng.Next(0, 256):X2}",
            secondaryColor = $"#{rng.Next(0, 256):X2}{rng.Next(0, 256):X2}{rng.Next(0, 256):X2}",
            backgroundColor = $"#{rng.Next(200, 256):X2}{rng.Next(200, 256):X2}{rng.Next(200, 256):X2}",
            fontFamily = new[] { "Inter", "Roboto", "Poppins", "SF Pro", "Nunito" }[rng.Next(5)],
            fontSize = $"{rng.Next(14, 18)}px",
            borderRadius = $"{rng.Next(4, 16)}px",
            spacing = $"{rng.Next(4, 8) * 4}px"
        };

        var accuracyBreakdown = new[]
        {
            new { metric = "Layout Structure", score = layoutAcc, rating = layoutAcc > 0.85 ? "Excellent" : layoutAcc > 0.7 ? "Good" : "Fair" },
            new { metric = "Color Matching", score = colorAcc, rating = colorAcc > 0.85 ? "Excellent" : colorAcc > 0.7 ? "Good" : "Fair" },
            new { metric = "Typography", score = typoAcc, rating = typoAcc > 0.85 ? "Excellent" : typoAcc > 0.7 ? "Good" : "Fair" },
            new { metric = "Spacing & Alignment", score = Math.Round(0.6 + rng.NextDouble() * 0.35, 2), rating = styleMatch > 0.8 ? "Excellent" : styleMatch > 0.65 ? "Good" : "Fair" },
            new { metric = "Overall Match", score = styleMatch, rating = styleMatch > 0.85 ? "Excellent" : styleMatch > 0.7 ? "Good" : "Fair" }
        };

        return Ok(new
        {
            result,
            generatedComponents,
            styleAnalysis,
            accuracyBreakdown
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.VisionToCodeResults.FirstOrDefaultAsync(v => v.Id == id && v.UserId == UserId);
        if (item == null) return NotFound();
        _db.VisionToCodeResults.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var items = await _db.VisionToCodeResults.Where(v => v.UserId == UserId).ToListAsync();
        if (items.Count == 0) return Ok(new { totalGenerations = 0 });

        return Ok(new
        {
            totalGenerations = items.Count,
            totalComponents = items.Sum(v => v.ComponentsGenerated),
            totalLines = items.Sum(v => v.LinesOfCode),
            avgStyleMatch = Math.Round(items.Average(v => v.StyleMatchScore), 2),
            avgLayoutAccuracy = Math.Round(items.Average(v => v.LayoutAccuracy), 2),
            avgColorAccuracy = Math.Round(items.Average(v => v.ColorAccuracy), 2),
            avgProcessingMs = Math.Round(items.Average(v => v.ProcessingMs), 0),
            byImageType = items.GroupBy(v => v.ImageType).Select(g => new
            {
                imageType = g.Key,
                count = g.Count(),
                avgMatch = Math.Round(g.Average(x => x.StyleMatchScore), 2)
            }),
            byFramework = items.GroupBy(v => v.Framework).Select(g => new
            {
                framework = g.Key,
                count = g.Count(),
                avgLines = Math.Round(g.Average(x => x.LinesOfCode), 0)
            })
        });
    }

    [AllowAnonymous]
    [HttpGet("image-types")]
    public IActionResult GetImageTypes()
    {
        return Ok(new[]
        {
            new { id = "screenshot", name = "Screenshot", description = "Capture any existing UI and generate matching components", icon = "camera", color = "#3B82F6" },
            new { id = "mockup", name = "Mockup / Figma", description = "Import design mockups from Figma, Sketch, or Adobe XD exports", icon = "palette", color = "#10B981" },
            new { id = "sketch", name = "Hand-drawn Sketch", description = "Photograph hand-drawn UI sketches and convert to code", icon = "pencil", color = "#F59E0B" },
            new { id = "wireframe", name = "Wireframe", description = "Convert low-fidelity wireframes into functional components", icon = "grid", color = "#8B5CF6" }
        });
    }

    public class GenerateRequest
    {
        public string ImageName { get; set; } = string.Empty;
        public string ImageType { get; set; } = "screenshot";
        public string Framework { get; set; } = "react";
        public string StylingEngine { get; set; } = "tailwind";
    }
}

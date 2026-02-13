using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/confidence-scores")]
public class ConfidenceScoreController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public ConfidenceScoreController(AiDevRequestDbContext db) => _db = db;

    [HttpPost("evaluate")]
    public async Task<IActionResult> Evaluate([FromBody] EvaluateRequest req)
    {
        var rng = new Random();

        // Simulate confidence scoring based on request characteristics
        var descLength = req.Description.Length;
        var hasSpecificTech = req.Description.Contains("React") || req.Description.Contains("API") || req.Description.Contains(".NET");
        var hasVagueTerms = req.Description.Contains("something") || req.Description.Contains("maybe") || req.Description.Contains("somehow");
        var wordCount = req.Description.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

        // Calculate score components
        var clarityScore = Math.Min(1.0, descLength / 200.0) * (hasVagueTerms ? 0.6 : 1.0);
        var specificityScore = hasSpecificTech ? 0.8 + rng.NextDouble() * 0.2 : 0.3 + rng.NextDouble() * 0.4;
        var scopeScore = wordCount > 50 ? 0.7 : wordCount > 20 ? 0.85 : 0.5;
        var overallScore = Math.Round((clarityScore * 0.35 + specificityScore * 0.35 + scopeScore * 0.3) * 100) / 100;

        var confidenceLevel = overallScore >= 0.7 ? "green" : overallScore >= 0.4 ? "yellow" : "red";
        var complexity = overallScore >= 0.7 ? "low" : overallScore >= 0.5 ? "medium" : overallScore >= 0.3 ? "high" : "extreme";
        var ambiguity = hasVagueTerms ? "high" : descLength > 100 ? "low" : "medium";
        var feasibility = overallScore >= 0.6 ? "feasible" : overallScore >= 0.3 ? "challenging" : "infeasible";

        var factors = new[]
        {
            new { factor = "Description Clarity", score = Math.Round(clarityScore, 2), detail = descLength > 100 ? "Good detail provided" : "Could use more detail" },
            new { factor = "Technical Specificity", score = Math.Round(specificityScore, 2), detail = hasSpecificTech ? "Specific technologies mentioned" : "No specific technologies referenced" },
            new { factor = "Scope Definition", score = Math.Round(scopeScore, 2), detail = wordCount > 50 ? "Well-defined scope" : "Scope could be clearer" },
            new { factor = "Ambiguity Check", score = hasVagueTerms ? 0.3 : 0.9, detail = hasVagueTerms ? "Contains vague language" : "Clear and unambiguous" },
            new { factor = "Feasibility Assessment", score = overallScore >= 0.5 ? 0.85 : 0.45, detail = overallScore >= 0.5 ? "Within AI generation capabilities" : "May require human assistance" }
        };

        var suggestions = new List<string>();
        if (descLength < 100) suggestions.Add("Add more detail to your request description (aim for 100+ characters)");
        if (!hasSpecificTech) suggestions.Add("Mention specific technologies or frameworks you want to use");
        if (hasVagueTerms) suggestions.Add("Replace vague terms ('something', 'maybe') with specific requirements");
        if (wordCount < 20) suggestions.Add("Expand your request with user stories or acceptance criteria");
        if (overallScore < 0.4) suggestions.Add("Consider breaking this into smaller, more focused requests");

        var effort = overallScore >= 0.7 ? "1-2 hours" : overallScore >= 0.5 ? "2-4 hours" : overallScore >= 0.3 ? "4-8 hours" : "8+ hours (consider splitting)";

        var score = new ConfidenceScore
        {
            UserId = User.FindFirst("sub")?.Value ?? "anonymous",
            RequestTitle = req.Title,
            RequestDescription = req.Description,
            ConfidenceLevel = confidenceLevel,
            Score = overallScore,
            ComplexityRating = complexity,
            AmbiguityLevel = ambiguity,
            FeasibilityRating = feasibility,
            Factors = System.Text.Json.JsonSerializer.Serialize(factors),
            Suggestions = System.Text.Json.JsonSerializer.Serialize(suggestions),
            EstimatedEffort = effort
        };
        _db.ConfidenceScores.Add(score);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            score.Id,
            score.RequestTitle,
            score.ConfidenceLevel,
            score.Score,
            score.ComplexityRating,
            score.AmbiguityLevel,
            score.FeasibilityRating,
            score.EstimatedEffort,
            factors,
            suggestions,
            recommendation = confidenceLevel switch
            {
                "green" => "High confidence — this request is well-suited for AI generation. Proceed with full generation.",
                "yellow" => "Medium confidence — the request could benefit from refinement. Consider the suggestions above before generating.",
                "red" => "Low confidence — this request needs significant clarification. Refine before committing resources.",
                _ => "Unable to determine confidence."
            }
        });
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var scores = await _db.ConfidenceScores
            .OrderByDescending(s => s.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(scores);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var score = await _db.ConfidenceScores.FindAsync(id);
        if (score == null) return NotFound();
        _db.ConfidenceScores.Remove(score);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var scores = await _db.ConfidenceScores.ToListAsync();
        var byLevel = scores.GroupBy(s => s.ConfidenceLevel).Select(g => new
        {
            level = g.Key,
            count = g.Count(),
            avgScore = Math.Round(g.Average(s => s.Score), 2)
        }).ToList();
        return Ok(new { total = scores.Count, byLevel });
    }

    [HttpGet("levels")]
    [AllowAnonymous]
    public IActionResult GetLevels()
    {
        return Ok(new[]
        {
            new { id = "green", name = "High Confidence", description = "Request is clear, specific, and well-suited for AI generation. 2x more likely to produce successful results.", scoreRange = "0.70 - 1.00", successRate = "85%+", color = "#22c55e",
                characteristics = new[] { "Specific technologies mentioned", "Clear acceptance criteria", "Well-defined scope", "Unambiguous language" } },
            new { id = "yellow", name = "Medium Confidence", description = "Request has potential but could benefit from refinement. Some ambiguity or missing details detected.", scoreRange = "0.40 - 0.69", successRate = "50-84%", color = "#eab308",
                characteristics = new[] { "Partial tech specifications", "Moderate scope definition", "Some vague requirements", "Missing acceptance criteria" } },
            new { id = "red", name = "Low Confidence", description = "Request needs significant clarification before AI generation. High risk of wasted compute and poor results.", scoreRange = "0.00 - 0.39", successRate = "<50%", color = "#ef4444",
                characteristics = new[] { "Vague or abstract description", "No technology preferences", "Unclear scope boundaries", "Multiple interpretations possible" } }
        });
    }

    public record EvaluateRequest(string Title, string Description);
}

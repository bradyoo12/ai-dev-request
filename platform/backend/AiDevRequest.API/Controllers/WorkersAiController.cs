using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/workers-ai")]
[Authorize]
public class WorkersAiController(AiDevRequestDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await db.WorkersAiDeployments
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("deploy")]
    public async Task<IActionResult> Deploy([FromBody] DeployRequest req)
    {
        var rng = new Random();
        var edgeLocations = req.EdgeRegion == "auto" ? rng.Next(150, 185) : rng.Next(30, 60);

        var entity = new WorkersAiDeployment
        {
            ProjectName = req.ProjectName,
            ModelId = req.ModelId,
            ModelCategory = req.ModelCategory,
            EdgeRegion = req.EdgeRegion,
            EdgeLocations = edgeLocations,
            InferenceLatencyMs = Math.Round(rng.NextDouble() * 80 + 15, 2),
            TotalInferences = 0,
            TokensProcessed = 0,
            CostUsd = 0,
            CustomModel = req.CustomModel,
            CustomModelSource = req.CustomModelSource ?? "none",
            ZeroColdStart = true,
            SuccessRate = Math.Round(95 + rng.NextDouble() * 5, 1),
            Status = "active"
        };

        db.WorkersAiDeployments.Add(entity);
        await db.SaveChangesAsync();

        return Ok(new
        {
            deployment = entity,
            endpoint = $"https://{req.ProjectName.ToLower().Replace(" ", "-")}.workers.dev/ai/{req.ModelCategory}",
            capabilities = new
            {
                zeroColdStart = true,
                serverlessGpu = true,
                globalEdge = edgeLocations > 100,
                customModels = req.CustomModel,
                payPerInference = true
            },
            pricing = new
            {
                inputTokens = "$0.011 per 1M tokens",
                outputTokens = "$0.019 per 1M tokens",
                imageInference = "$0.0001 per image",
                embeddingTokens = "$0.008 per 1M tokens"
            },
            deployTimeMs = rng.Next(100, 500)
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var entity = await db.WorkersAiDeployments.FindAsync(id);
        if (entity == null) return NotFound();
        db.WorkersAiDeployments.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await db.WorkersAiDeployments.ToListAsync();
        if (all.Count == 0) return Ok(new { totalDeployments = 0 });

        var byCategory = all.GroupBy(x => x.ModelCategory).Select(g => new
        {
            category = g.Key,
            count = g.Count(),
            avgLatencyMs = Math.Round(g.Average(x => x.InferenceLatencyMs), 2)
        }).ToList();

        return Ok(new
        {
            totalDeployments = all.Count,
            totalInferences = all.Sum(x => x.TotalInferences),
            avgLatencyMs = Math.Round(all.Average(x => x.InferenceLatencyMs), 2),
            avgSuccessRate = Math.Round(all.Average(x => x.SuccessRate), 1),
            totalCostUsd = Math.Round(all.Sum(x => x.CostUsd), 4),
            customModels = all.Count(x => x.CustomModel),
            byCategory
        });
    }

    [AllowAnonymous]
    [HttpGet("models")]
    public IActionResult GetModels()
    {
        return Ok(new[]
        {
            new { id = "@cf/meta/llama-3.1-8b-instruct", name = "Llama 3.1 8B Instruct", category = "text-generation", provider = "Meta", popular = true },
            new { id = "@cf/mistral/mistral-7b-instruct-v0.2", name = "Mistral 7B Instruct", category = "text-generation", provider = "Mistral AI", popular = true },
            new { id = "@cf/baai/bge-large-en-v1.5", name = "BGE Large EN v1.5", category = "embeddings", provider = "BAAI", popular = true },
            new { id = "@cf/openai/whisper", name = "Whisper", category = "speech-to-text", provider = "OpenAI", popular = false },
            new { id = "@cf/microsoft/resnet-50", name = "ResNet-50", category = "image-classification", provider = "Microsoft", popular = false },
            new { id = "@cf/meta/m2m100-1.2b", name = "M2M100 1.2B", category = "translation", provider = "Meta", popular = false }
        });
    }

    public record DeployRequest(
        string ProjectName,
        string ModelId,
        string ModelCategory,
        string EdgeRegion = "auto",
        bool CustomModel = false,
        string? CustomModelSource = null
    );
}

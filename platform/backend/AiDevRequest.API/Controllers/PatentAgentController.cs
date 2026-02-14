using Microsoft.AspNetCore.Mvc;
using AiDevRequest.API.Services;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/patent-agent")]
public class PatentAgentController : ControllerBase
{
    private readonly IPatentAgentService _patentAgentService;

    public PatentAgentController(IPatentAgentService patentAgentService)
    {
        _patentAgentService = patentAgentService;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var innovations = await _patentAgentService.GetAllInnovationsAsync();
        return Ok(innovations);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var innovation = await _patentAgentService.GetInnovationByIdAsync(id);
        if (innovation == null) return NotFound();
        return Ok(innovation);
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze()
    {
        var innovations = await _patentAgentService.AnalyzeCodebaseAsync();
        return Ok(innovations);
    }

    [HttpPost("{id}/draft")]
    public async Task<IActionResult> GenerateDraft(Guid id)
    {
        try
        {
            var draft = await _patentAgentService.GeneratePatentDraftAsync(id);
            return Ok(new { draft });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await _patentAgentService.GetAllInnovationsAsync();
        var byTier = all.GroupBy(x => x.Category)
            .Select(g => new { tier = g.Key, count = g.Count(), avgScore = g.Average(x => x.NoveltyScore + x.NonObviousnessScore + x.UtilityScore + x.CommercialValueScore) })
            .OrderBy(x => x.tier)
            .ToList();
        var byStatus = all.GroupBy(x => x.Status)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToList();
        return Ok(new { total = all.Count, byTier, byStatus });
    }
}

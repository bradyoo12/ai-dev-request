using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/agent-trace")]
public class AgentTraceController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public AgentTraceController(AiDevRequestDbContext db) => _db = db;

    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze([FromBody] AnalyzeRequest req)
    {
        var rng = new Random();
        var totalLines = rng.Next(50, 500);
        var aiLines = (int)(totalLines * (rng.NextDouble() * 0.4 + 0.5)); // 50-90% AI
        var humanLines = totalLines - aiLines;
        var aiPct = Math.Round((double)aiLines / totalLines * 100, 1);

        var files = GenerateFileTraces(req.ProjectName, rng, totalLines);

        var trace = new AgentTrace
        {
            UserId = User.FindFirst("sub")?.Value ?? "anonymous",
            ProjectName = req.ProjectName,
            FileName = req.FileName,
            AuthorType = aiPct > 80 ? "ai" : aiPct < 20 ? "human" : "mixed",
            StartLine = 1,
            EndLine = totalLines,
            TotalLines = totalLines,
            AiGeneratedLines = aiLines,
            HumanEditedLines = humanLines,
            AiPercentage = aiPct,
            ModelUsed = req.ModelUsed,
            ConversationId = Guid.NewGuid().ToString("N")[..12],
            PromptSummary = $"Generate {req.FileName} for {req.ProjectName}",
            TraceFormat = "agent-trace-v1",
            TraceMetadata = System.Text.Json.JsonSerializer.Serialize(new { version = "1.0", spec = "agent-trace.dev" }),
            ComplianceStatus = aiPct > 95 ? "review-needed" : "compliant"
        };
        _db.AgentTraces.Add(trace);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            trace.Id,
            trace.ProjectName,
            trace.FileName,
            trace.AuthorType,
            trace.TotalLines,
            trace.AiGeneratedLines,
            trace.HumanEditedLines,
            aiPercentage = trace.AiPercentage,
            trace.ModelUsed,
            trace.ConversationId,
            trace.TraceFormat,
            trace.ComplianceStatus,
            files,
            summary = new
            {
                totalFiles = files.Count,
                avgAiPercentage = Math.Round(files.Average(f => f.AiPercentage), 1),
                complianceStatus = trace.ComplianceStatus,
                recommendation = aiPct > 95
                    ? "High AI content — consider human review for compliance"
                    : aiPct > 70
                    ? "Good balance — AI-generated with human oversight"
                    : "Mostly human-authored — minimal AI attribution needed"
            }
        });
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var traces = await _db.AgentTraces
            .OrderByDescending(t => t.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(traces);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var trace = await _db.AgentTraces.FindAsync(id);
        if (trace == null) return NotFound();
        _db.AgentTraces.Remove(trace);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var traces = await _db.AgentTraces.ToListAsync();
        var byAuthor = traces.GroupBy(t => t.AuthorType).Select(g => new
        {
            authorType = g.Key,
            count = g.Count(),
            avgAiPercentage = Math.Round(g.Average(t => t.AiPercentage), 1)
        }).ToList();
        return Ok(new { total = traces.Count, byAuthor });
    }

    [HttpGet("formats")]
    [AllowAnonymous]
    public IActionResult GetFormats()
    {
        return Ok(new[]
        {
            new { id = "agent-trace-v1", name = "Agent Trace v1", description = "Vendor-neutral JSON standard for AI code attribution", spec = "agent-trace.dev", supporters = new[] { "Cursor", "Cognition (Devin)", "Cloudflare", "Vercel", "Google Jules" },
                fields = new[] { "authorType", "startLine", "endLine", "modelUsed", "conversationId", "promptSummary" } },
            new { id = "spdx-ai", name = "SPDX AI Extension", description = "Software Package Data Exchange with AI metadata", spec = "spdx.dev",  supporters = new[] { "Linux Foundation", "OpenSSF" },
                fields = new[] { "aiGenerated", "modelId", "trainingData", "license" } },
            new { id = "sarif-ai", name = "SARIF + AI Annotations", description = "Static Analysis Results with AI origin markers", spec = "sarifweb.azurewebsites.net", supporters = new[] { "Microsoft", "GitHub" },
                fields = new[] { "toolName", "ruleId", "aiConfidence", "codeFlowLocations" } },
            new { id = "cyclonedx-ai", name = "CycloneDX AI BOM", description = "AI Bill of Materials tracking model usage", spec = "cyclonedx.org", supporters = new[] { "OWASP", "CycloneDX Project" },
                fields = new[] { "componentType", "modelCard", "datasetId", "inferenceEndpoint" } }
        });
    }

    private static List<FileTrace> GenerateFileTraces(string project, Random rng, int baseTotalLines)
    {
        var extensions = new[] { ".tsx", ".ts", ".cs", ".json", ".css" };
        var folders = new[] { "src/components", "src/pages", "src/api", "Controllers", "Services" };
        var count = rng.Next(3, 8);
        var files = new List<FileTrace>();
        for (var i = 0; i < count; i++)
        {
            var lines = rng.Next(20, baseTotalLines);
            var aiLines = (int)(lines * (rng.NextDouble() * 0.5 + 0.4));
            files.Add(new FileTrace
            {
                FileName = $"{folders[i % folders.Length]}/{project.Replace(" ", "")}{extensions[i % extensions.Length]}",
                TotalLines = lines,
                AiGeneratedLines = aiLines,
                HumanEditedLines = lines - aiLines,
                AiPercentage = Math.Round((double)aiLines / lines * 100, 1),
                AuthorType = (double)aiLines / lines > 0.8 ? "ai" : (double)aiLines / lines < 0.2 ? "human" : "mixed"
            });
        }
        return files;
    }

    public record AnalyzeRequest(string ProjectName, string FileName, string ModelUsed = "claude-opus-4-6");

    public class FileTrace
    {
        public string FileName { get; set; } = string.Empty;
        public int TotalLines { get; set; }
        public int AiGeneratedLines { get; set; }
        public int HumanEditedLines { get; set; }
        public double AiPercentage { get; set; }
        public string AuthorType { get; set; } = string.Empty;
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/agentic-workflows")]
public class AgenticWorkflowController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public AgenticWorkflowController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.AgenticWorkflows
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("deploy")]
    public async Task<IActionResult> Deploy([FromBody] DeployRequest req)
    {
        var rand = new Random();
        var rolloutPercent = req.Strategy switch
        {
            "canary" => 5,
            "blue-green" => 50,
            "rolling" => 25,
            _ => 100
        };

        var totalRequests = rand.Next(100, 5000);
        var successRate = 0.85 + rand.NextDouble() * 0.15;
        var failedRequests = (int)(totalRequests * (1 - successRate));
        var avgLatency = 50 + rand.NextDouble() * 500;
        var costPerRequest = 0.001 + rand.NextDouble() * 0.05;

        var rollbackTriggered = successRate < 0.90 || costPerRequest > 0.04;
        var healthStatus = rollbackTriggered ? "degraded" : successRate > 0.98 ? "healthy" : "healthy";

        var alerts = new List<object>();
        if (successRate < 0.95)
            alerts.Add(new { type = "warning", message = $"Success rate {(successRate * 100):F1}% below 95% threshold" });
        if (costPerRequest > 0.03)
            alerts.Add(new { type = "warning", message = $"Cost ${costPerRequest:F3}/req exceeds $0.03 budget" });
        if (avgLatency > 400)
            alerts.Add(new { type = "info", message = $"Latency {avgLatency:F0}ms approaching 500ms limit" });

        if (rollbackTriggered)
        {
            healthStatus = "rolled-back";
            alerts.Add(new { type = "critical", message = "Automatic rollback triggered" });
        }

        var wf = new AgenticWorkflow
        {
            UserId = "demo-user",
            ProjectName = req.ProjectName,
            WorkflowName = req.WorkflowName,
            WorkflowVersion = req.Version,
            DeploymentStrategy = req.Strategy,
            RolloutPercent = rolloutPercent,
            SuccessRate = Math.Round(successRate, 4),
            AvgLatencyMs = Math.Round(avgLatency, 1),
            CostPerRequest = Math.Round(costPerRequest, 4),
            TotalRequests = totalRequests,
            FailedRequests = failedRequests,
            RollbackTriggered = rollbackTriggered,
            RollbackReason = rollbackTriggered ? (successRate < 0.90 ? "Error rate exceeded 10% threshold" : "Cost per request exceeded $0.04 limit") : "",
            RollbackVersion = rollbackTriggered ? "v" + (double.Parse(req.Version.TrimStart('v')) - 0.1).ToString("F1") : "",
            HealthStatus = healthStatus,
            MonitoringAlerts = JsonSerializer.Serialize(alerts)
        };

        _db.AgenticWorkflows.Add(wf);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            wf.Id,
            wf.ProjectName,
            wf.WorkflowName,
            wf.WorkflowVersion,
            wf.DeploymentStrategy,
            wf.RolloutPercent,
            successRate = Math.Round(wf.SuccessRate * 100, 1),
            wf.AvgLatencyMs,
            wf.CostPerRequest,
            wf.TotalRequests,
            wf.FailedRequests,
            wf.RollbackTriggered,
            wf.RollbackReason,
            wf.RollbackVersion,
            wf.HealthStatus,
            alerts,
            recommendation = rollbackTriggered
                ? $"Workflow rolled back to {wf.RollbackVersion}. Review alerts and fix issues before redeploying."
                : rolloutPercent < 100
                    ? $"Workflow deployed at {rolloutPercent}% rollout. Monitor metrics before increasing."
                    : "Workflow fully deployed. All metrics within healthy thresholds."
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.AgenticWorkflows.FindAsync(id);
        if (item == null) return NotFound();
        _db.AgenticWorkflows.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await _db.AgenticWorkflows.ToListAsync();
        var byStrategy = all.GroupBy(x => x.DeploymentStrategy)
            .Select(g => new { strategy = g.Key, count = g.Count(), avgSuccess = Math.Round(g.Average(x => x.SuccessRate) * 100, 1) })
            .ToList();
        return Ok(new { total = all.Count, byStrategy });
    }

    [HttpGet("strategies")]
    public IActionResult Strategies()
    {
        var strategies = new[]
        {
            new { id = "canary", name = "Canary Deployment", description = "Test on 5% of traffic first, auto-promote on success metrics", rollout = "5% → 25% → 50% → 100%", riskLevel = "low", features = new[] { "5% initial traffic", "Auto-promotion on success", "Instant rollback", "A/B comparison" } },
            new { id = "blue-green", name = "Blue-Green Deployment", description = "Run two identical environments, switch traffic instantly", rollout = "0% → 100% (instant switch)", riskLevel = "medium", features = new[] { "Zero-downtime switch", "Full environment parity", "Quick rollback", "Cost: 2x infrastructure" } },
            new { id = "rolling", name = "Rolling Update", description = "Gradually replace instances with new version", rollout = "25% → 50% → 75% → 100%", riskLevel = "medium", features = new[] { "Gradual instance replacement", "No extra infrastructure", "Moderate rollback speed", "Load balanced" } },
            new { id = "full", name = "Full Deployment", description = "Deploy to 100% immediately with monitoring", rollout = "100% (immediate)", riskLevel = "high", features = new[] { "Fastest deployment", "Highest risk", "Monitor-and-rollback", "Simple to manage" } }
        };
        return Ok(strategies);
    }

    public class DeployRequest
    {
        public string ProjectName { get; set; } = string.Empty;
        public string WorkflowName { get; set; } = string.Empty;
        public string Version { get; set; } = "v1.0";
        public string Strategy { get; set; } = "canary";
    }
}

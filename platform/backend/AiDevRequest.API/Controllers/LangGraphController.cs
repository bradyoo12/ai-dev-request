using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/langgraph")]
[Authorize]
public class LangGraphController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public LangGraphController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("workflows")]
    public async Task<IActionResult> ListWorkflows()
    {
        var userId = GetUserId();
        var workflows = await _db.LangGraphWorkflows.Where(w => w.UserId == userId)
            .OrderByDescending(w => w.UpdatedAt).Take(50).ToListAsync();
        return Ok(workflows);
    }

    [HttpPost("workflows")]
    public async Task<IActionResult> CreateWorkflow([FromBody] CreateWorkflowRequest request)
    {
        var userId = GetUserId();
        var count = await _db.LangGraphWorkflows.CountAsync(w => w.UserId == userId);
        if (count >= 50) return BadRequest("Maximum 50 workflows per user");

        var nodes = new List<object>();
        var edges = new List<object>();

        // Build nodes from request or default
        var nodeTypes = request.NodeTypes ?? new[] { "analyzer", "generator", "reviewer" };
        for (int i = 0; i < nodeTypes.Length; i++)
        {
            nodes.Add(new { id = $"node-{i + 1}", type = nodeTypes[i], name = GetNodeName(nodeTypes[i]), status = "pending", config = new { }, outputJson = "{}", executionTimeMs = 0 });
            if (i > 0)
                edges.Add(new { from = $"node-{i}", to = $"node-{i + 1}", condition = "success" });
        }

        var workflow = new LangGraphWorkflow
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            WorkflowName = request.Name ?? "Untitled Workflow",
            Description = request.Description ?? "",
            NodesJson = JsonSerializer.Serialize(nodes),
            EdgesJson = JsonSerializer.Serialize(edges),
            TotalNodes = nodeTypes.Length,
            StampedeProtectionEnabled = true,
            DevRequestId = request.DevRequestId,
        };

        _db.LangGraphWorkflows.Add(workflow);
        await _db.SaveChangesAsync();
        return Ok(workflow);
    }

    [HttpGet("workflows/{id}")]
    public async Task<IActionResult> GetWorkflow(Guid id)
    {
        var userId = GetUserId();
        var workflow = await _db.LangGraphWorkflows.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        if (workflow == null) return NotFound();
        return Ok(workflow);
    }

    [HttpPost("workflows/{id}/execute")]
    public async Task<IActionResult> ExecuteWorkflow(Guid id)
    {
        var userId = GetUserId();
        var workflow = await _db.LangGraphWorkflows.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        if (workflow == null) return NotFound();

        // Simulate execution: mark all nodes as completed with timing
        var nodes = JsonSerializer.Deserialize<List<JsonElement>>(workflow.NodesJson) ?? new();
        var completedNodes = new List<object>();
        var rand = new Random();
        var totalTimeMs = 0.0;

        foreach (var node in nodes)
        {
            var timeMs = rand.Next(200, 1500);
            totalTimeMs += timeMs;
            completedNodes.Add(new
            {
                id = node.GetProperty("id").GetString(),
                type = node.GetProperty("type").GetString(),
                name = node.GetProperty("name").GetString(),
                status = "completed",
                config = new { },
                outputJson = JsonSerializer.Serialize(new { result = "success", artifacts = rand.Next(1, 8) }),
                executionTimeMs = timeMs
            });
        }

        workflow.NodesJson = JsonSerializer.Serialize(completedNodes);
        workflow.Status = "completed";
        workflow.CompletedNodes = completedNodes.Count;
        workflow.TotalExecutions++;
        workflow.AvgExecutionTimeMs = totalTimeMs / Math.Max(completedNodes.Count, 1);
        workflow.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(workflow);
    }

    [HttpPost("workflows/{id}/pause")]
    public async Task<IActionResult> PauseWorkflow(Guid id)
    {
        var userId = GetUserId();
        var workflow = await _db.LangGraphWorkflows.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        if (workflow == null) return NotFound();

        workflow.Status = workflow.Status == "paused" ? "draft" : "paused";
        workflow.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(workflow);
    }

    [HttpGet("node-types")]
    [AllowAnonymous]
    public IActionResult GetNodeTypes()
    {
        var types = new[]
        {
            new { id = "analyzer", name = "Analyzer", description = "Analyzes requirements, extracts features, identifies constraints", color = "#3b82f6", icon = "search" },
            new { id = "generator", name = "Code Generator", description = "Generates source code from specifications and design patterns", color = "#10b981", icon = "code" },
            new { id = "reviewer", name = "Code Reviewer", description = "Reviews generated code for quality, security, and best practices", color = "#f59e0b", icon = "eye" },
            new { id = "tester", name = "Test Generator", description = "Creates unit tests, integration tests, and E2E test suites", color = "#ef4444", icon = "check" },
            new { id = "deployer", name = "Deployer", description = "Handles deployment, infrastructure provisioning, and CI/CD", color = "#8b5cf6", icon = "rocket" },
            new { id = "custom", name = "Custom Agent", description = "User-defined agent with custom prompts and tool access", color = "#6b7280", icon = "settings" },
        };
        return Ok(types);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var workflows = await _db.LangGraphWorkflows.Where(w => w.UserId == userId).ToListAsync();

        var stats = new
        {
            totalWorkflows = workflows.Count,
            completedWorkflows = workflows.Count(w => w.Status == "completed"),
            successRate = workflows.Count > 0 ? Math.Round(workflows.Count(w => w.Status == "completed") * 100.0 / workflows.Count, 1) : 0,
            avgNodes = workflows.Count > 0 ? Math.Round(workflows.Average(w => w.TotalNodes), 1) : 0,
            totalExecutions = workflows.Sum(w => w.TotalExecutions),
            totalCacheHits = workflows.Sum(w => w.CacheHitsCount),
            recentWorkflows = workflows.OrderByDescending(w => w.UpdatedAt).Take(5).Select(w => new { w.Id, w.WorkflowName, w.Status, w.TotalNodes, w.CompletedNodes, w.UpdatedAt }),
        };
        return Ok(stats);
    }

    [HttpGet("templates")]
    [AllowAnonymous]
    public IActionResult GetTemplates()
    {
        var templates = new[]
        {
            new
            {
                id = "code-review-pipeline",
                name = "Code Review Pipeline",
                description = "Multi-agent code review with security, performance, and architecture analysis",
                category = "review",
                nodeTypes = new[] { "analyzer", "reviewer", "reviewer", "tester" },
                nodeNames = new[] { "Analyze Changes", "Security Review", "Architecture Review", "Test Coverage Check" }
            },
            new
            {
                id = "full-stack-generator",
                name = "Full-Stack Generator",
                description = "End-to-end full-stack application generation with testing and deployment",
                category = "generation",
                nodeTypes = new[] { "analyzer", "generator", "generator", "tester", "deployer" },
                nodeNames = new[] { "Analyze Requirements", "Generate Backend", "Generate Frontend", "Run Tests", "Deploy Preview" }
            },
            new
            {
                id = "test-automation",
                name = "Test Automation",
                description = "Automated test generation and validation pipeline",
                category = "testing",
                nodeTypes = new[] { "analyzer", "tester", "tester", "reviewer" },
                nodeNames = new[] { "Analyze Code", "Generate Unit Tests", "Generate E2E Tests", "Review Coverage" }
            },
        };
        return Ok(templates);
    }

    private static string GetNodeName(string type) => type switch
    {
        "analyzer" => "Analyze Requirements",
        "generator" => "Generate Code",
        "reviewer" => "Review Code",
        "tester" => "Run Tests",
        "deployer" => "Deploy",
        "custom" => "Custom Step",
        _ => "Unknown Step"
    };
}

public record CreateWorkflowRequest(string? Name, string? Description, string[]? NodeTypes, int? DevRequestId);

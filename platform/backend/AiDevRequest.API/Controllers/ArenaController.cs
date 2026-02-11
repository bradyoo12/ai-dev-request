using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/arena")]
public class ArenaController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public ArenaController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    // GET /api/arena/comparisons
    [HttpGet("comparisons")]
    public async Task<IActionResult> ListComparisons()
    {
        var userId = GetUserId();
        var comparisons = await _db.ArenaComparisons
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(comparisons);
    }

    // POST /api/arena/compare
    [HttpPost("compare")]
    public async Task<IActionResult> CreateComparison([FromBody] CreateComparisonRequest req)
    {
        var userId = GetUserId();
        var rng = new Random();

        var models = new[]
        {
            new { name = "Claude Sonnet", provider = "Anthropic", costPer1K = 0.003m },
            new { name = "GPT-4o", provider = "OpenAI", costPer1K = 0.005m },
            new { name = "Gemini Pro", provider = "Google", costPer1K = 0.002m },
        };

        var outputs = new List<object>();
        long totalLatency = 0;
        int totalTokens = 0;
        decimal totalCost = 0;

        foreach (var model in models)
        {
            var latency = rng.Next(200, 2001);
            var tokens = rng.Next(150, 1201);
            var cost = Math.Round(model.costPer1K * tokens / 1000m, 6);

            totalLatency += latency;
            totalTokens += tokens;
            totalCost += cost;

            outputs.Add(new
            {
                model = model.name,
                provider = model.provider,
                output = GenerateModelOutput(model.name, req.Prompt, req.TaskCategory),
                latencyMs = latency,
                tokenCount = tokens,
                cost
            });
        }

        var comparison = new ArenaComparison
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PromptText = req.Prompt,
            TaskCategory = req.TaskCategory ?? "code-generation",
            ModelOutputsJson = System.Text.Json.JsonSerializer.Serialize(outputs),
            ModelCount = models.Length,
            TotalCost = totalCost,
            TotalTokens = totalTokens,
            TotalLatencyMs = totalLatency,
            Status = "completed",
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };

        _db.ArenaComparisons.Add(comparison);
        await _db.SaveChangesAsync();
        return Ok(comparison);
    }

    // POST /api/arena/comparisons/{id}/select-winner
    [HttpPost("comparisons/{id}/select-winner")]
    public async Task<IActionResult> SelectWinner(Guid id, [FromBody] SelectWinnerRequest req)
    {
        var userId = GetUserId();
        var comparison = await _db.ArenaComparisons.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (comparison == null) return NotFound();

        comparison.SelectedModel = req.Model;
        comparison.SelectionReason = req.Reason ?? "";
        comparison.Status = "winner_selected";
        await _db.SaveChangesAsync();
        return Ok(comparison);
    }

    // GET /api/arena/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var comparisons = await _db.ArenaComparisons.Where(c => c.UserId == userId).ToListAsync();
        var total = comparisons.Count;
        var winnersSelected = comparisons.Count(c => c.Status == "winner_selected");
        var avgCost = comparisons.Any() ? Math.Round(comparisons.Average(c => (double)c.TotalCost), 6) : 0;
        var totalTokens = comparisons.Sum(c => c.TotalTokens);
        var avgLatency = comparisons.Any() ? Math.Round(comparisons.Average(c => c.TotalLatencyMs), 0) : 0;

        var winRates = comparisons
            .Where(c => c.SelectedModel != null)
            .GroupBy(c => c.SelectedModel!)
            .Select(g => new
            {
                model = g.Key,
                wins = g.Count(),
                winRate = Math.Round((double)g.Count() / Math.Max(1, winnersSelected) * 100, 1)
            })
            .OrderByDescending(x => x.wins)
            .ToList();

        var fastestModel = winRates.FirstOrDefault()?.model ?? "N/A";
        var mostSelected = winRates.FirstOrDefault()?.model ?? "N/A";

        var recentComparisons = comparisons.OrderByDescending(c => c.CreatedAt).Take(5).Select(c => new
        {
            c.PromptText,
            c.TaskCategory,
            c.SelectedModel,
            c.TotalCost,
            c.CreatedAt
        }).ToList();

        return Ok(new
        {
            totalComparisons = total,
            winnersSelected,
            avgCost,
            totalTokens,
            avgLatency,
            fastestModel,
            mostSelected,
            winRates,
            recentComparisons
        });
    }

    // GET /api/arena/models
    [HttpGet("models")]
    public IActionResult GetModels()
    {
        var models = new[]
        {
            new { name = "Claude Sonnet", provider = "Anthropic", costPer1K = 0.003, avgLatencyMs = 800, description = "Balanced performance and cost for code generation", strengths = "Clean code, strong reasoning, excellent documentation" },
            new { name = "GPT-4o", provider = "OpenAI", costPer1K = 0.005, avgLatencyMs = 1200, description = "Multimodal model with broad capabilities", strengths = "Versatile output, good at refactoring, strong type inference" },
            new { name = "Gemini Pro", provider = "Google", costPer1K = 0.002, avgLatencyMs = 600, description = "Cost-effective with fast inference", strengths = "Fast responses, good for boilerplate, efficient token usage" },
        };
        return Ok(models);
    }

    // GET /api/arena/leaderboard
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard()
    {
        var userId = GetUserId();
        var comparisons = await _db.ArenaComparisons
            .Where(c => c.UserId == userId && c.SelectedModel != null)
            .ToListAsync();

        var leaderboard = comparisons
            .GroupBy(c => c.TaskCategory)
            .Select(catGroup => new
            {
                category = catGroup.Key,
                totalComparisons = catGroup.Count(),
                models = catGroup
                    .GroupBy(c => c.SelectedModel!)
                    .Select(modelGroup => new
                    {
                        model = modelGroup.Key,
                        wins = modelGroup.Count(),
                        winRate = Math.Round((double)modelGroup.Count() / Math.Max(1, catGroup.Count()) * 100, 1)
                    })
                    .OrderByDescending(m => m.wins)
                    .ToList()
            })
            .OrderByDescending(c => c.totalComparisons)
            .ToList();

        return Ok(leaderboard);
    }

    private static string GenerateModelOutput(string model, string prompt, string? taskCategory)
    {
        var category = taskCategory ?? "code-generation";
        var promptLower = prompt.ToLower();

        if (model == "Claude Sonnet")
        {
            if (category == "bug-fixing")
                return $"// Fix Analysis by Claude Sonnet\n// Issue identified in: {prompt}\n\n// Root cause: The issue stems from an unhandled edge case.\n// Fix: Add proper null checks and validation.\n\nfunction fix(input: unknown) {{\n  if (input == null) {{\n    throw new Error('Input cannot be null');\n  }}\n  // Apply defensive programming pattern\n  const validated = validateInput(input);\n  return processData(validated);\n}}\n\nfunction validateInput(input: unknown): string {{\n  if (typeof input !== 'string') {{\n    throw new TypeError('Expected string input');\n  }}\n  return input.trim();\n}}";
            if (category == "architecture")
                return $"// Architecture Proposal by Claude Sonnet\n// Request: {prompt}\n\n// Recommended: Clean Architecture with CQRS\n// Layers: Domain → Application → Infrastructure → Presentation\n\ninterface ICommandHandler<TCommand, TResult> {{\n  handle(command: TCommand): Promise<TResult>;\n}}\n\ninterface IQueryHandler<TQuery, TResult> {{\n  handle(query: TQuery): Promise<TResult>;\n}}\n\n// Domain layer stays pure — no dependencies on infrastructure\n// Commands and queries separated for scalability";
            return $"// Generated by Claude Sonnet\n// Task: {prompt}\n\nexport function solution(data: string[]): Record<string, number> {{\n  const result: Record<string, number> = {{}};\n  for (const item of data) {{\n    const key = item.toLowerCase().trim();\n    result[key] = (result[key] ?? 0) + 1;\n  }}\n  return result;\n}}\n\n// Clean, typed implementation with null safety\n// Time complexity: O(n), Space complexity: O(k)";
        }

        if (model == "GPT-4o")
        {
            if (category == "bug-fixing")
                return $"// Bug Fix by GPT-4o\n// Problem: {prompt}\n\n// Analysis: Missing error boundary and race condition detected\n\nasync function safeFix(input: any): Promise<Result> {{\n  try {{\n    const sanitized = sanitize(input);\n    const result = await processAsync(sanitized);\n    return {{ success: true, data: result }};\n  }} catch (error) {{\n    console.error('Processing failed:', error);\n    return {{ success: false, error: String(error) }};\n  }}\n}}\n\ntype Result = {{ success: boolean; data?: unknown; error?: string }};";
            if (category == "architecture")
                return $"// Architecture Design by GPT-4o\n// Requirement: {prompt}\n\n// Pattern: Hexagonal Architecture (Ports & Adapters)\n\ninterface Port<TInput, TOutput> {{\n  execute(input: TInput): Promise<TOutput>;\n}}\n\nclass ServiceAdapter implements Port<Request, Response> {{\n  constructor(private repo: Repository) {{}}\n  async execute(input: Request): Promise<Response> {{\n    const entity = await this.repo.findById(input.id);\n    return this.mapToResponse(entity);\n  }}\n}}";
            return $"// Generated by GPT-4o\n// Task: {prompt}\n\nconst solution = (data: string[]) => {{\n  return data.reduce<Record<string, number>>((acc, item) => {{\n    const key = item.toLowerCase().trim();\n    acc[key] = (acc[key] || 0) + 1;\n    return acc;\n  }}, {{}});\n}};\n\nexport default solution;\n\n// Functional approach with reduce\n// Handles edge cases gracefully";
        }

        // Gemini Pro
        if (category == "bug-fixing")
            return $"// Quick Fix by Gemini Pro\n// Issue: {prompt}\n\nfunction quickFix(input: string | null): string {{\n  if (!input) return '';\n  return input.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();\n}}\n\n// Fast, minimal fix targeting the core issue\n// Added input sanitization and null guard";
        if (category == "architecture")
            return $"// Architecture Sketch by Gemini Pro\n// For: {prompt}\n\n// Simple layered approach:\n// Controller → Service → Repository → Database\n\ninterface CrudService<T> {{\n  getAll(): Promise<T[]>;\n  getById(id: string): Promise<T | null>;\n  create(data: Partial<T>): Promise<T>;\n  update(id: string, data: Partial<T>): Promise<T>;\n  delete(id: string): Promise<void>;\n}}";
        return $"// Generated by Gemini Pro\n// Task: {prompt}\n\nfunction solve(data: string[]) {{\n  const map = new Map<string, number>();\n  data.forEach(item => {{\n    const k = item.toLowerCase().trim();\n    map.set(k, (map.get(k) ?? 0) + 1);\n  }});\n  return Object.fromEntries(map);\n}}\n\nexport {{ solve }};\n\n// Efficient Map-based counting\n// Minimal allocations";
    }
}

public record CreateComparisonRequest(string Prompt, string? TaskCategory);
public record SelectWinnerRequest(string Model, string? Reason);

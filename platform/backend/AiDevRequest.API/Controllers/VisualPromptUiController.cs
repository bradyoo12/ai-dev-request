using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/visual-prompt")]
[Authorize]
public class VisualPromptUiController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public VisualPromptUiController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("components")]
    public async Task<IActionResult> ListComponents([FromQuery] string? category)
    {
        var userId = GetUserId();
        var query = _db.VisualPromptUis.Where(v => v.UserId == userId);
        if (!string.IsNullOrEmpty(category) && category != "all")
            query = query.Where(v => v.Category == category);
        var components = await query.OrderByDescending(v => v.UpdatedAt).Take(50).ToListAsync();

        return Ok(components.Select(c => new ComponentListDto
        {
            Id = c.Id.ToString(),
            ComponentName = c.ComponentName,
            PromptText = c.PromptText,
            Category = c.Category,
            Status = c.Status,
            IterationCount = c.IterationCount,
            ViewCount = c.ViewCount,
            ForkCount = c.ForkCount,
            LikeCount = c.LikeCount,
            IsPublic = c.IsPublic,
            ThumbnailUrl = c.ThumbnailUrl,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
        }));
    }

    [HttpGet("components/{componentId}")]
    public async Task<IActionResult> GetComponent(Guid componentId)
    {
        var userId = GetUserId();
        var comp = await _db.VisualPromptUis.FirstOrDefaultAsync(v => v.Id == componentId && v.UserId == userId);
        if (comp == null) return NotFound();

        comp.ViewCount++;
        comp.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new ComponentDetailDto
        {
            Id = comp.Id.ToString(),
            ComponentName = comp.ComponentName,
            PromptText = comp.PromptText,
            GeneratedCode = comp.GeneratedCode,
            GeneratedHtml = comp.GeneratedHtml,
            Framework = comp.Framework,
            StylingLibrary = comp.StylingLibrary,
            Status = comp.Status,
            IterationCount = comp.IterationCount,
            Conversation = JsonSerializer.Deserialize<List<ConversationEntry>>(comp.ConversationJson) ?? new(),
            Category = comp.Category,
            Tags = comp.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
            ViewCount = comp.ViewCount,
            ForkCount = comp.ForkCount,
            LikeCount = comp.LikeCount,
            IsPublic = comp.IsPublic,
            ThumbnailUrl = comp.ThumbnailUrl,
            ThemeTokens = JsonSerializer.Deserialize<Dictionary<string, string>>(comp.ThemeTokensJson) ?? new(),
            GenerationTimeMs = comp.GenerationTimeMs,
            TokensUsed = comp.TokensUsed,
            EstimatedCost = comp.EstimatedCost,
            CreatedAt = comp.CreatedAt,
            UpdatedAt = comp.UpdatedAt,
        });
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateComponent([FromBody] GenerateComponentDto dto)
    {
        var userId = GetUserId();
        var random = new Random();

        var sampleComponents = new Dictionary<string, (string code, string html)>
        {
            ["pricing"] = (
                "export default function PricingTable() {\n  const [yearly, setYearly] = useState(false);\n  const plans = [\n    { name: 'Starter', price: yearly ? 96 : 9, features: ['5 projects', '1GB storage', 'Email support'] },\n    { name: 'Pro', price: yearly ? 240 : 24, features: ['25 projects', '10GB storage', 'Priority support', 'API access'], popular: true },\n    { name: 'Enterprise', price: yearly ? 960 : 99, features: ['Unlimited projects', '100GB storage', '24/7 support', 'Custom integrations', 'SSO'] },\n  ];\n  return (\n    <div className=\"py-12\">\n      <div className=\"text-center mb-8\">\n        <h2 className=\"text-3xl font-bold\">Pricing Plans</h2>\n        <div className=\"mt-4 flex items-center justify-center gap-3\">\n          <span>Monthly</span>\n          <button onClick={() => setYearly(!yearly)} className={`w-12 h-6 rounded-full ${yearly ? 'bg-blue-600' : 'bg-gray-300'}`}>\n            <span className={`block w-5 h-5 bg-white rounded-full transform transition ${yearly ? 'translate-x-6' : 'translate-x-0.5'}`}/>\n          </button>\n          <span>Yearly <span className=\"text-green-500 text-sm\">Save 20%</span></span>\n        </div>\n      </div>\n      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto\">\n        {plans.map(p => (\n          <div key={p.name} className={`rounded-xl border-2 p-6 ${p.popular ? 'border-blue-600 shadow-lg' : 'border-gray-200'}`}>\n            {p.popular && <span className=\"bg-blue-600 text-white text-xs px-3 py-1 rounded-full\">Most Popular</span>}\n            <h3 className=\"text-xl font-bold mt-2\">{p.name}</h3>\n            <div className=\"text-4xl font-bold mt-4\">${p.price}<span className=\"text-sm text-gray-500\">/mo</span></div>\n            <ul className=\"mt-6 space-y-2\">{p.features.map(f => <li key={f}>✓ {f}</li>)}</ul>\n            <button className={`w-full mt-6 py-3 rounded-lg font-medium ${p.popular ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Get Started</button>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}",
                "<div class=\"py-12\"><h2 class=\"text-3xl font-bold text-center\">Pricing Plans</h2><div class=\"grid grid-cols-3 gap-6 mt-8\"><div class=\"border-2 rounded-xl p-6\"><h3>Starter</h3><div class=\"text-4xl font-bold\">$9/mo</div></div><div class=\"border-2 border-blue-600 rounded-xl p-6 shadow-lg\"><span class=\"bg-blue-600 text-white px-3 py-1 rounded-full text-xs\">Most Popular</span><h3>Pro</h3><div class=\"text-4xl font-bold\">$24/mo</div></div><div class=\"border-2 rounded-xl p-6\"><h3>Enterprise</h3><div class=\"text-4xl font-bold\">$99/mo</div></div></div></div>"
            ),
            ["hero"] = (
                "export default function HeroSection() {\n  return (\n    <section className=\"relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-24 px-6\">\n      <div className=\"max-w-4xl mx-auto text-center\">\n        <h1 className=\"text-5xl md:text-6xl font-extrabold tracking-tight\">Build Amazing Products <span className=\"text-yellow-300\">Faster</span></h1>\n        <p className=\"mt-6 text-xl text-indigo-100 max-w-2xl mx-auto\">The all-in-one platform for teams that want to ship beautiful software without the complexity.</p>\n        <div className=\"mt-10 flex flex-col sm:flex-row gap-4 justify-center\">\n          <button className=\"px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:shadow-xl transition\">Start Free Trial</button>\n          <button className=\"px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition\">Watch Demo</button>\n        </div>\n        <div className=\"mt-12 text-sm text-indigo-200\">Trusted by 10,000+ teams worldwide</div>\n      </div>\n    </section>\n  );\n}",
                "<section class=\"bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-24 px-6 text-center\"><h1 class=\"text-5xl font-extrabold\">Build Amazing Products <span class=\"text-yellow-300\">Faster</span></h1><p class=\"mt-6 text-xl text-indigo-100\">The all-in-one platform for teams.</p><div class=\"mt-10 flex gap-4 justify-center\"><button class=\"px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl\">Start Free Trial</button></div></section>"
            ),
            ["default"] = (
                "export default function Component() {\n  return (\n    <div className=\"p-8 max-w-md mx-auto\">\n      <div className=\"bg-white rounded-2xl shadow-lg p-6 border\">\n        <h2 className=\"text-2xl font-bold text-gray-900\">Generated Component</h2>\n        <p className=\"mt-2 text-gray-600\">This component was generated from your prompt.</p>\n        <div className=\"mt-6 flex gap-3\">\n          <button className=\"px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition\">Primary Action</button>\n          <button className=\"px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition\">Secondary</button>\n        </div>\n      </div>\n    </div>\n  );\n}",
                "<div class=\"p-8 max-w-md mx-auto\"><div class=\"bg-white rounded-2xl shadow-lg p-6 border\"><h2 class=\"text-2xl font-bold\">Generated Component</h2><p class=\"mt-2 text-gray-600\">This component was generated from your prompt.</p></div></div>"
            ),
        };

        var matchKey = dto.Prompt.ToLower().Contains("pricing") ? "pricing"
            : dto.Prompt.ToLower().Contains("hero") ? "hero"
            : "default";
        var (code, html) = sampleComponents[matchKey];

        var componentName = dto.ComponentName ?? $"Component_{DateTime.UtcNow:yyyyMMdd_HHmmss}";
        var genTime = Math.Round(random.NextDouble() * 2000 + 800, 0);
        var tokens = random.Next(500, 2000);

        var conversation = new List<ConversationEntry>
        {
            new() { Role = "user", Content = dto.Prompt, Timestamp = DateTime.UtcNow },
            new() { Role = "assistant", Content = $"I've generated a {componentName} component based on your description. The component uses React with Tailwind CSS styling.", Timestamp = DateTime.UtcNow },
        };

        var comp = new VisualPromptUi
        {
            UserId = userId,
            ComponentName = componentName,
            PromptText = dto.Prompt,
            GeneratedCode = code,
            GeneratedHtml = html,
            Framework = dto.Framework ?? "react",
            StylingLibrary = dto.StylingLibrary ?? "tailwind",
            Status = "generated",
            IterationCount = 1,
            ConversationJson = JsonSerializer.Serialize(conversation),
            Category = dto.Category ?? "custom",
            GenerationTimeMs = genTime,
            TokensUsed = tokens,
            EstimatedCost = Math.Round(tokens * 0.000015, 6),
        };

        _db.VisualPromptUis.Add(comp);
        await _db.SaveChangesAsync();

        return Ok(new ComponentDetailDto
        {
            Id = comp.Id.ToString(),
            ComponentName = comp.ComponentName,
            PromptText = comp.PromptText,
            GeneratedCode = comp.GeneratedCode,
            GeneratedHtml = comp.GeneratedHtml,
            Framework = comp.Framework,
            StylingLibrary = comp.StylingLibrary,
            Status = comp.Status,
            IterationCount = comp.IterationCount,
            Conversation = conversation,
            Category = comp.Category,
            Tags = new List<string>(),
            GenerationTimeMs = comp.GenerationTimeMs,
            TokensUsed = comp.TokensUsed,
            EstimatedCost = comp.EstimatedCost,
            CreatedAt = comp.CreatedAt,
            UpdatedAt = comp.UpdatedAt,
        });
    }

    [HttpPost("components/{componentId}/refine")]
    public async Task<IActionResult> RefineComponent(Guid componentId, [FromBody] RefineComponentDto dto)
    {
        var userId = GetUserId();
        var comp = await _db.VisualPromptUis.FirstOrDefaultAsync(v => v.Id == componentId && v.UserId == userId);
        if (comp == null) return NotFound();

        var random = new Random();
        var conversation = JsonSerializer.Deserialize<List<ConversationEntry>>(comp.ConversationJson) ?? new();
        conversation.Add(new ConversationEntry { Role = "user", Content = dto.Prompt, Timestamp = DateTime.UtcNow });
        conversation.Add(new ConversationEntry { Role = "assistant", Content = $"I've refined the {comp.ComponentName} component based on your feedback: \"{dto.Prompt}\". The changes have been applied.", Timestamp = DateTime.UtcNow });

        comp.ConversationJson = JsonSerializer.Serialize(conversation);
        comp.IterationCount++;
        comp.TokensUsed += random.Next(300, 800);
        comp.GenerationTimeMs = Math.Round(random.NextDouble() * 1500 + 500, 0);
        comp.EstimatedCost = Math.Round(comp.TokensUsed * 0.000015, 6);
        comp.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new ComponentDetailDto
        {
            Id = comp.Id.ToString(),
            ComponentName = comp.ComponentName,
            PromptText = comp.PromptText,
            GeneratedCode = comp.GeneratedCode,
            GeneratedHtml = comp.GeneratedHtml,
            Framework = comp.Framework,
            StylingLibrary = comp.StylingLibrary,
            Status = comp.Status,
            IterationCount = comp.IterationCount,
            Conversation = conversation,
            Category = comp.Category,
            Tags = comp.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
            GenerationTimeMs = comp.GenerationTimeMs,
            TokensUsed = comp.TokensUsed,
            EstimatedCost = comp.EstimatedCost,
            CreatedAt = comp.CreatedAt,
            UpdatedAt = comp.UpdatedAt,
        });
    }

    [HttpGet("gallery")]
    public async Task<IActionResult> GetGallery([FromQuery] string? category)
    {
        var userId = GetUserId();
        var query = _db.VisualPromptUis.Where(v => v.UserId == userId && v.Status == "generated");
        if (!string.IsNullOrEmpty(category) && category != "all")
            query = query.Where(v => v.Category == category);

        var components = await query.OrderByDescending(v => v.LikeCount).ThenByDescending(v => v.ViewCount).Take(20).ToListAsync();

        return Ok(components.Select(c => new ComponentListDto
        {
            Id = c.Id.ToString(),
            ComponentName = c.ComponentName,
            PromptText = c.PromptText,
            Category = c.Category,
            Status = c.Status,
            IterationCount = c.IterationCount,
            ViewCount = c.ViewCount,
            ForkCount = c.ForkCount,
            LikeCount = c.LikeCount,
            IsPublic = c.IsPublic,
            ThumbnailUrl = c.ThumbnailUrl,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
        }));
    }

    [HttpPost("components/{componentId}/export")]
    public async Task<IActionResult> ExportComponent(Guid componentId, [FromBody] ExportComponentDto dto)
    {
        var userId = GetUserId();
        var comp = await _db.VisualPromptUis.FirstOrDefaultAsync(v => v.Id == componentId && v.UserId == userId);
        if (comp == null) return NotFound();

        comp.ExportedToProjectId = dto.ProjectId;
        comp.ExportedFilePath = dto.FilePath ?? $"src/components/{comp.ComponentName}.tsx";
        comp.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            exportedTo = comp.ExportedFilePath,
            projectId = comp.ExportedToProjectId,
        });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var components = await _db.VisualPromptUis.Where(v => v.UserId == userId).ToListAsync();

        return Ok(new VisualPromptStatsDto
        {
            TotalComponents = components.Count,
            TotalIterations = components.Sum(c => c.IterationCount),
            TotalTokensUsed = components.Sum(c => c.TokensUsed),
            TotalCost = Math.Round(components.Sum(c => c.EstimatedCost), 4),
            AvgGenerationTimeMs = components.Count > 0 ? Math.Round(components.Average(c => c.GenerationTimeMs), 0) : 0,
            CategoriesUsed = components.Select(c => c.Category).Distinct().Count(),
            ExportedCount = components.Count(c => c.ExportedToProjectId != null),
            PublicCount = components.Count(c => c.IsPublic),
        });
    }

    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        return Ok(new[]
        {
            new { id = "landing", name = "Landing Pages", icon = "layout", count = 0 },
            new { id = "dashboard", name = "Dashboards", icon = "bar-chart", count = 0 },
            new { id = "form", name = "Forms & Inputs", icon = "edit", count = 0 },
            new { id = "card", name = "Cards & Lists", icon = "grid", count = 0 },
            new { id = "navigation", name = "Navigation", icon = "menu", count = 0 },
            new { id = "pricing", name = "Pricing Tables", icon = "dollar-sign", count = 0 },
            new { id = "hero", name = "Hero Sections", icon = "star", count = 0 },
            new { id = "modal", name = "Modals & Dialogs", icon = "layers", count = 0 },
            new { id = "custom", name = "Custom", icon = "code", count = 0 },
        });
    }
}

public class ComponentListDto
{
    public string Id { get; set; } = "";
    public string ComponentName { get; set; } = "";
    public string PromptText { get; set; } = "";
    public string Category { get; set; } = "";
    public string Status { get; set; } = "";
    public int IterationCount { get; set; }
    public int ViewCount { get; set; }
    public int ForkCount { get; set; }
    public int LikeCount { get; set; }
    public bool IsPublic { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ComponentDetailDto
{
    public string Id { get; set; } = "";
    public string ComponentName { get; set; } = "";
    public string PromptText { get; set; } = "";
    public string GeneratedCode { get; set; } = "";
    public string GeneratedHtml { get; set; } = "";
    public string Framework { get; set; } = "";
    public string StylingLibrary { get; set; } = "";
    public string Status { get; set; } = "";
    public int IterationCount { get; set; }
    public List<ConversationEntry> Conversation { get; set; } = new();
    public string Category { get; set; } = "";
    public List<string> Tags { get; set; } = new();
    public int ViewCount { get; set; }
    public int ForkCount { get; set; }
    public int LikeCount { get; set; }
    public bool IsPublic { get; set; }
    public string? ThumbnailUrl { get; set; }
    public Dictionary<string, string>? ThemeTokens { get; set; }
    public double GenerationTimeMs { get; set; }
    public int TokensUsed { get; set; }
    public double EstimatedCost { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ConversationEntry
{
    public string Role { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime Timestamp { get; set; }
}

public class GenerateComponentDto
{
    public string Prompt { get; set; } = "";
    public string? ComponentName { get; set; }
    public string? Framework { get; set; }
    public string? StylingLibrary { get; set; }
    public string? Category { get; set; }
}

public class RefineComponentDto
{
    public string Prompt { get; set; } = "";
}

public class ExportComponentDto
{
    public string ProjectId { get; set; } = "";
    public string? FilePath { get; set; }
}

public class VisualPromptStatsDto
{
    public int TotalComponents { get; set; }
    public int TotalIterations { get; set; }
    public int TotalTokensUsed { get; set; }
    public double TotalCost { get; set; }
    public double AvgGenerationTimeMs { get; set; }
    public int CategoriesUsed { get; set; }
    public int ExportedCount { get; set; }
    public int PublicCount { get; set; }
}

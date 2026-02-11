using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/framework")]
[Authorize]
public class FrameworkConfigController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public FrameworkConfigController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var userId = GetUserId();
        var config = await _db.FrameworkConfigs.FirstOrDefaultAsync(f => f.UserId == userId);

        if (config == null)
        {
            config = new FrameworkConfig { UserId = userId };
            _db.FrameworkConfigs.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(new FrameworkConfigDto
        {
            SelectedFramework = config.SelectedFramework,
            SelectedBackend = config.SelectedBackend,
            SelectedDatabase = config.SelectedDatabase,
            SelectedStyling = config.SelectedStyling,
            ProjectsGenerated = config.ProjectsGenerated,
            AutoDetectStack = config.AutoDetectStack,
            IncludeDocker = config.IncludeDocker,
            IncludeCI = config.IncludeCI,
            IncludeTests = config.IncludeTests,
            FavoriteFrameworks = config.FavoriteFrameworks.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
        });
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] UpdateFrameworkConfigDto dto)
    {
        var userId = GetUserId();
        var config = await _db.FrameworkConfigs.FirstOrDefaultAsync(f => f.UserId == userId);
        if (config == null) return NotFound();

        if (dto.SelectedFramework != null) config.SelectedFramework = dto.SelectedFramework;
        if (dto.SelectedBackend != null) config.SelectedBackend = dto.SelectedBackend;
        if (dto.SelectedDatabase != null) config.SelectedDatabase = dto.SelectedDatabase;
        if (dto.SelectedStyling != null) config.SelectedStyling = dto.SelectedStyling;
        if (dto.AutoDetectStack.HasValue) config.AutoDetectStack = dto.AutoDetectStack.Value;
        if (dto.IncludeDocker.HasValue) config.IncludeDocker = dto.IncludeDocker.Value;
        if (dto.IncludeCI.HasValue) config.IncludeCI = dto.IncludeCI.Value;
        if (dto.IncludeTests.HasValue) config.IncludeTests = dto.IncludeTests.Value;
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpGet("frameworks")]
    public IActionResult GetFrameworks()
    {
        return Ok(new[]
        {
            new FrameworkDto { Id = "react-vite", Name = "React + Vite", Category = "Frontend", Tier = 1, Language = "TypeScript", Description = "Fast SPA with React 18 and Vite bundler", Icon = "react", Tags = new[] { "SPA", "Vite", "TypeScript" } },
            new FrameworkDto { Id = "nextjs", Name = "Next.js", Category = "Full-Stack", Tier = 1, Language = "TypeScript", Description = "Full-stack React with SSR, API routes, and App Router", Icon = "nextjs", Tags = new[] { "SSR", "API Routes", "Full-Stack" } },
            new FrameworkDto { Id = "express", Name = "Express.js", Category = "Backend", Tier = 1, Language = "TypeScript", Description = "Lightweight Node.js API server with Express", Icon = "nodejs", Tags = new[] { "REST API", "Node.js", "Lightweight" } },
            new FrameworkDto { Id = "fastapi", Name = "FastAPI", Category = "Backend", Tier = 2, Language = "Python", Description = "High-performance Python API with auto-generated docs", Icon = "python", Tags = new[] { "Python", "OpenAPI", "Async" } },
            new FrameworkDto { Id = "django", Name = "Django", Category = "Full-Stack", Tier = 2, Language = "Python", Description = "Full-stack Python web framework with ORM and admin", Icon = "python", Tags = new[] { "Python", "ORM", "Admin Panel" } },
            new FrameworkDto { Id = "flutter", Name = "Flutter", Category = "Mobile", Tier = 2, Language = "Dart", Description = "Cross-platform mobile app with Material Design", Icon = "flutter", Tags = new[] { "Mobile", "Cross-Platform", "Dart" } },
            new FrameworkDto { Id = "vue-nuxt", Name = "Vue.js + Nuxt", Category = "Full-Stack", Tier = 3, Language = "TypeScript", Description = "Vue 3 with Nuxt for SSR and full-stack capabilities", Icon = "vue", Tags = new[] { "Vue", "SSR", "Full-Stack" } },
            new FrameworkDto { Id = "go-gin", Name = "Go + Gin", Category = "Backend", Tier = 3, Language = "Go", Description = "High-performance Go API server with Gin framework", Icon = "go", Tags = new[] { "Go", "High-Performance", "Compiled" } },
            new FrameworkDto { Id = "aspnet", Name = "ASP.NET Core", Category = "Full-Stack", Tier = 3, Language = "C#", Description = ".NET web application with Razor Pages or Blazor", Icon = "dotnet", Tags = new[] { "C#", ".NET", "Enterprise" } },
        });
    }

    [HttpGet("backends")]
    public IActionResult GetBackends()
    {
        return Ok(new[]
        {
            new { id = "none", name = "No Backend", description = "Frontend-only project" },
            new { id = "express", name = "Express.js", description = "Node.js REST API" },
            new { id = "fastapi", name = "FastAPI", description = "Python async API" },
            new { id = "django-rest", name = "Django REST", description = "Python Django API" },
            new { id = "aspnet-api", name = "ASP.NET API", description = ".NET Web API" },
            new { id = "supabase", name = "Supabase", description = "BaaS with PostgreSQL" },
        });
    }

    [HttpGet("databases")]
    public IActionResult GetDatabases()
    {
        return Ok(new[]
        {
            new { id = "none", name = "No Database", description = "Stateless application" },
            new { id = "postgresql", name = "PostgreSQL", description = "Advanced relational database" },
            new { id = "mysql", name = "MySQL", description = "Popular relational database" },
            new { id = "sqlite", name = "SQLite", description = "Embedded file-based database" },
            new { id = "mongodb", name = "MongoDB", description = "NoSQL document database" },
            new { id = "supabase", name = "Supabase (PostgreSQL)", description = "Managed PostgreSQL with realtime" },
        });
    }

    [HttpPost("generate-preview")]
    public async Task<IActionResult> GeneratePreview([FromBody] GeneratePreviewDto dto)
    {
        var userId = GetUserId();
        var config = await _db.FrameworkConfigs.FirstOrDefaultAsync(f => f.UserId == userId);
        if (config == null) return NotFound();

        var random = new Random();
        var framework = dto.Framework ?? config.SelectedFramework;

        var fileStructures = new Dictionary<string, string[]>
        {
            ["react-vite"] = new[] { "src/App.tsx", "src/main.tsx", "src/components/", "src/pages/", "vite.config.ts", "package.json", "tsconfig.json", "tailwind.config.js" },
            ["nextjs"] = new[] { "app/layout.tsx", "app/page.tsx", "app/api/", "components/", "lib/", "next.config.js", "package.json", "tsconfig.json" },
            ["express"] = new[] { "src/index.ts", "src/routes/", "src/controllers/", "src/middleware/", "src/models/", "package.json", "tsconfig.json" },
            ["fastapi"] = new[] { "main.py", "routers/", "models/", "schemas/", "database.py", "requirements.txt", "Dockerfile" },
            ["django"] = new[] { "manage.py", "project/settings.py", "project/urls.py", "app/models.py", "app/views.py", "app/urls.py", "requirements.txt" },
            ["flutter"] = new[] { "lib/main.dart", "lib/screens/", "lib/widgets/", "lib/models/", "lib/services/", "pubspec.yaml" },
            ["vue-nuxt"] = new[] { "app.vue", "pages/index.vue", "components/", "composables/", "server/api/", "nuxt.config.ts", "package.json" },
            ["go-gin"] = new[] { "main.go", "handlers/", "models/", "middleware/", "routes/", "go.mod", "Dockerfile" },
            ["aspnet"] = new[] { "Program.cs", "Controllers/", "Models/", "Data/", "appsettings.json", "project.csproj" },
        };

        var files = fileStructures.GetValueOrDefault(framework, fileStructures["react-vite"]);
        var estimatedFiles = random.Next(15, 40);
        var estimatedTokens = random.Next(5000, 15000);

        config.ProjectsGenerated++;
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new GeneratePreviewResult
        {
            Framework = framework,
            ProjectStructure = files.ToList(),
            EstimatedFiles = estimatedFiles,
            EstimatedTokens = estimatedTokens,
            EstimatedCost = Math.Round(estimatedTokens * 0.000015, 4),
            EstimatedTimeSeconds = random.Next(30, 120),
            Features = new List<string> { "TypeScript/type-safe code", "Responsive design", "Error handling", "Environment configuration", config.IncludeDocker ? "Docker support" : "No Docker", config.IncludeTests ? "Test suite included" : "No tests", config.IncludeCI ? "CI/CD pipeline" : "No CI/CD" },
        });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var config = await _db.FrameworkConfigs.FirstOrDefaultAsync(f => f.UserId == userId);
        if (config == null) return NotFound();

        var history = JsonSerializer.Deserialize<List<FrameworkHistoryEntry>>(config.FrameworkHistoryJson) ?? new();

        return Ok(new FrameworkStatsDto
        {
            TotalProjects = config.ProjectsGenerated,
            FavoriteFramework = config.SelectedFramework,
            FrameworksUsed = history.Select(h => h.Framework).Distinct().Count(),
            RecentProjects = history.TakeLast(5).Reverse().ToList(),
        });
    }
}

public class FrameworkConfigDto
{
    public string SelectedFramework { get; set; } = "";
    public string SelectedBackend { get; set; } = "";
    public string SelectedDatabase { get; set; } = "";
    public string SelectedStyling { get; set; } = "";
    public int ProjectsGenerated { get; set; }
    public bool AutoDetectStack { get; set; }
    public bool IncludeDocker { get; set; }
    public bool IncludeCI { get; set; }
    public bool IncludeTests { get; set; }
    public List<string> FavoriteFrameworks { get; set; } = new();
}

public class UpdateFrameworkConfigDto
{
    public string? SelectedFramework { get; set; }
    public string? SelectedBackend { get; set; }
    public string? SelectedDatabase { get; set; }
    public string? SelectedStyling { get; set; }
    public bool? AutoDetectStack { get; set; }
    public bool? IncludeDocker { get; set; }
    public bool? IncludeCI { get; set; }
    public bool? IncludeTests { get; set; }
}

public class FrameworkDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public int Tier { get; set; }
    public string Language { get; set; } = "";
    public string Description { get; set; } = "";
    public string Icon { get; set; } = "";
    public string[] Tags { get; set; } = Array.Empty<string>();
}

public class GeneratePreviewDto
{
    public string? Framework { get; set; }
    public string? Description { get; set; }
}

public class GeneratePreviewResult
{
    public string Framework { get; set; } = "";
    public List<string> ProjectStructure { get; set; } = new();
    public int EstimatedFiles { get; set; }
    public int EstimatedTokens { get; set; }
    public double EstimatedCost { get; set; }
    public int EstimatedTimeSeconds { get; set; }
    public List<string> Features { get; set; } = new();
}

public class FrameworkHistoryEntry
{
    public string Framework { get; set; } = "";
    public string ProjectName { get; set; } = "";
    public DateTime GeneratedAt { get; set; }
}

public class FrameworkStatsDto
{
    public int TotalProjects { get; set; }
    public string FavoriteFramework { get; set; } = "";
    public int FrameworksUsed { get; set; }
    public List<FrameworkHistoryEntry> RecentProjects { get; set; } = new();
}

using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/view-transitions")]
[Authorize]
public class ViewTransitionController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public ViewTransitionController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var userId = GetUserId();
        var config = await _db.ViewTransitionConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new ViewTransitionConfig { Id = Guid.NewGuid(), UserId = userId };
            _db.ViewTransitionConfigs.Add(config);
            await _db.SaveChangesAsync();
        }
        return Ok(config);
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] Dictionary<string, object> updates)
    {
        var userId = GetUserId();
        var config = await _db.ViewTransitionConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null) return NotFound();

        foreach (var kv in updates)
        {
            switch (kv.Key)
            {
                case "transitionPreset": config.TransitionPreset = kv.Value?.ToString() ?? "fade"; break;
                case "transitionDurationMs": config.TransitionDurationMs = Convert.ToInt32(kv.Value); break;
                case "easingFunction": config.EasingFunction = kv.Value?.ToString() ?? "ease-in-out"; break;
                case "enableViewTransitions": config.EnableViewTransitions = Convert.ToBoolean(kv.Value); break;
                case "enableFramerMotion": config.EnableFramerMotion = Convert.ToBoolean(kv.Value); break;
                case "enablePageTransitions": config.EnablePageTransitions = Convert.ToBoolean(kv.Value); break;
                case "enableComponentAnimations": config.EnableComponentAnimations = Convert.ToBoolean(kv.Value); break;
                case "enableLoadingAnimations": config.EnableLoadingAnimations = Convert.ToBoolean(kv.Value); break;
            }
        }
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpGet("presets")]
    public IActionResult GetPresets()
    {
        var presets = new[]
        {
            new { id = "fade", name = "Fade", description = "Smooth opacity transition between pages", duration = 300, css = "opacity: 0 → 1", category = "Basic" },
            new { id = "slide-left", name = "Slide Left", description = "Pages slide in from the right", duration = 400, css = "transform: translateX(100%) → 0", category = "Basic" },
            new { id = "slide-up", name = "Slide Up", description = "Pages slide in from the bottom", duration = 400, css = "transform: translateY(100%) → 0", category = "Basic" },
            new { id = "scale", name = "Scale", description = "Pages scale up from center", duration = 350, css = "transform: scale(0.95) → 1", category = "Basic" },
            new { id = "fade-slide", name = "Fade + Slide", description = "Combined fade and slide for elegant transitions", duration = 450, css = "opacity + translateX", category = "Combined" },
            new { id = "morph", name = "Morph", description = "Shared element transitions between pages", duration = 500, css = "view-transition-name: shared", category = "Advanced" },
            new { id = "crossfade", name = "Crossfade", description = "Old page fades out as new page fades in simultaneously", duration = 350, css = "mix-blend-mode crossfade", category = "Advanced" },
            new { id = "zoom", name = "Zoom", description = "Dramatic zoom transition for impactful navigation", duration = 500, css = "transform: scale(0.8) → 1.05 → 1", category = "Advanced" },
            new { id = "spring", name = "Spring (Framer)", description = "Physics-based spring animation via Framer Motion", duration = 600, css = "spring({ stiffness: 300, damping: 30 })", category = "Framer Motion" },
            new { id = "stagger", name = "Stagger (Framer)", description = "Children animate in sequence with delay", duration = 800, css = "staggerChildren: 0.1", category = "Framer Motion" },
            new { id = "layout", name = "Layout (Framer)", description = "Smooth layout animations when elements resize/reposition", duration = 400, css = "layoutId: shared", category = "Framer Motion" },
        };
        return Ok(presets);
    }

    [HttpGet("easing-functions")]
    public IActionResult GetEasingFunctions()
    {
        var easings = new[]
        {
            new { id = "ease", name = "Ease", description = "Default browser easing", curve = "cubic-bezier(0.25, 0.1, 0.25, 1)" },
            new { id = "ease-in-out", name = "Ease In-Out", description = "Smooth acceleration and deceleration", curve = "cubic-bezier(0.42, 0, 0.58, 1)" },
            new { id = "ease-out", name = "Ease Out", description = "Fast start, slow end", curve = "cubic-bezier(0, 0, 0.58, 1)" },
            new { id = "ease-in", name = "Ease In", description = "Slow start, fast end", curve = "cubic-bezier(0.42, 0, 1, 1)" },
            new { id = "linear", name = "Linear", description = "Constant speed", curve = "cubic-bezier(0, 0, 1, 1)" },
            new { id = "spring", name = "Spring", description = "Physics-based bounce (Framer Motion only)", curve = "spring(1, 100, 10, 0)" },
        };
        return Ok(easings);
    }

    [HttpPost("generate-css")]
    public IActionResult GenerateCss([FromBody] GenerateCssRequest request)
    {
        var css = request.Preset switch
        {
            "fade" => $"@keyframes fadeIn {{ from {{ opacity: 0; }} to {{ opacity: 1; }} }}\n.page-enter {{ animation: fadeIn {request.DurationMs}ms {request.Easing}; }}",
            "slide-left" => $"@keyframes slideLeft {{ from {{ transform: translateX(20px); opacity: 0; }} to {{ transform: translateX(0); opacity: 1; }} }}\n.page-enter {{ animation: slideLeft {request.DurationMs}ms {request.Easing}; }}",
            "slide-up" => $"@keyframes slideUp {{ from {{ transform: translateY(20px); opacity: 0; }} to {{ transform: translateY(0); opacity: 1; }} }}\n.page-enter {{ animation: slideUp {request.DurationMs}ms {request.Easing}; }}",
            "scale" => $"@keyframes scaleIn {{ from {{ transform: scale(0.95); opacity: 0; }} to {{ transform: scale(1); opacity: 1; }} }}\n.page-enter {{ animation: scaleIn {request.DurationMs}ms {request.Easing}; }}",
            "fade-slide" => $"@keyframes fadeSlide {{ from {{ transform: translateX(10px); opacity: 0; }} to {{ transform: translateX(0); opacity: 1; }} }}\n.page-enter {{ animation: fadeSlide {request.DurationMs}ms {request.Easing}; }}",
            _ => $"@keyframes fadeIn {{ from {{ opacity: 0; }} to {{ opacity: 1; }} }}\n.page-enter {{ animation: fadeIn {request.DurationMs}ms {request.Easing}; }}"
        };

        var viewTransitionCss = $"::view-transition-old(root) {{ animation: {request.DurationMs}ms {request.Easing} both fadeOut; }}\n::view-transition-new(root) {{ animation: {request.DurationMs}ms {request.Easing} both fadeIn; }}";

        return Ok(new { css, viewTransitionCss, preset = request.Preset, durationMs = request.DurationMs, easing = request.Easing });
    }

    [HttpGet("demo")]
    public IActionResult GetDemoPages()
    {
        var pages = new[]
        {
            new { id = "home", name = "Home", description = "Landing page with hero section", color = "#3B82F6" },
            new { id = "about", name = "About", description = "Team and company info", color = "#8B5CF6" },
            new { id = "pricing", name = "Pricing", description = "Plans and pricing table", color = "#10B981" },
            new { id = "dashboard", name = "Dashboard", description = "User dashboard with charts", color = "#F59E0B" },
            new { id = "settings", name = "Settings", description = "User preferences page", color = "#EF4444" },
        };
        return Ok(pages);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var config = await _db.ViewTransitionConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        return Ok(new
        {
            currentPreset = config?.TransitionPreset ?? "fade",
            durationMs = config?.TransitionDurationMs ?? 300,
            framerMotionEnabled = config?.EnableFramerMotion ?? false,
            projectsWithTransitions = config?.ProjectsWithTransitions ?? 0,
            viewTransitionsSupported = true,
            browserSupport = "92%"
        });
    }
}

public class GenerateCssRequest
{
    public string Preset { get; set; } = "fade";
    public int DurationMs { get; set; } = 300;
    public string Easing { get; set; } = "ease-in-out";
}

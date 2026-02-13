using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/webmcp")]
public class WebMcpController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public WebMcpController(AiDevRequestDbContext db) => _db = db;

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.WebMcpSessions
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [Authorize]
    [HttpPost("connect")]
    public async Task<IActionResult> Connect([FromBody] ConnectRequest req)
    {
        var session = new WebMcpSession
        {
            UserId = User.FindFirst("sub")?.Value ?? "",
            TargetUrl = req.TargetUrl,
            BrowserType = req.BrowserType,
            Protocol = req.Protocol
        };

        var rng = new Random();

        // Simulate WebMCP connection and DOM analysis
        session.ElementsDiscovered = rng.Next(45, 320);
        session.DomNodesAnalyzed = rng.Next(200, 2500);
        session.SemanticAccuracy = Math.Round(85.0 + rng.NextDouble() * 14.5, 1);
        session.ActionReliability = Math.Round(90.0 + rng.NextDouble() * 9.5, 1);
        session.SessionDurationMs = rng.Next(800, 5200);

        // Simulate actions and events
        var actions = new List<object>();
        var actionTypes = new[] { "click", "type", "navigate", "scroll", "select", "hover" };
        var actionCount = rng.Next(3, 12);
        for (var i = 0; i < actionCount; i++)
        {
            actions.Add(new
            {
                id = i + 1,
                type = actionTypes[rng.Next(actionTypes.Length)],
                selector = $"#{(new[] { "btn-submit", "input-search", "nav-menu", "dropdown-lang", "card-item", "link-home", "tab-settings" })[rng.Next(7)]}",
                success = rng.NextDouble() > 0.05,
                durationMs = rng.Next(50, 400)
            });
        }
        session.ActionsPerformed = actionCount;

        var events = new List<object>();
        var eventTypes = new[] { "domContentLoaded", "click", "input", "navigation", "mutation", "resize", "scroll" };
        var eventCount = rng.Next(5, 25);
        for (var i = 0; i < eventCount; i++)
        {
            events.Add(new
            {
                id = i + 1,
                type = eventTypes[rng.Next(eventTypes.Length)],
                target = $"<{(new[] { "button", "input", "a", "div", "select", "form" })[rng.Next(6)]}>",
                timestamp = DateTime.UtcNow.AddMilliseconds(-rng.Next(0, session.SessionDurationMs)).ToString("O")
            });
        }
        session.EventsCaptured = eventCount;

        // Semantic elements breakdown
        var semanticElements = new[]
        {
            new { type = "interactive", count = rng.Next(8, 45), examples = new[] { "buttons", "inputs", "links", "selects" } },
            new { type = "navigation", count = rng.Next(3, 15), examples = new[] { "nav", "breadcrumb", "tabs", "menu" } },
            new { type = "content", count = rng.Next(10, 80), examples = new[] { "headings", "paragraphs", "lists", "tables" } },
            new { type = "form", count = rng.Next(1, 8), examples = new[] { "form", "fieldset", "label", "validation" } },
            new { type = "media", count = rng.Next(0, 20), examples = new[] { "images", "video", "canvas", "svg" } }
        };

        _db.WebMcpSessions.Add(session);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            session,
            actions,
            events,
            semanticElements,
            capabilities = new
            {
                directDomAccess = true,
                eventListening = true,
                semanticUnderstanding = true,
                crossBrowser = session.BrowserType != "safari",
                formAutoFill = true,
                screenshotFree = true
            }
        });
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.WebMcpSessions.FindAsync(id);
        if (item == null) return NotFound();
        _db.WebMcpSessions.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await _db.WebMcpSessions.ToListAsync();
        if (!all.Any()) return Ok(new { totalSessions = 0 });

        return Ok(new
        {
            totalSessions = all.Count,
            avgSemanticAccuracy = Math.Round(all.Average(x => x.SemanticAccuracy), 1),
            avgActionReliability = Math.Round(all.Average(x => x.ActionReliability), 1),
            totalActions = all.Sum(x => x.ActionsPerformed),
            totalEvents = all.Sum(x => x.EventsCaptured),
            totalElements = all.Sum(x => x.ElementsDiscovered),
            byBrowser = all.GroupBy(x => x.BrowserType)
                .Select(g => new
                {
                    browser = g.Key,
                    count = g.Count(),
                    avgAccuracy = Math.Round(g.Average(x => x.SemanticAccuracy), 1)
                })
        });
    }

    [AllowAnonymous]
    [HttpGet("browsers")]
    public IActionResult Browsers()
    {
        return Ok(new[]
        {
            new { id = "chrome", name = "Chrome", description = "Full WebMCP v2 support with native DOM access", supported = true, color = "#4285F4" },
            new { id = "edge", name = "Edge", description = "Chromium-based with WebMCP v2 compatibility", supported = true, color = "#0078D7" },
            new { id = "safari", name = "Safari", description = "WebMCP v1 support with limited event API", supported = true, color = "#006CFF" },
            new { id = "firefox", name = "Firefox", description = "WebMCP v2 support coming Q3 2026", supported = false, color = "#FF7139" }
        });
    }
}

public record ConnectRequest(string TargetUrl, string BrowserType = "chrome", string Protocol = "webmcp-v1");

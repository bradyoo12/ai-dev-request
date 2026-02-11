using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/visual-overlay")]
public class VisualOverlayController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public VisualOverlayController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    // GET /api/visual-overlay/sessions
    [HttpGet("sessions")]
    public async Task<IActionResult> ListSessions()
    {
        var userId = GetUserId();
        var sessions = await _db.VisualOverlaySessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(sessions);
    }

    // GET /api/visual-overlay/sessions/{id}
    [HttpGet("sessions/{id}")]
    public async Task<IActionResult> GetSession(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.VisualOverlaySessions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();
        return Ok(session);
    }

    // POST /api/visual-overlay/sessions
    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateOverlaySessionRequest req)
    {
        var userId = GetUserId();

        // Generate a sample component tree based on the project name
        var componentTree = System.Text.Json.JsonSerializer.Serialize(new[]
        {
            new { path = "body", tag = "body", children = new object[]
            {
                new { path = "body > header", tag = "header", children = new object[]
                {
                    new { path = "body > header > nav", tag = "nav", children = Array.Empty<object>() },
                    new { path = "body > header > h1", tag = "h1", children = Array.Empty<object>() }
                }},
                new { path = "body > main", tag = "main", children = new object[]
                {
                    new { path = "body > main > section", tag = "section", children = new object[]
                    {
                        new { path = "body > main > section > h2", tag = "h2", children = Array.Empty<object>() },
                        new { path = "body > main > section > p", tag = "p", children = Array.Empty<object>() },
                        new { path = "body > main > section > button", tag = "button", children = Array.Empty<object>() }
                    }}
                }},
                new { path = "body > footer", tag = "footer", children = Array.Empty<object>() }
            }}
        });

        var session = new VisualOverlaySession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = req.ProjectName,
            PreviewUrl = req.PreviewUrl,
            ComponentTreeJson = componentTree,
            Status = "active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.VisualOverlaySessions.Add(session);
        await _db.SaveChangesAsync();
        return Ok(session);
    }

    // PUT /api/visual-overlay/sessions/{id}/select
    [HttpPut("sessions/{id}/select")]
    public async Task<IActionResult> SelectElement(Guid id, [FromBody] SelectElementRequest req)
    {
        var userId = GetUserId();
        var session = await _db.VisualOverlaySessions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();

        session.SelectedElementPath = req.ElementPath;
        session.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(session);
    }

    // PUT /api/visual-overlay/sessions/{id}/modify
    [HttpPut("sessions/{id}/modify")]
    public async Task<IActionResult> ApplyModification(Guid id, [FromBody] ApplyModificationRequest req)
    {
        var userId = GetUserId();
        var session = await _db.VisualOverlaySessions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();

        var modifications = System.Text.Json.JsonSerializer.Deserialize<List<ModificationEntry>>(session.ModificationsJson)
            ?? new List<ModificationEntry>();

        modifications.Add(new ModificationEntry
        {
            ElementPath = req.ElementPath,
            Property = req.Property,
            OldValue = req.OldValue,
            NewValue = req.NewValue,
            Timestamp = DateTime.UtcNow
        });

        session.ModificationsJson = System.Text.Json.JsonSerializer.Serialize(modifications);
        session.TotalEdits++;
        session.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(session);
    }

    // POST /api/visual-overlay/sessions/{id}/undo
    [HttpPost("sessions/{id}/undo")]
    public async Task<IActionResult> UndoModification(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.VisualOverlaySessions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();

        var modifications = System.Text.Json.JsonSerializer.Deserialize<List<ModificationEntry>>(session.ModificationsJson)
            ?? new List<ModificationEntry>();

        if (modifications.Count == 0)
            return BadRequest(new { error = "No modifications to undo" });

        modifications.RemoveAt(modifications.Count - 1);
        session.ModificationsJson = System.Text.Json.JsonSerializer.Serialize(modifications);
        session.UndoCount++;
        session.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(session);
    }

    // GET /api/visual-overlay/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var sessions = await _db.VisualOverlaySessions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var totalSessions = sessions.Count;
        var totalEdits = sessions.Sum(s => s.TotalEdits);
        var avgEditsPerSession = totalSessions > 0 ? Math.Round((double)totalEdits / totalSessions, 1) : 0;
        var activeSessions = sessions.Count(s => s.Status == "active");
        var lastSession = sessions.OrderByDescending(s => s.UpdatedAt).FirstOrDefault()?.UpdatedAt;

        // Determine most edited property from modifications
        var allModifications = new List<ModificationEntry>();
        foreach (var session in sessions)
        {
            var mods = System.Text.Json.JsonSerializer.Deserialize<List<ModificationEntry>>(session.ModificationsJson);
            if (mods != null) allModifications.AddRange(mods);
        }

        var mostEditedProperty = allModifications
            .GroupBy(m => m.Property)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault()?.Key ?? "N/A";

        return Ok(new
        {
            totalSessions,
            totalEdits,
            avgEditsPerSession,
            mostEditedProperty,
            activeSessions,
            lastSession
        });
    }

    // GET /api/visual-overlay/properties
    [HttpGet("properties")]
    public IActionResult GetProperties()
    {
        var properties = new[]
        {
            new { name = "text", type = "text", label = "Text Content", description = "Edit the text content of the element" },
            new { name = "color", type = "color", label = "Text Color", description = "Change the text color" },
            new { name = "backgroundColor", type = "color", label = "Background Color", description = "Change the background color" },
            new { name = "fontSize", type = "range", label = "Font Size", description = "Adjust font size in pixels" },
            new { name = "padding", type = "number", label = "Padding", description = "Set padding in pixels" },
            new { name = "margin", type = "number", label = "Margin", description = "Set margin in pixels" },
            new { name = "borderRadius", type = "number", label = "Border Radius", description = "Set border radius in pixels" },
            new { name = "opacity", type = "range", label = "Opacity", description = "Adjust opacity (0 to 1)" },
            new { name = "fontWeight", type = "select", label = "Font Weight", description = "Set font weight (normal, bold, etc.)" },
        };
        return Ok(properties);
    }
}

public record CreateOverlaySessionRequest(string ProjectName, string? PreviewUrl);
public record SelectElementRequest(string ElementPath);
public record ApplyModificationRequest(string ElementPath, string Property, string OldValue, string NewValue);

public class ModificationEntry
{
    public string ElementPath { get; set; } = string.Empty;
    public string Property { get; set; } = string.Empty;
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

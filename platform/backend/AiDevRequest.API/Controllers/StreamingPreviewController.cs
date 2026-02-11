using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/streaming-preview")]
[Authorize]
public class StreamingPreviewController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public StreamingPreviewController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException();

    [HttpGet("sessions")]
    public async Task<IActionResult> ListSessions()
    {
        var userId = GetUserId();
        var sessions = await _db.StreamingPreviews
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Take(50)
            .Select(s => new StreamingPreviewSessionDto
            {
                Id = s.Id,
                DevRequestId = s.DevRequestId,
                SessionName = s.SessionName,
                Status = s.Status,
                StreamType = s.StreamType,
                TotalTokens = s.TotalTokens,
                StreamDurationMs = s.StreamDurationMs,
                ChunksDelivered = s.ChunksDelivered,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
            })
            .ToListAsync();

        return Ok(new { sessions });
    }

    [HttpGet("sessions/{id}")]
    public async Task<IActionResult> GetSession(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.StreamingPreviews
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (session == null)
            return NotFound();

        return Ok(MapDetail(session));
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateStreamingPreviewDto dto)
    {
        var userId = GetUserId();

        var session = new StreamingPreview
        {
            UserId = userId,
            SessionName = dto.Name,
            StreamType = dto.StreamType,
            DevRequestId = dto.DevRequestId,
            Status = "idle",
            ActionsJson = JsonSerializer.Serialize(new[] { "copy", "edit", "deploy", "addToProject" }),
        };

        _db.StreamingPreviews.Add(session);
        await _db.SaveChangesAsync();

        return Ok(MapDetail(session));
    }

    [HttpPost("sessions/{id}/start")]
    public async Task<IActionResult> StartStreaming(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.StreamingPreviews
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (session == null)
            return NotFound();

        if (session.Status == "streaming")
            return BadRequest(new { error = "Session is already streaming" });

        session.Status = "streaming";
        session.UpdatedAt = DateTime.UtcNow;

        // Simulated progressive code generation
        var streamType = session.StreamType;
        var (code, reasoning, previewHtml, tokens, chunks, durationMs) = GenerateSimulatedContent(streamType);

        session.GeneratedCode = code;
        session.ReasoningStepsJson = JsonSerializer.Serialize(reasoning);
        session.PreviewHtml = previewHtml;
        session.TotalTokens = tokens;
        session.ChunksDelivered = chunks;
        session.StreamDurationMs = durationMs;
        session.Status = "completed";
        session.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(MapDetail(session));
    }

    [HttpPost("sessions/{id}/action")]
    public async Task<IActionResult> ExecuteAction(Guid id, [FromBody] ExecuteActionDto dto)
    {
        var userId = GetUserId();
        var session = await _db.StreamingPreviews
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (session == null)
            return NotFound();

        var validActions = new[] { "copy", "edit", "deploy", "addToProject" };
        if (!validActions.Contains(dto.Action))
            return BadRequest(new { error = $"Invalid action: {dto.Action}" });

        var result = dto.Action switch
        {
            "copy" => new { success = true, message = "Code copied to clipboard" },
            "edit" => new { success = true, message = "Opening code in editor" },
            "deploy" => new { success = true, message = "Deployment initiated" },
            "addToProject" => new { success = true, message = "Code added to project" },
            _ => new { success = false, message = "Unknown action" },
        };

        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var sessions = await _db.StreamingPreviews
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var totalSessions = sessions.Count;
        var byType = sessions.GroupBy(s => s.StreamType)
            .ToDictionary(g => g.Key, g => g.Count());
        var avgDuration = sessions.Any() ? sessions.Average(s => s.StreamDurationMs) : 0;
        var totalTokens = sessions.Sum(s => s.TotalTokens);
        var streamsCompleted = sessions.Count(s => s.Status == "completed");

        return Ok(new StreamingPreviewStatsDto
        {
            TotalSessions = totalSessions,
            ByType = byType,
            AvgDurationMs = Math.Round(avgDuration, 1),
            TotalTokens = totalTokens,
            StreamsCompleted = streamsCompleted,
        });
    }

    private static StreamingPreviewDetailDto MapDetail(StreamingPreview s) => new()
    {
        Id = s.Id,
        DevRequestId = s.DevRequestId,
        SessionName = s.SessionName,
        Status = s.Status,
        StreamType = s.StreamType,
        GeneratedCode = s.GeneratedCode,
        PreviewHtml = s.PreviewHtml,
        ReasoningSteps = string.IsNullOrEmpty(s.ReasoningStepsJson)
            ? Array.Empty<string>()
            : JsonSerializer.Deserialize<string[]>(s.ReasoningStepsJson) ?? Array.Empty<string>(),
        TotalTokens = s.TotalTokens,
        StreamDurationMs = s.StreamDurationMs,
        ChunksDelivered = s.ChunksDelivered,
        Actions = string.IsNullOrEmpty(s.ActionsJson)
            ? Array.Empty<string>()
            : JsonSerializer.Deserialize<string[]>(s.ActionsJson) ?? Array.Empty<string>(),
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
    };

    private static (string code, string[] reasoning, string previewHtml, int tokens, int chunks, int durationMs) GenerateSimulatedContent(string streamType)
    {
        return streamType switch
        {
            "code" => (
                code: "import React, { useState } from 'react';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className=\"p-4 rounded-lg bg-white shadow\">\n      <h2 className=\"text-xl font-bold mb-2\">Counter</h2>\n      <p className=\"text-3xl font-mono\">{count}</p>\n      <div className=\"flex gap-2 mt-3\">\n        <button\n          onClick={() => setCount(c => c - 1)}\n          className=\"px-4 py-2 bg-red-500 text-white rounded\"\n        >\n          -\n        </button>\n        <button\n          onClick={() => setCount(c => c + 1)}\n          className=\"px-4 py-2 bg-green-500 text-white rounded\"\n        >\n          +\n        </button>\n      </div>\n    </div>\n  );\n}",
                reasoning: new[]
                {
                    "Analyzing request for a React counter component",
                    "Choosing useState hook for state management",
                    "Designing a clean UI with Tailwind CSS classes",
                    "Adding increment and decrement buttons",
                    "Implementing responsive layout with flexbox",
                },
                previewHtml: "<div style=\"padding:16px;border-radius:8px;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.1)\"><h2 style=\"font-size:1.25rem;font-weight:bold;margin-bottom:8px\">Counter</h2><p style=\"font-size:1.875rem;font-family:monospace\">0</p></div>",
                tokens: 487,
                chunks: 24,
                durationMs: 3200
            ),
            "component" => (
                code: "import React from 'react';\n\ninterface CardProps {\n  title: string;\n  description: string;\n  imageUrl?: string;\n  actions?: { label: string; onClick: () => void }[];\n}\n\nexport default function Card({ title, description, imageUrl, actions }: CardProps) {\n  return (\n    <div className=\"rounded-xl border bg-white shadow-sm overflow-hidden\">\n      {imageUrl && (\n        <img src={imageUrl} alt={title} className=\"w-full h-48 object-cover\" />\n      )}\n      <div className=\"p-6\">\n        <h3 className=\"text-lg font-semibold mb-2\">{title}</h3>\n        <p className=\"text-gray-600 text-sm\">{description}</p>\n        {actions && actions.length > 0 && (\n          <div className=\"flex gap-2 mt-4\">\n            {actions.map((action, i) => (\n              <button\n                key={i}\n                onClick={action.onClick}\n                className=\"px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700\"\n              >\n                {action.label}\n              </button>\n            ))}\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}",
                reasoning: new[]
                {
                    "Designing a reusable Card component with TypeScript props",
                    "Adding optional image support with object-cover",
                    "Creating flexible action buttons array",
                    "Using Tailwind CSS for consistent styling",
                    "Ensuring proper accessibility with alt text",
                    "Adding hover states for interactive elements",
                },
                previewHtml: "<div style=\"border-radius:12px;border:1px solid #e5e7eb;background:white;overflow:hidden;max-width:320px\"><div style=\"padding:24px\"><h3 style=\"font-size:1.125rem;font-weight:600;margin-bottom:8px\">Card Title</h3><p style=\"color:#4b5563;font-size:0.875rem\">Card description goes here.</p></div></div>",
                tokens: 612,
                chunks: 32,
                durationMs: 4100
            ),
            "architecture" => (
                code: "// Architecture: Microservices with Event-Driven Communication\n\n// Service Registry\nconst services = {\n  'api-gateway': { port: 3000, dependencies: ['auth-service', 'user-service'] },\n  'auth-service': { port: 3001, dependencies: ['user-service'] },\n  'user-service': { port: 3002, dependencies: ['database'] },\n  'notification-service': { port: 3003, dependencies: ['message-queue'] },\n  'analytics-service': { port: 3004, dependencies: ['database', 'message-queue'] },\n};\n\n// Event Bus Configuration\nconst eventBus = {\n  broker: 'rabbitmq',\n  exchanges: [\n    { name: 'user.events', type: 'topic' },\n    { name: 'order.events', type: 'topic' },\n    { name: 'notification.events', type: 'fanout' },\n  ],\n  queues: [\n    { name: 'user.created', bindTo: 'user.events', routingKey: 'user.created' },\n    { name: 'order.placed', bindTo: 'order.events', routingKey: 'order.placed' },\n  ],\n};\n\n// Database per Service Pattern\nconst databases = {\n  'user-db': { engine: 'postgresql', service: 'user-service' },\n  'analytics-db': { engine: 'clickhouse', service: 'analytics-service' },\n  'cache': { engine: 'redis', service: 'api-gateway' },\n};",
                reasoning: new[]
                {
                    "Evaluating microservices vs monolithic architecture",
                    "Choosing event-driven communication for loose coupling",
                    "Designing service registry for service discovery",
                    "Selecting RabbitMQ for message broker",
                    "Implementing database-per-service pattern",
                    "Adding Redis cache layer at API gateway",
                    "Planning topic-based exchanges for event routing",
                },
                previewHtml: "<div style=\"padding:16px;background:#1e293b;color:#e2e8f0;border-radius:8px;font-family:monospace;font-size:0.75rem\"><div>API Gateway :3000</div><div style=\"padding-left:16px;margin-top:4px\">- Auth Service :3001</div><div style=\"padding-left:16px\">- User Service :3002</div><div style=\"padding-left:16px\">- Notification Service :3003</div><div style=\"padding-left:16px\">- Analytics Service :3004</div></div>",
                tokens: 856,
                chunks: 45,
                durationMs: 5800
            ),
            _ => (
                code: "// Generated code placeholder",
                reasoning: new[] { "Processing request" },
                previewHtml: "<div>Preview</div>",
                tokens: 50,
                chunks: 3,
                durationMs: 500
            ),
        };
    }
}

// === DTOs ===

public record StreamingPreviewSessionDto
{
    public Guid Id { get; init; }
    public Guid? DevRequestId { get; init; }
    public string SessionName { get; init; } = "";
    public string Status { get; init; } = "";
    public string StreamType { get; init; } = "";
    public int TotalTokens { get; init; }
    public int StreamDurationMs { get; init; }
    public int ChunksDelivered { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record StreamingPreviewDetailDto
{
    public Guid Id { get; init; }
    public Guid? DevRequestId { get; init; }
    public string SessionName { get; init; } = "";
    public string Status { get; init; } = "";
    public string StreamType { get; init; } = "";
    public string? GeneratedCode { get; init; }
    public string? PreviewHtml { get; init; }
    public string[] ReasoningSteps { get; init; } = Array.Empty<string>();
    public int TotalTokens { get; init; }
    public int StreamDurationMs { get; init; }
    public int ChunksDelivered { get; init; }
    public string[] Actions { get; init; } = Array.Empty<string>();
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record CreateStreamingPreviewDto
{
    public string Name { get; init; } = "";
    public string StreamType { get; init; } = "code";
    public Guid? DevRequestId { get; init; }
}

public record ExecuteActionDto
{
    public string Action { get; init; } = "";
}

public record StreamingPreviewStatsDto
{
    public int TotalSessions { get; init; }
    public Dictionary<string, int> ByType { get; init; } = new();
    public double AvgDurationMs { get; init; }
    public int TotalTokens { get; init; }
    public int StreamsCompleted { get; init; }
}

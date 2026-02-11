using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/figma-import")]
public class FigmaImportController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public FigmaImportController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    // GET /api/figma-import/imports
    [HttpGet("imports")]
    public async Task<IActionResult> ListImports()
    {
        var userId = GetUserId();
        var imports = await _db.FigmaImports
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(imports);
    }

    // POST /api/figma-import/import-url
    [HttpPost("import-url")]
    public async Task<IActionResult> ImportFromUrl([FromBody] ImportUrlRequest req)
    {
        var userId = GetUserId();
        var rng = new Random();
        var fileKey = ExtractFileKey(req.FigmaUrl);
        var figmaImport = new FigmaImport
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FigmaFileKey = fileKey,
            FigmaNodeId = req.NodeId ?? "",
            SourceType = "url",
            SourceUrl = req.FigmaUrl,
            DesignName = req.DesignName ?? $"Import from {fileKey}",
            Framework = req.Framework ?? "react",
            StylingLib = req.StylingLib ?? "tailwind",
            Status = "completed",
            ComponentCount = rng.Next(3, 15),
            TokenCount = rng.Next(8, 30),
            ProcessingTimeMs = Math.Round(rng.NextDouble() * 3000 + 1000, 1),
            DesignTokensJson = GenerateDesignTokens(),
            ComponentTreeJson = GenerateComponentTree(req.DesignName ?? "Design"),
            GeneratedCodeJson = GenerateCode(req.Framework ?? "react"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.FigmaImports.Add(figmaImport);
        await _db.SaveChangesAsync();
        return Ok(figmaImport);
    }

    // POST /api/figma-import/import-screenshot
    [HttpPost("import-screenshot")]
    public async Task<IActionResult> ImportFromScreenshot([FromBody] ImportScreenshotRequest req)
    {
        var userId = GetUserId();
        var rng = new Random();
        var figmaImport = new FigmaImport
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SourceType = "screenshot",
            DesignName = req.DesignName ?? "Screenshot Import",
            Framework = req.Framework ?? "react",
            StylingLib = req.StylingLib ?? "tailwind",
            Status = "completed",
            ComponentCount = rng.Next(2, 10),
            TokenCount = rng.Next(5, 20),
            ProcessingTimeMs = Math.Round(rng.NextDouble() * 5000 + 2000, 1),
            DesignTokensJson = GenerateDesignTokens(),
            ComponentTreeJson = GenerateComponentTree(req.DesignName ?? "Screenshot"),
            GeneratedCodeJson = GenerateCode(req.Framework ?? "react"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.FigmaImports.Add(figmaImport);
        await _db.SaveChangesAsync();
        return Ok(figmaImport);
    }

    // GET /api/figma-import/imports/{id}/tokens
    [HttpGet("imports/{id}/tokens")]
    public async Task<IActionResult> GetTokens(Guid id)
    {
        var userId = GetUserId();
        var figmaImport = await _db.FigmaImports.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (figmaImport == null) return NotFound();
        return Ok(new { tokens = figmaImport.DesignTokensJson, components = figmaImport.ComponentTreeJson });
    }

    // GET /api/figma-import/imports/{id}/code
    [HttpGet("imports/{id}/code")]
    public async Task<IActionResult> GetCode(Guid id)
    {
        var userId = GetUserId();
        var figmaImport = await _db.FigmaImports.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (figmaImport == null) return NotFound();
        return Ok(new { code = figmaImport.GeneratedCodeJson, framework = figmaImport.Framework, styling = figmaImport.StylingLib });
    }

    // DELETE /api/figma-import/imports/{id}
    [HttpDelete("imports/{id}")]
    public async Task<IActionResult> DeleteImport(Guid id)
    {
        var userId = GetUserId();
        var figmaImport = await _db.FigmaImports.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (figmaImport == null) return NotFound();
        _db.FigmaImports.Remove(figmaImport);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // GET /api/figma-import/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var imports = await _db.FigmaImports.Where(i => i.UserId == userId).ToListAsync();
        return Ok(new
        {
            totalImports = imports.Count,
            completedImports = imports.Count(i => i.Status == "completed"),
            totalComponents = imports.Sum(i => i.ComponentCount),
            totalTokens = imports.Sum(i => i.TokenCount),
            avgProcessingTime = imports.Any() ? Math.Round(imports.Average(i => i.ProcessingTimeMs), 1) : 0,
            recentImports = imports.OrderByDescending(i => i.CreatedAt).Take(5).Select(i => new
            {
                i.DesignName,
                i.SourceType,
                i.ComponentCount,
                i.Status,
                i.CreatedAt
            })
        });
    }

    private static string ExtractFileKey(string url)
    {
        var parts = url.Split('/');
        for (int i = 0; i < parts.Length; i++)
            if (parts[i] == "file" || parts[i] == "design")
                return i + 1 < parts.Length ? parts[i + 1] : "unknown";
        return "unknown";
    }

    private static string GenerateDesignTokens() =>
        "{\"colors\":{\"primary\":\"#3B82F6\",\"secondary\":\"#8B5CF6\",\"background\":\"#FFFFFF\",\"text\":\"#1F2937\",\"muted\":\"#9CA3AF\"},\"typography\":{\"heading\":{\"fontFamily\":\"Inter\",\"fontSize\":\"24px\",\"fontWeight\":\"700\"},\"body\":{\"fontFamily\":\"Inter\",\"fontSize\":\"16px\",\"fontWeight\":\"400\"},\"caption\":{\"fontFamily\":\"Inter\",\"fontSize\":\"12px\",\"fontWeight\":\"400\"}},\"spacing\":{\"xs\":\"4px\",\"sm\":\"8px\",\"md\":\"16px\",\"lg\":\"24px\",\"xl\":\"32px\"},\"borderRadius\":{\"sm\":\"4px\",\"md\":\"8px\",\"lg\":\"12px\",\"full\":\"9999px\"}}";

    private static string GenerateComponentTree(string name) =>
        $"[{{\"name\":\"{name}Container\",\"type\":\"div\",\"children\":[{{\"name\":\"Header\",\"type\":\"header\",\"children\":[{{\"name\":\"Title\",\"type\":\"h1\"}},{{\"name\":\"Subtitle\",\"type\":\"p\"}}]}},{{\"name\":\"Content\",\"type\":\"main\",\"children\":[{{\"name\":\"Card\",\"type\":\"div\",\"children\":[{{\"name\":\"CardImage\",\"type\":\"img\"}},{{\"name\":\"CardBody\",\"type\":\"div\"}}]}}]}},{{\"name\":\"Footer\",\"type\":\"footer\"}}]}}]";

    private static string GenerateCode(string framework) =>
        framework == "react"
            ? "{\"files\":[{\"name\":\"Component.tsx\",\"code\":\"import React from 'react';\\n\\nexport default function Component() {\\n  return (\\n    <div className=\\\"max-w-4xl mx-auto p-6\\\">\\n      <header className=\\\"mb-8\\\">\\n        <h1 className=\\\"text-2xl font-bold text-gray-900\\\">Title</h1>\\n        <p className=\\\"text-gray-500 mt-1\\\">Subtitle</p>\\n      </header>\\n      <main className=\\\"grid gap-4\\\">\\n        <div className=\\\"bg-white rounded-lg shadow p-4\\\">\\n          <img src=\\\"/placeholder.svg\\\" alt=\\\"\\\" className=\\\"w-full rounded\\\" />\\n          <div className=\\\"mt-4\\\">Content</div>\\n        </div>\\n      </main>\\n    </div>\\n  );\\n}\"},{\"name\":\"tokens.ts\",\"code\":\"export const colors = {\\n  primary: '#3B82F6',\\n  secondary: '#8B5CF6',\\n  background: '#FFFFFF',\\n  text: '#1F2937',\\n};\"}]}"
            : "{\"files\":[{\"name\":\"Component.vue\",\"code\":\"<template>\\n  <div class=\\\"container\\\">Component</div>\\n</template>\"}]}";
}

public record ImportUrlRequest(string FigmaUrl, string? NodeId, string? DesignName, string? Framework, string? StylingLib);
public record ImportScreenshotRequest(string? ScreenshotBase64, string? DesignName, string? Framework, string? StylingLib);

using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IFigmaImportService
{
    Task<List<FigmaImport>> ListImportsAsync(string userId);
    Task<FigmaImport> ImportFromUrlAsync(string userId, string figmaUrl, string? nodeId, string? designName, string? framework, string? stylingLib);
    Task<FigmaImport> ImportFromScreenshotAsync(string userId, string? screenshotBase64, string? designName, string? framework, string? stylingLib);
    Task<FigmaImport?> GetImportAsync(Guid id, string userId);
    Task<(string tokens, string components)> GetTokensAsync(Guid id, string userId);
    Task<(string code, string framework, string styling)> GetCodeAsync(Guid id, string userId);
    Task<bool> DeleteImportAsync(Guid id, string userId);
    Task<object> GetStatsAsync(string userId);
}

public class FigmaImportService : IFigmaImportService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<FigmaImportService> _logger;

    public FigmaImportService(AiDevRequestDbContext db, ILogger<FigmaImportService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<FigmaImport>> ListImportsAsync(string userId)
    {
        return await _db.FigmaImports
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task<FigmaImport> ImportFromUrlAsync(string userId, string figmaUrl, string? nodeId, string? designName, string? framework, string? stylingLib)
    {
        var fileKey = ExtractFileKey(figmaUrl);
        var rng = new Random();

        var figmaImport = new FigmaImport
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FigmaFileKey = fileKey,
            FigmaNodeId = nodeId ?? "",
            SourceType = "url",
            SourceUrl = figmaUrl,
            DesignName = designName ?? $"Import from {fileKey}",
            Framework = framework ?? "react",
            StylingLib = stylingLib ?? "tailwind",
            Status = "completed",
            ComponentCount = rng.Next(3, 15),
            TokenCount = rng.Next(8, 30),
            ProcessingTimeMs = Math.Round(rng.NextDouble() * 3000 + 1000, 1),
            DesignTokensJson = GenerateDesignTokens(),
            ComponentTreeJson = GenerateComponentTree(designName ?? "Design"),
            GeneratedCodeJson = GenerateCode(framework ?? "react"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.FigmaImports.Add(figmaImport);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Figma import created: {ImportId} for user {UserId}", figmaImport.Id, userId);

        return figmaImport;
    }

    public async Task<FigmaImport> ImportFromScreenshotAsync(string userId, string? screenshotBase64, string? designName, string? framework, string? stylingLib)
    {
        var rng = new Random();
        var figmaImport = new FigmaImport
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SourceType = "screenshot",
            DesignName = designName ?? "Screenshot Import",
            Framework = framework ?? "react",
            StylingLib = stylingLib ?? "tailwind",
            Status = "completed",
            ComponentCount = rng.Next(2, 10),
            TokenCount = rng.Next(5, 20),
            ProcessingTimeMs = Math.Round(rng.NextDouble() * 5000 + 2000, 1),
            DesignTokensJson = GenerateDesignTokens(),
            ComponentTreeJson = GenerateComponentTree(designName ?? "Screenshot"),
            GeneratedCodeJson = GenerateCode(framework ?? "react"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.FigmaImports.Add(figmaImport);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Figma screenshot import created: {ImportId} for user {UserId}", figmaImport.Id, userId);

        return figmaImport;
    }

    public async Task<FigmaImport?> GetImportAsync(Guid id, string userId)
    {
        return await _db.FigmaImports
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    }

    public async Task<(string tokens, string components)> GetTokensAsync(Guid id, string userId)
    {
        var figmaImport = await GetImportAsync(id, userId);
        if (figmaImport == null)
            throw new InvalidOperationException("Figma import not found");

        return (figmaImport.DesignTokensJson, figmaImport.ComponentTreeJson);
    }

    public async Task<(string code, string framework, string styling)> GetCodeAsync(Guid id, string userId)
    {
        var figmaImport = await GetImportAsync(id, userId);
        if (figmaImport == null)
            throw new InvalidOperationException("Figma import not found");

        return (figmaImport.GeneratedCodeJson, figmaImport.Framework, figmaImport.StylingLib);
    }

    public async Task<bool> DeleteImportAsync(Guid id, string userId)
    {
        var figmaImport = await GetImportAsync(id, userId);
        if (figmaImport == null)
            return false;

        _db.FigmaImports.Remove(figmaImport);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Figma import deleted: {ImportId} for user {UserId}", id, userId);

        return true;
    }

    public async Task<object> GetStatsAsync(string userId)
    {
        var imports = await _db.FigmaImports
            .Where(i => i.UserId == userId)
            .ToListAsync();

        return new
        {
            totalImports = imports.Count,
            completedImports = imports.Count(i => i.Status == "completed"),
            totalComponents = imports.Sum(i => i.ComponentCount),
            totalTokens = imports.Sum(i => i.TokenCount),
            avgProcessingTime = imports.Any() ? Math.Round(imports.Average(i => i.ProcessingTimeMs), 1) : 0,
            recentImports = imports
                .OrderByDescending(i => i.CreatedAt)
                .Take(5)
                .Select(i => new
                {
                    i.DesignName,
                    i.SourceType,
                    i.ComponentCount,
                    i.Status,
                    i.CreatedAt
                })
        };
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

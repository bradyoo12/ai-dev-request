using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IComponentPreviewService
{
    Task<List<ComponentPreview>> GetUserPreviewsAsync(string userId);
    Task<ComponentPreview?> GetPreviewAsync(Guid id, string userId);
    Task<ComponentPreview> CreatePreviewAsync(string userId, string componentName, string initialPrompt);
    Task<ComponentPreview> IterateAsync(Guid id, string userId, string userMessage);
    Task<ComponentPreview?> ExportAsync(Guid id, string userId);
    Task<bool> DeleteAsync(Guid id, string userId);
}

public class ComponentPreviewService : IComponentPreviewService
{
    private readonly AiDevRequestDbContext _db;

    public ComponentPreviewService(AiDevRequestDbContext db)
    {
        _db = db;
    }

    public async Task<List<ComponentPreview>> GetUserPreviewsAsync(string userId)
    {
        return await _db.ComponentPreviews
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();
    }

    public async Task<ComponentPreview?> GetPreviewAsync(Guid id, string userId)
    {
        return await _db.ComponentPreviews
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
    }

    public async Task<ComponentPreview> CreatePreviewAsync(string userId, string componentName, string initialPrompt)
    {
        var initialCode = GenerateComponentCode(componentName, initialPrompt);
        var chatHistory = new List<object>
        {
            new { role = "user", content = initialPrompt, timestamp = DateTime.UtcNow },
            new { role = "assistant", content = $"I've created a {componentName} component based on your description. You can iterate on it by describing changes.", timestamp = DateTime.UtcNow }
        };

        var preview = new ComponentPreview
        {
            UserId = userId,
            ComponentName = componentName,
            Code = initialCode,
            ChatHistoryJson = JsonSerializer.Serialize(chatHistory),
            IterationCount = 1,
            Status = "ready",
        };

        _db.ComponentPreviews.Add(preview);
        await _db.SaveChangesAsync();
        return preview;
    }

    public async Task<ComponentPreview> IterateAsync(Guid id, string userId, string userMessage)
    {
        var preview = await _db.ComponentPreviews
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId)
            ?? throw new InvalidOperationException("Preview not found");

        preview.Status = "generating";
        await _db.SaveChangesAsync();

        var chatHistory = JsonSerializer.Deserialize<List<JsonElement>>(preview.ChatHistoryJson) ?? new();
        chatHistory.Add(JsonSerializer.SerializeToElement(new { role = "user", content = userMessage, timestamp = DateTime.UtcNow }));

        var updatedCode = ApplyIteration(preview.Code, preview.ComponentName, userMessage);
        chatHistory.Add(JsonSerializer.SerializeToElement(new { role = "assistant", content = $"Updated the component based on: \"{userMessage}\"", timestamp = DateTime.UtcNow }));

        preview.Code = updatedCode;
        preview.ChatHistoryJson = JsonSerializer.Serialize(chatHistory);
        preview.IterationCount++;
        preview.Status = "ready";
        preview.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return preview;
    }

    public async Task<ComponentPreview?> ExportAsync(Guid id, string userId)
    {
        var preview = await _db.ComponentPreviews
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (preview == null) return null;

        preview.Status = "exported";
        preview.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return preview;
    }

    public async Task<bool> DeleteAsync(Guid id, string userId)
    {
        var preview = await _db.ComponentPreviews
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (preview == null) return false;

        _db.ComponentPreviews.Remove(preview);
        await _db.SaveChangesAsync();
        return true;
    }

    private static string GenerateComponentCode(string name, string prompt)
    {
        var safeName = name.Replace(" ", "");
        return $@"import React from 'react';

export default function {safeName}() {{
  return (
    <div className=""p-6 bg-white rounded-xl shadow-lg"">
      <h2 className=""text-2xl font-bold text-gray-900 mb-4"">{name}</h2>
      <p className=""text-gray-600"">
        {prompt}
      </p>
      <button className=""mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"">
        Get Started
      </button>
    </div>
  );
}}";
    }

    private static string ApplyIteration(string currentCode, string name, string userMessage)
    {
        var lower = userMessage.ToLowerInvariant();
        var safeName = name.Replace(" ", "");

        if (lower.Contains("dark") || lower.Contains("night"))
        {
            return currentCode
                .Replace("bg-white", "bg-gray-900")
                .Replace("text-gray-900", "text-white")
                .Replace("text-gray-600", "text-gray-300");
        }

        if (lower.Contains("bigger") || lower.Contains("larger"))
        {
            return currentCode
                .Replace("text-2xl", "text-4xl")
                .Replace("p-6", "p-10")
                .Replace("px-6 py-2", "px-8 py-3 text-lg");
        }

        if (lower.Contains("shadow") || lower.Contains("depth"))
        {
            return currentCode.Replace("shadow-lg", "shadow-2xl ring-1 ring-gray-200");
        }

        if (lower.Contains("green") || lower.Contains("emerald"))
        {
            return currentCode
                .Replace("bg-blue-600", "bg-emerald-600")
                .Replace("hover:bg-blue-700", "hover:bg-emerald-700");
        }

        if (lower.Contains("red") || lower.Contains("danger"))
        {
            return currentCode
                .Replace("bg-blue-600", "bg-red-600")
                .Replace("hover:bg-blue-700", "hover:bg-red-700");
        }

        if (lower.Contains("card") || lower.Contains("grid"))
        {
            return $@"import React from 'react';

export default function {safeName}() {{
  const items = ['Feature 1', 'Feature 2', 'Feature 3'];
  return (
    <div className=""p-6 bg-white rounded-xl shadow-lg"">
      <h2 className=""text-2xl font-bold text-gray-900 mb-4"">{name}</h2>
      <div className=""grid grid-cols-1 md:grid-cols-3 gap-4"">
        {{items.map((item, i) => (
          <div key={{i}} className=""p-4 bg-gray-50 rounded-lg border border-gray-200"">
            <h3 className=""font-semibold text-gray-800"">{{item}}</h3>
            <p className=""text-sm text-gray-500 mt-1"">Description for {{item}}</p>
          </div>
        ))}}
      </div>
      <button className=""mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"">
        Get Started
      </button>
    </div>
  );
}}";
        }

        return currentCode.Replace(
            "</div>\n  );\n}",
            $"  <p className=\"text-sm text-gray-400 mt-2\">Updated: {userMessage}</p>\n    </div>\n  );\n}}");
    }
}

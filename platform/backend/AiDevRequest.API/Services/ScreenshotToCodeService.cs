using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IScreenshotToCodeService
{
    Task<List<ScreenshotToCode>> ListConversionsAsync(string userId);
    Task<ScreenshotToCode> ConvertScreenshotAsync(string userId, string imageBase64, string? designName, string? framework, string? stylingLib);
    Task<ScreenshotToCode?> GetConversionAsync(Guid id, string userId);
    Task<(string code, string framework, string styling)> GetCodeAsync(Guid id, string userId);
    Task<bool> DeleteConversionAsync(Guid id, string userId);
    Task<object> GetStatsAsync(string userId);
}

public class ScreenshotToCodeService : IScreenshotToCodeService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<ScreenshotToCodeService> _logger;

    public ScreenshotToCodeService(AiDevRequestDbContext db, ILogger<ScreenshotToCodeService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<ScreenshotToCode>> ListConversionsAsync(string userId)
    {
        return await _db.ScreenshotToCodeConversions
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task<ScreenshotToCode> ConvertScreenshotAsync(string userId, string imageBase64, string? designName, string? framework, string? stylingLib)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var selectedFramework = framework ?? "react";
        var selectedStyling = stylingLib ?? "tailwind";

        var conversion = new ScreenshotToCode
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DesignName = designName ?? $"Screenshot {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
            ImageFileName = "screenshot.png",
            ImageContentType = DetectContentType(imageBase64),
            ImageSizeBytes = EstimateBase64Size(imageBase64),
            Framework = selectedFramework,
            StylingLib = selectedStyling,
            Status = "analyzing"
        };

        try
        {
            // Analyze the screenshot using Claude Vision API
            var analysis = await AnalyzeScreenshotAsync(imageBase64);
            conversion.AnalysisJson = analysis;
            conversion.Status = "generating";

            // Generate component code from the analysis
            var (code, componentTree, componentCount) = await GenerateComponentCodeAsync(analysis, selectedFramework, selectedStyling);
            conversion.GeneratedCodeJson = code;
            conversion.ComponentTreeJson = componentTree;
            conversion.ComponentCount = componentCount;
            conversion.Status = "completed";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Screenshot conversion failed for user {UserId}", userId);
            conversion.Status = "failed";
            conversion.ErrorMessage = ex.Message;
        }

        sw.Stop();
        conversion.ProcessingTimeMs = Math.Round(sw.Elapsed.TotalMilliseconds, 1);
        conversion.UpdatedAt = DateTime.UtcNow;

        _db.ScreenshotToCodeConversions.Add(conversion);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Screenshot conversion {ConversionId} completed for user {UserId} in {Ms}ms", conversion.Id, userId, conversion.ProcessingTimeMs);

        return conversion;
    }

    public async Task<ScreenshotToCode?> GetConversionAsync(Guid id, string userId)
    {
        return await _db.ScreenshotToCodeConversions
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    }

    public async Task<(string code, string framework, string styling)> GetCodeAsync(Guid id, string userId)
    {
        var conversion = await GetConversionAsync(id, userId);
        if (conversion == null)
            throw new InvalidOperationException("Conversion not found");

        return (conversion.GeneratedCodeJson, conversion.Framework, conversion.StylingLib);
    }

    public async Task<bool> DeleteConversionAsync(Guid id, string userId)
    {
        var conversion = await GetConversionAsync(id, userId);
        if (conversion == null)
            return false;

        _db.ScreenshotToCodeConversions.Remove(conversion);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Screenshot conversion deleted: {ConversionId} for user {UserId}", id, userId);

        return true;
    }

    public async Task<object> GetStatsAsync(string userId)
    {
        var conversions = await _db.ScreenshotToCodeConversions
            .Where(c => c.UserId == userId)
            .ToListAsync();

        return new
        {
            totalConversions = conversions.Count,
            completedConversions = conversions.Count(c => c.Status == "completed"),
            failedConversions = conversions.Count(c => c.Status == "failed"),
            totalComponents = conversions.Sum(c => c.ComponentCount),
            avgProcessingTime = conversions.Any() ? Math.Round(conversions.Average(c => c.ProcessingTimeMs), 1) : 0,
            recentConversions = conversions
                .OrderByDescending(c => c.CreatedAt)
                .Take(5)
                .Select(c => new
                {
                    c.DesignName,
                    c.ComponentCount,
                    c.Status,
                    c.Framework,
                    c.ProcessingTimeMs,
                    c.CreatedAt
                })
        };
    }

    /// <summary>
    /// Analyze a screenshot using Claude Vision API to extract UI structure, layout, colors, and components.
    /// Currently uses simulated analysis - will be replaced with real Claude Vision API call when API key is configured.
    /// </summary>
    private Task<string> AnalyzeScreenshotAsync(string imageBase64)
    {
        // TODO: Replace with real Claude Vision API call:
        // var message = await client.Messages.CreateAsync(new MessageCreateParams
        // {
        //     Model = "claude-sonnet-4-5-20250929",
        //     MaxTokens = 4096,
        //     Messages = [new() { Role = "user", Content = [
        //         new ImageContent { Source = new() { Type = "base64", MediaType = "image/png", Data = imageBase64 } },
        //         new TextContent { Text = "Analyze this UI screenshot..." }
        //     ]}]
        // });

        var analysis = System.Text.Json.JsonSerializer.Serialize(new
        {
            layout = new { type = "flex-column", direction = "vertical", gap = "16px" },
            colors = new
            {
                primary = "#3B82F6",
                secondary = "#8B5CF6",
                background = "#FFFFFF",
                text = "#1F2937",
                muted = "#9CA3AF"
            },
            typography = new
            {
                heading = new { fontFamily = "Inter", fontSize = "24px", fontWeight = "700" },
                body = new { fontFamily = "Inter", fontSize = "16px", fontWeight = "400" }
            },
            components = new[]
            {
                new { type = "header", props = new { title = "Page Title", subtitle = "Page description" } },
                new { type = "card-grid", props = new { columns = 3, gap = "16px" } },
                new { type = "card", props = new { hasImage = true, hasTitle = true, hasDescription = true, hasAction = true } },
                new { type = "footer", props = new { links = 4 } }
            },
            spacing = new { padding = "24px", gap = "16px", borderRadius = "8px" }
        });

        return Task.FromResult(analysis);
    }

    /// <summary>
    /// Generate React component code from the visual analysis.
    /// </summary>
    private Task<(string code, string componentTree, int componentCount)> GenerateComponentCodeAsync(string analysisJson, string framework, string stylingLib)
    {
        // TODO: Replace with real Claude API call that generates code from analysis
        var componentCount = 4;

        var componentTree = "[{\"name\":\"PageLayout\",\"type\":\"div\",\"children\":[{\"name\":\"Header\",\"type\":\"header\",\"children\":[{\"name\":\"Title\",\"type\":\"h1\"},{\"name\":\"Subtitle\",\"type\":\"p\"}]},{\"name\":\"CardGrid\",\"type\":\"main\",\"children\":[{\"name\":\"Card\",\"type\":\"div\",\"children\":[{\"name\":\"CardImage\",\"type\":\"img\"},{\"name\":\"CardTitle\",\"type\":\"h3\"},{\"name\":\"CardDescription\",\"type\":\"p\"},{\"name\":\"CardAction\",\"type\":\"button\"}]}]},{\"name\":\"Footer\",\"type\":\"footer\"}]}]";

        string code;
        if (framework == "react")
        {
            code = System.Text.Json.JsonSerializer.Serialize(new
            {
                files = new[]
                {
                    new
                    {
                        name = "PageLayout.tsx",
                        language = "tsx",
                        code = @"import React from 'react';

interface CardProps {
  image: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

function Card({ image, title, description, actionLabel, onAction }: CardProps) {
  return (
    <div className=""bg-white rounded-lg shadow-md overflow-hidden"">
      <img src={image} alt={title} className=""w-full h-48 object-cover"" />
      <div className=""p-4"">
        <h3 className=""text-lg font-semibold text-gray-900"">{title}</h3>
        <p className=""text-gray-500 mt-1 text-sm"">{description}</p>
        <button
          onClick={onAction}
          className=""mt-3 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors""
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export default function PageLayout() {
  const cards = [
    { image: '/placeholder-1.svg', title: 'Feature One', description: 'Description of the first feature.', actionLabel: 'Learn More' },
    { image: '/placeholder-2.svg', title: 'Feature Two', description: 'Description of the second feature.', actionLabel: 'Get Started' },
    { image: '/placeholder-3.svg', title: 'Feature Three', description: 'Description of the third feature.', actionLabel: 'Explore' },
  ];

  return (
    <div className=""max-w-6xl mx-auto px-6 py-8"">
      <header className=""mb-8"">
        <h1 className=""text-3xl font-bold text-gray-900"">Page Title</h1>
        <p className=""text-gray-500 mt-2"">Page description goes here</p>
      </header>

      <main className=""grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"">
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </main>

      <footer className=""mt-12 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm"">
        <div className=""flex justify-center gap-6"">
          <a href=""#"" className=""hover:text-gray-600"">About</a>
          <a href=""#"" className=""hover:text-gray-600"">Privacy</a>
          <a href=""#"" className=""hover:text-gray-600"">Terms</a>
          <a href=""#"" className=""hover:text-gray-600"">Contact</a>
        </div>
      </footer>
    </div>
  );
}"
                    },
                    new
                    {
                        name = "tokens.ts",
                        language = "ts",
                        code = @"export const colors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  background: '#FFFFFF',
  text: '#1F2937',
  muted: '#9CA3AF',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
};"
                    }
                }
            });
        }
        else
        {
            code = System.Text.Json.JsonSerializer.Serialize(new
            {
                files = new[]
                {
                    new
                    {
                        name = "PageLayout.vue",
                        language = "vue",
                        code = "<template>\n  <div class=\"max-w-6xl mx-auto px-6 py-8\">\n    <header class=\"mb-8\">\n      <h1 class=\"text-3xl font-bold text-gray-900\">Page Title</h1>\n      <p class=\"text-gray-500 mt-2\">Page description</p>\n    </header>\n    <main class=\"grid grid-cols-3 gap-6\">\n      <div v-for=\"card in cards\" :key=\"card.title\" class=\"bg-white rounded-lg shadow-md p-4\">\n        <h3 class=\"font-semibold\">{{ card.title }}</h3>\n        <p class=\"text-gray-500 text-sm\">{{ card.description }}</p>\n      </div>\n    </main>\n  </div>\n</template>"
                    }
                }
            });
        }

        return Task.FromResult((code, componentTree, componentCount));
    }

    private static string DetectContentType(string base64)
    {
        if (base64.StartsWith("/9j/")) return "image/jpeg";
        if (base64.StartsWith("iVBOR")) return "image/png";
        if (base64.StartsWith("R0lGOD")) return "image/gif";
        if (base64.StartsWith("UklGR")) return "image/webp";
        return "image/png";
    }

    private static long EstimateBase64Size(string base64)
    {
        return (long)(base64.Length * 0.75);
    }
}

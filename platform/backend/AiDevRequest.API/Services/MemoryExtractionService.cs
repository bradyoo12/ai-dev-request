using System.Text.RegularExpressions;

namespace AiDevRequest.API.Services;

/// <summary>
/// Service for extracting organizational knowledge from conversations and code.
/// Identifies key facts, patterns, and preferences for storage in organizational memory.
/// </summary>
public interface IMemoryExtractionService
{
    /// <summary>
    /// Extract memories from a conversation or text content.
    /// </summary>
    Task<List<ExtractedMemory>> ExtractMemoriesAsync(string content, string userId);

    /// <summary>
    /// Extract memories from code artifacts (e.g., generated code, architecture decisions).
    /// </summary>
    Task<List<ExtractedMemory>> ExtractFromCodeAsync(string code, string language, string userId);
}

public class ExtractedMemory
{
    public required string Content { get; set; }
    public required string Category { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public class MemoryExtractionService : IMemoryExtractionService
{
    private readonly ILogger<MemoryExtractionService> _logger;

    public MemoryExtractionService(ILogger<MemoryExtractionService> logger)
    {
        _logger = logger;
    }

    public Task<List<ExtractedMemory>> ExtractMemoriesAsync(string content, string userId)
    {
        var memories = new List<ExtractedMemory>();

        // Extract tech stack preferences
        memories.AddRange(ExtractTechStackMemories(content));

        // Extract design patterns
        memories.AddRange(ExtractDesignPatternMemories(content));

        // Extract architectural decisions
        memories.AddRange(ExtractArchitecturalMemories(content));

        _logger.LogInformation("Extracted {Count} memories for user {UserId}", memories.Count, userId);
        return Task.FromResult(memories);
    }

    public Task<List<ExtractedMemory>> ExtractFromCodeAsync(string code, string language, string userId)
    {
        var memories = new List<ExtractedMemory>();

        // Extract framework usage
        memories.AddRange(ExtractFrameworkUsage(code, language));

        // Extract coding patterns
        memories.AddRange(ExtractCodingPatterns(code, language));

        _logger.LogInformation("Extracted {Count} code memories for user {UserId}", memories.Count, userId);
        return Task.FromResult(memories);
    }

    private static List<ExtractedMemory> ExtractTechStackMemories(string content)
    {
        var memories = new List<ExtractedMemory>();
        var lowerContent = content.ToLower();

        var techStackPatterns = new Dictionary<string, string>
        {
            ["react"] = "Uses React for frontend development",
            ["vue.js"] = "Uses Vue.js for frontend development",
            ["angular"] = "Uses Angular for frontend development",
            ["next.js"] = "Prefers Next.js framework",
            [".net"] = "Uses .NET for backend development",
            ["node.js"] = "Uses Node.js for backend",
            ["python"] = "Uses Python for backend",
            ["postgresql"] = "Uses PostgreSQL database",
            ["mongodb"] = "Uses MongoDB database",
            ["redis"] = "Uses Redis for caching",
            ["docker"] = "Uses Docker for containerization",
            ["kubernetes"] = "Uses Kubernetes for orchestration",
            ["tailwind"] = "Uses Tailwind CSS for styling",
            ["typescript"] = "Prefers TypeScript over JavaScript"
        };

        foreach (var (pattern, memory) in techStackPatterns)
        {
            if (lowerContent.Contains(pattern))
            {
                memories.Add(new ExtractedMemory
                {
                    Content = memory,
                    Category = "tech_stack",
                    Metadata = new Dictionary<string, object> { ["technology"] = pattern }
                });
            }
        }

        return memories.Take(5).ToList(); // Limit to avoid excessive extraction
    }

    private static List<ExtractedMemory> ExtractDesignPatternMemories(string content)
    {
        var memories = new List<ExtractedMemory>();
        var lowerContent = content.ToLower();

        var patterns = new Dictionary<string, string>
        {
            ["repository pattern"] = "Uses Repository pattern for data access",
            ["dependency injection"] = "Uses Dependency Injection pattern",
            ["singleton"] = "Uses Singleton pattern",
            ["factory"] = "Uses Factory pattern",
            ["observer"] = "Uses Observer pattern",
            ["mvc"] = "Follows MVC architecture",
            ["mvvm"] = "Follows MVVM architecture",
            ["clean architecture"] = "Follows Clean Architecture principles",
            ["microservices"] = "Uses Microservices architecture"
        };

        foreach (var (pattern, memory) in patterns)
        {
            if (lowerContent.Contains(pattern))
            {
                memories.Add(new ExtractedMemory
                {
                    Content = memory,
                    Category = "design_pattern",
                    Metadata = new Dictionary<string, object> { ["pattern"] = pattern }
                });
            }
        }

        return memories;
    }

    private static List<ExtractedMemory> ExtractArchitecturalMemories(string content)
    {
        var memories = new List<ExtractedMemory>();
        var lowerContent = content.ToLower();

        if (lowerContent.Contains("restful api") || lowerContent.Contains("rest api"))
        {
            memories.Add(new ExtractedMemory
            {
                Content = "Prefers RESTful API design",
                Category = "architecture",
                Metadata = new Dictionary<string, object> { ["api_style"] = "REST" }
            });
        }

        if (lowerContent.Contains("graphql"))
        {
            memories.Add(new ExtractedMemory
            {
                Content = "Uses GraphQL for API layer",
                Category = "architecture",
                Metadata = new Dictionary<string, object> { ["api_style"] = "GraphQL" }
            });
        }

        if (lowerContent.Contains("event-driven") || lowerContent.Contains("event driven"))
        {
            memories.Add(new ExtractedMemory
            {
                Content = "Uses event-driven architecture",
                Category = "architecture",
                Metadata = new Dictionary<string, object> { ["style"] = "event-driven" }
            });
        }

        return memories;
    }

    private static List<ExtractedMemory> ExtractFrameworkUsage(string code, string language)
    {
        var memories = new List<ExtractedMemory>();

        // Simple regex-based framework detection
        if (language.ToLower() == "typescript" || language.ToLower() == "javascript")
        {
            if (Regex.IsMatch(code, @"import.*from\s+['""]react['""]", RegexOptions.IgnoreCase))
            {
                memories.Add(new ExtractedMemory
                {
                    Content = "Uses React in codebase",
                    Category = "framework",
                    Metadata = new Dictionary<string, object> { ["language"] = language, ["framework"] = "React" }
                });
            }

            if (code.Contains("express()", StringComparison.OrdinalIgnoreCase))
            {
                memories.Add(new ExtractedMemory
                {
                    Content = "Uses Express.js for backend",
                    Category = "framework",
                    Metadata = new Dictionary<string, object> { ["language"] = language, ["framework"] = "Express.js" }
                });
            }
        }

        if (language.ToLower() == "csharp" || language.ToLower() == "c#")
        {
            if (code.Contains("WebApplication.CreateBuilder", StringComparison.OrdinalIgnoreCase))
            {
                memories.Add(new ExtractedMemory
                {
                    Content = "Uses ASP.NET Core minimal APIs",
                    Category = "framework",
                    Metadata = new Dictionary<string, object> { ["language"] = "C#", ["framework"] = "ASP.NET Core" }
                });
            }
        }

        return memories;
    }

    private static List<ExtractedMemory> ExtractCodingPatterns(string code, string language)
    {
        var memories = new List<ExtractedMemory>();

        // Detect async/await usage
        if (code.Contains("async ", StringComparison.OrdinalIgnoreCase) &&
            code.Contains("await ", StringComparison.OrdinalIgnoreCase))
        {
            memories.Add(new ExtractedMemory
            {
                Content = "Uses async/await pattern consistently",
                Category = "coding_style",
                Metadata = new Dictionary<string, object> { ["pattern"] = "async/await" }
            });
        }

        // Detect error handling patterns
        if (code.Contains("try", StringComparison.OrdinalIgnoreCase) &&
            code.Contains("catch", StringComparison.OrdinalIgnoreCase))
        {
            memories.Add(new ExtractedMemory
            {
                Content = "Uses try-catch for error handling",
                Category = "coding_style",
                Metadata = new Dictionary<string, object> { ["pattern"] = "try-catch" }
            });
        }

        return memories;
    }
}

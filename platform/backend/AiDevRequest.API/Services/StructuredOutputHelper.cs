using System.Text.Json;
using System.Text.RegularExpressions;

namespace AiDevRequest.API.Services;

/// <summary>
/// Centralized helper for extracting and deserializing structured JSON from Claude API responses.
/// Ensures consistent, reliable JSON parsing across all AI services.
/// </summary>
public static class StructuredOutputHelper
{
    private static readonly JsonSerializerOptions DefaultOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    /// <summary>
    /// Appends a JSON-only instruction to the system prompt to improve response reliability.
    /// </summary>
    public static string AppendJsonInstruction(string systemPrompt)
    {
        return systemPrompt + @"

IMPORTANT: Your response must be ONLY valid JSON — no markdown, no explanatory text, no code fences.
Do not wrap the JSON in ```json``` blocks. Output raw JSON only.";
    }

    /// <summary>
    /// Extracts and deserializes a JSON object from a Claude API response string.
    /// Handles common patterns: pure JSON, JSON wrapped in text, JSON in code blocks.
    /// </summary>
    public static T? DeserializeResponse<T>(string content) where T : class
    {
        if (string.IsNullOrWhiteSpace(content))
            return null;

        var json = ExtractJson(content);
        if (string.IsNullOrEmpty(json))
            return null;

        return JsonSerializer.Deserialize<T>(json, DefaultOptions);
    }

    /// <summary>
    /// Extracts and deserializes a JSON array from a Claude API response string.
    /// </summary>
    public static List<T>? DeserializeListResponse<T>(string content) where T : class
    {
        if (string.IsNullOrWhiteSpace(content))
            return null;

        var json = ExtractJson(content, expectArray: true);
        if (string.IsNullOrEmpty(json))
            return null;

        return JsonSerializer.Deserialize<List<T>>(json, DefaultOptions);
    }

    /// <summary>
    /// Extracts JSON from a string that may contain surrounding text or markdown code fences.
    /// </summary>
    internal static string ExtractJson(string content, bool expectArray = false)
    {
        content = content.Trim();

        // Try to extract from markdown code fences first
        var fenceMatch = Regex.Match(content, @"```(?:json)?\s*\n?([\s\S]*?)```", RegexOptions.Multiline);
        if (fenceMatch.Success)
        {
            content = fenceMatch.Groups[1].Value.Trim();
        }

        if (expectArray)
        {
            // Look for JSON array
            var arrayStart = content.IndexOf('[');
            var arrayEnd = content.LastIndexOf(']');
            if (arrayStart >= 0 && arrayEnd > arrayStart)
            {
                return content[arrayStart..(arrayEnd + 1)];
            }
        }

        // Look for JSON object
        var jsonStart = content.IndexOf('{');
        var jsonEnd = content.LastIndexOf('}');
        if (jsonStart >= 0 && jsonEnd > jsonStart)
        {
            return content[jsonStart..(jsonEnd + 1)];
        }

        // If expecting array and found no object, try array again on original
        if (expectArray)
        {
            var arrStart = content.IndexOf('[');
            var arrEnd = content.LastIndexOf(']');
            if (arrStart >= 0 && arrEnd > arrStart)
            {
                return content[arrStart..(arrEnd + 1)];
            }
        }

        return content;
    }
}

using System.Security.Claims;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ApiDocsController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<ApiDocsController> _logger;

    public ApiDocsController(AiDevRequestDbContext context, ILogger<ApiDocsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// List all API doc configs for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ApiDocConfigDto>>> ListApiDocs()
    {
        var userId = GetUserId();
        var entities = await _context.ApiDocConfigs
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.UpdatedAt)
            .ToListAsync();

        var docs = entities.Select(d => ToDto(d)).ToList();
        return Ok(docs);
    }

    /// <summary>
    /// Get a single API doc config by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiDocConfigDto>> GetApiDoc(Guid id)
    {
        var userId = GetUserId();
        var doc = await _context.ApiDocConfigs
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

        if (doc == null)
            return NotFound(new { error = "API documentation config not found." });

        return Ok(ToDto(doc));
    }

    /// <summary>
    /// Create a new API doc config
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiDocConfigDto>> CreateApiDoc([FromBody] CreateApiDocRequestDto request)
    {
        var userId = GetUserId();

        var count = await _context.ApiDocConfigs.CountAsync(d => d.UserId == userId);
        if (count >= 50)
            return BadRequest(new { error = "Maximum of 50 API doc configs per user." });

        if (request.Endpoints == null || request.Endpoints.Count == 0)
            return BadRequest(new { error = "At least one API endpoint is required." });

        var doc = new ApiDocConfig
        {
            UserId = userId,
            ProjectName = string.IsNullOrWhiteSpace(request.ProjectName) ? "Untitled API" : request.ProjectName.Trim(),
            Description = request.Description?.Trim(),
            EndpointsJson = JsonSerializer.Serialize(request.Endpoints),
            SdkLanguages = request.SdkLanguages != null ? string.Join(",", request.SdkLanguages) : null,
            DevRequestId = request.DevRequestId,
            Status = ApiDocStatus.Draft,
        };

        _context.ApiDocConfigs.Add(doc);
        await _context.SaveChangesAsync();

        _logger.LogInformation("API doc config created for user {UserId}: {DocId}", userId, doc.Id);

        return Ok(ToDto(doc));
    }

    /// <summary>
    /// Update an existing API doc config
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiDocConfigDto>> UpdateApiDoc(Guid id, [FromBody] UpdateApiDocRequestDto request)
    {
        var userId = GetUserId();
        var doc = await _context.ApiDocConfigs
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

        if (doc == null)
            return NotFound(new { error = "API documentation config not found." });

        if (request.ProjectName != null)
            doc.ProjectName = request.ProjectName.Trim();

        if (request.Description != null)
            doc.Description = request.Description.Trim();

        if (request.Endpoints != null && request.Endpoints.Count > 0)
            doc.EndpointsJson = JsonSerializer.Serialize(request.Endpoints);

        if (request.SdkLanguages != null)
            doc.SdkLanguages = string.Join(",", request.SdkLanguages);

        doc.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ToDto(doc));
    }

    /// <summary>
    /// Delete an API doc config
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteApiDoc(Guid id)
    {
        var userId = GetUserId();
        var doc = await _context.ApiDocConfigs
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

        if (doc == null)
            return NotFound(new { error = "API documentation config not found." });

        _context.ApiDocConfigs.Remove(doc);
        await _context.SaveChangesAsync();

        _logger.LogInformation("API doc config deleted for user {UserId}: {DocId}", userId, id);

        return Ok(new { message = "API documentation config deleted." });
    }

    /// <summary>
    /// Generate OpenAPI spec from the stored endpoints
    /// </summary>
    [HttpPost("{id:guid}/generate")]
    public async Task<ActionResult<ApiDocConfigDto>> GenerateSpec(Guid id)
    {
        var userId = GetUserId();
        var doc = await _context.ApiDocConfigs
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

        if (doc == null)
            return NotFound(new { error = "API documentation config not found." });

        var endpoints = JsonSerializer.Deserialize<List<ApiEndpointDto>>(doc.EndpointsJson) ?? new();

        var openApiSpec = BuildOpenApiSpec(doc.ProjectName, doc.Description, endpoints);
        doc.OpenApiSpecJson = JsonSerializer.Serialize(openApiSpec);
        doc.Status = ApiDocStatus.Generated;
        doc.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("OpenAPI spec generated for user {UserId}: {DocId}", userId, doc.Id);

        return Ok(ToDto(doc));
    }

    /// <summary>
    /// Get the available SDK languages
    /// </summary>
    [HttpGet("sdk-languages")]
    public ActionResult<List<SdkLanguageDto>> GetSdkLanguages()
    {
        var languages = new List<SdkLanguageDto>
        {
            new() { Id = "typescript", Name = "TypeScript", FileExtension = ".ts", PackageManager = "npm" },
            new() { Id = "python", Name = "Python", FileExtension = ".py", PackageManager = "pip" },
            new() { Id = "csharp", Name = "C#", FileExtension = ".cs", PackageManager = "NuGet" },
            new() { Id = "go", Name = "Go", FileExtension = ".go", PackageManager = "go mod" },
            new() { Id = "java", Name = "Java", FileExtension = ".java", PackageManager = "Maven" },
            new() { Id = "kotlin", Name = "Kotlin", FileExtension = ".kt", PackageManager = "Gradle" },
        };
        return Ok(languages);
    }

    private static object BuildOpenApiSpec(string title, string? description, List<ApiEndpointDto> endpoints)
    {
        var paths = new Dictionary<string, object>();
        foreach (var ep in endpoints)
        {
            var method = (ep.Method ?? "GET").ToLowerInvariant();
            var operation = new Dictionary<string, object>
            {
                ["summary"] = ep.Summary ?? ep.Name ?? "",
                ["operationId"] = ep.Name ?? "",
                ["tags"] = new[] { ep.Tag ?? "default" },
                ["responses"] = new Dictionary<string, object>
                {
                    ["200"] = new Dictionary<string, object>
                    {
                        ["description"] = "Successful response",
                    },
                },
            };

            if (ep.RequestBody != null)
            {
                operation["requestBody"] = new Dictionary<string, object>
                {
                    ["required"] = true,
                    ["content"] = new Dictionary<string, object>
                    {
                        ["application/json"] = new Dictionary<string, object>
                        {
                            ["schema"] = new Dictionary<string, string>
                            {
                                ["type"] = "object",
                            },
                        },
                    },
                };
            }

            var path = ep.Path ?? "/";
            if (!paths.ContainsKey(path))
                paths[path] = new Dictionary<string, object>();

            ((Dictionary<string, object>)paths[path])[method] = operation;
        }

        return new
        {
            openapi = "3.1.0",
            info = new
            {
                title = title,
                description = description ?? "",
                version = "1.0.0",
            },
            paths,
        };
    }

    private static ApiDocConfigDto ToDto(ApiDocConfig d) => new()
    {
        Id = d.Id,
        ProjectName = d.ProjectName,
        Description = d.Description,
        Endpoints = JsonSerializer.Deserialize<List<ApiEndpointDto>>(d.EndpointsJson) ?? new(),
        HasOpenApiSpec = d.OpenApiSpecJson != null,
        OpenApiSpecJson = d.OpenApiSpecJson,
        SdkLanguages = d.SdkLanguages?.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList() ?? new(),
        Status = d.Status.ToString(),
        DevRequestId = d.DevRequestId,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt,
    };
}

public class ApiEndpointDto
{
    public string? Name { get; set; }
    public string? Path { get; set; }
    public string? Method { get; set; }
    public string? Summary { get; set; }
    public string? Tag { get; set; }
    public string? RequestBody { get; set; }
    public string? ResponseType { get; set; }
}

public class ApiDocConfigDto
{
    public Guid Id { get; set; }
    public string ProjectName { get; set; } = "";
    public string? Description { get; set; }
    public List<ApiEndpointDto> Endpoints { get; set; } = new();
    public bool HasOpenApiSpec { get; set; }
    public string? OpenApiSpecJson { get; set; }
    public List<string> SdkLanguages { get; set; } = new();
    public string Status { get; set; } = "";
    public Guid? DevRequestId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SdkLanguageDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string FileExtension { get; set; } = "";
    public string PackageManager { get; set; } = "";
}

public class CreateApiDocRequestDto
{
    public string? ProjectName { get; set; }
    public string? Description { get; set; }
    public List<ApiEndpointDto> Endpoints { get; set; } = new();
    public List<string>? SdkLanguages { get; set; }
    public Guid? DevRequestId { get; set; }
}

public class UpdateApiDocRequestDto
{
    public string? ProjectName { get; set; }
    public string? Description { get; set; }
    public List<ApiEndpointDto>? Endpoints { get; set; }
    public List<string>? SdkLanguages { get; set; }
}

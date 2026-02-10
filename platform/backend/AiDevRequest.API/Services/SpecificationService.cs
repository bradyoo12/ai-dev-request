using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISpecificationService
{
    Task<DevelopmentSpec> GenerateRequirementsSpecAsync(int devRequestId);
    Task<DevelopmentSpec> GenerateDesignSpecAsync(int devRequestId);
    Task<DevelopmentSpec> GenerateImplementationSpecAsync(int devRequestId);
    Task<DevelopmentSpec> ApproveSpecAsync(Guid specId);
    Task<DevelopmentSpec> RejectSpecAsync(Guid specId, string feedback);
    Task<DevelopmentSpec?> GetSpecAsync(int devRequestId);
    Task<List<DevelopmentSpec>> GetSpecHistoryAsync(int devRequestId);
    Task<DevelopmentSpec> UpdateSpecAsync(Guid specId, DevelopmentSpecUpdateDto update);
}

public class DevelopmentSpecUpdateDto
{
    public string? UserStories { get; set; }
    public string? AcceptanceCriteria { get; set; }
    public string? EdgeCases { get; set; }
    public string? ArchitectureDecisions { get; set; }
    public string? ApiContracts { get; set; }
    public string? DataModels { get; set; }
    public string? ComponentBreakdown { get; set; }
    public string? TaskList { get; set; }
    public string? DependencyOrder { get; set; }
    public string? EstimatedFiles { get; set; }
    public string? TraceabilityLinks { get; set; }
}

public class SpecificationService : ISpecificationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SpecificationService> _logger;

    public SpecificationService(AiDevRequestDbContext context, ILogger<SpecificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DevelopmentSpec> GenerateRequirementsSpecAsync(int devRequestId)
    {
        var devRequest = await _context.DevRequests.FindAsync(devRequestId)
            ?? throw new InvalidOperationException("Dev request not found.");

        // Check if there's already a spec in review/approved for this phase
        var existingSpec = await _context.DevelopmentSpecs
            .Where(s => s.DevRequestId == devRequestId && s.Phase == "requirements")
            .OrderByDescending(s => s.Version)
            .FirstOrDefaultAsync();

        var version = (existingSpec?.Version ?? 0) + 1;

        // Generate requirements based on the dev request description
        var userStories = JsonSerializer.Serialize(new[]
        {
            new { id = "US-1", title = $"Core functionality for: {Truncate(devRequest.Description, 80)}", role = "user", action = "use the requested feature", benefit = "achieve the described goal" },
            new { id = "US-2", title = "Error handling and validation", role = "user", action = "receive clear feedback on invalid inputs", benefit = "understand how to correct mistakes" },
            new { id = "US-3", title = "Responsive design", role = "user", action = "access the feature on any device", benefit = "have a consistent experience" }
        });

        var acceptanceCriteria = JsonSerializer.Serialize(new[]
        {
            new { id = "AC-1", storyId = "US-1", criteria = "Feature implements the core described functionality" },
            new { id = "AC-2", storyId = "US-1", criteria = "Feature is accessible from the main navigation" },
            new { id = "AC-3", storyId = "US-2", criteria = "All form inputs have proper validation messages" },
            new { id = "AC-4", storyId = "US-3", criteria = "UI works on mobile, tablet, and desktop viewports" }
        });

        var edgeCases = JsonSerializer.Serialize(new[]
        {
            new { id = "EC-1", description = "Empty state: no data available yet", mitigation = "Show helpful empty state message" },
            new { id = "EC-2", description = "Network failure during data load", mitigation = "Show error with retry option" },
            new { id = "EC-3", description = "Concurrent modifications by multiple users", mitigation = "Implement optimistic locking" }
        });

        var spec = new DevelopmentSpec
        {
            DevRequestId = devRequestId,
            Phase = "requirements",
            Status = "review",
            UserStories = userStories,
            AcceptanceCriteria = acceptanceCriteria,
            EdgeCases = edgeCases,
            Version = version,
        };

        _context.DevelopmentSpecs.Add(spec);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Requirements spec generated for request {RequestId}, version {Version}",
            devRequestId, version);

        return spec;
    }

    public async Task<DevelopmentSpec> GenerateDesignSpecAsync(int devRequestId)
    {
        var devRequest = await _context.DevRequests.FindAsync(devRequestId)
            ?? throw new InvalidOperationException("Dev request not found.");

        var existingSpec = await _context.DevelopmentSpecs
            .Where(s => s.DevRequestId == devRequestId && s.Phase == "design")
            .OrderByDescending(s => s.Version)
            .FirstOrDefaultAsync();

        var version = (existingSpec?.Version ?? 0) + 1;

        var architectureDecisions = JsonSerializer.Serialize(new[]
        {
            new { id = "ADR-1", title = "Frontend framework", decision = "React with TypeScript", rationale = "Consistent with existing platform stack" },
            new { id = "ADR-2", title = "State management", decision = "Zustand", rationale = "Lightweight and already used in the project" },
            new { id = "ADR-3", title = "API pattern", decision = "REST with JSON", rationale = "Matches existing API contracts" }
        });

        var apiContracts = JsonSerializer.Serialize(new[]
        {
            new { method = "GET", path = "/api/resource", description = "List resources", requestBody = (string?)null, responseType = "Resource[]" },
            new { method = "POST", path = "/api/resource", description = "Create resource", requestBody = "CreateResourceDto", responseType = "Resource" },
            new { method = "PUT", path = "/api/resource/{id}", description = "Update resource", requestBody = "UpdateResourceDto", responseType = "Resource" }
        });

        var dataModels = JsonSerializer.Serialize(new[]
        {
            new { name = "Resource", fields = new[] { "id: int", "name: string", "description: string", "createdAt: DateTime" } }
        });

        var componentBreakdown = JsonSerializer.Serialize(new[]
        {
            new { name = "ResourcePage", type = "page", description = "Main page component", children = new[] { "ResourceList", "ResourceForm" } },
            new { name = "ResourceList", type = "component", description = "Displays list of resources", children = Array.Empty<string>() },
            new { name = "ResourceForm", type = "component", description = "Create/edit resource form", children = Array.Empty<string>() }
        });

        var spec = new DevelopmentSpec
        {
            DevRequestId = devRequestId,
            Phase = "design",
            Status = "review",
            ArchitectureDecisions = architectureDecisions,
            ApiContracts = apiContracts,
            DataModels = dataModels,
            ComponentBreakdown = componentBreakdown,
            Version = version,
        };

        _context.DevelopmentSpecs.Add(spec);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Design spec generated for request {RequestId}, version {Version}",
            devRequestId, version);

        return spec;
    }

    public async Task<DevelopmentSpec> GenerateImplementationSpecAsync(int devRequestId)
    {
        var devRequest = await _context.DevRequests.FindAsync(devRequestId)
            ?? throw new InvalidOperationException("Dev request not found.");

        var existingSpec = await _context.DevelopmentSpecs
            .Where(s => s.DevRequestId == devRequestId && s.Phase == "implementation")
            .OrderByDescending(s => s.Version)
            .FirstOrDefaultAsync();

        var version = (existingSpec?.Version ?? 0) + 1;

        var taskList = JsonSerializer.Serialize(new[]
        {
            new { id = "T-1", file = "src/entities/Resource.cs", action = "create", description = "Define entity model", estimatedLines = 30 },
            new { id = "T-2", file = "src/services/ResourceService.cs", action = "create", description = "Implement business logic", estimatedLines = 100 },
            new { id = "T-3", file = "src/controllers/ResourceController.cs", action = "create", description = "Define API endpoints", estimatedLines = 80 },
            new { id = "T-4", file = "src/api/resources.ts", action = "create", description = "Frontend API client", estimatedLines = 60 },
            new { id = "T-5", file = "src/pages/ResourcePage.tsx", action = "create", description = "Page component", estimatedLines = 200 }
        });

        var dependencyOrder = JsonSerializer.Serialize(new[] { "T-1", "T-2", "T-3", "T-4", "T-5" });

        var estimatedFiles = JsonSerializer.Serialize(new[]
        {
            "src/entities/Resource.cs",
            "src/services/ResourceService.cs",
            "src/controllers/ResourceController.cs",
            "src/api/resources.ts",
            "src/pages/ResourcePage.tsx"
        });

        var traceabilityLinks = JsonSerializer.Serialize(new Dictionary<string, string[]>
        {
            ["T-1"] = new[] { "US-1", "AC-1" },
            ["T-2"] = new[] { "US-1", "US-2", "AC-1", "AC-3" },
            ["T-3"] = new[] { "US-1", "AC-2" },
            ["T-4"] = new[] { "US-1", "US-3" },
            ["T-5"] = new[] { "US-1", "US-3", "AC-4" }
        });

        var spec = new DevelopmentSpec
        {
            DevRequestId = devRequestId,
            Phase = "implementation",
            Status = "review",
            TaskList = taskList,
            DependencyOrder = dependencyOrder,
            EstimatedFiles = estimatedFiles,
            TraceabilityLinks = traceabilityLinks,
            Version = version,
        };

        _context.DevelopmentSpecs.Add(spec);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Implementation spec generated for request {RequestId}, version {Version}",
            devRequestId, version);

        return spec;
    }

    public async Task<DevelopmentSpec> ApproveSpecAsync(Guid specId)
    {
        var spec = await _context.DevelopmentSpecs.FindAsync(specId)
            ?? throw new InvalidOperationException("Specification not found.");

        if (spec.Status == "approved")
            throw new InvalidOperationException("Specification is already approved.");

        spec.Status = "approved";
        spec.ApprovedAt = DateTime.UtcNow;
        spec.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Spec {SpecId} approved for request {RequestId}",
            specId, spec.DevRequestId);

        return spec;
    }

    public async Task<DevelopmentSpec> RejectSpecAsync(Guid specId, string feedback)
    {
        var spec = await _context.DevelopmentSpecs.FindAsync(specId)
            ?? throw new InvalidOperationException("Specification not found.");

        if (spec.Status == "approved")
            throw new InvalidOperationException("Cannot reject an already approved specification.");

        spec.Status = "rejected";
        spec.RejectionFeedback = feedback;
        spec.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Spec {SpecId} rejected for request {RequestId} with feedback",
            specId, spec.DevRequestId);

        return spec;
    }

    public async Task<DevelopmentSpec?> GetSpecAsync(int devRequestId)
    {
        return await _context.DevelopmentSpecs
            .Where(s => s.DevRequestId == devRequestId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<DevelopmentSpec>> GetSpecHistoryAsync(int devRequestId)
    {
        return await _context.DevelopmentSpecs
            .Where(s => s.DevRequestId == devRequestId)
            .OrderByDescending(s => s.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task<DevelopmentSpec> UpdateSpecAsync(Guid specId, DevelopmentSpecUpdateDto update)
    {
        var spec = await _context.DevelopmentSpecs.FindAsync(specId)
            ?? throw new InvalidOperationException("Specification not found.");

        if (spec.Status == "approved")
            throw new InvalidOperationException("Cannot edit an approved specification.");

        // Update only non-null fields
        if (update.UserStories != null) spec.UserStories = update.UserStories;
        if (update.AcceptanceCriteria != null) spec.AcceptanceCriteria = update.AcceptanceCriteria;
        if (update.EdgeCases != null) spec.EdgeCases = update.EdgeCases;
        if (update.ArchitectureDecisions != null) spec.ArchitectureDecisions = update.ArchitectureDecisions;
        if (update.ApiContracts != null) spec.ApiContracts = update.ApiContracts;
        if (update.DataModels != null) spec.DataModels = update.DataModels;
        if (update.ComponentBreakdown != null) spec.ComponentBreakdown = update.ComponentBreakdown;
        if (update.TaskList != null) spec.TaskList = update.TaskList;
        if (update.DependencyOrder != null) spec.DependencyOrder = update.DependencyOrder;
        if (update.EstimatedFiles != null) spec.EstimatedFiles = update.EstimatedFiles;
        if (update.TraceabilityLinks != null) spec.TraceabilityLinks = update.TraceabilityLinks;

        spec.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Spec {SpecId} updated for request {RequestId}",
            specId, spec.DevRequestId);

        return spec;
    }

    private static string Truncate(string value, int maxLength)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return value.Length <= maxLength ? value : value[..maxLength] + "...";
    }
}

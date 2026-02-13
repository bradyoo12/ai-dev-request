using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IIterationService
{
    Task<IterationResult> IterateAsync(Guid devRequestId, string message, string userId);
}

public class IterationResult
{
    public string AssistantMessage { get; set; } = "";
    public List<string> ChangedFiles { get; set; } = new();
    public int TotalChanges { get; set; }
    public int TokensUsed { get; set; }
}

public class IterationService : IIterationService
{
    private readonly IRefinementService _refinementService;
    private readonly IProjectVersionService _versionService;
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<IterationService> _logger;

    public IterationService(
        IRefinementService refinementService,
        IProjectVersionService versionService,
        AiDevRequestDbContext db,
        ILogger<IterationService> logger)
    {
        _refinementService = refinementService;
        _versionService = versionService;
        _db = db;
        _logger = logger;
    }

    public async Task<IterationResult> IterateAsync(Guid devRequestId, string message, string userId)
    {
        _logger.LogInformation("Starting iteration for DevRequest {RequestId}", devRequestId);

        // Load DevRequest with validation
        var devRequest = await _db.DevRequests.FindAsync(devRequestId)
            ?? throw new KeyNotFoundException($"DevRequest {devRequestId} not found");

        if (devRequest.UserId != userId)
            throw new UnauthorizedAccessException("User does not own this DevRequest");

        // Create snapshot BEFORE applying changes (for undo functionality)
        if (!string.IsNullOrEmpty(devRequest.ProjectPath) && Directory.Exists(devRequest.ProjectPath))
        {
            try
            {
                await _versionService.CreateSnapshotAsync(
                    devRequestId,
                    devRequest.ProjectPath,
                    "Pre-iteration snapshot",
                    "iteration");

                _logger.LogInformation("Created snapshot before iteration for DevRequest {RequestId}", devRequestId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create snapshot before iteration for DevRequest {RequestId}", devRequestId);
                // Continue with iteration even if snapshot fails
            }
        }

        // Send message to Claude via RefinementService
        var assistantMessage = await _refinementService.SendMessageAsync(devRequestId, message);

        // Parse and apply file changes from the assistant's response
        var applyResult = await _refinementService.ApplyChangesAsync(devRequestId, assistantMessage.Content);

        _logger.LogInformation(
            "Iteration complete for DevRequest {RequestId}: {TotalChanges} file(s) changed",
            devRequestId,
            applyResult.TotalChanges);

        return new IterationResult
        {
            AssistantMessage = assistantMessage.Content,
            ChangedFiles = applyResult.ModifiedFiles.Concat(applyResult.CreatedFiles).ToList(),
            TotalChanges = applyResult.TotalChanges,
            TokensUsed = assistantMessage.TokensUsed ?? 0
        };
    }
}

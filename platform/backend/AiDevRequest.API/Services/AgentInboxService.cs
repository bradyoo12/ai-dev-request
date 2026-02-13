using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IAgentInboxService
{
    Task<string> AnalyzeFeedbackAsync(AgentInboxItem item);
    Task<Guid?> CreateDevRequestFromFeedbackAsync(AgentInboxItem item, string userId);
}

public class AgentInboxService : IAgentInboxService
{
    private readonly AiDevRequestDbContext _db;

    public AgentInboxService(AiDevRequestDbContext db) => _db = db;

    /// <summary>
    /// Analyze feedback content and return a simple summary (v1 — no AI call yet).
    /// </summary>
    public Task<string> AnalyzeFeedbackAsync(AgentInboxItem item)
    {
        var analysis = $"Feedback type: {item.Type}. " +
                       $"Title: {item.Title ?? "(none)"}. " +
                       $"Content length: {item.Content.Length} chars. " +
                       $"Source: {item.Source}.";
        return Task.FromResult(analysis);
    }

    /// <summary>
    /// Convert an inbox feedback item into a new DevRequest for implementation.
    /// </summary>
    public async Task<Guid?> CreateDevRequestFromFeedbackAsync(AgentInboxItem item, string userId)
    {
        var description = $"[Agent Inbox #{item.Id}] {item.Title ?? "Feedback"}\n\n{item.Content}";

        var devRequest = new DevRequest
        {
            UserId = userId,
            Description = description,
            ContactEmail = item.SubmitterEmail
        };

        _db.DevRequests.Add(devRequest);

        item.TriggeredDevRequestId = devRequest.Id;
        item.Status = "in_progress";
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return devRequest.Id;
    }
}

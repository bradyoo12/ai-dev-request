using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ICollaborativeEditingService
{
    Task<CollaborativeSession> CreateSessionAsync(int projectId, string sessionName, string createdBy);
    Task<CollaborativeSession?> GetActiveSessionAsync(int projectId);
    Task<CollaborativeSession> JoinSessionAsync(int projectId, string userId, string displayName);
    Task<CollaborativeSession> UpdateDocumentAsync(int projectId, string userId, string content);
    Task<CollaborativeSession> EndSessionAsync(int projectId);
    Task<List<CollaborativeSession>> GetSessionHistoryAsync(int projectId);
}

public class CollaborativeEditingService : ICollaborativeEditingService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<CollaborativeEditingService> _logger;

    private static readonly string[] ParticipantColors =
    {
        "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
        "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1"
    };

    public CollaborativeEditingService(
        AiDevRequestDbContext context,
        ILogger<CollaborativeEditingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CollaborativeSession> CreateSessionAsync(int projectId, string sessionName, string createdBy)
    {
        // End any existing active session
        var existing = await _context.CollaborativeSessions
            .Where(s => s.ProjectId == projectId && s.Status == "active")
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            existing.Status = "ended";
            existing.EndedAt = DateTime.UtcNow;
        }

        var session = new CollaborativeSession
        {
            ProjectId = projectId,
            SessionName = string.IsNullOrEmpty(sessionName) ? $"Session {DateTime.UtcNow:MMdd-HHmm}" : sessionName,
            CreatedBy = createdBy,
            Status = "active",
        };

        // Add creator as first participant
        var participant = new ParticipantInfo
        {
            UserId = createdBy,
            DisplayName = createdBy,
            Color = ParticipantColors[0],
            JoinedAt = DateTime.UtcNow.ToString("o")
        };
        session.ParticipantsJson = JsonSerializer.Serialize(new[] { participant });
        session.ParticipantCount = 1;

        // Initial activity
        var activity = new ActivityInfo
        {
            UserId = createdBy,
            DisplayName = createdBy,
            Action = "created",
            Detail = "Created collaborative session",
            Timestamp = DateTime.UtcNow.ToString("o")
        };
        session.ActivityFeedJson = JsonSerializer.Serialize(new[] { activity });

        _context.CollaborativeSessions.Add(session);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created collaborative session {SessionId} for project {ProjectId}", session.Id, projectId);

        return session;
    }

    public async Task<CollaborativeSession?> GetActiveSessionAsync(int projectId)
    {
        return await _context.CollaborativeSessions
            .Where(s => s.ProjectId == projectId && s.Status == "active")
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<CollaborativeSession> JoinSessionAsync(int projectId, string userId, string displayName)
    {
        var session = await _context.CollaborativeSessions
            .Where(s => s.ProjectId == projectId && s.Status == "active")
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No active session found for this project.");

        var participants = DeserializeList<ParticipantInfo>(session.ParticipantsJson);

        if (participants.All(p => p.UserId != userId))
        {
            var colorIdx = participants.Count % ParticipantColors.Length;
            participants.Add(new ParticipantInfo
            {
                UserId = userId,
                DisplayName = displayName,
                Color = ParticipantColors[colorIdx],
                JoinedAt = DateTime.UtcNow.ToString("o")
            });
            session.ParticipantsJson = JsonSerializer.Serialize(participants);
            session.ParticipantCount = participants.Count;
        }

        var activities = DeserializeList<ActivityInfo>(session.ActivityFeedJson);
        activities.Add(new ActivityInfo
        {
            UserId = userId,
            DisplayName = displayName,
            Action = "joined",
            Detail = $"{displayName} joined the session",
            Timestamp = DateTime.UtcNow.ToString("o")
        });
        session.ActivityFeedJson = JsonSerializer.Serialize(activities);
        session.LastActivityAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} joined session {SessionId}", userId, session.Id);

        return session;
    }

    public async Task<CollaborativeSession> UpdateDocumentAsync(int projectId, string userId, string content)
    {
        var session = await _context.CollaborativeSessions
            .Where(s => s.ProjectId == projectId && s.Status == "active")
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No active session found for this project.");

        session.DocumentContent = content;
        session.DocumentVersion++;
        session.LastActivityAt = DateTime.UtcNow;

        var activities = DeserializeList<ActivityInfo>(session.ActivityFeedJson);
        activities.Add(new ActivityInfo
        {
            UserId = userId,
            DisplayName = userId,
            Action = "edited",
            Detail = "Updated document content",
            Timestamp = DateTime.UtcNow.ToString("o")
        });

        // Keep last 50 activities
        if (activities.Count > 50)
            activities = activities.Skip(activities.Count - 50).ToList();

        session.ActivityFeedJson = JsonSerializer.Serialize(activities);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Document updated in session {SessionId}, version {Version}", session.Id, session.DocumentVersion);

        return session;
    }

    public async Task<CollaborativeSession> EndSessionAsync(int projectId)
    {
        var session = await _context.CollaborativeSessions
            .Where(s => s.ProjectId == projectId && s.Status == "active")
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No active session found for this project.");

        session.Status = "ended";
        session.EndedAt = DateTime.UtcNow;

        var activities = DeserializeList<ActivityInfo>(session.ActivityFeedJson);
        activities.Add(new ActivityInfo
        {
            UserId = session.CreatedBy,
            DisplayName = session.CreatedBy,
            Action = "ended",
            Detail = "Session ended",
            Timestamp = DateTime.UtcNow.ToString("o")
        });
        session.ActivityFeedJson = JsonSerializer.Serialize(activities);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Session {SessionId} ended for project {ProjectId}", session.Id, projectId);

        return session;
    }

    public async Task<List<CollaborativeSession>> GetSessionHistoryAsync(int projectId)
    {
        return await _context.CollaborativeSessions
            .Where(s => s.ProjectId == projectId)
            .OrderByDescending(s => s.CreatedAt)
            .Take(20)
            .ToListAsync();
    }

    private static List<T> DeserializeList<T>(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new List<T>();
        return JsonSerializer.Deserialize<List<T>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<T>();
    }
}

internal class ParticipantInfo
{
    public string UserId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Color { get; set; } = "";
    public string JoinedAt { get; set; } = "";
}

internal class ActivityInfo
{
    public string UserId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Action { get; set; } = "";
    public string Detail { get; set; } = "";
    public string Timestamp { get; set; } = "";
}

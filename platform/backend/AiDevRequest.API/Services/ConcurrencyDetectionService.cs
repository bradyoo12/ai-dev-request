using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IConcurrencyDetectionService
{
    Task DetectIssuesAsync(Guid sessionId, List<AgentTestExecution> executions);
}

public class ConcurrencyDetectionService : IConcurrencyDetectionService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<ConcurrencyDetectionService> _logger;

    public ConcurrencyDetectionService(
        AiDevRequestDbContext context,
        ILogger<ConcurrencyDetectionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task DetectIssuesAsync(Guid sessionId, List<AgentTestExecution> executions)
    {
        _logger.LogInformation("Detecting concurrency issues for session {SessionId} with {ExecutionCount} executions",
            sessionId, executions.Count);

        var issues = new List<ConcurrencyIssue>();

        // Parse all actions from all executions
        var allActions = new List<(Guid PersonaId, ExecutedAction Action)>();

        foreach (var execution in executions)
        {
            if (string.IsNullOrEmpty(execution.ActionsJson)) continue;

            try
            {
                var actions = JsonSerializer.Deserialize<List<ExecutedAction>>(execution.ActionsJson);
                if (actions != null)
                {
                    foreach (var action in actions)
                    {
                        allActions.Add((execution.PersonaId, action));
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse actions from execution {ExecutionId}", execution.Id);
            }
        }

        // Detect race conditions - multiple write operations on same target
        issues.AddRange(DetectRaceConditions(sessionId, allActions));

        // Detect data conflicts - conflicting operations
        issues.AddRange(DetectDataConflicts(sessionId, allActions));

        // Detect lost updates - write followed by write without read
        issues.AddRange(DetectLostUpdates(sessionId, allActions));

        // Save detected issues
        if (issues.Count > 0)
        {
            _context.ConcurrencyIssues.AddRange(issues);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Detected {IssueCount} concurrency issues for session {SessionId}",
                issues.Count, sessionId);
        }
        else
        {
            _logger.LogInformation("No concurrency issues detected for session {SessionId}", sessionId);
        }
    }

    private List<ConcurrencyIssue> DetectRaceConditions(
        Guid sessionId,
        List<(Guid PersonaId, ExecutedAction Action)> allActions)
    {
        var issues = new List<ConcurrencyIssue>();

        // Group by target resource
        var resourceGroups = allActions
            .Where(a => a.Action.ActionType is "update" or "create" or "delete")
            .GroupBy(a => a.Action.Target);

        foreach (var group in resourceGroups)
        {
            var actions = group.ToList();

            // If 2+ personas write to same resource within 1 second = race condition
            if (actions.Count >= 2)
            {
                var timings = actions.Select(a => a.Action.StartedAt).OrderBy(t => t).ToList();

                for (int i = 0; i < timings.Count - 1; i++)
                {
                    var timeDiff = (timings[i + 1] - timings[i]).TotalMilliseconds;

                    if (timeDiff < 1000) // Within 1 second
                    {
                        var affectedPersonas = actions.Select(a => a.PersonaId).Distinct().ToList();

                        issues.Add(new ConcurrencyIssue
                        {
                            SessionId = sessionId,
                            IssueType = "race_condition",
                            Severity = timeDiff < 100 ? "critical" : timeDiff < 500 ? "high" : "medium",
                            ResourcePath = group.Key,
                            Description = $"Race condition detected: {actions.Count} concurrent {actions[0].Action.ActionType} operations on {group.Key} within {timeDiff:F0}ms",
                            ConflictingOperations = string.Join(", ", actions.Select(a => $"{a.PersonaId}: {a.Action.ActionType}")),
                            AffectedPersonasJson = JsonSerializer.Serialize(affectedPersonas),
                            ConfidenceScore = timeDiff < 100 ? 95 : timeDiff < 500 ? 85 : 70
                        });

                        break; // Only report once per resource
                    }
                }
            }
        }

        return issues;
    }

    private List<ConcurrencyIssue> DetectDataConflicts(
        Guid sessionId,
        List<(Guid PersonaId, ExecutedAction Action)> allActions)
    {
        var issues = new List<ConcurrencyIssue>();

        // Group by target resource
        var resourceGroups = allActions.GroupBy(a => a.Action.Target);

        foreach (var group in resourceGroups)
        {
            var actions = group.OrderBy(a => a.Action.StartedAt).ToList();

            // Look for conflicting operation patterns
            for (int i = 0; i < actions.Count - 1; i++)
            {
                var current = actions[i];
                var next = actions[i + 1];

                // DELETE followed by UPDATE = conflict
                if (current.Action.ActionType == "delete" && next.Action.ActionType == "update")
                {
                    var timeDiff = (next.Action.StartedAt - current.Action.CompletedAt).TotalMilliseconds;

                    if (timeDiff < 2000) // Within 2 seconds
                    {
                        issues.Add(new ConcurrencyIssue
                        {
                            SessionId = sessionId,
                            IssueType = "data_conflict",
                            Severity = "high",
                            ResourcePath = group.Key,
                            Description = $"Data conflict: DELETE followed by UPDATE on {group.Key} within {timeDiff:F0}ms",
                            ConflictingOperations = $"{current.PersonaId}: delete, {next.PersonaId}: update",
                            AffectedPersonasJson = JsonSerializer.Serialize(new[] { current.PersonaId, next.PersonaId }),
                            ConfidenceScore = 90
                        });
                    }
                }

                // CREATE followed by CREATE = duplicate key conflict
                if (current.Action.ActionType == "create" && next.Action.ActionType == "create" &&
                    current.Action.Data == next.Action.Data)
                {
                    var timeDiff = (next.Action.StartedAt - current.Action.StartedAt).TotalMilliseconds;

                    if (timeDiff < 1000)
                    {
                        issues.Add(new ConcurrencyIssue
                        {
                            SessionId = sessionId,
                            IssueType = "data_conflict",
                            Severity = "medium",
                            ResourcePath = group.Key,
                            Description = $"Duplicate creation: Multiple CREATE operations with same data on {group.Key}",
                            ConflictingOperations = $"{current.PersonaId}: create, {next.PersonaId}: create",
                            AffectedPersonasJson = JsonSerializer.Serialize(new[] { current.PersonaId, next.PersonaId }),
                            ConfidenceScore = 85
                        });
                    }
                }
            }
        }

        return issues;
    }

    private List<ConcurrencyIssue> DetectLostUpdates(
        Guid sessionId,
        List<(Guid PersonaId, ExecutedAction Action)> allActions)
    {
        var issues = new List<ConcurrencyIssue>();

        // Group by target resource
        var resourceGroups = allActions
            .Where(a => a.Action.ActionType is "update" or "read")
            .GroupBy(a => a.Action.Target);

        foreach (var group in resourceGroups)
        {
            var actions = group.OrderBy(a => a.Action.StartedAt).ToList();

            // Look for lost update pattern: UPDATE without prior READ
            for (int i = 0; i < actions.Count; i++)
            {
                if (actions[i].Action.ActionType == "update")
                {
                    // Check if this persona read before update
                    var personaId = actions[i].PersonaId;
                    var updateTime = actions[i].Action.StartedAt;

                    var hasRecentRead = actions
                        .Where(a => a.PersonaId == personaId && a.Action.ActionType == "read")
                        .Any(a => a.Action.StartedAt < updateTime && (updateTime - a.Action.StartedAt).TotalSeconds < 5);

                    if (!hasRecentRead)
                    {
                        issues.Add(new ConcurrencyIssue
                        {
                            SessionId = sessionId,
                            IssueType = "lost_update",
                            Severity = "medium",
                            ResourcePath = group.Key,
                            Description = $"Potential lost update: UPDATE on {group.Key} without prior READ by {personaId}",
                            ConflictingOperations = $"{personaId}: update without read",
                            AffectedPersonasJson = JsonSerializer.Serialize(new[] { personaId }),
                            ConfidenceScore = 75
                        });
                    }
                }
            }
        }

        return issues;
    }
}

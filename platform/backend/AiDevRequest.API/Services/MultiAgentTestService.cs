using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IMultiAgentTestService
{
    Task<MultiAgentTestSession> CreateSessionAsync(Guid devRequestId, string scenarioType, int concurrencyLevel, List<string> personaTypes);
    Task<MultiAgentTestSession> StartSimulationAsync(Guid sessionId);
    Task<MultiAgentTestSession> GetSessionStatusAsync(Guid sessionId);
    Task<MultiAgentTestSessionReport> GetSessionReportAsync(Guid sessionId);
    Task<List<MultiAgentTestSession>> GetSessionsAsync(Guid devRequestId);
    Task<RefineResult> GenerateRefinementAsync(Guid sessionId);
}

public class MultiAgentTestService : IMultiAgentTestService
{
    private readonly AiDevRequestDbContext _context;
    private readonly IPersonaSimulationService _personaService;
    private readonly IConcurrencyDetectionService _concurrencyService;
    private readonly IA2AService _a2aService;
    private readonly AnthropicClient _client;
    private readonly ILogger<MultiAgentTestService> _logger;
    private readonly string _projectsBasePath;

    public MultiAgentTestService(
        AiDevRequestDbContext context,
        IPersonaSimulationService personaService,
        IConcurrencyDetectionService concurrencyService,
        IA2AService a2aService,
        IConfiguration configuration,
        ILogger<MultiAgentTestService> logger)
    {
        _context = context;
        _personaService = personaService;
        _concurrencyService = concurrencyService;
        _a2aService = a2aService;
        _logger = logger;
        _projectsBasePath = configuration["Projects:BasePath"] ?? "./projects";

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<MultiAgentTestSession> CreateSessionAsync(
        Guid devRequestId,
        string scenarioType,
        int concurrencyLevel,
        List<string> personaTypes)
    {
        _logger.LogInformation("Creating multi-agent test session for dev request {DevRequestId}", devRequestId);

        var session = new MultiAgentTestSession
        {
            DevRequestId = devRequestId,
            ScenarioType = scenarioType,
            ConcurrencyLevel = concurrencyLevel,
            PersonaCount = personaTypes.Count,
            ConfigJson = JsonSerializer.Serialize(new
            {
                PersonaTypes = personaTypes,
                Timeout = 300,
                RetryAttempts = 3
            })
        };

        _context.MultiAgentTestSessions.Add(session);
        await _context.SaveChangesAsync();

        // Create persona records
        foreach (var personaType in personaTypes)
        {
            var persona = new TestPersona
            {
                SessionId = session.Id,
                PersonaType = personaType,
                PersonaName = $"{personaType}-{Guid.NewGuid().ToString()[..8]}"
            };

            _context.TestPersonas.Add(persona);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Created multi-agent test session {SessionId} with {PersonaCount} personas",
            session.Id, personaTypes.Count);

        return session;
    }

    public async Task<MultiAgentTestSession> StartSimulationAsync(Guid sessionId)
    {
        var session = await _context.MultiAgentTestSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId)
            ?? throw new InvalidOperationException($"Session {sessionId} not found");

        if (session.Status != "pending")
            throw new InvalidOperationException($"Session {sessionId} is not in pending state");

        session.Status = "running";
        session.StartedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Starting multi-agent test simulation for session {SessionId}", sessionId);

        // Get project path
        var projectPath = await ResolveProjectPathAsync(session.DevRequestId);
        if (projectPath == null)
        {
            session.Status = "failed";
            session.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            throw new InvalidOperationException("Project path could not be resolved");
        }

        // Get personas
        var personas = await _context.TestPersonas
            .Where(p => p.SessionId == sessionId)
            .ToListAsync();

        // Execute personas in parallel using Task.WhenAll
        var executionTasks = personas.Select(persona =>
            ExecutePersonaAsync(session, persona, projectPath));

        try
        {
            var executions = await Task.WhenAll(executionTasks);

            // Detect concurrency issues
            await _concurrencyService.DetectIssuesAsync(sessionId, executions.ToList());

            // Aggregate results
            await AggregateResultsAsync(session);

            session.Status = "completed";
            session.CompletedAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Multi-agent simulation failed for session {SessionId}", sessionId);
            session.Status = "failed";
            session.CompletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Multi-agent test simulation completed for session {SessionId}: {Status}",
            sessionId, session.Status);

        return session;
    }

    private async Task<AgentTestExecution> ExecutePersonaAsync(
        MultiAgentTestSession session,
        TestPersona persona,
        string projectPath)
    {
        var execution = new AgentTestExecution
        {
            SessionId = session.Id,
            PersonaId = persona.Id,
            Status = "running",
            StartedAt = DateTime.UtcNow
        };

        _context.AgentTestExecutions.Add(execution);
        await _context.SaveChangesAsync();

        persona.Status = "active";
        persona.StartedAt = DateTime.UtcNow;

        try
        {
            // Generate persona behavior using PersonaSimulationService
            var behavior = await _personaService.GeneratePersonaBehaviorAsync(
                persona.PersonaType,
                session.ScenarioType,
                projectPath);

            persona.BehaviorJson = JsonSerializer.Serialize(behavior);

            // Execute persona actions
            var result = await _personaService.ExecutePersonaActionsAsync(
                persona.PersonaType,
                behavior,
                projectPath);

            execution.ActionsJson = JsonSerializer.Serialize(result.Actions);
            execution.IssuesJson = JsonSerializer.Serialize(result.Issues);
            execution.ActionsCount = result.Actions.Count;
            execution.IssuesCount = result.Issues.Count;
            execution.Status = "completed";

            persona.ActionsPerformed = result.Actions.Count;
            persona.ActionsSucceeded = result.Actions.Count(a => a.Success);
            persona.ActionsFailed = result.Actions.Count(a => !a.Success);
            persona.Status = "completed";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Persona execution failed: {PersonaType} in session {SessionId}",
                persona.PersonaType, session.Id);

            execution.Status = "failed";
            execution.ErrorMessage = ex.Message;
            execution.StackTrace = ex.StackTrace;

            persona.Status = "failed";
        }

        execution.CompletedAt = DateTime.UtcNow;
        persona.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return execution;
    }

    private async Task AggregateResultsAsync(MultiAgentTestSession session)
    {
        var personas = await _context.TestPersonas
            .Where(p => p.SessionId == session.Id)
            .ToListAsync();

        var executions = await _context.AgentTestExecutions
            .Where(e => e.SessionId == session.Id)
            .ToListAsync();

        var issues = await _context.ConcurrencyIssues
            .Where(i => i.SessionId == session.Id)
            .ToListAsync();

        session.TotalActions = personas.Sum(p => p.ActionsPerformed);
        session.SuccessfulActions = personas.Sum(p => p.ActionsSucceeded);
        session.FailedActions = personas.Sum(p => p.ActionsFailed);
        session.IssuesDetected = issues.Count;

        // Calculate overall score (0-100)
        if (session.TotalActions > 0)
        {
            var successRate = (decimal)session.SuccessfulActions / session.TotalActions;
            var issuesPenalty = Math.Min(issues.Count * 5m, 30m); // Max 30 point penalty
            session.OverallScore = Math.Max(0, (successRate * 100m) - issuesPenalty);
        }

        session.ResultsJson = JsonSerializer.Serialize(new
        {
            Personas = personas.Select(p => new
            {
                p.PersonaType,
                p.PersonaName,
                p.Status,
                p.ActionsPerformed,
                p.ActionsSucceeded,
                p.ActionsFailed
            }),
            Issues = issues.Select(i => new
            {
                i.IssueType,
                i.Severity,
                i.Description
            })
        });

        await _context.SaveChangesAsync();
    }

    public async Task<MultiAgentTestSession> GetSessionStatusAsync(Guid sessionId)
    {
        return await _context.MultiAgentTestSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId)
            ?? throw new InvalidOperationException($"Session {sessionId} not found");
    }

    public async Task<MultiAgentTestSessionReport> GetSessionReportAsync(Guid sessionId)
    {
        var session = await _context.MultiAgentTestSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId)
            ?? throw new InvalidOperationException($"Session {sessionId} not found");

        var personas = await _context.TestPersonas
            .Where(p => p.SessionId == sessionId)
            .ToListAsync();

        var executions = await _context.AgentTestExecutions
            .Where(e => e.SessionId == sessionId)
            .ToListAsync();

        var issues = await _context.ConcurrencyIssues
            .Where(i => i.SessionId == sessionId)
            .OrderByDescending(i => i.Severity == "critical" ? 4 : i.Severity == "high" ? 3 : i.Severity == "medium" ? 2 : 1)
            .ToListAsync();

        return new MultiAgentTestSessionReport
        {
            Session = session,
            Personas = personas,
            Executions = executions,
            Issues = issues
        };
    }

    public async Task<List<MultiAgentTestSession>> GetSessionsAsync(Guid devRequestId)
    {
        return await _context.MultiAgentTestSessions
            .Where(s => s.DevRequestId == devRequestId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<RefineResult> GenerateRefinementAsync(Guid sessionId)
    {
        var report = await GetSessionReportAsync(sessionId);

        if (report.Issues.Count == 0)
        {
            return new RefineResult
            {
                HasFixes = false,
                Message = "No concurrency issues detected. No refinement needed.",
                Fixes = new List<CodeFix>()
            };
        }

        _logger.LogInformation("Generating AI-driven refinement for session {SessionId} with {IssueCount} issues",
            sessionId, report.Issues.Count);

        var issuesSummary = string.Join("\n", report.Issues.Select(i =>
            $"- [{i.Severity.ToUpper()}] {i.IssueType}: {i.Description}\n  Resource: {i.ResourcePath}\n  Operations: {i.ConflictingOperations}"));

        var prompt = $@"You are a senior software engineer specializing in concurrency and race condition resolution.

## Multi-Agent Test Results

**Scenario:** {report.Session.ScenarioType}
**Total Actions:** {report.Session.TotalActions}
**Failed Actions:** {report.Session.FailedActions}
**Concurrency Issues Detected:** {report.Issues.Count}

## Detected Issues

{issuesSummary}

## Task

Generate code fixes to resolve these concurrency issues. For each issue, provide:
1. The specific code pattern causing the issue
2. The recommended fix (locking, optimistic concurrency, atomic operations, etc.)
3. Code snippets showing before and after

Respond with ONLY a JSON object:
{{
  ""fixes"": [
    {{
      ""issueType"": ""race_condition|data_conflict|deadlock|lost_update|phantom_read"",
      ""severity"": ""critical|high|medium|low"",
      ""description"": ""brief description of the fix"",
      ""filePath"": ""relative file path if known, or null"",
      ""originalCode"": ""problematic code snippet"",
      ""fixedCode"": ""fixed code snippet"",
      ""explanation"": ""detailed explanation of what changed and why"",
      ""confidence"": 0-100
    }}
  ],
  ""summary"": ""overall summary of all fixes""
}}

Be specific and actionable. JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 8000,
                Temperature = 0.3m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var result = StructuredOutputHelper.DeserializeResponse<RefineResultData>(content);

            if (result != null && result.Fixes.Count > 0)
            {
                _logger.LogInformation("Generated {FixCount} refinement fixes for session {SessionId}",
                    result.Fixes.Count, sessionId);

                return new RefineResult
                {
                    HasFixes = true,
                    Message = result.Summary,
                    Fixes = result.Fixes
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate refinement for session {SessionId}", sessionId);
        }

        return new RefineResult
        {
            HasFixes = false,
            Message = "Failed to generate refinement. Please try again.",
            Fixes = new List<CodeFix>()
        };
    }

    private async Task<string?> ResolveProjectPathAsync(Guid devRequestId)
    {
        var devRequest = await _context.DevRequests
            .Where(r => r.Id == devRequestId)
            .FirstOrDefaultAsync();

        if (devRequest?.ProjectPath != null && Directory.Exists(devRequest.ProjectPath))
            return devRequest.ProjectPath;

        if (Directory.Exists(_projectsBasePath))
        {
            var dirs = Directory.GetDirectories(_projectsBasePath)
                .OrderByDescending(d => Directory.GetCreationTime(d))
                .ToArray();

            if (dirs.Length > 0)
                return dirs[0];
        }

        return null;
    }
}

public class MultiAgentTestSessionReport
{
    public MultiAgentTestSession Session { get; set; } = null!;
    public List<TestPersona> Personas { get; set; } = new();
    public List<AgentTestExecution> Executions { get; set; } = new();
    public List<ConcurrencyIssue> Issues { get; set; } = new();
}

public class RefineResult
{
    public bool HasFixes { get; set; }
    public string Message { get; set; } = "";
    public List<CodeFix> Fixes { get; set; } = new();
}

public class RefineResultData
{
    public List<CodeFix> Fixes { get; set; } = new();
    public string Summary { get; set; } = "";
}

public class CodeFix
{
    public string IssueType { get; set; } = "";
    public string Severity { get; set; } = "";
    public string Description { get; set; } = "";
    public string? FilePath { get; set; }
    public string OriginalCode { get; set; } = "";
    public string FixedCode { get; set; } = "";
    public string Explanation { get; set; } = "";
    public int Confidence { get; set; }
}

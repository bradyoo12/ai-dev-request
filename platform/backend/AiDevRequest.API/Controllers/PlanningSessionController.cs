using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/planning")]
[Authorize]
public class PlanningSessionController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public PlanningSessionController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("sessions")]
    public async Task<IActionResult> ListSessions()
    {
        var userId = GetUserId();
        var sessions = await _db.PlanningSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.UpdatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(sessions);
    }

    [HttpGet("sessions/{id}")]
    public async Task<IActionResult> GetSession(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.PlanningSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();
        return Ok(session);
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreatePlanningSessionRequest request)
    {
        var userId = GetUserId();
        var validModes = new[] { "brainstorm", "architecture", "debug", "requirements" };
        var mode = validModes.Contains(request.Mode?.ToLowerInvariant()) ? request.Mode!.ToLowerInvariant() : "brainstorm";

        var session = new PlanningSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DevRequestId = request.DevRequestId,
            SessionName = request.SessionName ?? "Untitled Session",
            Status = "active",
            Mode = mode,
            MessagesJson = "[]",
            PlanOutputJson = "{}",
        };
        _db.PlanningSessions.Add(session);
        await _db.SaveChangesAsync();
        return Ok(session);
    }

    [HttpPost("sessions/{id}/message")]
    public async Task<IActionResult> SendMessage(Guid id, [FromBody] PlanningMessageRequest request)
    {
        var userId = GetUserId();
        var session = await _db.PlanningSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();
        if (session.Status != "active") return BadRequest("Session is not active");

        var messages = JsonSerializer.Deserialize<List<PlanningMessage>>(session.MessagesJson) ?? new();
        var userMessage = new PlanningMessage
        {
            Role = "user",
            Content = request.Content ?? "",
            Timestamp = DateTime.UtcNow,
        };
        messages.Add(userMessage);

        // Simulated AI response based on mode
        var aiContent = GenerateAiResponse(session.Mode, request.Content ?? "", messages.Count);
        var aiMessage = new PlanningMessage
        {
            Role = "assistant",
            Content = aiContent,
            Timestamp = DateTime.UtcNow,
        };
        messages.Add(aiMessage);

        var userTokens = (request.Content?.Length ?? 0) * 4;
        var aiTokens = aiContent.Length * 4;

        session.MessagesJson = JsonSerializer.Serialize(messages);
        session.TotalMessages = messages.Count;
        session.UserMessages = messages.Count(m => m.Role == "user");
        session.AiMessages = messages.Count(m => m.Role == "assistant");
        session.TokensUsed += userTokens + aiTokens;
        session.EstimatedSavings = session.TokensUsed * 0.8m; // Planning uses ~80% fewer tokens than code gen
        session.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(session);
    }

    [HttpPost("sessions/{id}/complete")]
    public async Task<IActionResult> CompleteSession(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.PlanningSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();

        var messages = JsonSerializer.Deserialize<List<PlanningMessage>>(session.MessagesJson) ?? new();
        var summary = GeneratePlanSummary(session.Mode, messages);

        session.Status = "completed";
        session.PlanOutputJson = JsonSerializer.Serialize(summary);
        session.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(session);
    }

    [HttpDelete("sessions/{id}")]
    public async Task<IActionResult> DeleteSession(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.PlanningSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();

        _db.PlanningSessions.Remove(session);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var sessions = await _db.PlanningSessions.Where(s => s.UserId == userId).ToListAsync();

        var byMode = sessions.GroupBy(s => s.Mode).Select(g => new
        {
            mode = g.Key,
            count = g.Count(),
            totalMessages = g.Sum(s => s.TotalMessages),
            tokensUsed = g.Sum(s => s.TokensUsed),
        }).ToList();

        return Ok(new
        {
            totalSessions = sessions.Count,
            activeSessions = sessions.Count(s => s.Status == "active"),
            completedSessions = sessions.Count(s => s.Status == "completed"),
            totalMessages = sessions.Sum(s => s.TotalMessages),
            totalTokensUsed = sessions.Sum(s => s.TokensUsed),
            estimatedSavings = sessions.Sum(s => s.EstimatedSavings),
            byMode,
        });
    }

    [HttpGet("modes")]
    public IActionResult GetModes()
    {
        var modes = new[]
        {
            new { id = "brainstorm", name = "Brainstorm", description = "Free-form ideation and creative exploration of concepts and approaches" },
            new { id = "architecture", name = "Architecture", description = "System design, component planning, and technical architecture decisions" },
            new { id = "debug", name = "Debug", description = "Analyze issues, trace problems, and plan debugging strategies without touching code" },
            new { id = "requirements", name = "Requirements", description = "Gather, refine, and document product requirements and user stories" },
        };
        return Ok(modes);
    }

    private static string GenerateAiResponse(string mode, string userInput, int messageCount)
    {
        var input = userInput.ToLowerInvariant();

        return mode switch
        {
            "brainstorm" => GenerateBrainstormResponse(input, messageCount),
            "architecture" => GenerateArchitectureResponse(input, messageCount),
            "debug" => GenerateDebugResponse(input, messageCount),
            "requirements" => GenerateRequirementsResponse(input, messageCount),
            _ => $"Interesting point about \"{userInput.Substring(0, Math.Min(50, userInput.Length))}...\". Let me help you think through this further. What specific aspect would you like to explore?",
        };
    }

    private static string GenerateBrainstormResponse(string input, int messageCount)
    {
        if (messageCount <= 2)
            return $"Great starting point! Let me help brainstorm around this idea. Here are some angles to consider:\n\n1. **User perspective**: Who are the primary users and what problems are we solving?\n2. **Technical feasibility**: What existing tools or patterns could we leverage?\n3. **Differentiation**: What would make this unique compared to existing solutions?\n\nWhich of these would you like to explore first?";

        if (input.Contains("user") || input.Contains("customer"))
            return "Focusing on the user angle - consider creating user personas:\n\n- **Power users**: Want advanced features, keyboard shortcuts, APIs\n- **Casual users**: Need simplicity, guided flows, templates\n- **Admin users**: Need oversight, analytics, team management\n\nFor each persona, what are their top 3 pain points?";

        if (input.Contains("tech") || input.Contains("stack") || input.Contains("tool"))
            return "From a technology perspective, here are some options to evaluate:\n\n- **Frontend**: React with TypeScript for type safety, or Vue for simpler component architecture\n- **Backend**: .NET for enterprise features, Node.js for rapid prototyping\n- **Data layer**: PostgreSQL for relational data, Redis for caching, or a hybrid approach\n\nWhat constraints do you have (team expertise, timeline, budget)?";

        return $"Building on your previous points, I see a few emerging themes:\n\n1. **Scalability**: How do we ensure this grows with demand?\n2. **Iteration speed**: Can we ship an MVP within 2 weeks?\n3. **Integration points**: What existing systems need to connect?\n\nLet's prioritize - what's most critical for your first milestone?";
    }

    private static string GenerateArchitectureResponse(string input, int messageCount)
    {
        if (messageCount <= 2)
            return "Let's design the architecture. I'll start by asking key questions:\n\n1. **Scale expectations**: How many concurrent users do you anticipate?\n2. **Data sensitivity**: Any compliance requirements (GDPR, SOC2)?\n3. **Deployment target**: Cloud (AWS/Azure/GCP), on-prem, or hybrid?\n4. **Integration needs**: What external services need to connect?\n\nPlease share your constraints so I can recommend the right patterns.";

        if (input.Contains("microservice") || input.Contains("service"))
            return "For a microservices architecture, I recommend:\n\n```\nAPI Gateway --> Auth Service\n           --> User Service\n           --> Core Business Service\n           --> Notification Service\n           --> Analytics Service\n```\n\n**Communication patterns**:\n- Synchronous: REST/gRPC for queries\n- Asynchronous: Message queue (RabbitMQ/Kafka) for events\n\n**Key considerations**:\n- Service discovery and load balancing\n- Distributed tracing (OpenTelemetry)\n- Circuit breaker pattern for resilience\n\nShould we detail any specific service?";

        if (input.Contains("database") || input.Contains("data") || input.Contains("storage"))
            return "For the data layer, here's my recommendation:\n\n**Primary database**: PostgreSQL\n- Strong ACID compliance, JSON support, great for complex queries\n\n**Caching layer**: Redis\n- Session storage, hot data caching, pub/sub for real-time features\n\n**Search**: Elasticsearch (if needed)\n- Full-text search, analytics, log aggregation\n\n**Schema design principles**:\n1. Normalize for writes, denormalize for reads\n2. Use UUIDs for distributed-friendly primary keys\n3. Soft deletes with `deleted_at` timestamps\n4. Audit columns on every table (`created_at`, `updated_at`, `created_by`)\n\nWant me to sketch out specific table schemas?";

        return "Based on what we've discussed, here's an evolving architecture summary:\n\n**Frontend**: SPA with React + TypeScript\n**API Layer**: RESTful API with versioning\n**Business Logic**: Service layer with dependency injection\n**Data Access**: Repository pattern with EF Core\n**Infrastructure**: Container-based deployment\n\nLet's drill into any layer - which area needs more detail?";
    }

    private static string GenerateDebugResponse(string input, int messageCount)
    {
        if (messageCount <= 2)
            return "Let's systematically debug this. Please tell me:\n\n1. **Symptoms**: What exactly is happening vs. what should happen?\n2. **Reproduction**: Can you consistently reproduce the issue?\n3. **Recent changes**: What changed before this started?\n4. **Environment**: Dev/staging/production? Which browser/OS?\n\nThe more context you provide, the faster we can narrow down the root cause.";

        if (input.Contains("error") || input.Contains("exception") || input.Contains("crash"))
            return "Based on the error description, here's a debugging plan:\n\n**Step 1**: Check error logs for the full stack trace\n**Step 2**: Identify the exact line/function where it fails\n**Step 3**: Check input data - is it valid/expected format?\n**Step 4**: Look for recent code changes in that area (git blame)\n**Step 5**: Try to reproduce with minimal test case\n\n**Common causes for this type of error**:\n- Null reference from missing data\n- Type mismatch in serialization\n- Race condition in async code\n- Missing environment variable or config\n\nWhich step would you like to start with?";

        if (input.Contains("slow") || input.Contains("performance") || input.Contains("timeout"))
            return "For performance issues, let's investigate:\n\n**Quick wins to check**:\n1. Database queries - any missing indexes? N+1 query patterns?\n2. Network calls - unnecessary sequential API calls that could be parallel?\n3. Memory leaks - objects not being disposed properly?\n4. Caching - are we re-computing expensive operations?\n\n**Measurement first**:\n- Add timing logs around suspected areas\n- Check database query execution plans\n- Monitor memory usage over time\n- Profile CPU-intensive operations\n\nDo you have access to profiling tools or APM (Application Performance Monitoring)?";

        return "Let's continue narrowing down the issue:\n\n**Hypothesis testing approach**:\n1. Form a hypothesis about the root cause\n2. Design a minimal test to validate or invalidate it\n3. If invalidated, form the next hypothesis\n4. Repeat until root cause is confirmed\n\n**Current best guesses based on your description**:\n- Data integrity issue in the persistence layer\n- Edge case not handled in business logic\n- Configuration drift between environments\n\nWhat additional data can you gather to help us narrow this down?";
    }

    private static string GenerateRequirementsResponse(string input, int messageCount)
    {
        if (messageCount <= 2)
            return "Let's define the requirements. I'll help structure them:\n\n**Categories to cover**:\n1. **Functional requirements**: What must the system do?\n2. **Non-functional requirements**: Performance, security, scalability\n3. **User stories**: As a [role], I want [feature], so that [benefit]\n4. **Acceptance criteria**: How do we know it's done?\n\nLet's start - what's the core problem you're solving?";

        if (input.Contains("user story") || input.Contains("stories") || input.Contains("feature"))
            return "Here's a template for well-structured user stories:\n\n**Epic**: [Feature Area]\n\n**Story 1**: As a registered user, I want to [action], so that [benefit]\n- **Acceptance Criteria**:\n  - Given [context], when [action], then [result]\n  - Edge case: [what happens when...]\n- **Priority**: P1/P2/P3\n- **Estimate**: S/M/L\n\n**Tips for good stories**:\n- Keep them independent and negotiable\n- Each story should be testable\n- Include error/edge case handling\n- Define \"done\" clearly\n\nWant me to help write specific stories for your features?";

        if (input.Contains("priority") || input.Contains("mvp") || input.Contains("scope"))
            return "Let's prioritize using the MoSCoW method:\n\n**Must Have** (MVP - launch blockers):\n- Core user flow works end-to-end\n- Authentication and authorization\n- Data persistence and basic CRUD\n\n**Should Have** (important but not blocking):\n- Search and filtering\n- Email notifications\n- Basic analytics\n\n**Could Have** (nice to have):\n- Advanced reporting\n- Third-party integrations\n- Customization options\n\n**Won't Have** (future scope):\n- Mobile app\n- AI-powered features\n- Multi-tenancy\n\nDoes this framework work for your project? Let's fill in your specific features.";

        return "Building on our requirements discussion:\n\n**Summary so far**:\n- We've identified the core problem and target users\n- Key functional areas are taking shape\n\n**Next steps to solidify requirements**:\n1. Review with stakeholders for alignment\n2. Identify dependencies between features\n3. Create a rough timeline/roadmap\n4. Define technical constraints and non-functional requirements\n\nWhat area needs the most clarification before we can finalize?";
    }

    private static object GeneratePlanSummary(string mode, List<PlanningMessage> messages)
    {
        var userMessages = messages.Where(m => m.Role == "user").Select(m => m.Content).ToList();
        var keyTopics = new List<string>();

        foreach (var msg in userMessages)
        {
            var lower = msg.ToLowerInvariant();
            if (lower.Contains("api") || lower.Contains("backend")) keyTopics.Add("API/Backend Design");
            if (lower.Contains("ui") || lower.Contains("frontend")) keyTopics.Add("Frontend/UI Design");
            if (lower.Contains("database") || lower.Contains("data")) keyTopics.Add("Data Architecture");
            if (lower.Contains("auth") || lower.Contains("security")) keyTopics.Add("Authentication & Security");
            if (lower.Contains("deploy") || lower.Contains("infra")) keyTopics.Add("Infrastructure & Deployment");
            if (lower.Contains("test") || lower.Contains("quality")) keyTopics.Add("Testing & Quality");
        }

        keyTopics = keyTopics.Distinct().ToList();
        if (keyTopics.Count == 0) keyTopics.Add("General " + mode + " discussion");

        return new
        {
            mode,
            totalExchanges = messages.Count / 2,
            keyTopics,
            summary = $"Planning session completed with {messages.Count} messages covering {keyTopics.Count} topic(s). Key areas discussed: {string.Join(", ", keyTopics)}.",
            nextSteps = new[]
            {
                "Review the discussion points and extract actionable items",
                "Create development tasks based on the planning outcomes",
                "Share the plan summary with team members for feedback",
            },
            completedAt = DateTime.UtcNow,
        };
    }
}

public class CreatePlanningSessionRequest
{
    public string? SessionName { get; set; }
    public string? Mode { get; set; }
    public Guid? DevRequestId { get; set; }
}

public class PlanningMessageRequest
{
    public string? Content { get; set; }
}

public class PlanningMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

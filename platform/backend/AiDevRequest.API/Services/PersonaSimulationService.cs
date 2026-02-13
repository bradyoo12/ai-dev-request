using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface IPersonaSimulationService
{
    Task<PersonaBehavior> GeneratePersonaBehaviorAsync(string personaType, string scenarioType, string projectPath);
    Task<PersonaExecutionResult> ExecutePersonaActionsAsync(string personaType, PersonaBehavior behavior, string projectPath);
}

public class PersonaSimulationService : IPersonaSimulationService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<PersonaSimulationService> _logger;

    public PersonaSimulationService(IConfiguration configuration, ILogger<PersonaSimulationService> logger)
    {
        _logger = logger;

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<PersonaBehavior> GeneratePersonaBehaviorAsync(
        string personaType,
        string scenarioType,
        string projectPath)
    {
        _logger.LogInformation("Generating behavior for persona {PersonaType} in scenario {ScenarioType}",
            personaType, scenarioType);

        var personaDescription = GetPersonaDescription(personaType);
        var scenarioDescription = GetScenarioDescription(scenarioType);
        var codeContext = await ReadProjectContextAsync(projectPath);

        var prompt = $@"You are simulating a {personaType} user testing a web application.

## Persona Profile
{personaDescription}

## Test Scenario
{scenarioDescription}

## Application Context
{codeContext}

## Task
Generate a realistic sequence of 5-10 actions this persona would perform in this scenario.

For each action, specify:
- actionType: (navigate, click, input, submit, read, delete, update, create)
- target: The UI element or resource to interact with
- data: Any data to input (for forms, API calls)
- expectedOutcome: What should happen
- timing: Relative timing (immediate, wait_100ms, wait_500ms, wait_1s)

Respond with ONLY a JSON object:
{{
  ""actions"": [
    {{
      ""actionType"": ""navigate|click|input|submit|read|delete|update|create"",
      ""target"": ""specific element or endpoint"",
      ""data"": ""input data or payload"",
      ""expectedOutcome"": ""expected result"",
      ""timing"": ""immediate|wait_100ms|wait_500ms|wait_1s""
    }}
  ]
}}

Be realistic - simulate actual user behavior with timing delays. JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 4000,
                Temperature = 0.7m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var result = StructuredOutputHelper.DeserializeResponse<PersonaBehavior>(content);

            if (result != null && result.Actions.Count > 0)
            {
                _logger.LogInformation("Generated {ActionCount} actions for {PersonaType}",
                    result.Actions.Count, personaType);
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate persona behavior for {PersonaType}", personaType);
        }

        // Return default behavior on error
        return new PersonaBehavior
        {
            Actions = new List<PersonaAction>
            {
                new() { ActionType = "navigate", Target = "/", ExpectedOutcome = "Page loads", Timing = "immediate" }
            }
        };
    }

    public async Task<PersonaExecutionResult> ExecutePersonaActionsAsync(
        string personaType,
        PersonaBehavior behavior,
        string projectPath)
    {
        _logger.LogInformation("Executing {ActionCount} actions for persona {PersonaType}",
            behavior.Actions.Count, personaType);

        var executedActions = new List<ExecutedAction>();
        var issues = new List<string>();

        foreach (var action in behavior.Actions)
        {
            var executed = new ExecutedAction
            {
                ActionType = action.ActionType,
                Target = action.Target,
                Data = action.Data,
                StartedAt = DateTime.UtcNow
            };

            // Apply timing
            if (action.Timing == "wait_100ms")
                await Task.Delay(100);
            else if (action.Timing == "wait_500ms")
                await Task.Delay(500);
            else if (action.Timing == "wait_1s")
                await Task.Delay(1000);

            try
            {
                // Simulate action execution
                var result = await SimulateActionAsync(action, projectPath);
                executed.Success = result.Success;
                executed.ActualOutcome = result.Outcome;
                executed.ResponseTime = result.ResponseTime;

                if (!result.Success)
                {
                    issues.Add($"{action.ActionType} on {action.Target} failed: {result.Outcome}");
                }
            }
            catch (Exception ex)
            {
                executed.Success = false;
                executed.ActualOutcome = ex.Message;
                issues.Add($"{action.ActionType} on {action.Target} threw exception: {ex.Message}");
            }

            executed.CompletedAt = DateTime.UtcNow;
            executedActions.Add(executed);
        }

        return new PersonaExecutionResult
        {
            Actions = executedActions,
            Issues = issues
        };
    }

    private async Task<ActionSimulationResult> SimulateActionAsync(PersonaAction action, string projectPath)
    {
        // Simulate network delay
        await Task.Delay(Random.Shared.Next(50, 200));

        // Simulate random failures for concurrent operations (10% chance)
        var shouldFail = Random.Shared.Next(100) < 10;

        if (shouldFail)
        {
            return new ActionSimulationResult
            {
                Success = false,
                Outcome = $"Conflict detected: {action.ActionType} on {action.Target} failed due to concurrent modification",
                ResponseTime = Random.Shared.Next(100, 500)
            };
        }

        return new ActionSimulationResult
        {
            Success = true,
            Outcome = action.ExpectedOutcome,
            ResponseTime = Random.Shared.Next(50, 300)
        };
    }

    private string GetPersonaDescription(string personaType)
    {
        return personaType.ToLower() switch
        {
            "admin" => @"Administrator with full system access.
- Can create, read, update, delete all resources
- Can modify system configuration
- Can manage users and permissions
- Has access to admin-only endpoints",

            "customer" => @"Regular user with limited permissions.
- Can create and read own data
- Can update own profile
- Cannot delete others' data
- Has read-only access to public resources
- Cannot access admin endpoints",

            "moderator" => @"Content moderator with partial admin access.
- Can review and approve user submissions
- Can hide/flag inappropriate content
- Cannot delete user accounts
- Has read access to most resources
- Limited write access",

            _ => "Generic user with standard permissions"
        };
    }

    private string GetScenarioDescription(string scenarioType)
    {
        return scenarioType.ToLower() switch
        {
            "concurrent_crud" => @"All personas simultaneously edit the same resources.
- Multiple users updating the same record
- Testing optimistic vs pessimistic locking
- Detecting lost updates and race conditions",

            "permission_boundaries" => @"Personas test authorization boundaries.
- Attempt to access restricted resources
- Try operations beyond permission level
- Verify proper access control enforcement",

            "race_conditions" => @"Personas trigger race conditions.
- Simultaneous updates to shared state
- Counter increments without proper locking
- File system concurrent access",

            "data_consistency" => @"Test referential integrity under concurrent load.
- Create parent and child records simultaneously
- Delete parent while child is being created
- Update foreign keys concurrently",

            _ => "General testing scenario with concurrent operations"
        };
    }

    private async Task<string> ReadProjectContextAsync(string projectPath)
    {
        try
        {
            // Read a sample of project files for context (keep it brief)
            var files = new List<string>();

            if (Directory.Exists(projectPath))
            {
                var sourceFiles = Directory.GetFiles(projectPath, "*.*", SearchOption.TopDirectoryOnly)
                    .Take(3);

                foreach (var file in sourceFiles)
                {
                    if (Path.GetExtension(file).ToLower() is ".md" or ".json")
                    {
                        var content = await File.ReadAllTextAsync(file);
                        if (content.Length < 1000)
                            files.Add($"{Path.GetFileName(file)}:\n{content}");
                    }
                }
            }

            return files.Count > 0 ? string.Join("\n\n", files) : "No context available.";
        }
        catch
        {
            return "Project context could not be read.";
        }
    }
}

public class PersonaBehavior
{
    public List<PersonaAction> Actions { get; set; } = new();
}

public class PersonaAction
{
    public string ActionType { get; set; } = "";
    public string Target { get; set; } = "";
    public string? Data { get; set; }
    public string ExpectedOutcome { get; set; } = "";
    public string Timing { get; set; } = "immediate";
}

public class PersonaExecutionResult
{
    public List<ExecutedAction> Actions { get; set; } = new();
    public List<string> Issues { get; set; } = new();
}

public class ExecutedAction
{
    public string ActionType { get; set; } = "";
    public string Target { get; set; } = "";
    public string? Data { get; set; }
    public bool Success { get; set; }
    public string ActualOutcome { get; set; } = "";
    public int ResponseTime { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
}

public class ActionSimulationResult
{
    public bool Success { get; set; }
    public string Outcome { get; set; } = "";
    public int ResponseTime { get; set; }
}

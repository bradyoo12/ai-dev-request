using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ITaskDecompositionService
{
    Task<List<SubagentTask>> DecomposeRequestAsync(Guid devRequestId);
    Task<string> GenerateAgentContextAsync(SubagentTask task, DevRequest devRequest);
    Task<Dictionary<int, List<int>>> BuildDependencyGraphAsync(List<SubagentTask> tasks);
}

public class TaskDecompositionService : ITaskDecompositionService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<TaskDecompositionService> _logger;

    public TaskDecompositionService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<TaskDecompositionService> logger)
    {
        _context = context;
        _logger = logger;

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<List<SubagentTask>> DecomposeRequestAsync(Guid devRequestId)
    {
        var devRequest = await _context.DevRequests.FindAsync(devRequestId)
            ?? throw new InvalidOperationException($"DevRequest {devRequestId} not found");

        _logger.LogInformation("Decomposing dev request {DevRequestId} into parallel tasks", devRequestId);

        // Call Claude API to analyze and decompose the request
        var decompositionPrompt = $@"You are a specialized AI that decomposes software development requests into parallelizable subtasks.

Given this dev request: ""{devRequest.Description}""

Framework preference: {devRequest.Framework ?? "Not specified"}
Category: {devRequest.Category}
Complexity: {devRequest.Complexity}

Identify independent work streams that can run simultaneously:
- **schema**: Database entities, relationships, migrations (must run first)
- **backend**: Controllers, services, database access, middleware, API endpoints
- **frontend**: UI components, pages, routing, state management, API client integration
- **tests**: Unit tests, integration tests, E2E scenarios
- **docs**: README, API documentation, deployment guides

Output JSON with this structure:
{{
  ""tasks"": [
    {{
      ""type"": ""schema"",
      ""name"": ""Create database entities"",
      ""description"": ""Design User, Post, Comment entities with relationships"",
      ""context"": ""Detailed context for this specific task..."",
      ""dependencies"": []
    }},
    {{
      ""type"": ""backend"",
      ""name"": ""Implement API endpoints"",
      ""description"": ""Create REST API for CRUD operations"",
      ""context"": ""Detailed context..."",
      ""dependencies"": [""schema""]
    }}
  ]
}}

IMPORTANT:
1. Each task must be independently executable by a specialized agent
2. Include detailed context for each task (file paths, tech stack, patterns to follow)
3. Specify dependencies correctly (e.g., backend depends on schema)
4. Generate 3-5 tasks maximum for parallel execution
5. Respond with ONLY valid JSON, no markdown formatting";

        try
        {
            var messages = new List<Message>
            {
                new Message(RoleType.User, decompositionPrompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                MaxTokens = 4096,
                Model = "claude-sonnet-4-20250514",
                Stream = false,
                Temperature = 0.7m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var jsonResponse = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            _logger.LogDebug("Claude decomposition response: {Response}", jsonResponse);

            // Parse the JSON response
            var decomposition = JsonSerializer.Deserialize<TaskDecomposition>(jsonResponse, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (decomposition == null || decomposition.Tasks == null || decomposition.Tasks.Count == 0)
            {
                throw new InvalidOperationException("Claude returned empty task decomposition");
            }

            // Create SubagentTask entities
            var tasks = new List<SubagentTask>();
            foreach (var taskDef in decomposition.Tasks)
            {
                var task = new SubagentTask
                {
                    DevRequestId = devRequestId,
                    TaskType = taskDef.Type,
                    Name = taskDef.Name,
                    Description = taskDef.Description,
                    ContextJson = JsonSerializer.Serialize(new
                    {
                        taskDef.Context,
                        devRequest.Framework,
                        devRequest.Category,
                        dependencies = taskDef.Dependencies
                    }),
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow
                };

                tasks.Add(task);
                _context.SubagentTasks.Add(task);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Decomposed request {DevRequestId} into {TaskCount} tasks",
                devRequestId, tasks.Count);

            return tasks;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decompose dev request {DevRequestId}", devRequestId);
            throw;
        }
    }

    public async Task<string> GenerateAgentContextAsync(SubagentTask task, DevRequest devRequest)
    {
        _logger.LogInformation("Generating specialized context for task {TaskId} ({TaskType})",
            task.Id, task.TaskType);

        var contextPrompt = task.TaskType.ToLowerInvariant() switch
        {
            "schema" => GenerateSchemaContextPrompt(task, devRequest),
            "backend" => GenerateBackendContextPrompt(task, devRequest),
            "frontend" => GenerateFrontendContextPrompt(task, devRequest),
            "tests" => GenerateTestsContextPrompt(task, devRequest),
            "docs" => GenerateDocsContextPrompt(task, devRequest),
            _ => GenerateGenericContextPrompt(task, devRequest)
        };

        return contextPrompt;
    }

    private string GenerateSchemaContextPrompt(SubagentTask task, DevRequest devRequest)
    {
        return $@"# Database Schema Design Task

## Project Context
- **Description**: {devRequest.Description}
- **Framework**: {devRequest.Framework ?? "Not specified"}
- **Category**: {devRequest.Category}

## Your Task
{task.Description}

## Requirements
1. Design database entities with proper relationships
2. Include primary keys, foreign keys, and indexes
3. Define data types and constraints
4. Consider scalability and normalization
5. Use Entity Framework Core conventions

## Output Format
Provide:
1. Entity class definitions (C#)
2. DbContext configuration
3. Migration script
4. Relationship diagrams (Mermaid syntax)

## Example Entity
```csharp
public class User
{{
    public Guid Id {{ get; set; }} = Guid.NewGuid();
    public string Email {{ get; set; }} = string.Empty;
    public DateTime CreatedAt {{ get; set; }} = DateTime.UtcNow;
}}
```

Focus on creating a clean, maintainable schema that other agents can build upon.";
    }

    private string GenerateBackendContextPrompt(SubagentTask task, DevRequest devRequest)
    {
        return $@"# Backend API Development Task

## Project Context
- **Description**: {devRequest.Description}
- **Framework**: ASP.NET Core 9.0
- **Category**: {devRequest.Category}

## Your Task
{task.Description}

## Requirements
1. Create RESTful API endpoints following existing patterns
2. Implement service layer with business logic
3. Use dependency injection
4. Add proper error handling and validation
5. Follow .NET naming conventions

## Architecture Patterns
- Controllers handle HTTP concerns only
- Services contain business logic
- Repository pattern for data access
- DTOs for request/response models

## Example Controller
```csharp
[ApiController]
[Route(""api/[controller]"")]
public class UsersController : ControllerBase
{{
    private readonly IUserService _userService;

    [HttpGet(""{{id}}"")]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {{
        var user = await _userService.GetByIdAsync(id);
        return user == null ? NotFound() : Ok(user);
    }}
}}
```

Ensure your endpoints integrate seamlessly with the frontend expectations.";
    }

    private string GenerateFrontendContextPrompt(SubagentTask task, DevRequest devRequest)
    {
        var framework = devRequest.Framework?.ToLowerInvariant() ?? "react";

        return $@"# Frontend Development Task

## Project Context
- **Description**: {devRequest.Description}
- **Framework**: {framework.ToUpper()}
- **Category**: {devRequest.Category}

## Your Task
{task.Description}

## Requirements
1. Build responsive UI components following {framework} best practices
2. Integrate with backend API endpoints
3. Implement proper error handling and loading states
4. Use TypeScript for type safety
5. Follow accessibility guidelines (WCAG 2.1)

## Tech Stack
- **Framework**: {framework}
- **State Management**: Zustand (for React) or framework-specific
- **Styling**: Tailwind CSS + shadcn/ui components
- **HTTP Client**: Axios or Fetch API
- **Routing**: React Router (for React)

## Example Component
```tsx
import {{ useState, useEffect }} from 'react';
import {{ Button }} from '@/components/ui/button';

export function UserList() {{
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {{
    fetchUsers();
  }}, []);

  const fetchUsers = async () => {{
    try {{
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    }} catch (error) {{
      console.error('Failed to fetch users', error);
    }} finally {{
      setLoading(false);
    }}
  }};

  if (loading) return <div>Loading...</div>;

  return (
    <div className=""space-y-4"">
      {{users.map(user => (
        <div key={{user.id}}>{{user.email}}</div>
      ))}}
    </div>
  );
}}
```

Create polished, production-ready components.";
    }

    private string GenerateTestsContextPrompt(SubagentTask task, DevRequest devRequest)
    {
        return $@"# Testing Task

## Project Context
- **Description**: {devRequest.Description}
- **Framework**: {devRequest.Framework ?? "Not specified"}
- **Category**: {devRequest.Category}

## Your Task
{task.Description}

## Requirements
1. Write comprehensive unit tests for business logic
2. Create integration tests for API endpoints
3. Add E2E tests for critical user flows
4. Achieve >80% code coverage for new code
5. Use xUnit (backend) and Playwright (E2E)

## Testing Patterns
- **Unit Tests**: Test services in isolation with mocked dependencies
- **Integration Tests**: Test API endpoints with in-memory database
- **E2E Tests**: Test complete user workflows in browser

## Example Unit Test
```csharp
public class UserServiceTests
{{
    [Fact]
    public async Task GetByIdAsync_ExistingUser_ReturnsUser()
    {{
        // Arrange
        var mockRepo = new Mock<IUserRepository>();
        var expectedUser = new User {{ Id = Guid.NewGuid(), Email = ""test@example.com"" }};
        mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(expectedUser);
        var service = new UserService(mockRepo.Object);

        // Act
        var result = await service.GetByIdAsync(expectedUser.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedUser.Email, result.Email);
    }}
}}
```

Ensure tests are reliable, fast, and maintainable.";
    }

    private string GenerateDocsContextPrompt(SubagentTask task, DevRequest devRequest)
    {
        return $@"# Documentation Task

## Project Context
- **Description**: {devRequest.Description}
- **Framework**: {devRequest.Framework ?? "Not specified"}
- **Category**: {devRequest.Category}

## Your Task
{task.Description}

## Requirements
1. Write clear, comprehensive README
2. Document API endpoints (OpenAPI/Swagger)
3. Add deployment instructions
4. Include architecture diagrams
5. Provide code examples for common use cases

## Documentation Structure
- **README.md**: Project overview, setup, and quick start
- **API.md**: Detailed API documentation
- **DEPLOYMENT.md**: How to deploy to production
- **ARCHITECTURE.md**: System design and architecture decisions

## Example README Section
```markdown
# Project Name

## Quick Start

### Prerequisites
- .NET 9.0 SDK
- Node.js 20+
- PostgreSQL 16+

### Installation
\`\`\`bash
# Backend
cd platform/backend
dotnet restore
dotnet run

# Frontend
cd platform/frontend
npm install
npm run dev
\`\`\`

### API Endpoints
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/{{id}}` - Get user by ID
```

Make documentation beginner-friendly yet comprehensive.";
    }

    private string GenerateGenericContextPrompt(SubagentTask task, DevRequest devRequest)
    {
        return $@"# Task: {task.Name}

## Project Context
- **Description**: {devRequest.Description}
- **Framework**: {devRequest.Framework ?? "Not specified"}
- **Category**: {devRequest.Category}
- **Task Type**: {task.TaskType}

## Your Task
{task.Description}

## Additional Context
{task.ContextJson}

Complete this task following best practices for the tech stack and maintaining consistency with the rest of the project.";
    }

    public async Task<Dictionary<int, List<int>>> BuildDependencyGraphAsync(List<SubagentTask> tasks)
    {
        _logger.LogInformation("Building dependency graph for {TaskCount} tasks", tasks.Count);

        var graph = new Dictionary<int, List<int>>();

        foreach (var task in tasks)
        {
            graph[task.Id] = new List<int>();

            // Parse dependencies from context
            try
            {
                var context = JsonSerializer.Deserialize<Dictionary<string, object>>(task.ContextJson);
                if (context != null && context.ContainsKey("dependencies"))
                {
                    var deps = context["dependencies"];
                    if (deps is JsonElement jsonElement && jsonElement.ValueKind == JsonValueKind.Array)
                    {
                        var depTypes = jsonElement.EnumerateArray()
                            .Where(e => e.ValueKind == JsonValueKind.String)
                            .Select(e => e.GetString())
                            .Where(s => !string.IsNullOrEmpty(s))
                            .ToList();

                        // Find task IDs for these dependency types
                        foreach (var depType in depTypes)
                        {
                            var depTask = tasks.FirstOrDefault(t =>
                                t.TaskType.Equals(depType, StringComparison.OrdinalIgnoreCase));
                            if (depTask != null)
                            {
                                graph[task.Id].Add(depTask.Id);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse dependencies for task {TaskId}", task.Id);
            }
        }

        return graph;
    }
}

// DTOs for Claude API response
public class TaskDecomposition
{
    public List<TaskDefinition> Tasks { get; set; } = new();
}

public class TaskDefinition
{
    public string Type { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Context { get; set; } = "";
    public List<string> Dependencies { get; set; } = new();
}

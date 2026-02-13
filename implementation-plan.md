## Implementation Plan for #497: Real Docker-based Sandboxed Preview Execution

### Overview
Replace the current simulated `SandboxExecutionService` with real Docker container execution using Docker.DotNet SDK. This is Phase 1/5 of the sandboxed preview system (#10).

### Current State Analysis
- **SandboxExecutionService.cs** (L108-262): Currently uses `SimulateExecution()` method with mock data
- **Controller**: `SandboxExecutionController.cs` already has proper REST endpoints
- **Entity**: `SandboxExecution` entity properly models execution lifecycle
- **DI Registration**: Service registered as scoped in `Program.cs` (L95)

### Files to Create

#### 1. `Services/DockerExecutionService.cs`
**Purpose**: Core Docker SDK integration for container lifecycle management

**Interface**:
```csharp
public interface IDockerExecutionService
{
    Task<string> PullImageAsync(string imageName, CancellationToken ct = default);
    Task<string> CreateContainerAsync(string imageName, string command, ContainerConfig config, CancellationToken ct = default);
    Task StartContainerAsync(string containerId, CancellationToken ct = default);
    Task<ContainerExecutionResult> WaitForCompletionAsync(string containerId, TimeSpan timeout, CancellationToken ct = default);
    Task StopContainerAsync(string containerId, CancellationToken ct = default);
    Task RemoveContainerAsync(string containerId, CancellationToken ct = default);
}
```

**Key Responsibilities**:
- Pull Docker images (node:20-alpine, dotnet/sdk:9.0, etc.)
- Create containers with resource limits (512MB RAM, 1 vCPU)
- Security constraints: read-only root filesystem, no privileged mode, network isolation
- Container lifecycle: create → start → wait → stop → remove

**Implementation Details**:
- Use `Docker.DotNet.DockerClient` for all Docker operations
- Configure resource limits via `HostConfig`: `Memory = 512 * 1024 * 1024`, `NanoCPUs = 1_000_000_000`
- Set security options: `ReadonlyRootfs = true`, `NetworkMode = "none"`
- Handle image pull progress with logging
- Proper error handling and cleanup on failures

#### 2. `Services/ContainerLogStreamService.cs`
**Purpose**: Real-time log streaming and error detection from Docker containers

**Interface**:
```csharp
public interface IContainerLogStreamService
{
    Task<ContainerLogs> StreamLogsAsync(string containerId, CancellationToken ct = default);
    Task<List<ContainerError>> DetectErrorsAsync(string containerId, CancellationToken ct = default);
}
```

**Key Responsibilities**:
- Stream stdout/stderr from running containers
- Error pattern detection (compile errors, runtime exceptions, dependency issues)
- Log aggregation and parsing
- Integration points for AI error analysis (future)

**Error Patterns to Detect**:
- TypeScript: "TS[0-9]+:", "Cannot find module"
- .NET: "error CS[0-9]+:", "Build FAILED"
- Node.js: "Error:", "MODULE_NOT_FOUND", "ENOENT"
- Runtime: "Unhandled exception", "Segmentation fault"

### Files to Modify

#### 3. `Services/SandboxExecutionService.cs`
**Changes**:
- Remove `SimulateExecution()`, `SimulateBuild()`, `SimulateTest()`, `SimulatePreview()` methods (L108-262)
- Remove `SimulatedResult` and `ResourceUsageInfo` classes (L265-279)
- Inject `IDockerExecutionService` and `IContainerLogStreamService`
- Implement real Docker execution in `ExecuteInSandbox()` method:
  1. Map execution type to Docker image (build → node:20-alpine, test → node:20-alpine, preview → nginx:alpine)
  2. Call `DockerExecutionService.PullImageAsync()`
  3. Call `DockerExecutionService.CreateContainerAsync()` with resource limits
  4. Call `DockerExecutionService.StartContainerAsync()`
  5. Stream logs via `ContainerLogStreamService.StreamLogsAsync()`
  6. Wait for completion with timeout (5 minutes default)
  7. Collect exit code and resource usage
  8. Cleanup: stop and remove container
  9. Update `SandboxExecution` entity with real results

#### 4. `Program.cs`
**Changes**:
- Add Docker.DotNet client registration (singleton):
  ```csharp
  builder.Services.AddSingleton<IDockerClient>(provider =>
  {
      var dockerUri = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
          ? "npipe://./pipe/docker_engine"
          : "unix:///var/run/docker.sock";
      return new DockerClientConfiguration(new Uri(dockerUri)).CreateClient();
  });
  ```
- Register `IDockerExecutionService` as scoped (after L95)
- Register `IContainerLogStreamService` as scoped

#### 5. `AiDevRequest.API.csproj`
**Changes**:
- Add NuGet package: `<PackageReference Include="Docker.DotNet" Version="3.125.15" />`

### Testing Strategy

#### Unit Tests (`AiDevRequest.Tests/Services/`)
- **DockerExecutionServiceTests.cs**:
  - Test container creation with mocked `IDockerClient`
  - Test resource limit configuration
  - Test security constraints (read-only FS, network isolation)
  - Test error handling (image pull failure, container start failure)

- **ContainerLogStreamServiceTests.cs**:
  - Test log streaming with mocked Docker client
  - Test error pattern detection (all frameworks)
  - Test log aggregation

- **SandboxExecutionServiceTests.cs** (update existing):
  - Replace simulation tests with Docker integration tests
  - Mock `IDockerExecutionService` and `IContainerLogStreamService`
  - Test full execution flow (pull → create → start → logs → cleanup)
  - Test timeout handling
  - Test cleanup on failure

#### Integration Tests
- **Local Docker Tests**: Spin up real containers with Node.js, .NET, Python
- Verify logs are captured correctly
- Verify resource limits enforced (check `docker stats`)
- Verify container cleanup (no orphaned containers)
- Test concurrent executions (10+ containers)

#### E2E Tests (Future - not in Phase 1)
- Full preview flow with Azure Container Instances
- Production deployment verification

### Security Considerations

#### Container Isolation
- **Resource Limits**: 512MB RAM, 1 vCPU (prevents DoS)
- **Read-Only Filesystem**: `ReadonlyRootfs = true` (prevents malicious file writes)
- **Network Isolation**: `NetworkMode = "none"` (prevents data exfiltration)
- **No Privileged Mode**: Never set `Privileged = true`
- **User Namespace**: Run as non-root user where possible

#### Image Security
- **Trusted Images Only**: Whitelist of official images (node, dotnet, python, nginx)
- **Image Verification**: Verify image digests before pull
- **Regular Updates**: Use specific tags (node:20-alpine), update regularly

#### Execution Security
- **Timeout**: Max 5 minutes per execution (prevents runaway containers)
- **Container Cleanup**: Always cleanup, even on errors (prevent resource leaks)
- **Log Size Limits**: Cap logs at 10MB to prevent memory exhaustion
- **Secret Isolation**: Never pass secrets via environment variables (use mounted volumes in future phases)

### Dependencies

#### NuGet Package
- **Docker.DotNet** v3.125.15 (MIT license, official .NET Docker SDK)

#### Docker Requirements
- **Dev Environment**: Docker Desktop installed and running
- **CI/CD**: Docker available on GitHub Actions runners (already installed)
- **Production**: Azure Container Instances (Phase 2 - not in this ticket)

### Configuration

#### appsettings.json (new section)
```json
{
  "Docker": {
    "Enabled": true,
    "SocketPath": "unix:///var/run/docker.sock",
    "WindowsSocketPath": "npipe://./pipe/docker_engine",
    "DefaultTimeout": "00:05:00",
    "DefaultMemoryLimitMb": 512,
    "DefaultCpuLimit": 1.0,
    "AllowedImages": [
      "node:20-alpine",
      "node:22-alpine",
      "dotnet/sdk:9.0",
      "python:3.12-slim",
      "nginx:alpine"
    ]
  }
}
```

### Implementation Phases

#### Phase 1: Core Docker Integration (This Ticket)
1. Create `DockerExecutionService` with basic container lifecycle
2. Create `ContainerLogStreamService` with log streaming
3. Update `SandboxExecutionService` to use real Docker
4. Add Docker.DotNet dependency
5. Register services in Program.cs
6. Write unit tests with mocked Docker client
7. Write integration tests with real Docker

#### Phase 2: Production Deployment (Future Ticket)
- Azure Container Instances integration
- Production security hardening
- Persistent volume mounts
- Multi-region deployment

#### Phase 3: Advanced Features (Future Tickets)
- Live log streaming via WebSockets
- GPU support for AI workloads
- Custom Docker image builds
- Multi-container orchestration

### Success Criteria

- [ ] `DockerExecutionService` successfully pulls, creates, starts, and stops containers
- [ ] `ContainerLogStreamService` streams logs and detects errors
- [ ] `SandboxExecutionService` executes real Docker containers (no simulation)
- [ ] Resource limits enforced (512MB RAM, 1 vCPU)
- [ ] Security constraints active (read-only FS, network isolation)
- [ ] Containers cleaned up after execution (no orphans)
- [ ] Unit tests pass (90%+ coverage)
- [ ] Integration tests pass with real Docker containers
- [ ] All existing tests still pass (no regressions)

### Verification Steps

1. Start local Docker Desktop
2. Run API server: `dotnet run --project platform/backend/AiDevRequest.API`
3. Create sandbox execution: `POST /api/projects/{id}/sandbox/execute` with `executionType: "build"`
4. Verify container created: `docker ps -a | grep sandbox`
5. Verify logs captured: Check `OutputLog` in response
6. Verify resource limits: `docker stats` (should show 512MB limit)
7. Verify cleanup: `docker ps -a` (no orphaned containers)
8. Run tests: `dotnet test platform/backend/AiDevRequest.Tests`

### Estimated Effort
- **Implementation**: 2 days
- **Testing**: 1 day
- **Documentation**: 0.5 days
- **Total**: 3-4 days

### Next Steps (Post-Implementation)
1. Code review by team lead
2. Integration testing in dev environment
3. Documentation update (README, API docs)
4. Merge to main
5. Deploy to staging for QA
6. Phase 2: Azure Container Instances integration (separate ticket)

---

**Status**: Ready for implementation. Branch `497-docker-preview` created. Awaiting approval to begin development.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

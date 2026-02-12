using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISandboxExecutionService
{
    Task<SandboxExecution> ExecuteInSandbox(Guid devRequestId, string executionType, string command, string isolationLevel);
    Task<SandboxExecution?> GetLatestExecution(Guid devRequestId);
    Task<List<SandboxExecution>> GetExecutionHistory(Guid devRequestId);
    Task<SandboxExecution?> GetExecutionById(Guid executionId);
}

public class SandboxExecutionService : ISandboxExecutionService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SandboxExecutionService> _logger;

    public SandboxExecutionService(
        AiDevRequestDbContext context,
        ILogger<SandboxExecutionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<SandboxExecution> ExecuteInSandbox(Guid devRequestId, string executionType, string command, string isolationLevel)
    {
        var execution = new SandboxExecution
        {
            DevRequestId = devRequestId,
            Status = "running",
            ExecutionType = executionType,
            IsolationLevel = isolationLevel,
            Command = command,
            StartedAt = DateTime.UtcNow,
        };

        _context.SandboxExecutions.Add(execution);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Started sandbox execution {ExecutionId} for dev request {DevRequestId}: type={Type}, isolation={Isolation}, command={Command}",
            execution.Id, devRequestId, executionType, isolationLevel, command);

        try
        {
            // Simulate sandbox execution with realistic output
            var result = SimulateExecution(executionType, command, isolationLevel);

            execution.OutputLog = result.OutputLog;
            execution.ErrorLog = result.ErrorLog;
            execution.ExitCode = result.ExitCode;
            execution.ResourceUsage = JsonSerializer.Serialize(result.ResourceUsage);
            execution.SecurityViolationsJson = result.SecurityViolations.Count > 0
                ? JsonSerializer.Serialize(result.SecurityViolations)
                : null;

            execution.Status = result.ExitCode == 0 ? "completed" : "failed";
            execution.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Sandbox execution {ExecutionId} completed with exit code {ExitCode} for dev request {DevRequestId}",
                execution.Id, execution.ExitCode, devRequestId);

            return execution;
        }
        catch (Exception ex)
        {
            execution.Status = "failed";
            execution.ErrorLog = ex.Message;
            execution.ExitCode = 1;
            execution.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Sandbox execution {ExecutionId} failed for dev request {DevRequestId}",
                execution.Id, devRequestId);
            throw;
        }
    }

    public async Task<SandboxExecution?> GetLatestExecution(Guid devRequestId)
    {
        return await _context.SandboxExecutions
            .Where(e => e.DevRequestId == devRequestId)
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<SandboxExecution>> GetExecutionHistory(Guid devRequestId)
    {
        return await _context.SandboxExecutions
            .Where(e => e.DevRequestId == devRequestId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<SandboxExecution?> GetExecutionById(Guid executionId)
    {
        return await _context.SandboxExecutions
            .FirstOrDefaultAsync(e => e.Id == executionId);
    }

    private static SimulatedResult SimulateExecution(string executionType, string command, string isolationLevel)
    {
        var random = new Random();
        var durationMs = random.Next(800, 15000);
        var cpuPercent = Math.Round(random.NextDouble() * 80 + 5, 1);
        var memoryMb = random.Next(64, 512);

        var resourceUsage = new ResourceUsageInfo
        {
            CpuPercent = cpuPercent,
            MemoryMb = memoryMb,
            DurationMs = durationMs,
        };

        var violations = new List<string>();

        // Simulate security checks based on isolation level
        if (isolationLevel == "container" && command.Contains("sudo"))
        {
            violations.Add("Attempted privilege escalation via sudo (blocked)");
        }
        if (command.Contains("rm -rf /"))
        {
            violations.Add("Destructive filesystem operation blocked");
        }
        if (command.Contains("curl") || command.Contains("wget"))
        {
            if (isolationLevel != "container")
            {
                violations.Add("Network access restricted in " + isolationLevel + " isolation");
            }
        }

        return executionType switch
        {
            "build" => SimulateBuild(command, resourceUsage, violations),
            "test" => SimulateTest(command, resourceUsage, violations),
            "preview" => SimulatePreview(command, resourceUsage, violations),
            _ => new SimulatedResult
            {
                OutputLog = $"Unknown execution type: {executionType}",
                ErrorLog = "Unsupported execution type",
                ExitCode = 1,
                ResourceUsage = resourceUsage,
                SecurityViolations = violations,
            }
        };
    }

    private static SimulatedResult SimulateBuild(string command, ResourceUsageInfo resourceUsage, List<string> violations)
    {
        var output = $@"[sandbox] Initializing build environment...
[sandbox] Isolation: active
[sandbox] Running: {command}

> Installing dependencies...
  added 847 packages in 12.3s

> Compiling TypeScript...
  src/index.ts -> dist/index.js
  src/App.tsx -> dist/App.js
  src/components/Header.tsx -> dist/components/Header.js
  src/components/Footer.tsx -> dist/components/Footer.js
  src/utils/helpers.ts -> dist/utils/helpers.js

> Bundling with Vite...
  dist/assets/index-a1b2c3d4.js   142.35 kB | gzip: 45.12 kB
  dist/assets/index-e5f6g7h8.css   18.67 kB  | gzip:  4.23 kB
  dist/index.html                   0.46 kB  | gzip:  0.31 kB

Build completed successfully in {resourceUsage.DurationMs}ms";

        return new SimulatedResult
        {
            OutputLog = output,
            ErrorLog = "",
            ExitCode = 0,
            ResourceUsage = resourceUsage,
            SecurityViolations = violations,
        };
    }

    private static SimulatedResult SimulateTest(string command, ResourceUsageInfo resourceUsage, List<string> violations)
    {
        var random = new Random();
        var totalTests = random.Next(15, 60);
        var passedTests = totalTests - random.Next(0, 3);
        var failedTests = totalTests - passedTests;

        var output = $@"[sandbox] Initializing test environment...
[sandbox] Isolation: active
[sandbox] Running: {command}

 PASS  src/components/Header.test.tsx (8 tests)
 PASS  src/components/Footer.test.tsx (5 tests)
 PASS  src/utils/helpers.test.ts (12 tests)
{(failedTests > 0 ? " FAIL  src/App.test.tsx (3 tests)" : " PASS  src/App.test.tsx (3 tests)")}
 PASS  src/api/client.test.ts (6 tests)
 PASS  src/hooks/useAuth.test.ts (4 tests)

Test Suites: {(failedTests > 0 ? "1 failed, " : "")}{(failedTests > 0 ? 5 : 6)} passed, 6 total
Tests:       {(failedTests > 0 ? $"{failedTests} failed, " : "")}{passedTests} passed, {totalTests} total
Snapshots:   0 total
Time:        {resourceUsage.DurationMs / 1000.0:F1}s
Coverage:    {random.Next(72, 96)}% statements";

        var errorLog = failedTests > 0
            ? $@"FAIL src/App.test.tsx
  - renders main heading
    Expected: ""Welcome to the App""
    Received: ""Welcome""

  {failedTests} test(s) failed"
            : "";

        return new SimulatedResult
        {
            OutputLog = output,
            ErrorLog = errorLog,
            ExitCode = failedTests > 0 ? 1 : 0,
            ResourceUsage = resourceUsage,
            SecurityViolations = violations,
        };
    }

    private static SimulatedResult SimulatePreview(string command, ResourceUsageInfo resourceUsage, List<string> violations)
    {
        var output = $@"[sandbox] Initializing preview environment...
[sandbox] Isolation: active
[sandbox] Running: {command}

> Starting development server...
  VITE v5.4.0  ready in 1247ms

  Local:   http://localhost:3000/
  Network: http://sandbox-preview.internal:3000/

  Preview URL: https://preview-abc123.sandbox.aidev.app

> Serving static files from dist/
  index.html ........... 0.46 kB
  assets/index.js ...... 142.35 kB
  assets/index.css ..... 18.67 kB

Preview server running. Auto-shutdown in 30 minutes.";

        return new SimulatedResult
        {
            OutputLog = output,
            ErrorLog = "",
            ExitCode = 0,
            ResourceUsage = resourceUsage,
            SecurityViolations = violations,
        };
    }
}

internal class SimulatedResult
{
    public string OutputLog { get; set; } = "";
    public string ErrorLog { get; set; } = "";
    public int ExitCode { get; set; }
    public ResourceUsageInfo ResourceUsage { get; set; } = new();
    public List<string> SecurityViolations { get; set; } = new();
}

public class ResourceUsageInfo
{
    public double CpuPercent { get; set; }
    public int MemoryMb { get; set; }
    public int DurationMs { get; set; }
}

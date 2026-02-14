using System.Text;
using System.Text.RegularExpressions;
using Docker.DotNet;
using Docker.DotNet.Models;

namespace AiDevRequest.API.Services;

public interface IContainerLogStreamService
{
    Task<(string Stdout, string Stderr)> GetLogsAsync(string containerId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<ContainerLogEntry> StreamLogsAsync(string containerId, CancellationToken cancellationToken = default);
    Task<List<string>> DetectErrorsAsync(string containerId, CancellationToken cancellationToken = default);
}

public class ContainerLogStreamService : IContainerLogStreamService
{
    private readonly IDockerClient _dockerClient;
    private readonly ILogger<ContainerLogStreamService> _logger;

    // Error detection patterns
    private static readonly Regex[] ErrorPatterns = new[]
    {
        new Regex(@"error[:\s]", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"exception[:\s]", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"fail(ed)?[:\s]", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"cannot find module", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"compilation (error|failed)", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"syntax error", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"undefined reference", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"segmentation fault", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"permission denied", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"command not found", RegexOptions.IgnoreCase | RegexOptions.Compiled),
    };

    public ContainerLogStreamService(IDockerClient dockerClient, ILogger<ContainerLogStreamService> logger)
    {
        _dockerClient = dockerClient;
        _logger = logger;
    }

    public async Task<(string Stdout, string Stderr)> GetLogsAsync(string containerId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Fetching logs for container: {ContainerId}", containerId);

        try
        {
            var parameters = new ContainerLogsParameters
            {
                ShowStdout = true,
                ShowStderr = true,
                Timestamps = false,
                Follow = false,
            };

            using var logStream = await _dockerClient.Containers.GetContainerLogsAsync(
                containerId,
                false, // tty
                parameters,
                cancellationToken);

            var (stdout, stderr) = await ParseDockerLogsAsync(logStream, cancellationToken);

            _logger.LogInformation(
                "Retrieved logs for container {ContainerId}: stdout={StdoutLength} chars, stderr={StderrLength} chars",
                containerId,
                stdout.Length,
                stderr.Length);

            return (stdout, stderr);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch logs for container: {ContainerId}", containerId);
            throw;
        }
    }

    public async IAsyncEnumerable<ContainerLogEntry> StreamLogsAsync(
        string containerId,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting log stream for container: {ContainerId}", containerId);

        var parameters = new ContainerLogsParameters
        {
            ShowStdout = true,
            ShowStderr = true,
            Timestamps = true,
            Follow = true,
        };

        using var logStream = await _dockerClient.Containers.GetContainerLogsAsync(
            containerId,
            false, // tty
            parameters,
            cancellationToken);

        await foreach (var entry in ParseDockerLogStreamAsync(logStream, cancellationToken))
        {
            yield return entry;
        }

        _logger.LogInformation("Log stream ended for container: {ContainerId}", containerId);
    }

    public async Task<List<string>> DetectErrorsAsync(string containerId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Detecting errors in container logs: {ContainerId}", containerId);

        var (stdout, stderr) = await GetLogsAsync(containerId, cancellationToken);
        var allLogs = stdout + "\n" + stderr;

        var errors = new List<string>();
        var lines = allLogs.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            foreach (var pattern in ErrorPatterns)
            {
                if (pattern.IsMatch(line))
                {
                    errors.Add(line.Trim());
                    break; // Avoid duplicate matches for same line
                }
            }
        }

        _logger.LogInformation(
            "Detected {ErrorCount} error lines in container {ContainerId}",
            errors.Count,
            containerId);

        return errors;
    }

    private static async Task<(string Stdout, string Stderr)> ParseDockerLogsAsync(
        MultiplexedStream stream,
        CancellationToken cancellationToken = default)
    {
        var stdout = new StringBuilder();
        var stderr = new StringBuilder();

        var buffer = new byte[8192];

        while (true)
        {
            var result = await stream.ReadOutputAsync(buffer, 0, buffer.Length, cancellationToken);
            if (result.Count == 0)
                break;

            var message = Encoding.UTF8.GetString(buffer, 0, result.Count);

            if (result.Target == MultiplexedStream.TargetStream.StandardOut)
            {
                stdout.Append(message);
            }
            else if (result.Target == MultiplexedStream.TargetStream.StandardError)
            {
                stderr.Append(message);
            }
        }

        return (stdout.ToString(), stderr.ToString());
    }

    private static async IAsyncEnumerable<ContainerLogEntry> ParseDockerLogStreamAsync(
        MultiplexedStream stream,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var buffer = new byte[8192];

        while (true)
        {
            var result = await stream.ReadOutputAsync(buffer, 0, buffer.Length, cancellationToken);
            if (result.Count == 0)
                break;

            var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
            var logType = result.Target == MultiplexedStream.TargetStream.StandardOut
                ? LogType.Stdout
                : LogType.Stderr;

            yield return new ContainerLogEntry
            {
                Type = logType,
                Message = message,
                Timestamp = DateTime.UtcNow,
            };
        }
    }
}

public record ContainerLogEntry
{
    public LogType Type { get; init; }
    public string Message { get; init; } = "";
    public DateTime Timestamp { get; init; }
}

public enum LogType
{
    Stdout = 1,
    Stderr = 2,
}

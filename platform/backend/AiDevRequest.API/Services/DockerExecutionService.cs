using Docker.DotNet;
using Docker.DotNet.Models;

namespace AiDevRequest.API.Services;

public interface IDockerExecutionService
{
    Task<string> PullImageAsync(string imageName, IProgress<JSONMessage>? progress = null, CancellationToken cancellationToken = default);
    Task<string> CreateContainerAsync(string imageName, string[] command, Dictionary<string, string>? environmentVariables = null, CancellationToken cancellationToken = default);
    Task StartContainerAsync(string containerId, CancellationToken cancellationToken = default);
    Task<ContainerInspectResponse> InspectContainerAsync(string containerId, CancellationToken cancellationToken = default);
    Task StopContainerAsync(string containerId, TimeSpan? timeout = null, CancellationToken cancellationToken = default);
    Task RemoveContainerAsync(string containerId, bool force = false, CancellationToken cancellationToken = default);
    Task<(int ExitCode, string? FinishedAt)> WaitForContainerAsync(string containerId, CancellationToken cancellationToken = default);
}

public class DockerExecutionService : IDockerExecutionService
{
    private readonly IDockerClient _dockerClient;
    private readonly ILogger<DockerExecutionService> _logger;

    // Security limits
    private const long MaxMemoryBytes = 512 * 1024 * 1024; // 512MB
    private const long MaxCpuQuota = 100000; // 1 vCPU (100% of 100000)
    private const long CpuPeriod = 100000;

    public DockerExecutionService(IDockerClient dockerClient, ILogger<DockerExecutionService> logger)
    {
        _dockerClient = dockerClient;
        _logger = logger;
    }

    public async Task<string> PullImageAsync(string imageName, IProgress<JSONMessage>? progress = null, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Pulling Docker image: {ImageName}", imageName);

        try
        {
            await _dockerClient.Images.CreateImageAsync(
                new ImagesCreateParameters
                {
                    FromImage = imageName,
                    Tag = "latest"
                },
                null,
                progress ?? new Progress<JSONMessage>(),
                cancellationToken);

            _logger.LogInformation("Successfully pulled image: {ImageName}", imageName);
            return imageName;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to pull Docker image: {ImageName}", imageName);
            throw;
        }
    }

    public async Task<string> CreateContainerAsync(
        string imageName,
        string[] command,
        Dictionary<string, string>? environmentVariables = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating Docker container from image: {ImageName}", imageName);

        try
        {
            var envVars = environmentVariables?.Select(kvp => $"{kvp.Key}={kvp.Value}").ToList() ?? new List<string>();

            var createParams = new CreateContainerParameters
            {
                Image = imageName,
                Cmd = command,
                Env = envVars,
                HostConfig = new HostConfig
                {
                    // Resource limits (security)
                    Memory = MaxMemoryBytes,
                    NanoCPUs = MaxCpuQuota * 10000, // Convert to nanocpus
                    CPUQuota = MaxCpuQuota,
                    CPUPeriod = CpuPeriod,

                    // Security: read-only root filesystem
                    ReadonlyRootfs = true,

                    // Network isolation
                    NetworkMode = "none",

                    // Disable privileged mode
                    Privileged = false,

                    // Auto-remove container after exit
                    AutoRemove = false, // We'll manually remove after collecting logs
                },
                // Working directory
                WorkingDir = "/workspace",
                // Attach streams for log collection
                AttachStdout = true,
                AttachStderr = true,
            };

            var response = await _dockerClient.Containers.CreateContainerAsync(createParams, cancellationToken);

            _logger.LogInformation("Created container with ID: {ContainerId}", response.ID);
            return response.ID;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Docker container from image: {ImageName}", imageName);
            throw;
        }
    }

    public async Task StartContainerAsync(string containerId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting Docker container: {ContainerId}", containerId);

        try
        {
            var started = await _dockerClient.Containers.StartContainerAsync(
                containerId,
                new ContainerStartParameters(),
                cancellationToken);

            if (!started)
            {
                _logger.LogWarning("Container {ContainerId} was already started", containerId);
            }
            else
            {
                _logger.LogInformation("Successfully started container: {ContainerId}", containerId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start Docker container: {ContainerId}", containerId);
            throw;
        }
    }

    public async Task<ContainerInspectResponse> InspectContainerAsync(string containerId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dockerClient.Containers.InspectContainerAsync(containerId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to inspect Docker container: {ContainerId}", containerId);
            throw;
        }
    }

    public async Task StopContainerAsync(string containerId, TimeSpan? timeout = null, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Stopping Docker container: {ContainerId}", containerId);

        try
        {
            var stopTimeout = timeout ?? TimeSpan.FromSeconds(10);
            await _dockerClient.Containers.StopContainerAsync(
                containerId,
                new ContainerStopParameters { WaitBeforeKillSeconds = (uint)stopTimeout.TotalSeconds },
                cancellationToken);

            _logger.LogInformation("Successfully stopped container: {ContainerId}", containerId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to stop Docker container: {ContainerId}", containerId);
            throw;
        }
    }

    public async Task RemoveContainerAsync(string containerId, bool force = false, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Removing Docker container: {ContainerId}", containerId);

        try
        {
            await _dockerClient.Containers.RemoveContainerAsync(
                containerId,
                new ContainerRemoveParameters { Force = force },
                cancellationToken);

            _logger.LogInformation("Successfully removed container: {ContainerId}", containerId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove Docker container: {ContainerId}", containerId);
            throw;
        }
    }

    public async Task<(int ExitCode, string? FinishedAt)> WaitForContainerAsync(string containerId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Waiting for Docker container to complete: {ContainerId}", containerId);

        try
        {
            var waitResponse = await _dockerClient.Containers.WaitContainerAsync(containerId, cancellationToken);

            var inspect = await InspectContainerAsync(containerId, cancellationToken);
            var finishedAt = inspect.State.FinishedAt;

            _logger.LogInformation(
                "Container {ContainerId} finished with exit code: {ExitCode}",
                containerId,
                waitResponse.StatusCode);

            return ((int)waitResponse.StatusCode, finishedAt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to wait for Docker container: {ContainerId}", containerId);
            throw;
        }
    }
}

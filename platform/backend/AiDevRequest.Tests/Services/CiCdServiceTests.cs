using AiDevRequest.API.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class CiCdServiceTests
{
    private CiCdService CreateService()
    {
        var logger = new Mock<ILogger<CiCdService>>();
        return new CiCdService(logger.Object);
    }

    [Fact]
    public async Task GeneratePipelineAsync_ReturnsPipelineResult()
    {
        var service = CreateService();

        // Use a temp directory to simulate a project
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);

        try
        {
            var result = await service.GeneratePipelineAsync(tempDir, "react");

            Assert.NotNull(result);
            Assert.NotEmpty(result.PipelineProvider);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }

    [Fact]
    public async Task GeneratePipelineAsync_ReturnsForDotnet()
    {
        var service = CreateService();
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);

        try
        {
            var result = await service.GeneratePipelineAsync(tempDir, "dotnet");

            Assert.NotNull(result);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }

    [Fact]
    public async Task GeneratePipelineAsync_ReturnsForPython()
    {
        var service = CreateService();
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);

        try
        {
            var result = await service.GeneratePipelineAsync(tempDir, "python");

            Assert.NotNull(result);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }
}

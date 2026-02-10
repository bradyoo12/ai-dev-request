using AiDevRequest.API.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class ExportServiceTests
{
    private ExportService CreateService()
    {
        var logger = new Mock<ILogger<ExportService>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());
        return new ExportService(logger.Object, httpClientFactory.Object);
    }

    [Fact]
    public async Task ExportAsZipAsync_ThrowsForNonExistentPath()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ExportAsZipAsync("/nonexistent/path", "test-project"));
    }

    [Fact]
    public async Task ExportAsZipAsync_ReturnsZipBytes()
    {
        var service = CreateService();
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);
        File.WriteAllText(Path.Combine(tempDir, "index.html"), "<html></html>");

        try
        {
            var zipBytes = await service.ExportAsZipAsync(tempDir, "test-project");

            Assert.NotEmpty(zipBytes);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }
}

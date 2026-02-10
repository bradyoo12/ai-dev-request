using AiDevRequest.API.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class DatabaseSchemaServiceTests
{
    private DatabaseSchemaService CreateService()
    {
        var logger = new Mock<ILogger<DatabaseSchemaService>>();
        return new DatabaseSchemaService(logger.Object);
    }

    [Fact]
    public async Task GenerateSchemaAsync_ReturnsSchemaResult()
    {
        var service = CreateService();
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);

        try
        {
            var result = await service.GenerateSchemaAsync(tempDir, "react", "An e-commerce app");

            Assert.NotNull(result);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }

    [Fact]
    public async Task GenerateSchemaAsync_ReturnsForDotnet()
    {
        var service = CreateService();
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);

        try
        {
            var result = await service.GenerateSchemaAsync(tempDir, "dotnet", "A blog platform");

            Assert.NotNull(result);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }
}

using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class RequestsControllerTests
{
    private RequestsController CreateController(
        AiDevRequestDbContext? db = null,
        Mock<IAnalysisService>? analysisService = null,
        Mock<IProposalService>? proposalService = null,
        Mock<IProductionService>? productionService = null,
        Mock<ITokenService>? tokenService = null,
        Mock<IBuildVerificationService>? verificationService = null,
        Mock<IAccessibilityService>? accessibilityService = null,
        Mock<ITestGenerationService>? testGenerationService = null,
        Mock<ICodeReviewService>? codeReviewService = null,
        Mock<ICiCdService>? ciCdService = null,
        Mock<IExportService>? exportService = null,
        Mock<IDatabaseSchemaService>? databaseSchemaService = null,
        Mock<IProjectVersionService>? versionService = null,
        Mock<IExpoPreviewService>? expoPreviewService = null,
        Mock<ISelfHealingService>? selfHealingService = null)
    {
        db ??= TestDbContextFactory.Create();
        analysisService ??= new Mock<IAnalysisService>();
        proposalService ??= new Mock<IProposalService>();
        productionService ??= new Mock<IProductionService>();
        tokenService ??= new Mock<ITokenService>();
        verificationService ??= new Mock<IBuildVerificationService>();
        accessibilityService ??= new Mock<IAccessibilityService>();
        testGenerationService ??= new Mock<ITestGenerationService>();
        codeReviewService ??= new Mock<ICodeReviewService>();
        ciCdService ??= new Mock<ICiCdService>();
        exportService ??= new Mock<IExportService>();
        databaseSchemaService ??= new Mock<IDatabaseSchemaService>();
        versionService ??= new Mock<IProjectVersionService>();
        expoPreviewService ??= new Mock<IExpoPreviewService>();
        selfHealingService ??= new Mock<ISelfHealingService>();
        var logger = new Mock<ILogger<RequestsController>>();

        return new RequestsController(
            db,
            analysisService.Object,
            proposalService.Object,
            productionService.Object,
            tokenService.Object,
            verificationService.Object,
            accessibilityService.Object,
            testGenerationService.Object,
            codeReviewService.Object,
            ciCdService.Object,
            exportService.Object,
            databaseSchemaService.Object,
            versionService.Object,
            expoPreviewService.Object,
            selfHealingService.Object,
            logger.Object);
    }

    [Fact]
    public async Task GetRequests_ReturnsOk_WithEmptyList()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequests();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetRequest_ReturnsNotFound_WhenDoesNotExist()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequest(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetRequest_ReturnsOk_WhenExists()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequest(requestId);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetRequest_ReturnsForbidden_WhenNotOwned()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "other-user",
            Description = "Test request",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequest(requestId);

        var statusResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(403, statusResult.StatusCode);
    }

    [Fact]
    public async Task GetAnalysis_ReturnsNotFound_WhenNoAnalysis()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetAnalysis(requestId);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetProposal_ReturnsNotFound_WhenNoProposal()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Analyzed
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetProposal(requestId);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task CompleteRequest_ReturnsOk()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Staging
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CompleteRequest(requestId);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetBuildStatus_ReturnsNotFound_WhenDoesNotExist()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetBuildStatus(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetVerification_ReturnsNotFound_WhenNone()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Staging
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetVerification(requestId);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GenerateProposal_ReturnsBadRequest_WhenNoAnalysis()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GenerateProposal(requestId);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task StartBuild_ReturnsBadRequest_WhenNotApproved()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.StartBuild(requestId);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task ApproveProposal_ReturnsBadRequest_WhenNoProposal()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.ProposalReady
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ApproveProposal(requestId);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task ExportZip_ReturnsBadRequest_WhenNoProjectPath()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Completed
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ExportZip(requestId);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetVersions_ReturnsOk()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Completed
        });
        await db.SaveChangesAsync();

        var versionService = new Mock<IProjectVersionService>();
        versionService.Setup(s => s.GetVersionsAsync(requestId))
            .ReturnsAsync(new List<ProjectVersion>());

        var controller = CreateController(db: db, versionService: versionService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetVersions(requestId);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task RollbackToVersion_ReturnsNotFound_WhenNull()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request",
            Status = RequestStatus.Completed
        });
        await db.SaveChangesAsync();

        var versionService = new Mock<IProjectVersionService>();
        versionService.Setup(s => s.RollbackAsync(requestId, It.IsAny<Guid>()))
            .ReturnsAsync((ProjectVersion?)null);

        var controller = CreateController(db: db, versionService: versionService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RollbackToVersion(requestId, Guid.NewGuid());

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }
}

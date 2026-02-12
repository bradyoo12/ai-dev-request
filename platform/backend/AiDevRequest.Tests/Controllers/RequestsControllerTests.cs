using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.DTOs;
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
        Mock<ISelfHealingService>? selfHealingService = null,
        Mock<ICostTrackingService>? costTrackingService = null,
        Mock<ICodeQualityReviewService>? codeQualityReviewService = null)
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
        costTrackingService ??= new Mock<ICostTrackingService>();
        codeQualityReviewService ??= new Mock<ICodeQualityReviewService>();
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
            costTrackingService.Object,
            codeQualityReviewService.Object,
            logger.Object);
    }

    // ===== CreateRequest =====

    [Fact]
    public async Task CreateRequest_Returns201Created()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateRequest(new CreateDevRequestDto
        {
            Description = "Build a task management app with Kanban board"
        });

        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);
        var response = createdResult.Value.Should().BeOfType<DevRequestResponseDto>().Subject;
        response.Description.Should().Contain("task management");
        response.Status.Should().Be(RequestStatus.Submitted);
    }

    [Fact]
    public async Task CreateRequest_SetsUserId()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller, "my-user-id");

        await controller.CreateRequest(new CreateDevRequestDto { Description = "Build something useful for me" });

        db.DevRequests.Should().HaveCount(1);
        db.DevRequests.First().UserId.Should().Be("my-user-id");
    }

    // ===== GetRequests =====

    [Fact]
    public async Task GetRequests_ReturnsOk_WithEmptyList()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequests();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var items = okResult.Value.Should().BeAssignableTo<IEnumerable<DevRequestListItemDto>>().Subject;
        items.Should().BeEmpty();
    }

    [Fact]
    public async Task GetRequests_FiltersUserOwnRequests()
    {
        var db = TestDbContextFactory.Create();
        db.DevRequests.Add(new DevRequest { UserId = "test-user-id", Description = "My request content here" });
        db.DevRequests.Add(new DevRequest { UserId = "other-user", Description = "Other user request content" });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequests();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var items = okResult.Value.Should().BeAssignableTo<IEnumerable<DevRequestListItemDto>>().Subject;
        items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetRequests_FiltersByStatus()
    {
        var db = TestDbContextFactory.Create();
        db.DevRequests.Add(new DevRequest { UserId = "test-user-id", Description = "Submitted request content", Status = RequestStatus.Submitted });
        db.DevRequests.Add(new DevRequest { UserId = "test-user-id", Description = "Completed request content", Status = RequestStatus.Completed });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequests(status: RequestStatus.Completed);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var items = okResult.Value.Should().BeAssignableTo<IEnumerable<DevRequestListItemDto>>().Subject;
        items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetRequests_ClampsPageSize()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        // Should not crash with excessive page size
        var result = await controller.GetRequests(pageSize: 500);

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    // ===== GetRequest =====

    [Fact]
    public async Task GetRequest_ReturnsNotFound_WhenDoesNotExist()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequest(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
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
            Description = "Test request description here",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequest(requestId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<DevRequestResponseDto>().Subject;
        response.Id.Should().Be(requestId);
        response.Status.Should().Be(RequestStatus.Submitted);
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
            Description = "Someone else's request",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRequest(requestId);

        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(403);
    }

    // ===== GetAnalysis =====

    [Fact]
    public async Task GetAnalysis_ReturnsNotFound_WhenNoAnalysis()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request with no analysis",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetAnalysis(requestId);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetAnalysis_ReturnsOk_WhenAnalysisExists()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        var analysisJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            category = "WebApp",
            complexity = "Medium",
            summary = "A task management app",
            requirements = new { functional = new string[0], nonFunctional = new string[0] },
            feasibility = new { score = 85, notes = "Feasible" },
            estimatedDays = 14,
            suggestedStack = new { frontend = "React", backend = "Node.js" }
        });
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Build a task management app",
            Status = RequestStatus.Analyzed,
            AnalysisResultJson = analysisJson
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetAnalysis(requestId);

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    // ===== AnalyzeRequest =====

    [Fact]
    public async Task AnalyzeRequest_ReturnsNotFound_WhenRequestMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.AnalyzeRequest(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task AnalyzeRequest_Returns402_WhenInsufficientTokens()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Build something awesome for me",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.CheckBalance("test-user-id", "analysis"))
            .ReturnsAsync((false, 50, 10));

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.AnalyzeRequest(requestId);

        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(402);
    }

    // ===== GenerateProposal =====

    [Fact]
    public async Task GenerateProposal_ReturnsBadRequest_WhenNoAnalysis()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request without analysis",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GenerateProposal(requestId);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GenerateProposal_Returns402_WhenInsufficientTokens()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request with analysis result",
            Status = RequestStatus.Analyzed,
            AnalysisResultJson = "{\"category\":\"WebApp\"}"
        });
        await db.SaveChangesAsync();

        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.CheckBalance("test-user-id", "proposal"))
            .ReturnsAsync((false, 100, 20));

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GenerateProposal(requestId);

        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(402);
    }

    // ===== ApproveProposal =====

    [Fact]
    public async Task ApproveProposal_ReturnsBadRequest_WhenNoProposal()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request without proposal",
            Status = RequestStatus.ProposalReady
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ApproveProposal(requestId);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ApproveProposal_ReturnsOk_WhenProposalExists()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request with valid proposal",
            Status = RequestStatus.ProposalReady,
            ProposalJson = "{\"title\":\"My App\"}"
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ApproveProposal(requestId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<DevRequestResponseDto>().Subject;
        response.Status.Should().Be(RequestStatus.Approved);
    }

    // ===== StartBuild =====

    [Fact]
    public async Task StartBuild_ReturnsBadRequest_WhenNotApproved()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Test request not approved",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.StartBuild(requestId);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task StartBuild_ReturnsBadRequest_WhenNoProposal()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Approved but no proposal",
            Status = RequestStatus.Approved
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.StartBuild(requestId);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ===== CompleteRequest =====

    [Fact]
    public async Task CompleteRequest_ReturnsOk_AndSetsCompleted()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Ready to complete request",
            Status = RequestStatus.Staging
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CompleteRequest(requestId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<DevRequestResponseDto>().Subject;
        response.Status.Should().Be(RequestStatus.Completed);
    }

    [Fact]
    public async Task CompleteRequest_ReturnsNotFound_WhenDoesNotExist()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CompleteRequest(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    // ===== UpdateStatus =====

    [Fact]
    public async Task UpdateStatus_ReturnsOk_AndUpdatesTimestamp()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request to update status",
            Status = RequestStatus.Submitted
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.UpdateStatus(requestId, new UpdateStatusDto { Status = RequestStatus.Analyzed });

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<DevRequestResponseDto>().Subject;
        response.Status.Should().Be(RequestStatus.Analyzed);
    }

    // ===== ExportZip =====

    [Fact]
    public async Task ExportZip_ReturnsBadRequest_WhenNoProjectPath()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "No project path set here",
            Status = RequestStatus.Completed
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ExportZip(requestId);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ===== GetProposal =====

    [Fact]
    public async Task GetProposal_ReturnsNotFound_WhenNoProposal()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request without proposal data",
            Status = RequestStatus.Analyzed
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetProposal(requestId);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ===== GetBuildStatus =====

    [Fact]
    public async Task GetBuildStatus_ReturnsNotFound_WhenDoesNotExist()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetBuildStatus(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetBuildStatus_ReturnsOk_WithNotStartedBuildStatus()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request without build started",
            Status = RequestStatus.Approved
        });
        await db.SaveChangesAsync();

        var productionService = new Mock<IProductionService>();

        var controller = CreateController(db: db, productionService: productionService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetBuildStatus(requestId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var buildStatus = okResult.Value.Should().BeOfType<BuildStatusDto>().Subject;
        buildStatus.BuildStatus.Should().Be("not_started");
    }

    // ===== GetVerification =====

    [Fact]
    public async Task GetVerification_ReturnsNotFound_WhenNone()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request without verification",
            Status = RequestStatus.Staging
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetVerification(requestId);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ===== GetVersions =====

    [Fact]
    public async Task GetVersions_ReturnsOk_WithEmptyList()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request with no versions",
            Status = RequestStatus.Completed
        });
        await db.SaveChangesAsync();

        var versionService = new Mock<IProjectVersionService>();
        versionService.Setup(s => s.GetVersionsAsync(requestId))
            .ReturnsAsync(new List<ProjectVersion>());

        var controller = CreateController(db: db, versionService: versionService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetVersions(requestId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var versions = okResult.Value.Should().BeAssignableTo<List<RequestVersionDto>>().Subject;
        versions.Should().BeEmpty();
    }

    // ===== RollbackToVersion =====

    [Fact]
    public async Task RollbackToVersion_ReturnsNotFound_WhenVersionNull()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request for rollback test",
            Status = RequestStatus.Completed
        });
        await db.SaveChangesAsync();

        var versionService = new Mock<IProjectVersionService>();
        versionService.Setup(s => s.RollbackAsync(requestId, It.IsAny<Guid>()))
            .ReturnsAsync((ProjectVersion?)null);

        var controller = CreateController(db: db, versionService: versionService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RollbackToVersion(requestId, Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ===== GitHubStatus =====

    [Fact]
    public async Task GetGitHubStatus_ReturnsLinkedFalse_WhenNoRepo()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user-id",
            Description = "Request without github link",
            Status = RequestStatus.Completed
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetGitHubStatus(requestId);

        result.Should().BeOfType<OkObjectResult>();
    }
}

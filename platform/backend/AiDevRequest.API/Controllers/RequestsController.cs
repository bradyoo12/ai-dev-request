using System.Security.Claims;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.DTOs;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly IAnalysisService _analysisService;
    private readonly IProposalService _proposalService;
    private readonly IProductionService _productionService;
    private readonly ITokenService _tokenService;
    private readonly IBuildVerificationService _verificationService;
    private readonly IAccessibilityService _accessibilityService;
    private readonly ITestGenerationService _testGenerationService;
    private readonly ICodeReviewService _codeReviewService;
    private readonly ICiCdService _ciCdService;
    private readonly IExportService _exportService;
    private readonly IDatabaseSchemaService _databaseSchemaService;
    private readonly IProjectVersionService _versionService;
    private readonly IExpoPreviewService _expoPreviewService;
    private readonly ISelfHealingService _selfHealingService;
    private readonly ILogger<RequestsController> _logger;

    public RequestsController(
        AiDevRequestDbContext context,
        IAnalysisService analysisService,
        IProposalService proposalService,
        IProductionService productionService,
        ITokenService tokenService,
        IBuildVerificationService verificationService,
        IAccessibilityService accessibilityService,
        ITestGenerationService testGenerationService,
        ICodeReviewService codeReviewService,
        ICiCdService ciCdService,
        IExportService exportService,
        IDatabaseSchemaService databaseSchemaService,
        IProjectVersionService versionService,
        IExpoPreviewService expoPreviewService,
        ISelfHealingService selfHealingService,
        ILogger<RequestsController> logger)
    {
        _context = context;
        _analysisService = analysisService;
        _proposalService = proposalService;
        _productionService = productionService;
        _tokenService = tokenService;
        _verificationService = verificationService;
        _accessibilityService = accessibilityService;
        _testGenerationService = testGenerationService;
        _codeReviewService = codeReviewService;
        _ciCdService = ciCdService;
        _exportService = exportService;
        _databaseSchemaService = databaseSchemaService;
        _versionService = versionService;
        _expoPreviewService = expoPreviewService;
        _selfHealingService = selfHealingService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    private async Task<(DevRequest? entity, ActionResult? error)> GetOwnedEntityAsync(Guid id)
    {
        var entity = await _context.DevRequests.FindAsync(id);
        if (entity == null)
            return (null, NotFound());
        if (entity.UserId != GetUserId())
            return (null, StatusCode(403, new { error = "이 요청에 대한 접근 권한이 없습니다." }));
        return (entity, null);
    }

    /// <summary>
    /// Create a new development request
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(DevRequestResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DevRequestResponseDto>> CreateRequest([FromBody] CreateDevRequestDto dto)
    {
        var userId = GetUserId();
        var entity = dto.ToEntity(userId);

        _context.DevRequests.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("New dev request created: {RequestId} by user {UserId}", entity.Id, userId);

        return CreatedAtAction(
            nameof(GetRequest),
            new { id = entity.Id },
            entity.ToResponseDto()
        );
    }

    /// <summary>
    /// Get a specific development request by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DevRequestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DevRequestResponseDto>> GetRequest(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        return Ok(entity!.ToResponseDto());
    }

    /// <summary>
    /// Get all development requests (paginated) - filtered by current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DevRequestListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DevRequestListItemDto>>> GetRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RequestStatus? status = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var userId = GetUserId();
        var query = _context.DevRequests.Where(r => r.UserId == userId);

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => r.ToListItemDto())
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>
    /// Analyze a development request using AI
    /// </summary>
    [HttpPost("{id:guid}/analyze")]
    [ProducesResponseType(typeof(AnalysisResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AnalysisResponseDto>> AnalyzeRequest(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        // Token gating: check balance before executing
        var userId = GetUserId();
        var (hasEnough, cost, balance) = await _tokenService.CheckBalance(userId, "analysis");
        if (!hasEnough)
        {
            return StatusCode(402, new
            {
                error = "Insufficient tokens.",
                required = cost,
                balance,
                shortfall = cost - balance,
                action = "analysis"
            });
        }

        // Update status to analyzing
        entity!.Status = RequestStatus.Analyzing;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Starting analysis for request {RequestId}", id);

        try
        {
            // Call AI analysis service (with optional screenshot for multimodal analysis)
            var analysisResult = await _analysisService.AnalyzeRequestAsync(
                entity.Description, entity.ScreenshotBase64, entity.ScreenshotMediaType);

            // Update entity with analysis results
            entity.AnalysisResultJson = JsonSerializer.Serialize(analysisResult);
            entity.Category = Enum.TryParse<RequestCategory>(analysisResult.Category, true, out var cat)
                ? cat
                : RequestCategory.Other;
            entity.Complexity = Enum.TryParse<RequestComplexity>(analysisResult.Complexity, true, out var comp)
                ? comp
                : RequestComplexity.Unknown;
            entity.Status = RequestStatus.Analyzed;
            entity.AnalyzedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Deduct tokens only after successful completion
            var transaction = await _tokenService.DebitTokens(userId, "analysis", id.ToString());

            _logger.LogInformation("Analysis completed for request {RequestId}: {Category}, {Complexity}",
                id, entity.Category, entity.Complexity);

            return Ok(new AnalysisResponseDto
            {
                RequestId = id,
                Category = analysisResult.Category,
                Complexity = analysisResult.Complexity,
                Summary = analysisResult.Summary,
                Requirements = analysisResult.Requirements,
                Feasibility = analysisResult.Feasibility,
                EstimatedDays = analysisResult.EstimatedDays,
                SuggestedStack = analysisResult.SuggestedStack,
                TokensUsed = transaction.Amount,
                NewBalance = transaction.BalanceAfter
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Analysis failed for request {RequestId}", id);

            entity.Status = RequestStatus.Submitted; // Reset status
            await _context.SaveChangesAsync();

            return StatusCode(500, new { error = "분석 중 오류가 발생했습니다." });
        }
    }

    /// <summary>
    /// Get analysis result for a request
    /// </summary>
    [HttpGet("{id:guid}/analysis")]
    [ProducesResponseType(typeof(AnalysisResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AnalysisResponseDto>> GetAnalysis(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.AnalysisResultJson))
        {
            return NotFound(new { error = "아직 분석이 완료되지 않았습니다." });
        }

        var analysisResult = JsonSerializer.Deserialize<AnalysisResult>(
            entity.AnalysisResultJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        if (analysisResult == null)
        {
            return NotFound(new { error = "분석 결과를 불러올 수 없습니다." });
        }

        return Ok(new AnalysisResponseDto
        {
            RequestId = id,
            Category = analysisResult.Category,
            Complexity = analysisResult.Complexity,
            Summary = analysisResult.Summary,
            Requirements = analysisResult.Requirements,
            Feasibility = analysisResult.Feasibility,
            EstimatedDays = analysisResult.EstimatedDays,
            SuggestedStack = analysisResult.SuggestedStack
        });
    }

    /// <summary>
    /// Update a development request status
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(DevRequestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DevRequestResponseDto>> UpdateStatus(
        Guid id,
        [FromBody] UpdateStatusDto dto)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        entity!.Status = dto.Status;

        // Update relevant timestamps based on status
        switch (dto.Status)
        {
            case RequestStatus.Analyzed:
                entity.AnalyzedAt = DateTime.UtcNow;
                break;
            case RequestStatus.ProposalReady:
                entity.ProposedAt = DateTime.UtcNow;
                break;
            case RequestStatus.Approved:
                entity.ApprovedAt = DateTime.UtcNow;
                break;
            case RequestStatus.Completed:
                entity.CompletedAt = DateTime.UtcNow;
                break;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Dev request {RequestId} status updated to {Status}", id, dto.Status);

        return Ok(entity.ToResponseDto());
    }

    /// <summary>
    /// Generate a proposal for a development request
    /// </summary>
    [HttpPost("{id:guid}/proposal")]
    [ProducesResponseType(typeof(ProposalResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProposalResponseDto>> GenerateProposal(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.AnalysisResultJson))
        {
            return BadRequest(new { error = "먼저 분석을 완료해주세요." });
        }

        // Token gating: check balance before executing
        var userId = GetUserId();
        var (hasEnough, cost, balance) = await _tokenService.CheckBalance(userId, "proposal");
        if (!hasEnough)
        {
            return StatusCode(402, new
            {
                error = "Insufficient tokens.",
                required = cost,
                balance,
                shortfall = cost - balance,
                action = "proposal"
            });
        }

        _logger.LogInformation("Generating proposal for request {RequestId}", id);

        try
        {
            var analysisResult = JsonSerializer.Deserialize<AnalysisResult>(
                entity.AnalysisResultJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (analysisResult == null)
            {
                return BadRequest(new { error = "분석 결과를 불러올 수 없습니다." });
            }

            var proposalResult = await _proposalService.GenerateProposalAsync(entity.Description, analysisResult);

            // Save proposal to entity
            entity.ProposalJson = JsonSerializer.Serialize(proposalResult);
            entity.Status = RequestStatus.ProposalReady;
            entity.ProposedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Deduct tokens only after successful completion
            var transaction = await _tokenService.DebitTokens(userId, "proposal", id.ToString());

            _logger.LogInformation("Proposal generated for request {RequestId}", id);

            return Ok(new ProposalResponseDto
            {
                RequestId = id,
                Proposal = proposalResult,
                TokensUsed = transaction.Amount,
                NewBalance = transaction.BalanceAfter
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Proposal generation failed for request {RequestId}", id);
            return StatusCode(500, new { error = "제안서 생성 중 오류가 발생했습니다." });
        }
    }

    /// <summary>
    /// Get the proposal for a development request
    /// </summary>
    [HttpGet("{id:guid}/proposal")]
    [ProducesResponseType(typeof(ProposalResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProposalResponseDto>> GetProposal(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.ProposalJson))
        {
            return NotFound(new { error = "아직 제안서가 생성되지 않았습니다." });
        }

        var proposalResult = JsonSerializer.Deserialize<ProposalResult>(
            entity.ProposalJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        if (proposalResult == null)
        {
            return NotFound(new { error = "제안서를 불러올 수 없습니다." });
        }

        return Ok(new ProposalResponseDto
        {
            RequestId = id,
            Proposal = proposalResult
        });
    }

    /// <summary>
    /// Approve a proposal
    /// </summary>
    [HttpPost("{id:guid}/proposal/approve")]
    [ProducesResponseType(typeof(DevRequestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DevRequestResponseDto>> ApproveProposal(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.ProposalJson))
        {
            return BadRequest(new { error = "승인할 제안서가 없습니다." });
        }

        entity.Status = RequestStatus.Approved;
        entity.ApprovedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Proposal approved for request {RequestId}", id);

        return Ok(entity.ToResponseDto());
    }

    /// <summary>
    /// Start building a project from an approved proposal
    /// </summary>
    [HttpPost("{id:guid}/build")]
    [ProducesResponseType(typeof(ProductionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductionResponseDto>> StartBuild(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (entity!.Status != RequestStatus.Approved)
        {
            return BadRequest(new { error = "제안서가 승인된 후에만 빌드를 시작할 수 있습니다." });
        }

        if (string.IsNullOrEmpty(entity.ProposalJson))
        {
            return BadRequest(new { error = "제안서가 없습니다." });
        }

        // Token gating: check balance before executing
        var userId = GetUserId();
        var (hasEnough, cost, balance) = await _tokenService.CheckBalance(userId, "build");
        if (!hasEnough)
        {
            return StatusCode(402, new
            {
                error = "Insufficient tokens.",
                required = cost,
                balance,
                shortfall = cost - balance,
                action = "build"
            });
        }

        _logger.LogInformation("Starting build for request {RequestId}", id);

        entity.Status = RequestStatus.Building;
        await _context.SaveChangesAsync();

        try
        {
            var proposal = JsonSerializer.Deserialize<ProposalResult>(
                entity.ProposalJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (proposal == null)
            {
                return BadRequest(new { error = "제안서를 불러올 수 없습니다." });
            }

            // Detect platform and complexity from analysis
            var platform = "web";
            var complexity = "Medium";
            if (!string.IsNullOrEmpty(entity.AnalysisResultJson))
            {
                var analysis = JsonSerializer.Deserialize<AnalysisResult>(
                    entity.AnalysisResultJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
                if (analysis != null)
                {
                    if (!string.IsNullOrEmpty(analysis.Platform))
                        platform = analysis.Platform;
                    if (!string.IsNullOrEmpty(analysis.Complexity))
                        complexity = analysis.Complexity;
                }
            }

            var result = await _productionService.GenerateProjectAsync(
                id.ToString(),
                entity.Description,
                proposal,
                platform,
                complexity,
                entity.ScreenshotBase64,
                entity.ScreenshotMediaType,
                entity.Framework
            );

            entity.ProjectId = result.ProjectId;
            entity.ProjectPath = result.ProjectPath;

            if (result.Status == "generated")
            {
                // Run self-healing validation loop on generated files
                try
                {
                    var generatedFiles = ReadProjectFilesForValidation(result.ProjectPath);
                    if (generatedFiles.Count > 0)
                    {
                        var selfHealingResult = await _selfHealingService.ValidateAndFixAsync(
                            id, generatedFiles, result.ProjectType);

                        result.ValidationPassed = selfHealingResult.Passed;
                        result.ValidationIterations = selfHealingResult.IterationsUsed;
                        result.ValidationSummary = selfHealingResult.Passed
                            ? "Code validation passed"
                            : $"Validation completed with {selfHealingResult.IterationsUsed} iteration(s)";

                        // Write fixed files back to disk if fixes were applied
                        if (selfHealingResult.FixHistory.Count > 0)
                        {
                            foreach (var (filePath, content) in selfHealingResult.Files)
                            {
                                var fullPath = Path.Combine(result.ProjectPath, filePath);
                                var directory = Path.GetDirectoryName(fullPath);
                                if (!string.IsNullOrEmpty(directory))
                                {
                                    Directory.CreateDirectory(directory);
                                }
                                await System.IO.File.WriteAllTextAsync(fullPath, content);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Self-healing validation failed for {RequestId}, continuing with original files", id);
                    result.ValidationSummary = "Self-healing validation could not be completed";
                }

                // Run AI build verification
                entity.Status = RequestStatus.Verifying;
                await _context.SaveChangesAsync();

                var verificationResult = await _verificationService.VerifyProjectAsync(
                    id, result.ProjectPath, result.ProjectType);

                result.VerificationScore = verificationResult.QualityScore;
                result.VerificationPassed = verificationResult.Passed;
                result.VerificationSummary = verificationResult.Summary;

                // Run accessibility audit
                var a11yResult = await _accessibilityService.AuditProjectAsync(
                    result.ProjectPath, result.ProjectType);
                result.AccessibilityScore = a11yResult.Score;
                result.AccessibilitySummary = a11yResult.Summary;
                result.AccessibilityIssueCount = a11yResult.Issues.Count;

                // Generate tests
                var testResult = await _testGenerationService.GenerateTestsAsync(
                    result.ProjectPath, result.ProjectType);
                result.TestFilesGenerated = testResult.TestFilesGenerated;
                result.TotalTestCount = testResult.TotalTestCount;
                result.TestCoverageEstimate = testResult.CoverageEstimate;
                result.TestFramework = testResult.TestFramework;
                result.TestSummary = testResult.Summary;

                // AI Code Review (security, performance, quality)
                var reviewResult = await _codeReviewService.ReviewProjectAsync(
                    result.ProjectPath, result.ProjectType);
                result.CodeReviewScore = reviewResult.OverallScore;
                result.SecurityScore = reviewResult.SecurityScore;
                result.PerformanceScore = reviewResult.PerformanceScore;
                result.CodeQualityScore = reviewResult.QualityScore;
                result.CodeReviewSummary = reviewResult.Summary;
                result.CodeReviewIssueCount = reviewResult.Issues.Count;

                // Generate CI/CD pipeline (GitHub Actions)
                var ciCdResult = await _ciCdService.GeneratePipelineAsync(
                    result.ProjectPath, result.ProjectType);
                result.CiCdProvider = ciCdResult.PipelineProvider;
                result.CiCdWorkflowCount = ciCdResult.Workflows.Count;
                result.CiCdSummary = ciCdResult.Summary;
                result.CiCdRequiredSecrets = ciCdResult.RequiredSecrets;

                // Auto-generate database schema if project needs one
                var dbResult = await _databaseSchemaService.GenerateSchemaAsync(
                    result.ProjectPath, result.ProjectType, entity.Description);
                result.HasDatabase = dbResult.HasDatabase;
                result.DatabaseProvider = dbResult.Provider;
                result.DatabaseTableCount = dbResult.Tables.Count;
                result.DatabaseRelationshipCount = dbResult.Relationships.Count;
                result.DatabaseSummary = dbResult.Summary;
                result.DatabaseTables = dbResult.Tables.Select(t => t.Name).ToList();

                // Create version snapshot of the completed build
                await _versionService.CreateSnapshotAsync(id, result.ProjectPath, "Initial build", "build");

                entity.Status = RequestStatus.Staging;
            }
            else
            {
                entity.Status = RequestStatus.Approved; // Reset on failure
            }

            await _context.SaveChangesAsync();

            // Deduct tokens only after successful completion
            var transaction = await _tokenService.DebitTokens(userId, "build", id.ToString());

            _logger.LogInformation("Build completed for request {RequestId}: {Status}", id, result.Status);

            return Ok(new ProductionResponseDto
            {
                RequestId = id,
                Production = result,
                TokensUsed = transaction.Amount,
                NewBalance = transaction.BalanceAfter
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Build failed for request {RequestId}", id);
            entity.Status = RequestStatus.Approved;
            await _context.SaveChangesAsync();
            return StatusCode(500, new { error = "빌드 중 오류가 발생했습니다." });
        }
    }

    /// <summary>
    /// Get build status for a request
    /// </summary>
    [HttpGet("{id:guid}/build")]
    [ProducesResponseType(typeof(BuildStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BuildStatusDto>> GetBuildStatus(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        string buildStatus = "not_started";
        if (!string.IsNullOrEmpty(entity!.ProjectId))
        {
            buildStatus = await _productionService.GetBuildStatusAsync(entity.ProjectId);
        }

        return Ok(new BuildStatusDto
        {
            RequestId = id,
            ProjectId = entity.ProjectId,
            ProjectPath = entity.ProjectPath,
            Status = entity.Status.ToString(),
            BuildStatus = buildStatus
        });
    }

    /// <summary>
    /// Get verification results for a request
    /// </summary>
    [HttpGet("{id:guid}/verification")]
    [ProducesResponseType(typeof(VerificationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VerificationResponseDto>> GetVerification(Guid id)
    {
        var (_, ownerError) = await GetOwnedEntityAsync(id);
        if (ownerError != null) return ownerError;

        var verifications = await _context.BuildVerifications
            .Where(v => v.DevRequestId == id)
            .OrderByDescending(v => v.Iteration)
            .ToListAsync();

        if (verifications.Count == 0)
        {
            return NotFound(new { error = "No verification results found." });
        }

        var latest = verifications.First();

        return Ok(new VerificationResponseDto
        {
            RequestId = id,
            QualityScore = latest.QualityScore,
            Status = latest.Status.ToString(),
            IssuesFound = verifications.Sum(v => v.IssuesFound),
            FixesApplied = verifications.Sum(v => v.FixesApplied),
            Iterations = verifications.Count
        });
    }

    /// <summary>
    /// Complete a request (mark as done)
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(typeof(DevRequestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DevRequestResponseDto>> CompleteRequest(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        entity!.Status = RequestStatus.Completed;
        entity.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Request {RequestId} marked as completed", id);

        return Ok(entity.ToResponseDto());
    }

    /// <summary>
    /// Download project as ZIP file
    /// </summary>
    [HttpGet("{id:guid}/export/zip")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportZip(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.ProjectPath))
            return BadRequest(new { error = "Project has not been built yet." });

        try
        {
            var projectName = entity.ProjectId ?? $"project-{id.ToString()[..8]}";
            var zipBytes = await _exportService.ExportAsZipAsync(entity.ProjectPath, projectName);
            return File(zipBytes, "application/zip", $"{projectName}.zip");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Export project to a new GitHub repository
    /// </summary>
    [HttpPost("{id:guid}/export/github")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportToGitHub(Guid id, [FromBody] GitHubExportRequest body)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.ProjectPath))
            return BadRequest(new { error = "Project has not been built yet." });

        if (string.IsNullOrWhiteSpace(body.AccessToken))
            return BadRequest(new { error = "GitHub access token is required." });

        try
        {
            var projectName = entity.ProjectId ?? $"project-{id.ToString()[..8]}";
            var result = await _exportService.ExportToGitHubAsync(
                entity.ProjectPath, projectName, body.AccessToken, body.RepoName);

            // Save GitHub link for future syncs
            entity.GitHubRepoUrl = result.RepoUrl;
            entity.GitHubRepoFullName = result.RepoFullName;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                result.RepoUrl,
                result.RepoFullName,
                result.FilesUploaded,
                result.TotalFiles
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Sync project changes to linked GitHub repository
    /// </summary>
    [HttpPost("{id:guid}/github/sync")]
    public async Task<IActionResult> SyncToGitHub(Guid id, [FromBody] GitHubSyncRequest body)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.ProjectPath))
            return BadRequest(new { error = "Project has not been built yet." });

        if (string.IsNullOrEmpty(entity.GitHubRepoFullName))
            return BadRequest(new { error = "No linked GitHub repository. Export to GitHub first." });

        if (string.IsNullOrWhiteSpace(body.AccessToken))
            return BadRequest(new { error = "GitHub access token is required." });

        try
        {
            var result = await _exportService.SyncToGitHubAsync(
                entity.ProjectPath, entity.GitHubRepoFullName, body.AccessToken);

            return Ok(new
            {
                result.RepoFullName,
                result.FilesCreated,
                result.FilesUpdated,
                result.TotalFiles
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get GitHub sync status for a project
    /// </summary>
    [HttpGet("{id:guid}/github")]
    public async Task<IActionResult> GetGitHubStatus(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        return Ok(new
        {
            linked = !string.IsNullOrEmpty(entity!.GitHubRepoFullName),
            repoUrl = entity.GitHubRepoUrl,
            repoFullName = entity.GitHubRepoFullName
        });
    }

    /// <summary>
    /// Get version history for a project
    /// </summary>
    [HttpGet("{id:guid}/versions")]
    public async Task<ActionResult<List<ProjectVersionDto>>> GetVersions(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        var versions = await _versionService.GetVersionsAsync(id);
        return Ok(versions.Select(v => new ProjectVersionDto
        {
            Id = v.Id,
            VersionNumber = v.VersionNumber,
            Label = v.Label,
            Source = v.Source,
            FileCount = v.FileCount,
            CreatedAt = v.CreatedAt
        }).ToList());
    }

    /// <summary>
    /// Rollback to a specific version
    /// </summary>
    [HttpPost("{id:guid}/versions/{versionId:guid}/rollback")]
    public async Task<ActionResult<ProjectVersionDto>> RollbackToVersion(Guid id, Guid versionId)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        var result = await _versionService.RollbackAsync(id, versionId);
        if (result == null)
            return NotFound(new { error = "Version snapshot not found." });

        return Ok(new ProjectVersionDto
        {
            Id = result.Id,
            VersionNumber = result.VersionNumber,
            Label = result.Label,
            Source = result.Source,
            FileCount = result.FileCount,
            CreatedAt = result.CreatedAt
        });
    }

    /// <summary>
    /// Generate Expo Snack preview for a mobile project
    /// </summary>
    [HttpPost("{id:guid}/preview/expo")]
    [ProducesResponseType(typeof(ExpoPreviewResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExpoPreviewResult>> GenerateExpoPreview(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.ProjectPath))
        {
            return BadRequest(new { error = "Project has not been built yet." });
        }

        _logger.LogInformation("Generating Expo preview for request {RequestId}", id);

        var result = await _expoPreviewService.GeneratePreviewAsync(id);

        if (!result.Success)
        {
            if (result.Error?.Contains("not a mobile project") == true)
                return BadRequest(new { error = result.Error });

            return BadRequest(new { error = result.Error });
        }

        return Ok(result);
    }

    /// <summary>
    /// Get stored preview info for a request
    /// </summary>
    [HttpGet("{id:guid}/preview")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPreview(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.PreviewUrl))
        {
            return NotFound(new { error = "No preview has been generated for this request." });
        }

        return Ok(new
        {
            requestId = id,
            previewUrl = entity.PreviewUrl,
            hasPreview = true
        });
    }

    /// <summary>
    /// Get generated project files as a map of relative path to content
    /// </summary>
    [HttpGet("{id:guid}/files")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProjectFiles(Guid id)
    {
        var (entity, error) = await GetOwnedEntityAsync(id);
        if (error != null) return error;

        if (string.IsNullOrEmpty(entity!.ProjectPath) || !Directory.Exists(entity.ProjectPath))
        {
            return NotFound(new { error = "Project has not been built yet or directory not found." });
        }

        var textExtensions = new HashSet<string>
        {
            ".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss",
            ".html", ".md", ".yaml", ".yml", ".toml", ".xml",
            ".dart", ".py", ".cs", ".java", ".go", ".rs",
            ".env", ".gitignore", ".eslintrc", ".prettierrc",
            ".cfg", ".ini", ".txt", ".sh", ".bat", ".cmd",
            ".lock", ".config", ".csproj", ".sln", ".gradle"
        };

        var files = new Dictionary<string, string>();
        var projectFiles = Directory.GetFiles(entity.ProjectPath, "*", SearchOption.AllDirectories)
            .Where(f => !f.Contains("node_modules") && !f.Contains(".git")
                     && !f.Contains("bin") && !f.Contains("obj")
                     && !f.Contains("__pycache__"))
            .OrderBy(f => f);

        foreach (var filePath in projectFiles)
        {
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            if (!textExtensions.Contains(ext) && !Path.GetFileName(filePath).StartsWith(".")) continue;

            try
            {
                var content = await System.IO.File.ReadAllTextAsync(filePath);
                // Skip very large files (>100KB) to keep response manageable
                if (content.Length > 100_000) continue;

                var relativePath = "/" + Path.GetRelativePath(entity.ProjectPath, filePath).Replace('\\', '/');
                files[relativePath] = content;
            }
            catch
            {
                // Skip files that can't be read
            }
        }

        return Ok(new { files, projectName = entity.ProjectId });
    }

    private static Dictionary<string, string> ReadProjectFilesForValidation(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var allowedExtensions = new HashSet<string>
        {
            ".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html",
            ".cs", ".csproj", ".py", ".md", ".yaml", ".yml",
            ".dart"
        };

        foreach (var filePath in Directory.GetFiles(projectPath, "*.*", SearchOption.AllDirectories))
        {
            var ext = Path.GetExtension(filePath).ToLower();
            if (!allowedExtensions.Contains(ext)) continue;

            var relativePath = Path.GetRelativePath(projectPath, filePath);
            if (relativePath.Contains("node_modules") || relativePath.Contains("dist") ||
                relativePath.Contains("bin") || relativePath.Contains("obj")) continue;

            try
            {
                var content = System.IO.File.ReadAllText(filePath);
                if (content.Length <= 50000)
                {
                    files[relativePath] = content;
                }
            }
            catch
            {
                // Skip unreadable files
            }
        }

        return files;
    }
}

public record ProjectVersionDto
{
    public Guid Id { get; init; }
    public int VersionNumber { get; init; }
    public string Label { get; init; } = "";
    public string Source { get; init; } = "";
    public int FileCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record UpdateStatusDto
{
    public RequestStatus Status { get; init; }
}

public record AnalysisResponseDto
{
    public Guid RequestId { get; init; }
    public string Category { get; init; } = "";
    public string Complexity { get; init; } = "";
    public string Summary { get; init; } = "";
    public RequirementsInfo Requirements { get; init; } = new();
    public FeasibilityInfo Feasibility { get; init; } = new();
    public int EstimatedDays { get; init; }
    public TechStackInfo SuggestedStack { get; init; } = new();
    public int? TokensUsed { get; init; }
    public int? NewBalance { get; init; }
}

public record ProposalResponseDto
{
    public Guid RequestId { get; init; }
    public ProposalResult Proposal { get; init; } = new();
    public int? TokensUsed { get; init; }
    public int? NewBalance { get; init; }
}

public record ProductionResponseDto
{
    public Guid RequestId { get; init; }
    public ProductionResult Production { get; init; } = new();
    public int? TokensUsed { get; init; }
    public int? NewBalance { get; init; }
}

public record BuildStatusDto
{
    public Guid RequestId { get; init; }
    public string? ProjectId { get; init; }
    public string? ProjectPath { get; init; }
    public string Status { get; init; } = "";
    public string BuildStatus { get; init; } = "";
}

public record VerificationResponseDto
{
    public Guid RequestId { get; init; }
    public int QualityScore { get; init; }
    public string Status { get; init; } = "";
    public int IssuesFound { get; init; }
    public int FixesApplied { get; init; }
    public int Iterations { get; init; }
}

public class GitHubExportRequest
{
    public string AccessToken { get; set; } = "";
    public string? RepoName { get; set; }
}

public class GitHubSyncRequest
{
    public string AccessToken { get; set; } = "";
}

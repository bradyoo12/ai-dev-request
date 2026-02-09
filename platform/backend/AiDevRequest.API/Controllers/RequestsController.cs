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
    private readonly ILogger<RequestsController> _logger;

    public RequestsController(
        AiDevRequestDbContext context,
        IAnalysisService analysisService,
        IProposalService proposalService,
        IProductionService productionService,
        ITokenService tokenService,
        IBuildVerificationService verificationService,
        ILogger<RequestsController> logger)
    {
        _context = context;
        _analysisService = analysisService;
        _proposalService = proposalService;
        _productionService = productionService;
        _tokenService = tokenService;
        _verificationService = verificationService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Create a new development request
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(DevRequestResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DevRequestResponseDto>> CreateRequest([FromBody] CreateDevRequestDto dto)
    {
        var entity = dto.ToEntity();

        _context.DevRequests.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("New dev request created: {RequestId}", entity.Id);

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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        return Ok(entity.ToResponseDto());
    }

    /// <summary>
    /// Get all development requests (paginated)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DevRequestListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DevRequestListItemDto>>> GetRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RequestStatus? status = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.DevRequests.AsQueryable();

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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

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
        entity.Status = RequestStatus.Analyzing;
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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        if (string.IsNullOrEmpty(entity.AnalysisResultJson))
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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        entity.Status = dto.Status;

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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        if (string.IsNullOrEmpty(entity.AnalysisResultJson))
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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        if (string.IsNullOrEmpty(entity.ProposalJson))
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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        if (string.IsNullOrEmpty(entity.ProposalJson))
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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        if (entity.Status != RequestStatus.Approved)
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
                entity.ScreenshotMediaType
            );

            entity.ProjectId = result.ProjectId;
            entity.ProjectPath = result.ProjectPath;

            if (result.Status == "generated")
            {
                // Run AI build verification
                entity.Status = RequestStatus.Verifying;
                await _context.SaveChangesAsync();

                var verificationResult = await _verificationService.VerifyProjectAsync(
                    id, result.ProjectPath, result.ProjectType);

                result.VerificationScore = verificationResult.QualityScore;
                result.VerificationPassed = verificationResult.Passed;
                result.VerificationSummary = verificationResult.Summary;

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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        string buildStatus = "not_started";
        if (!string.IsNullOrEmpty(entity.ProjectId))
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
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        entity.Status = RequestStatus.Completed;
        entity.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Request {RequestId} marked as completed", id);

        return Ok(entity.ToResponseDto());
    }
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

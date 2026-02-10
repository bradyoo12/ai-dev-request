using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{requestId:guid}/compiler")]
public class CompilerController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ICompilerValidationService _compilerService;
    private readonly ILogger<CompilerController> _logger;

    public CompilerController(
        AiDevRequestDbContext context,
        ICompilerValidationService compilerService,
        ILogger<CompilerController> logger)
    {
        _context = context;
        _compilerService = compilerService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Trigger compilation validation for a project
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(CompilationOutput), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CompilationOutput>> Validate(Guid requestId, [FromQuery] string language = "typescript")
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        if (string.IsNullOrEmpty(entity.ProjectPath))
            return BadRequest(new { error = "Project has not been built yet." });

        _logger.LogInformation("Triggering compilation for request {RequestId} with language {Language}", requestId, language);

        try
        {
            var result = await _compilerService.CompileAsync(requestId, language);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Compilation failed for request {RequestId}", requestId);
            return StatusCode(500, new { error = "Compilation failed." });
        }
    }

    /// <summary>
    /// Get latest compilation result for a project
    /// </summary>
    [HttpGet("result")]
    [ProducesResponseType(typeof(CompilationResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CompilationResultResponse>> GetResult(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        var result = await _compilerService.GetCompilationResultAsync(requestId);
        if (result == null)
            return NotFound(new { error = "No compilation result found. Run a validation first." });

        return Ok(new CompilationResultResponse
        {
            Id = result.Id,
            DevRequestId = result.DevRequestId,
            Language = result.Language,
            Success = result.Success,
            ErrorsJson = result.ErrorsJson,
            WarningsJson = result.WarningsJson,
            RetryCount = result.RetryCount,
            CompiledAt = result.CompiledAt
        });
    }

    /// <summary>
    /// Auto-fix compilation errors with AI
    /// </summary>
    [HttpPost("fix")]
    [ProducesResponseType(typeof(CompilationOutput), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CompilationOutput>> Fix(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound();
        if (entity.UserId != GetUserId())
            return StatusCode(403, new { error = "Access denied." });

        if (string.IsNullOrEmpty(entity.ProjectPath))
            return BadRequest(new { error = "Project has not been built yet." });

        _logger.LogInformation("Triggering auto-fix for request {RequestId}", requestId);

        try
        {
            var result = await _compilerService.ValidateAndFixAsync(requestId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Auto-fix failed for request {RequestId}", requestId);
            return StatusCode(500, new { error = "Auto-fix failed." });
        }
    }

    /// <summary>
    /// Get supported compiler languages
    /// </summary>
    [HttpGet("/api/compiler/languages")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<SupportedLanguage>), StatusCodes.Status200OK)]
    public ActionResult<List<SupportedLanguage>> GetLanguages()
    {
        return Ok(_compilerService.GetSupportedLanguages());
    }
}

public record CompilationResultResponse
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string Language { get; init; } = "";
    public bool Success { get; init; }
    public string ErrorsJson { get; init; } = "[]";
    public string WarningsJson { get; init; } = "[]";
    public int RetryCount { get; init; }
    public DateTime CompiledAt { get; init; }
}

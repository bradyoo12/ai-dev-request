using Microsoft.AspNetCore.Mvc;
using AiDevRequest.API.Services;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/figma-import")]
public class FigmaImportController : ControllerBase
{
    private readonly IFigmaImportService _service;

    public FigmaImportController(IFigmaImportService service)
    {
        _service = service;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    // GET /api/figma-import/imports
    [HttpGet("imports")]
    public async Task<IActionResult> ListImports()
    {
        var userId = GetUserId();
        var imports = await _service.ListImportsAsync(userId);
        return Ok(imports);
    }

    // POST /api/figma-import/import-url
    [HttpPost("import-url")]
    public async Task<IActionResult> ImportFromUrl([FromBody] ImportUrlRequest req)
    {
        var userId = GetUserId();
        var result = await _service.ImportFromUrlAsync(userId, req.FigmaUrl, req.NodeId, req.DesignName, req.Framework, req.StylingLib);
        return Ok(result);
    }

    // POST /api/figma-import/import-screenshot
    [HttpPost("import-screenshot")]
    public async Task<IActionResult> ImportFromScreenshot([FromBody] ImportScreenshotRequest req)
    {
        var userId = GetUserId();
        var result = await _service.ImportFromScreenshotAsync(userId, req.ScreenshotBase64, req.DesignName, req.Framework, req.StylingLib);
        return Ok(result);
    }

    // GET /api/figma-import/imports/{id}/tokens
    [HttpGet("imports/{id}/tokens")]
    public async Task<IActionResult> GetTokens(Guid id)
    {
        var userId = GetUserId();
        var figmaImport = await _service.GetImportAsync(id, userId);
        if (figmaImport == null) return NotFound();
        var (tokens, components) = await _service.GetTokensAsync(id, userId);
        return Ok(new { tokens, components });
    }

    // GET /api/figma-import/imports/{id}/code
    [HttpGet("imports/{id}/code")]
    public async Task<IActionResult> GetCode(Guid id)
    {
        var userId = GetUserId();
        var figmaImport = await _service.GetImportAsync(id, userId);
        if (figmaImport == null) return NotFound();
        var (code, framework, styling) = await _service.GetCodeAsync(id, userId);
        return Ok(new { code, framework, styling });
    }

    // DELETE /api/figma-import/imports/{id}
    [HttpDelete("imports/{id}")]
    public async Task<IActionResult> DeleteImport(Guid id)
    {
        var userId = GetUserId();
        var deleted = await _service.DeleteImportAsync(id, userId);
        if (!deleted) return NotFound();
        return Ok(new { deleted = true });
    }

    // GET /api/figma-import/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var stats = await _service.GetStatsAsync(userId);
        return Ok(stats);
    }

}

public record ImportUrlRequest(string FigmaUrl, string? NodeId, string? DesignName, string? Framework, string? StylingLib);
public record ImportScreenshotRequest(string? ScreenshotBase64, string? DesignName, string? Framework, string? StylingLib);

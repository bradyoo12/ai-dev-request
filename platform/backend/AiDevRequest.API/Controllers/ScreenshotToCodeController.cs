using Microsoft.AspNetCore.Mvc;
using AiDevRequest.API.Services;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/screenshot-to-code")]
public class ScreenshotToCodeController : ControllerBase
{
    private readonly IScreenshotToCodeService _service;

    public ScreenshotToCodeController(IScreenshotToCodeService service)
    {
        _service = service;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    // GET /api/screenshot-to-code/conversions
    [HttpGet("conversions")]
    public async Task<IActionResult> ListConversions()
    {
        var userId = GetUserId();
        var conversions = await _service.ListConversionsAsync(userId);
        return Ok(conversions);
    }

    // POST /api/screenshot-to-code/convert
    [HttpPost("convert")]
    public async Task<IActionResult> ConvertScreenshot([FromBody] ConvertScreenshotRequest req)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(req.ImageBase64))
            return BadRequest(new { error = "Image data is required" });

        var result = await _service.ConvertScreenshotAsync(userId, req.ImageBase64, req.DesignName, req.Framework, req.StylingLib);
        return Ok(result);
    }

    // GET /api/screenshot-to-code/conversions/{id}
    [HttpGet("conversions/{id}")]
    public async Task<IActionResult> GetConversion(Guid id)
    {
        var userId = GetUserId();
        var conversion = await _service.GetConversionAsync(id, userId);
        if (conversion == null) return NotFound();
        return Ok(conversion);
    }

    // GET /api/screenshot-to-code/conversions/{id}/code
    [HttpGet("conversions/{id}/code")]
    public async Task<IActionResult> GetCode(Guid id)
    {
        var userId = GetUserId();
        var conversion = await _service.GetConversionAsync(id, userId);
        if (conversion == null) return NotFound();
        var (code, framework, styling) = await _service.GetCodeAsync(id, userId);
        return Ok(new { code, framework, styling });
    }

    // DELETE /api/screenshot-to-code/conversions/{id}
    [HttpDelete("conversions/{id}")]
    public async Task<IActionResult> DeleteConversion(Guid id)
    {
        var userId = GetUserId();
        var deleted = await _service.DeleteConversionAsync(id, userId);
        if (!deleted) return NotFound();
        return Ok(new { deleted = true });
    }

    // GET /api/screenshot-to-code/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var stats = await _service.GetStatsAsync(userId);
        return Ok(stats);
    }
}

public record ConvertScreenshotRequest(string? ImageBase64, string? DesignName, string? Framework, string? StylingLib);

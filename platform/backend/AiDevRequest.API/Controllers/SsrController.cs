using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

/// <summary>
/// Controller for serving server-side rendered pages.
/// Renders pre-built HTML for SEO-critical pages and falls back
/// to the SPA shell for dynamic routes.
/// </summary>
[ApiController]
[Route("api/ssr")]
public class SsrController : ControllerBase
{
    private readonly ISsrService _ssrService;

    public SsrController(ISsrService ssrService) => _ssrService = ssrService;

    /// <summary>
    /// Renders a page at the given path using SSR.
    /// Returns pre-rendered HTML if available, otherwise returns the SPA shell.
    /// </summary>
    /// <param name="path">The URL path to render (e.g., "" for home, "about" for /about)</param>
    [HttpGet("{*path}")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK, "text/html")]
    public async Task<IActionResult> RenderPage(string? path)
    {
        var html = await _ssrService.RenderAsync(path ?? "/");
        return Content(html, "text/html");
    }

    /// <summary>
    /// Returns the list of pre-rendered pages available for SSR.
    /// Useful for debugging and monitoring which pages have SSR support.
    /// </summary>
    [HttpGet("_status")]
    [ProducesResponseType(typeof(SsrStatusDto), StatusCodes.Status200OK)]
    public IActionResult GetStatus()
    {
        var knownRoutes = new[] { "/", "/projects", "/suggestions", "/templates" };
        var prerenderedRoutes = knownRoutes
            .Where(r => _ssrService.HasPrerenderedPage(r))
            .ToList();

        return Ok(new SsrStatusDto
        {
            Enabled = true,
            PrerenderedPageCount = prerenderedRoutes.Count,
            PrerenderedRoutes = prerenderedRoutes
        });
    }
}

public record SsrStatusDto
{
    public bool Enabled { get; init; }
    public int PrerenderedPageCount { get; init; }
    public List<string> PrerenderedRoutes { get; init; } = [];
}

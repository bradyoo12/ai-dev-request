namespace AiDevRequest.API.Services;

/// <summary>
/// Service for server-side rendering of the frontend application.
/// Loads pre-rendered HTML pages generated at build time and injects them
/// into the HTML template for improved performance and SEO.
/// </summary>
public interface ISsrService
{
    /// <summary>
    /// Renders the given path to a full HTML page string.
    /// Returns pre-rendered HTML if available, otherwise falls back to the SPA shell.
    /// </summary>
    /// <param name="path">The URL path to render (e.g., "/" or "/about")</param>
    /// <returns>Complete HTML page content</returns>
    Task<string> RenderAsync(string path);

    /// <summary>
    /// Checks whether a pre-rendered page exists for the given path.
    /// </summary>
    bool HasPrerenderedPage(string path);
}

public class SsrService : ISsrService
{
    private readonly ILogger<SsrService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly Dictionary<string, string> _prerenderedPages = new();
    private readonly string _htmlTemplate;

    public SsrService(
        ILogger<SsrService> logger,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _logger = logger;
        _configuration = configuration;
        _environment = environment;

        // Load the HTML template (index.html) that contains <!--ssr-outlet--> placeholder
        var ssrDistPath = _configuration["Ssr:DistPath"]
            ?? Path.Combine(_environment.ContentRootPath, "..", "..", "frontend", "dist");

        _htmlTemplate = LoadHtmlTemplate(ssrDistPath);

        // Load pre-rendered pages from the SSR dist directory
        LoadPrerenderedPages(ssrDistPath);
    }

    public Task<string> RenderAsync(string path)
    {
        var normalizedPath = NormalizePath(path);

        if (_prerenderedPages.TryGetValue(normalizedPath, out var prerenderedHtml))
        {
            _logger.LogDebug("Serving pre-rendered page for path: {Path}", normalizedPath);
            var fullHtml = InjectIntoTemplate(prerenderedHtml);
            return Task.FromResult(fullHtml);
        }

        // Fallback: return the SPA shell (empty root div) so the client
        // can hydrate/render on its own. This keeps backward compatibility.
        _logger.LogDebug("No pre-rendered page for path: {Path}, falling back to SPA shell", normalizedPath);
        return Task.FromResult(_htmlTemplate);
    }

    public bool HasPrerenderedPage(string path)
    {
        return _prerenderedPages.ContainsKey(NormalizePath(path));
    }

    private string LoadHtmlTemplate(string distPath)
    {
        var indexPath = Path.Combine(distPath, "index.html");
        if (File.Exists(indexPath))
        {
            _logger.LogInformation("Loaded HTML template from: {Path}", indexPath);
            return File.ReadAllText(indexPath);
        }

        // Fallback: minimal HTML template for when the dist hasn't been built yet
        _logger.LogWarning("HTML template not found at {Path}, using fallback template", indexPath);
        return """
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>AI Dev Request</title>
            </head>
            <body>
                <div id="root"><!--ssr-outlet--></div>
                <script type="module" src="/src/main.tsx"></script>
            </body>
            </html>
            """;
    }

    private void LoadPrerenderedPages(string distPath)
    {
        var ssrDir = Path.Combine(distPath, "ssr");
        if (!Directory.Exists(ssrDir))
        {
            _logger.LogInformation("No pre-rendered pages directory found at: {Path}", ssrDir);
            return;
        }

        foreach (var file in Directory.GetFiles(ssrDir, "*.html"))
        {
            var fileName = Path.GetFileNameWithoutExtension(file);
            var routePath = fileName == "index" ? "/" : $"/{fileName}";
            var content = File.ReadAllText(file);
            _prerenderedPages[routePath] = content;
            _logger.LogInformation("Loaded pre-rendered page: {Route} from {File}", routePath, file);
        }

        _logger.LogInformation("Loaded {Count} pre-rendered SSR pages", _prerenderedPages.Count);
    }

    private string InjectIntoTemplate(string renderedHtml)
    {
        // Replace the <!--ssr-outlet--> placeholder or the empty root div content
        if (_htmlTemplate.Contains("<!--ssr-outlet-->"))
        {
            return _htmlTemplate.Replace("<!--ssr-outlet-->", renderedHtml);
        }

        // Fallback: inject into the root div
        return _htmlTemplate.Replace(
            "<div id=\"root\"></div>",
            $"<div id=\"root\">{renderedHtml}</div>");
    }

    private static string NormalizePath(string path)
    {
        if (string.IsNullOrEmpty(path) || path == "/")
            return "/";

        // Ensure leading slash, remove trailing slash
        var normalized = path.StartsWith('/') ? path : $"/{path}";
        return normalized.TrimEnd('/');
    }
}

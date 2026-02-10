using System.Globalization;
using System.Text;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/growth")]
public class AdminGrowthController : ControllerBase
{
    private readonly IGrowthService _growthService;
    private readonly ILogger<AdminGrowthController> _logger;

    public AdminGrowthController(IGrowthService growthService, ILogger<AdminGrowthController> logger)
    {
        _growthService = growthService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/admin/growth/overview - KPI summary
    /// </summary>
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        try
        {
            var overview = await _growthService.GetOverviewAsync();
            return Ok(overview);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get growth overview");
            return Ok(new GrowthOverviewDto());
        }
    }

    /// <summary>
    /// GET /api/admin/growth/trends?months=12 - Monthly growth trends
    /// </summary>
    [HttpGet("trends")]
    public async Task<IActionResult> GetTrends([FromQuery] int months = 12)
    {
        try
        {
            var trends = await _growthService.GetTrendsAsync(months);
            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get growth trends");
            return Ok(new List<GrowthTrendDto>());
        }
    }

    /// <summary>
    /// GET /api/admin/growth/funnel - Conversion funnel
    /// </summary>
    [HttpGet("funnel")]
    public async Task<IActionResult> GetFunnel()
    {
        try
        {
            var funnel = await _growthService.GetFunnelAsync();
            return Ok(funnel);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get growth funnel");
            return Ok(new List<FunnelStepDto>());
        }
    }

    /// <summary>
    /// POST /api/admin/growth/events - Record a platform event
    /// </summary>
    [HttpPost("events")]
    [AllowAnonymous]
    public async Task<IActionResult> RecordEvent([FromBody] RecordEventRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.EventType))
                return BadRequest(new { error = "eventType is required" });

            var validTypes = new[] { "visit", "register", "trial_start", "paid_conversion", "churn" };
            if (!validTypes.Contains(request.EventType))
                return BadRequest(new { error = $"Invalid eventType. Must be one of: {string.Join(", ", validTypes)}" });

            var evt = await _growthService.RecordEventAsync(
                request.EventType,
                request.UserId,
                request.SessionId,
                request.Metadata);

            return Ok(new { id = evt.Id, eventType = evt.EventType, createdAt = evt.CreatedAt });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record platform event");
            return StatusCode(500, new { error = "Failed to record event" });
        }
    }

    /// <summary>
    /// GET /api/admin/growth/export - CSV export
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv()
    {
        try
        {
            var trends = await _growthService.GetTrendsAsync(24);
            var funnel = await _growthService.GetFunnelAsync();
            var overview = await _growthService.GetOverviewAsync();

            var csv = new StringBuilder();

            // Overview section
            csv.AppendLine("# Growth Overview");
            csv.AppendLine("Metric,Value");
            csv.AppendLine($"Total Visitors,{overview.TotalVisitors}");
            csv.AppendLine($"Total Registered,{overview.TotalRegistered}");
            csv.AppendLine($"Total Trial Users,{overview.TotalTrialUsers}");
            csv.AppendLine($"Total Paid Users,{overview.TotalPaidUsers}");
            csv.AppendLine($"Monthly Growth Rate,{overview.MonthlyGrowthRate}%");
            csv.AppendLine($"Conversion Rate,{overview.ConversionRate}%");
            csv.AppendLine($"Churn Rate,{overview.ChurnRate}%");
            csv.AppendLine();

            // Trends section
            csv.AppendLine("# Monthly Trends");
            csv.AppendLine("Month,Visitors,Registered,TrialUsers,PaidUsers");
            foreach (var t in trends)
            {
                csv.AppendLine($"{t.Month},{t.Visitors},{t.Registered},{t.TrialUsers},{t.PaidUsers}");
            }
            csv.AppendLine();

            // Funnel section
            csv.AppendLine("# Conversion Funnel");
            csv.AppendLine("Stage,Count,Percentage");
            foreach (var f in funnel)
            {
                csv.AppendLine($"{f.Stage},{f.Count},{f.Percentage}%");
            }

            return File(
                Encoding.UTF8.GetBytes(csv.ToString()),
                "text/csv",
                $"growth-metrics-{DateTime.UtcNow:yyyy-MM-dd}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to export growth data");
            return StatusCode(500, "Export failed");
        }
    }
}

public record RecordEventRequest
{
    public string EventType { get; init; } = "";
    public string? UserId { get; init; }
    public string? SessionId { get; init; }
    public string? Metadata { get; init; }
}

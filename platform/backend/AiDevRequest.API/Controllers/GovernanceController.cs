using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/governance")]
[Authorize]
public class GovernanceController(AiDevRequestDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await db.GovernanceActions
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("evaluate")]
    public async Task<IActionResult> Evaluate([FromBody] EvaluateRequest req)
    {
        var rng = new Random();

        var classification = ClassifyAction(req.ActionType);
        var requiresApproval = classification == "destructive";
        var blocked = classification == "destructive" && req.ActionType == "mass-delete";
        var autoApproved = classification == "safe";

        var action = new GovernanceAction
        {
            ProjectName = req.ProjectName,
            ActionType = req.ActionType,
            ActionDescription = req.ActionDescription,
            Classification = classification,
            AgentId = req.AgentId,
            RequiresApproval = requiresApproval,
            ApprovalStatus = blocked ? "rejected" : autoApproved ? "auto-approved" : "pending",
            Blocked = blocked,
            BlockReason = blocked ? $"Mass deletion of {rng.Next(10, 50)} files requires manual review" : string.Empty,
            Rolled = false,
            RollbackAction = classification != "safe" ? $"git revert HEAD~1" : string.Empty,
            ExecutionTimeMs = Math.Round(rng.NextDouble() * 200 + 10, 2),
            AffectedFiles = rng.Next(1, 25),
            AuditTrail = $"Agent {req.AgentId} attempted {req.ActionType} on {req.ProjectName}",
            Status = blocked ? "blocked" : requiresApproval ? "pending-approval" : "completed"
        };

        db.GovernanceActions.Add(action);
        await db.SaveChangesAsync();

        return Ok(new
        {
            action,
            classification,
            requiresApproval,
            blocked,
            recommendation = classification switch
            {
                "safe" => "Action is safe to execute. Auto-approved.",
                "reversible" => "Action is reversible. Proceed with caution.",
                "destructive" => blocked ? "Action BLOCKED. Requires manual review." : "Action requires human approval before execution.",
                _ => "Unknown classification"
            },
            rollbackAvailable = classification != "safe",
            guardrails = new[]
            {
                new { rule = "Protected branch push", enabled = true, applies = req.ActionType == "git-push" },
                new { rule = "Schema migration review", enabled = true, applies = req.ActionType == "schema-change" },
                new { rule = "Secret exposure prevention", enabled = true, applies = req.ActionType == "secret-modify" },
                new { rule = "Mass deletion guard", enabled = true, applies = req.ActionType == "mass-delete" },
                new { rule = "File operation audit", enabled = true, applies = req.ActionType == "file-delete" }
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var entity = await db.GovernanceActions.FindAsync(id);
        if (entity == null) return NotFound();
        db.GovernanceActions.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await db.GovernanceActions.ToListAsync();
        if (all.Count == 0) return Ok(new { totalActions = 0 });

        var byClassification = all.GroupBy(x => x.Classification).Select(g => new
        {
            classification = g.Key,
            count = g.Count(),
            blockedCount = g.Count(x => x.Blocked),
            approvalRate = Math.Round((double)g.Count(x => x.ApprovalStatus == "approved" || x.ApprovalStatus == "auto-approved") / g.Count() * 100, 1)
        }).ToList();

        return Ok(new
        {
            totalActions = all.Count,
            blockedActions = all.Count(x => x.Blocked),
            pendingApprovals = all.Count(x => x.ApprovalStatus == "pending"),
            autoApproved = all.Count(x => x.ApprovalStatus == "auto-approved"),
            rollbackCount = all.Count(x => x.Rolled),
            avgExecutionTimeMs = Math.Round(all.Average(x => x.ExecutionTimeMs), 2),
            byClassification
        });
    }

    [AllowAnonymous]
    [HttpGet("rules")]
    public IActionResult GetRules()
    {
        return Ok(new[]
        {
            new { id = "protected-branch", name = "Protected Branch Guard", description = "Block force push to main/master branches", severity = "critical", enabled = true, color = "#ef4444" },
            new { id = "schema-review", name = "Schema Migration Review", description = "Require approval for database schema changes", severity = "high", enabled = true, color = "#f59e0b" },
            new { id = "secret-prevention", name = "Secret Exposure Prevention", description = "Detect and block credential commits", severity = "critical", enabled = true, color = "#ef4444" },
            new { id = "mass-delete", name = "Mass Deletion Guard", description = "Block bulk file deletion without confirmation", severity = "high", enabled = true, color = "#f59e0b" },
            new { id = "audit-trail", name = "Action Audit Trail", description = "Log all agent actions with rollback capability", severity = "medium", enabled = true, color = "#3b82f6" }
        });
    }

    private static string ClassifyAction(string actionType) => actionType switch
    {
        "git-push" => "destructive",
        "mass-delete" => "destructive",
        "schema-change" => "destructive",
        "secret-modify" => "destructive",
        "file-delete" => "reversible",
        _ => "safe"
    };

    public record EvaluateRequest(
        string ProjectName,
        string ActionType,
        string ActionDescription,
        string AgentId = "agent-1"
    );
}

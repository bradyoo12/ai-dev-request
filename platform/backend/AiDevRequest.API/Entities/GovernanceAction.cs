using BradYoo.Core.Common.Entities;

namespace AiDevRequest.API.Entities;

public class GovernanceAction : BaseEntity
{
    public string ProjectName { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;         // git-push, file-delete, schema-change, secret-modify, mass-delete
    public string ActionDescription { get; set; } = string.Empty;
    public string Classification { get; set; } = "safe";           // safe, reversible, destructive
    public string AgentId { get; set; } = string.Empty;
    public bool RequiresApproval { get; set; }
    public string ApprovalStatus { get; set; } = "pending";        // pending, approved, rejected, auto-approved
    public string ApprovedBy { get; set; } = string.Empty;
    public bool Blocked { get; set; }
    public string BlockReason { get; set; } = string.Empty;
    public bool Rolled { get; set; }
    public string RollbackAction { get; set; } = string.Empty;
    public double ExecutionTimeMs { get; set; }
    public int AffectedFiles { get; set; }
    public string AuditTrail { get; set; } = string.Empty;
    public string Status { get; set; } = "completed";              // completed, blocked, pending-approval, rolled-back
}

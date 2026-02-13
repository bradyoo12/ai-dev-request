using BradYoo.Core.Common.Entities;

namespace AiDevRequest.API.Entities;

public class EditPrediction : BaseEntity
{
    public string ProjectName { get; set; } = string.Empty;
    public string SourceFile { get; set; } = string.Empty;
    public string ChangeType { get; set; } = string.Empty;      // rename, delete, modify-signature, add-parameter, change-type, move
    public string ChangeDescription { get; set; } = string.Empty;
    public int AffectedFiles { get; set; }
    public int PredictedEdits { get; set; }
    public int AcceptedEdits { get; set; }
    public double Confidence { get; set; }
    public double RippleDepth { get; set; }                     // how many levels deep the ripple effect goes
    public int DependencyNodes { get; set; }
    public int ImportReferences { get; set; }
    public int TypeReferences { get; set; }
    public int TestFilesAffected { get; set; }
    public double AnalysisTimeMs { get; set; }
    public string Status { get; set; } = "completed";          // completed, analyzing, partial
}

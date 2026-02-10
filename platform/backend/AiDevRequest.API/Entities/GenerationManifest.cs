namespace AiDevRequest.API.Entities;

public class GenerationManifest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DevRequestId { get; set; }

    /// <summary>
    /// JSON array of file entries with metadata (path, language, size, dependencies, exports)
    /// </summary>
    public string FilesJson { get; set; } = "[]";

    /// <summary>
    /// JSON array of cross-file references (sourceFile, targetFile, referenceType, symbol)
    /// </summary>
    public string CrossReferencesJson { get; set; } = "[]";

    /// <summary>
    /// JSON array of validation results (rule, status, message, affectedFiles)
    /// </summary>
    public string ValidationResultsJson { get; set; } = "[]";

    /// <summary>
    /// Overall validation status: pending, passed, failed, resolved
    /// </summary>
    public string ValidationStatus { get; set; } = "pending";

    /// <summary>
    /// Total number of files in the manifest
    /// </summary>
    public int FileCount { get; set; }

    /// <summary>
    /// Number of cross-file references detected
    /// </summary>
    public int CrossReferenceCount { get; set; }

    /// <summary>
    /// Number of validation issues found
    /// </summary>
    public int IssueCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

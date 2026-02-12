using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class DevRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    public required string Description { get; set; }

    public string? ContactEmail { get; set; }

    public string? ContactPhone { get; set; }

    // Screenshot for design-to-code
    public string? ScreenshotBase64 { get; set; }

    public string? ScreenshotMediaType { get; set; }

    // Preferred framework (e.g. react, vue, svelte, nextjs, nuxt, angular)
    public string? Framework { get; set; }

    // AI power level for dynamic intelligence
    public PowerLevel PowerLevel { get; set; } = PowerLevel.Standard;

    // Request classification
    public RequestCategory Category { get; set; } = RequestCategory.Unknown;

    public RequestComplexity Complexity { get; set; } = RequestComplexity.Unknown;

    // Status tracking
    public RequestStatus Status { get; set; } = RequestStatus.Submitted;

    // AI Analysis results (stored as JSON)
    public string? AnalysisResultJson { get; set; }

    // AI Proposal (stored as JSON)
    public string? ProposalJson { get; set; }

    // Generated project info
    public string? ProjectId { get; set; }

    public string? ProjectPath { get; set; }

    // Expo preview
    public string? PreviewUrl { get; set; }

    // GitHub sync
    public string? GitHubRepoUrl { get; set; }

    public string? GitHubRepoFullName { get; set; }

    // Self-healing validation
    public int ValidationIterations { get; set; }

    public string? FixHistory { get; set; }

    public bool ValidationPassed { get; set; }

    // Model routing / cost tracking
    /// <summary>JSON summary of which model tiers were used for this request.</summary>
    public string? ModelTierUsage { get; set; }

    /// <summary>Estimated cost savings vs single-model (Opus-only) approach (USD).</summary>
    public decimal? EstimatedCostSavings { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? AnalyzedAt { get; set; }

    public DateTime? ProposedAt { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}

public enum RequestCategory
{
    Unknown,
    WebApp,
    MobileApp,
    Api,
    Automation,
    AiSolution,
    LandingPage,
    Dashboard,
    Chatbot,
    Other
}

public enum RequestComplexity
{
    Unknown,
    Simple,      // 1-3 days
    Medium,      // 1-2 weeks
    Complex,     // 3-4 weeks
    Enterprise   // 1+ months
}

public enum RequestStatus
{
    Submitted,      // 접수됨
    Analyzing,      // AI 분석 중
    Analyzed,       // 분석 완료
    ProposalReady,  // 제안서 준비됨
    Approved,       // 고객 승인
    Building,       // 제작 중
    Verifying,      // AI 품질 검증 중
    Staging,        // 스테이징 배포됨
    Completed,      // 완료
    Cancelled       // 취소됨
}

public enum PowerLevel
{
    Standard = 0,   // 표준 - 빠른 분석
    Extended = 1,   // 확장 사고 - 단계별 추론
    HighPower = 2   // 고성능 - 최고 성능 모델
}

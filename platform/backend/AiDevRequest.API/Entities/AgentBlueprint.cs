namespace AiDevRequest.API.Entities;

/// <summary>
/// Stores the specification for AI agent creation before generation.
/// Used by AI Agent Builder feature to design and generate specialized agents.
/// </summary>
public class AgentBlueprint
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public required string UserId { get; set; }

    public required string Name { get; set; }

    /// <summary>
    /// Natural language description from user describing what the agent should do
    /// </summary>
    public required string Description { get; set; }

    /// <summary>
    /// Type of agent: Slack, Telegram, CustomerService, Monitoring, DataPipeline, etc.
    /// </summary>
    public required string AgentType { get; set; }

    /// <summary>
    /// JSON array of extracted capabilities from AI analysis
    /// </summary>
    public string? CapabilitiesJson { get; set; }

    /// <summary>
    /// JSON array of external services/APIs to integrate
    /// </summary>
    public string? IntegrationsJson { get; set; }

    /// <summary>
    /// JSON object containing generated agent configuration
    /// </summary>
    public string? ConfigurationJson { get; set; }

    /// <summary>
    /// Generated agent code (implementation)
    /// </summary>
    public string? GeneratedCode { get; set; }

    /// <summary>
    /// Status: Draft, Analyzing, Generating, Ready, Failed, Deployed
    /// </summary>
    public string Status { get; set; } = "Draft";

    /// <summary>
    /// Error message if generation failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Foreign key to generated AgentSkill entity
    /// </summary>
    public Guid? GeneratedSkillId { get; set; }

    /// <summary>
    /// Navigation property to generated AgentSkill
    /// </summary>
    public AgentSkill? GeneratedSkill { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

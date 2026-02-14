using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Services;

public interface IAgentBuilderService
{
    Task<AgentSkill> GenerateAgentFromSpecAsync(string specification, string userId);
    Task<AgentSkill> PreviewAgentAsync(string specification);
    Task<bool> ValidateAgentConfigAsync(AgentSkill skill);
    Task<AgentDeployment> DeployAgentAsync(Guid agentSkillId, string platform, string configJson, string userId);
    Task<List<AgentDeployment>> GetDeploymentsAsync(string userId);
    Task<bool> UndeployAgentAsync(Guid deploymentId, string userId);
    Task<List<AgentTemplate>> GetAgentTemplatesAsync();
}

public record AgentTemplate
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Category { get; init; } = "";
    public string Platform { get; init; } = "";
    public string IconUrl { get; init; } = "";
    public string TemplateSpec { get; init; } = "";
}

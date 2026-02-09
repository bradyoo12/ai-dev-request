using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface IProductionService
{
    Task<ProductionResult> GenerateProjectAsync(string requestId, string description, ProposalResult proposal, string platform = "web", string complexity = "Medium", string? screenshotBase64 = null, string? screenshotMediaType = null);
    Task<string> GetBuildStatusAsync(string projectId);
}

public class ProductionService : IProductionService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<ProductionService> _logger;
    private readonly string _projectsBasePath;

    public ProductionService(IConfiguration configuration, ILogger<ProductionService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _logger = logger;
        _projectsBasePath = configuration["Projects:BasePath"] ?? "./projects";
    }

    private static int GetThinkingBudget(string complexity)
    {
        return complexity.ToLowerInvariant() switch
        {
            "simple" => 0,        // No thinking — fast, cheap
            "medium" => 10000,    // Light thinking budget
            "complex" => 50000,   // Full thinking budget
            "enterprise" => 50000,
            _ => 0
        };
    }

    public async Task<ProductionResult> GenerateProjectAsync(string requestId, string description, ProposalResult proposal, string platform = "web", string complexity = "Medium", string? screenshotBase64 = null, string? screenshotMediaType = null)
    {
        var projectId = $"proj_{requestId[..8]}_{DateTime.UtcNow:yyyyMMdd}";
        var projectPath = Path.Combine(_projectsBasePath, projectId);
        var thinkingBudget = GetThinkingBudget(complexity);

        _logger.LogInformation("Starting project generation: {ProjectId} (platform: {Platform}, complexity: {Complexity}, thinking: {ThinkingBudget})", projectId, platform, complexity, thinkingBudget);

        var proposalJson = JsonSerializer.Serialize(proposal);

        var isMobile = platform == "mobile" || platform == "fullstack";

        var projectTypeOptions = isMobile
            ? "react-native|expo"
            : "react|nextjs|dotnet|python";

        var fileGuidance = isMobile
            ? @"핵심 파일들만 생성하세요:
- package.json (React Native + Expo 의존성)
- app.json (Expo 설정)
- App.tsx (메인 진입점)
- 스크린 파일들 (screens/ 디렉토리, 3-5개)
- 네비게이션 설정 (navigation/)
- 핵심 컴포넌트 (components/ 디렉토리)
- README.md

React Native + Expo (managed workflow) 기반으로 생성하세요.
React Navigation을 사용하세요.
NativeWind (Tailwind for RN) 또는 React Native Paper를 UI에 사용하세요."
            : @"핵심 파일들만 생성하세요:
- package.json / .csproj (의존성)
- 메인 진입점 파일
- 핵심 컴포넌트/서비스 파일 (3-5개)
- 설정 파일 (환경변수, 빌드 설정)
- README.md";

        var prompt = $@"당신은 소프트웨어 프로젝트를 생성하는 전문 개발자입니다.

다음 제안서를 바탕으로 프로젝트 구조와 핵심 파일들을 생성해주세요.

## 원본 요청
{description}

## 제안서
{proposalJson}

다음 JSON 형식으로 프로젝트 파일들을 생성해주세요:

{{
  ""projectName"": ""프로젝트 이름 (영문, 케밥케이스)"",
  ""projectType"": ""{projectTypeOptions}"",
  ""files"": [
    {{
      ""path"": ""상대 파일 경로"",
      ""content"": ""파일 내용"",
      ""description"": ""파일 설명""
    }}
  ],
  ""setupCommands"": [""초기 설정 명령어 목록""],
  ""buildCommands"": [""빌드 명령어 목록""],
  ""deployConfig"": {{
    ""platform"": ""azure|vercel|docker|expo"",
    ""settings"": {{}}
  }},
  ""envVariables"": [
    {{""name"": ""환경변수명"", ""description"": ""설명"", ""required"": true}}
  ]
}}

{fileGuidance}

JSON만 응답하세요.";

        try
        {
            List<Message> messages;

            if (!string.IsNullOrEmpty(screenshotBase64))
            {
                var contentBlocks = new List<ContentBase>
                {
                    new ImageContent
                    {
                        Source = new ImageSource
                        {
                            MediaType = screenshotMediaType ?? "image/png",
                            Data = screenshotBase64,
                        }
                    },
                    new TextContent { Text = prompt + "\n\n사용자가 첨부한 디자인 스크린샷을 참고하여 UI를 최대한 동일하게 구현해주세요." }
                };
                messages = new List<Message> { new Message { Role = RoleType.User, Content = contentBlocks } };
            }
            else
            {
                messages = new List<Message> { new Message(RoleType.User, prompt) };
            }

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = thinkingBudget > 0 ? 16000 : 8000,
            };

            if (thinkingBudget > 0)
            {
                // Extended thinking requires Temperature = 1
                parameters.Temperature = 1.0m;
                parameters.Thinking = new ThinkingParameters { BudgetTokens = thinkingBudget };
                _logger.LogInformation("Extended thinking enabled with {Budget} token budget for {ProjectId}", thinkingBudget, projectId);
            }
            else
            {
                parameters.Temperature = 0.3m;
            }

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            // Extract text content (skip thinking blocks)
            var content = string.Join("", response.Content
                .Where(c => c is TextContent)
                .Select(c => c.ToString())) ?? "{}";

            // Extract JSON
            var jsonStart = content.IndexOf('{');
            var jsonEnd = content.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                content = content[jsonStart..(jsonEnd + 1)];
            }

            var generatedProject = JsonSerializer.Deserialize<GeneratedProject>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (generatedProject == null)
            {
                throw new Exception("Failed to parse generated project");
            }

            // Create project directory and files
            Directory.CreateDirectory(projectPath);

            foreach (var file in generatedProject.Files)
            {
                var filePath = Path.Combine(projectPath, file.Path);
                var directory = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(directory))
                {
                    Directory.CreateDirectory(directory);
                }
                await File.WriteAllTextAsync(filePath, file.Content);
                _logger.LogInformation("Created file: {FilePath}", filePath);
            }

            _logger.LogInformation("Project generated successfully: {ProjectId} at {Path}", projectId, projectPath);

            return new ProductionResult
            {
                ProjectId = projectId,
                ProjectPath = projectPath,
                ProjectName = generatedProject.ProjectName,
                ProjectType = generatedProject.ProjectType,
                FilesGenerated = generatedProject.Files.Count,
                SetupCommands = generatedProject.SetupCommands,
                BuildCommands = generatedProject.BuildCommands,
                DeployConfig = generatedProject.DeployConfig,
                EnvVariables = generatedProject.EnvVariables,
                Status = "generated",
                StagingUrl = null, // Will be set after deployment
                Message = $"프로젝트가 성공적으로 생성되었습니다. {generatedProject.Files.Count}개 파일이 생성되었습니다."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate project {ProjectId}", projectId);
            return new ProductionResult
            {
                ProjectId = projectId,
                ProjectPath = projectPath,
                Status = "failed",
                Message = $"프로젝트 생성 실패: {ex.Message}"
            };
        }
    }

    public Task<string> GetBuildStatusAsync(string projectId)
    {
        var projectPath = Path.Combine(_projectsBasePath, projectId);
        if (Directory.Exists(projectPath))
        {
            return Task.FromResult("completed");
        }
        return Task.FromResult("not_found");
    }
}

public class ProductionResult
{
    public string ProjectId { get; set; } = "";
    public string ProjectPath { get; set; } = "";
    public string ProjectName { get; set; } = "";
    public string ProjectType { get; set; } = "";
    public int FilesGenerated { get; set; }
    public List<string> SetupCommands { get; set; } = new();
    public List<string> BuildCommands { get; set; } = new();
    public DeployConfigInfo DeployConfig { get; set; } = new();
    public List<EnvVariableInfo> EnvVariables { get; set; } = new();
    public string Status { get; set; } = "";
    public string? StagingUrl { get; set; }
    public string Message { get; set; } = "";
    public int? VerificationScore { get; set; }
    public bool? VerificationPassed { get; set; }
    public string? VerificationSummary { get; set; }
    public int? AccessibilityScore { get; set; }
    public string? AccessibilitySummary { get; set; }
    public int? AccessibilityIssueCount { get; set; }
    public int? TestFilesGenerated { get; set; }
    public int? TotalTestCount { get; set; }
    public int? TestCoverageEstimate { get; set; }
    public string? TestFramework { get; set; }
    public string? TestSummary { get; set; }
    public int? CodeReviewScore { get; set; }
    public int? SecurityScore { get; set; }
    public int? PerformanceScore { get; set; }
    public int? CodeQualityScore { get; set; }
    public string? CodeReviewSummary { get; set; }
    public int? CodeReviewIssueCount { get; set; }
    public string? CiCdProvider { get; set; }
    public int? CiCdWorkflowCount { get; set; }
    public string? CiCdSummary { get; set; }
    public List<string>? CiCdRequiredSecrets { get; set; }
    public bool? HasDatabase { get; set; }
    public string? DatabaseProvider { get; set; }
    public int? DatabaseTableCount { get; set; }
    public int? DatabaseRelationshipCount { get; set; }
    public string? DatabaseSummary { get; set; }
    public List<string>? DatabaseTables { get; set; }
}

public class GeneratedProject
{
    public string ProjectName { get; set; } = "";
    public string ProjectType { get; set; } = "";
    public List<GeneratedFile> Files { get; set; } = new();
    public List<string> SetupCommands { get; set; } = new();
    public List<string> BuildCommands { get; set; } = new();
    public DeployConfigInfo DeployConfig { get; set; } = new();
    public List<EnvVariableInfo> EnvVariables { get; set; } = new();
}

public class GeneratedFile
{
    public string Path { get; set; } = "";
    public string Content { get; set; } = "";
    public string Description { get; set; } = "";
}

public class DeployConfigInfo
{
    public string Platform { get; set; } = "";
    public Dictionary<string, object> Settings { get; set; } = new();
}

public class EnvVariableInfo
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public bool Required { get; set; }
}

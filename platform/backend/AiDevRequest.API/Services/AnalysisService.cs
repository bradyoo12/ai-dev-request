using System.Text.Json;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface IAnalysisService
{
    Task<AnalysisResult> AnalyzeRequestAsync(string description);
}

public class AnalysisService : IAnalysisService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<AnalysisService> _logger;

    public AnalysisService(IConfiguration configuration, ILogger<AnalysisService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _logger = logger;
    }

    public async Task<AnalysisResult> AnalyzeRequestAsync(string description)
    {
        var prompt = $@"당신은 소프트웨어 개발 요청을 분석하는 전문가입니다.

사용자의 개발 요청을 분석하고 다음 JSON 형식으로 응답해주세요:

{{
  ""category"": ""WebApp|MobileApp|Api|Automation|AiSolution|LandingPage|Dashboard|Chatbot|Other"",
  ""complexity"": ""Simple|Medium|Complex|Enterprise"",
  ""summary"": ""요청 내용 한 줄 요약"",
  ""requirements"": {{
    ""functional"": [""기능 요구사항 목록""],
    ""nonFunctional"": [""비기능 요구사항 (성능, 보안 등)""],
    ""integrations"": [""외부 연동 필요사항 (결제, 인증 등)""]
  }},
  ""feasibility"": {{
    ""score"": 0.0-1.0,
    ""risks"": [""잠재적 리스크""],
    ""questions"": [""추가로 확인이 필요한 사항""]
  }},
  ""estimatedDays"": 숫자,
  ""suggestedStack"": {{
    ""frontend"": ""추천 프론트엔드 기술"",
    ""backend"": ""추천 백엔드 기술"",
    ""database"": ""추천 데이터베이스"",
    ""others"": [""기타 필요 기술""]
  }}
}}

사용자 요청:
{description}

JSON만 응답하세요. 다른 텍스트는 포함하지 마세요.";

        try
        {
            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 2000,
                Temperature = 0.3m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            // Extract JSON from response (in case there's extra text)
            var jsonStart = content.IndexOf('{');
            var jsonEnd = content.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                content = content[jsonStart..(jsonEnd + 1)];
            }

            var result = JsonSerializer.Deserialize<AnalysisResult>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result ?? new AnalysisResult { Summary = "분석 실패" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze request");
            return new AnalysisResult
            {
                Summary = "분석 중 오류가 발생했습니다.",
                Category = "Other",
                Complexity = "Unknown",
                Feasibility = new FeasibilityInfo { Score = 0, Risks = new[] { ex.Message } }
            };
        }
    }
}

public class AnalysisResult
{
    public string Category { get; set; } = "Unknown";
    public string Complexity { get; set; } = "Unknown";
    public string Summary { get; set; } = "";
    public RequirementsInfo Requirements { get; set; } = new();
    public FeasibilityInfo Feasibility { get; set; } = new();
    public int EstimatedDays { get; set; }
    public TechStackInfo SuggestedStack { get; set; } = new();
}

public class RequirementsInfo
{
    public string[] Functional { get; set; } = Array.Empty<string>();
    public string[] NonFunctional { get; set; } = Array.Empty<string>();
    public string[] Integrations { get; set; } = Array.Empty<string>();
}

public class FeasibilityInfo
{
    public double Score { get; set; }
    public string[] Risks { get; set; } = Array.Empty<string>();
    public string[] Questions { get; set; } = Array.Empty<string>();
}

public class TechStackInfo
{
    public string Frontend { get; set; } = "";
    public string Backend { get; set; } = "";
    public string Database { get; set; } = "";
    public string[] Others { get; set; } = Array.Empty<string>();
}

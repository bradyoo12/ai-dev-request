using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface IProposalService
{
    Task<ProposalResult> GenerateProposalAsync(string description, AnalysisResult analysis);
}

public class ProposalService : IProposalService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<ProposalService> _logger;

    public ProposalService(IConfiguration configuration, ILogger<ProposalService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _logger = logger;
    }

    public async Task<ProposalResult> GenerateProposalAsync(string description, AnalysisResult analysis)
    {
        var analysisJson = JsonSerializer.Serialize(analysis);

        var prompt = $@"당신은 소프트웨어 개발 제안서를 작성하는 전문가입니다.

사용자의 개발 요청과 AI 분석 결과를 바탕으로 상세한 제안서를 작성해주세요.

## 원본 요청
{description}

## AI 분석 결과
{analysisJson}

다음 JSON 형식으로 제안서를 작성해주세요:

{{
  ""title"": ""프로젝트 제목"",
  ""summary"": ""프로젝트 요약 (2-3문장)"",
  ""scope"": {{
    ""included"": [""포함되는 범위 목록""],
    ""excluded"": [""제외되는 범위 목록""]
  }},
  ""architecture"": {{
    ""overview"": ""아키텍처 개요 설명"",
    ""components"": [
      {{""name"": ""컴포넌트명"", ""description"": ""설명"", ""technology"": ""기술""}}
    ],
    ""dataFlow"": ""데이터 흐름 설명""
  }},
  ""milestones"": [
    {{
      ""phase"": 1,
      ""name"": ""마일스톤 이름"",
      ""description"": ""설명"",
      ""deliverables"": [""산출물 목록""],
      ""durationDays"": 숫자
    }}
  ],
  ""pricing"": {{
    ""development"": {{
      ""amount"": 숫자,
      ""currency"": ""KRW"",
      ""breakdown"": [
        {{""item"": ""항목"", ""amount"": 숫자}}
      ]
    }},
    ""monthly"": {{
      ""hosting"": 숫자,
      ""maintenance"": 숫자,
      ""apiCosts"": 숫자,
      ""total"": 숫자
    }}
  }},
  ""timeline"": {{
    ""totalDays"": 숫자,
    ""startDate"": ""시작 가능일 (예: 승인 후 즉시)"",
    ""phases"": [
      {{""name"": ""단계명"", ""duration"": ""기간"", ""description"": ""설명""}}
    ]
  }},
  ""terms"": {{
    ""payment"": ""결제 조건"",
    ""warranty"": ""보증 조건"",
    ""support"": ""지원 조건""
  }},
  ""nextSteps"": [""다음 단계 목록""]
}}

가격은 한국 원화(KRW)로 작성하고, 복잡도에 맞는 현실적인 가격을 산정해주세요:
- Simple: 50만원 ~ 200만원
- Medium: 200만원 ~ 800만원
- Complex: 800만원 ~ 3000만원
- Enterprise: 3000만원 이상

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
                MaxTokens = 4000,
                Temperature = 0.4m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            // Extract JSON from response
            var jsonStart = content.IndexOf('{');
            var jsonEnd = content.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                content = content[jsonStart..(jsonEnd + 1)];
            }

            var result = JsonSerializer.Deserialize<ProposalResult>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result ?? new ProposalResult { Title = "제안서 생성 실패" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate proposal");
            return new ProposalResult
            {
                Title = "제안서 생성 실패",
                Summary = $"오류: {ex.Message}"
            };
        }
    }
}

public class ProposalResult
{
    public string Title { get; set; } = "";
    public string Summary { get; set; } = "";
    public ScopeInfo Scope { get; set; } = new();
    public ArchitectureInfo Architecture { get; set; } = new();
    public List<MilestoneInfo> Milestones { get; set; } = new();
    public PricingInfo Pricing { get; set; } = new();
    public TimelineInfo Timeline { get; set; } = new();
    public TermsInfo Terms { get; set; } = new();
    public List<string> NextSteps { get; set; } = new();
}

public class ScopeInfo
{
    public List<string> Included { get; set; } = new();
    public List<string> Excluded { get; set; } = new();
}

public class ArchitectureInfo
{
    public string Overview { get; set; } = "";
    public List<ComponentInfo> Components { get; set; } = new();
    public string DataFlow { get; set; } = "";
}

public class ComponentInfo
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Technology { get; set; } = "";
}

public class MilestoneInfo
{
    public int Phase { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public List<string> Deliverables { get; set; } = new();
    public int DurationDays { get; set; }
}

public class PricingInfo
{
    public DevelopmentCost Development { get; set; } = new();
    public MonthlyCost Monthly { get; set; } = new();
}

public class DevelopmentCost
{
    public long Amount { get; set; }
    public string Currency { get; set; } = "KRW";
    public List<CostBreakdown> Breakdown { get; set; } = new();
}

public class CostBreakdown
{
    public string Item { get; set; } = "";
    public long Amount { get; set; }
}

public class MonthlyCost
{
    public long Hosting { get; set; }
    public long Maintenance { get; set; }
    public long ApiCosts { get; set; }
    public long Total { get; set; }
}

public class TimelineInfo
{
    public int TotalDays { get; set; }
    public string StartDate { get; set; } = "";
    public List<PhaseInfo> Phases { get; set; } = new();
}

public class PhaseInfo
{
    public string Name { get; set; } = "";
    public string Duration { get; set; } = "";
    public string Description { get; set; } = "";
}

public class TermsInfo
{
    public string Payment { get; set; } = "";
    public string Warranty { get; set; } = "";
    public string Support { get; set; } = "";
}

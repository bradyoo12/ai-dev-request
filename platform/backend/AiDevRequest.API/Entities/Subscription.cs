using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class Subscription
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public required string Email { get; set; }

    public SubscriptionPlan Plan { get; set; } = SubscriptionPlan.Free;

    public int ProjectLimit { get; set; } = 1;

    public int ProjectsUsed { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; set; }

    public bool IsActive => ExpiresAt == null || ExpiresAt > DateTime.UtcNow;
}

public enum SubscriptionPlan
{
    Free,       // 1 project, basic features
    Starter,    // 3 projects, ₩49,000/월
    Pro,        // 10 projects, ₩149,000/월
    Enterprise  // Unlimited, custom pricing
}

public class PricingPlan
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string NameKorean { get; set; } = "";
    public long PriceMonthly { get; set; }
    public long PriceYearly { get; set; }
    public string Currency { get; set; } = "KRW";
    public int ProjectLimit { get; set; }
    public List<string> Features { get; set; } = new();
    public bool IsPopular { get; set; }

    public static List<PricingPlan> GetAllPlans() => new()
    {
        new PricingPlan
        {
            Id = "free",
            Name = "Free",
            NameKorean = "무료",
            PriceMonthly = 0,
            PriceYearly = 0,
            ProjectLimit = 1,
            Features = new List<string>
            {
                "1개 프로젝트",
                "기본 AI 분석",
                "스테이징 환경 7일",
                "커뮤니티 지원"
            }
        },
        new PricingPlan
        {
            Id = "starter",
            Name = "Starter",
            NameKorean = "스타터",
            PriceMonthly = 49000,
            PriceYearly = 490000,
            ProjectLimit = 3,
            Features = new List<string>
            {
                "3개 프로젝트",
                "고급 AI 분석",
                "자동 코드 생성",
                "공유 호스팅",
                "이메일 지원"
            }
        },
        new PricingPlan
        {
            Id = "pro",
            Name = "Pro",
            NameKorean = "프로",
            PriceMonthly = 149000,
            PriceYearly = 1490000,
            ProjectLimit = 10,
            IsPopular = true,
            Features = new List<string>
            {
                "10개 프로젝트",
                "최고급 AI 분석",
                "커스텀 도메인",
                "전용 리소스",
                "우선 지원",
                "API 액세스"
            }
        },
        new PricingPlan
        {
            Id = "enterprise",
            Name = "Enterprise",
            NameKorean = "엔터프라이즈",
            PriceMonthly = -1, // Contact us
            PriceYearly = -1,
            ProjectLimit = -1, // Unlimited
            Features = new List<string>
            {
                "무제한 프로젝트",
                "온프레미스 옵션",
                "전담 지원",
                "SLA 보장",
                "커스텀 통합",
                "보안 감사"
            }
        }
    };
}

using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Data;

public class AiDevRequestDbContext : DbContext
{
    public AiDevRequestDbContext(DbContextOptions<AiDevRequestDbContext> options)
        : base(options)
    {
    }

    public DbSet<DevRequest> DevRequests => Set<DevRequest>();
    public DbSet<Language> Languages => Set<Language>();
    public DbSet<Translation> Translations => Set<Translation>();
    public DbSet<TokenBalance> TokenBalances => Set<TokenBalance>();
    public DbSet<TokenTransaction> TokenTransactions => Set<TokenTransaction>();
    public DbSet<TokenPackage> TokenPackages => Set<TokenPackage>();
    public DbSet<TokenPricing> TokenPricings => Set<TokenPricing>();
    public DbSet<Deployment> Deployments => Set<Deployment>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AutoTopUpConfig> AutoTopUpConfigs => Set<AutoTopUpConfig>();
    public DbSet<HostingPlan> HostingPlans => Set<HostingPlan>();
    public DbSet<BuildVerification> BuildVerifications => Set<BuildVerification>();
    public DbSet<RefinementMessage> RefinementMessages => Set<RefinementMessage>();
    public DbSet<Suggestion> Suggestions => Set<Suggestion>();
    public DbSet<SuggestionVote> SuggestionVotes => Set<SuggestionVote>();
    public DbSet<SuggestionComment> SuggestionComments => Set<SuggestionComment>();
    public DbSet<SuggestionStatusHistory> SuggestionStatusHistories => Set<SuggestionStatusHistory>();
    public DbSet<SubscriptionRecord> SubscriptionRecords => Set<SubscriptionRecord>();
    public DbSet<SubscriptionEvent> SubscriptionEvents => Set<SubscriptionEvent>();
    public DbSet<ChurnMetricSnapshot> ChurnMetricSnapshots => Set<ChurnMetricSnapshot>();
    public DbSet<Domain> Domains => Set<Domain>();
    public DbSet<DomainTransaction> DomainTransactions => Set<DomainTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DevRequest>(entity =>
        {
            entity.ToTable("dev_requests");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(10000);

            entity.Property(e => e.ContactEmail)
                .HasMaxLength(255);

            entity.Property(e => e.ContactPhone)
                .HasMaxLength(50);

            entity.Property(e => e.ScreenshotBase64)
                .HasColumnType("text");

            entity.Property(e => e.ScreenshotMediaType)
                .HasMaxLength(50);

            entity.Property(e => e.Category)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.Complexity)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.AnalysisResultJson)
                .HasColumnType("jsonb");

            entity.Property(e => e.ProposalJson)
                .HasColumnType("jsonb");

            entity.Property(e => e.ProjectId)
                .HasMaxLength(100);

            entity.Property(e => e.ProjectPath)
                .HasMaxLength(500);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<Language>(entity =>
        {
            entity.ToTable("languages");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Code)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.NativeName)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(e => e.Code).IsUnique();

            entity.HasData(
                new Language { Id = 1, Code = "ko", Name = "Korean", NativeName = "\ud55c\uad6d\uc5b4", IsDefault = true, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Language { Id = 2, Code = "en", Name = "English", NativeName = "English", IsDefault = false, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        });

        modelBuilder.Entity<Translation>(entity =>
        {
            entity.ToTable("translations");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.LanguageCode)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(e => e.Namespace)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Key)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.Value)
                .IsRequired();

            entity.HasIndex(e => new { e.LanguageCode, e.Namespace, e.Key }).IsUnique();
        });

        modelBuilder.Entity<TokenBalance>(entity =>
        {
            entity.ToTable("token_balances");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<TokenTransaction>(entity =>
        {
            entity.ToTable("token_transactions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ReferenceId).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<TokenPackage>(entity =>
        {
            entity.ToTable("token_packages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PriceUsd).HasColumnType("decimal(10,2)");
            entity.HasData(
                new TokenPackage { Id = 1, Name = "500 Tokens", TokenAmount = 500, PriceUsd = 5.00m, SortOrder = 1 },
                new TokenPackage { Id = 2, Name = "1,000 Tokens", TokenAmount = 1000, PriceUsd = 10.00m, SortOrder = 2 },
                new TokenPackage { Id = 3, Name = "3,000 Tokens", TokenAmount = 3000, PriceUsd = 25.00m, DiscountPercent = 17, SortOrder = 3 },
                new TokenPackage { Id = 4, Name = "10,000 Tokens", TokenAmount = 10000, PriceUsd = 70.00m, DiscountPercent = 30, SortOrder = 4 }
            );
        });

        modelBuilder.Entity<TokenPricing>(entity =>
        {
            entity.ToTable("token_pricing");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ActionType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.HasIndex(e => e.ActionType).IsUnique();
            entity.HasData(
                new TokenPricing { Id = 1, ActionType = "analysis", TokenCost = 50, Description = "AI Analysis" },
                new TokenPricing { Id = 2, ActionType = "proposal", TokenCost = 100, Description = "Proposal Generation" },
                new TokenPricing { Id = 3, ActionType = "build", TokenCost = 300, Description = "Project Build" },
                new TokenPricing { Id = 4, ActionType = "staging", TokenCost = 50, Description = "Staging Deploy" },
                new TokenPricing { Id = 5, ActionType = "refinement", TokenCost = 10, Description = "Chat Refinement" }
            );
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("payments");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.StripePaymentIntentId).HasMaxLength(200);
            entity.Property(e => e.StripeCheckoutSessionId).HasMaxLength(200);
            entity.Property(e => e.AmountUsd).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Currency).HasMaxLength(10);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.MetadataJson).HasColumnType("jsonb");

            entity.Property(e => e.Type)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.StripePaymentIntentId);
            entity.HasIndex(e => e.StripeCheckoutSessionId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<Deployment>(entity =>
        {
            entity.ToTable("deployments");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SiteName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ResourceGroupName).HasMaxLength(200);
            entity.Property(e => e.PreviewUrl).HasMaxLength(500);
            entity.Property(e => e.ContainerAppName).HasMaxLength(100);
            entity.Property(e => e.ContainerImageTag).HasMaxLength(200);
            entity.Property(e => e.Region).HasMaxLength(50);
            entity.Property(e => e.ProjectType).HasMaxLength(50);
            entity.Property(e => e.DeploymentLogJson).HasColumnType("jsonb");

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.ProfileImageUrl).HasMaxLength(500);
            entity.Property(e => e.AnonymousUserId).HasMaxLength(100);
            entity.Property(e => e.GoogleId).HasMaxLength(100);
            entity.Property(e => e.AppleId).HasMaxLength(100);
            entity.Property(e => e.LineId).HasMaxLength(100);
            entity.Property(e => e.KakaoId).HasMaxLength(100);
            entity.Property(e => e.CountryCode).HasMaxLength(10);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.AnonymousUserId);
            entity.HasIndex(e => e.GoogleId);
            entity.HasIndex(e => e.KakaoId);
            entity.HasIndex(e => e.LineId);
            entity.HasIndex(e => e.AppleId);
        });

        modelBuilder.Entity<AutoTopUpConfig>(entity =>
        {
            entity.ToTable("auto_topup_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.MonthlyLimitUsd).HasColumnType("decimal(10,2)");
            entity.Property(e => e.MonthlySpentUsd).HasColumnType("decimal(10,2)");
            entity.Property(e => e.FailureReason).HasMaxLength(500);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<BuildVerification>(entity =>
        {
            entity.ToTable("build_verifications");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50);
            entity.Property(e => e.ResultJson).HasColumnType("jsonb");
            entity.HasIndex(e => e.DevRequestId);
        });

        modelBuilder.Entity<RefinementMessage>(entity =>
        {
            entity.ToTable("refinement_messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Content).IsRequired();
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<Suggestion>(entity =>
        {
            entity.ToTable("suggestions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(5000);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<SuggestionVote>(entity =>
        {
            entity.ToTable("suggestion_votes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => new { e.SuggestionId, e.UserId }).IsUnique();
            entity.HasIndex(e => e.SuggestionId);
        });

        modelBuilder.Entity<SuggestionComment>(entity =>
        {
            entity.ToTable("suggestion_comments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(5000);
            entity.HasIndex(e => e.SuggestionId);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<SuggestionStatusHistory>(entity =>
        {
            entity.ToTable("suggestion_status_history");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FromStatus).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ToStatus).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ChangedByUserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.HasIndex(e => e.SuggestionId);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<SubscriptionRecord>(entity =>
        {
            entity.ToTable("subscription_records");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PlanType).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.StartedAt);
        });

        modelBuilder.Entity<SubscriptionEvent>(entity =>
        {
            entity.ToTable("subscription_events");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UserEmail).HasMaxLength(255);
            entity.Property(e => e.EventType).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.FromPlan).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.ToPlan).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.EventType);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<ChurnMetricSnapshot>(entity =>
        {
            entity.ToTable("churn_metric_snapshots");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ChurnRate).HasColumnType("decimal(10,4)");
            entity.Property(e => e.Mrr).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.PeriodStart);
        });

        modelBuilder.Entity<Domain>(entity =>
        {
            entity.ToTable("domains");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DomainName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Tld).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Registrar).HasMaxLength(50);
            entity.Property(e => e.RegistrarDomainId).HasMaxLength(200);
            entity.Property(e => e.AnnualCostUsd).HasColumnType("decimal(10,2)");

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.SslStatus)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.DnsStatus)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.DeploymentId);
            entity.HasIndex(e => e.DomainName).IsUnique();
        });

        modelBuilder.Entity<DomainTransaction>(entity =>
        {
            entity.ToTable("domain_transactions");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AmountUsd).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.Property(e => e.Type)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.PaymentMethod)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.HasIndex(e => e.DomainId);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<HostingPlan>(entity =>
        {
            entity.ToTable("hosting_plans");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.MonthlyCostUsd).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Vcpu).HasMaxLength(20);
            entity.Property(e => e.MemoryGb).HasMaxLength(20);
            entity.Property(e => e.AzureSku).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.BestFor).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasData(
                new HostingPlan { Id = 1, Name = "free", DisplayName = "Free", MonthlyCostUsd = 0, Vcpu = "Shared", MemoryGb = "0.25", StorageGb = 1, BandwidthGb = 5, SupportsCustomDomain = false, SupportsAutoscale = false, SupportsSla = false, MaxInstances = 1, AzureSku = "Consumption-Free", Description = "Perfect for testing and preview. 7-day expiry.", BestFor = "Testing, previews, prototypes", SortOrder = 1 },
                new HostingPlan { Id = 2, Name = "basic", DisplayName = "Basic", MonthlyCostUsd = 5.00m, Vcpu = "1", MemoryGb = "0.5", StorageGb = 1, BandwidthGb = 50, SupportsCustomDomain = true, SupportsAutoscale = false, SupportsSla = false, MaxInstances = 1, AzureSku = "Consumption-Basic", Description = "Always-on hosting with custom domain support.", BestFor = "Personal projects, small business sites", SortOrder = 2 },
                new HostingPlan { Id = 3, Name = "standard", DisplayName = "Standard", MonthlyCostUsd = 25.00m, Vcpu = "2", MemoryGb = "2", StorageGb = 5, BandwidthGb = 200, SupportsCustomDomain = true, SupportsAutoscale = true, SupportsSla = true, MaxInstances = 3, AzureSku = "Dedicated-D4", Description = "Auto-scaling with SLA guarantee.", BestFor = "Business apps, medium-traffic sites", SortOrder = 3 },
                new HostingPlan { Id = 4, Name = "premium", DisplayName = "Premium", MonthlyCostUsd = 70.00m, Vcpu = "4", MemoryGb = "4", StorageGb = 20, BandwidthGb = 500, SupportsCustomDomain = true, SupportsAutoscale = true, SupportsSla = true, MaxInstances = 10, AzureSku = "Dedicated-D8", Description = "High-performance with 99.9% SLA.", BestFor = "Enterprise apps, high-traffic platforms", SortOrder = 4 }
            );
        });
    }
}

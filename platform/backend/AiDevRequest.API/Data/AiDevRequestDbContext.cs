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
    public DbSet<ProjectVersion> ProjectVersions => Set<ProjectVersion>();
    public DbSet<ProjectTemplate> ProjectTemplates => Set<ProjectTemplate>();
    public DbSet<AgentCard> AgentCards => Set<AgentCard>();
    public DbSet<A2ATask> A2ATasks => Set<A2ATask>();
    public DbSet<A2AArtifact> A2AArtifacts => Set<A2AArtifact>();
    public DbSet<A2AConsent> A2AConsents => Set<A2AConsent>();
    public DbSet<A2AAuditLog> A2AAuditLogs => Set<A2AAuditLog>();
    public DbSet<UserMemory> UserMemories => Set<UserMemory>();
    public DbSet<UserPreference> UserPreferences => Set<UserPreference>();
    public DbSet<UserPreferenceSummary> UserPreferenceSummaries => Set<UserPreferenceSummary>();
    public DbSet<UserInterest> UserInterests => Set<UserInterest>();
    public DbSet<AppRecommendation> AppRecommendations => Set<AppRecommendation>();
    public DbSet<TrendReport> TrendReports => Set<TrendReport>();
    public DbSet<ProjectReview> ProjectReviews => Set<ProjectReview>();
    public DbSet<UpdateRecommendation> UpdateRecommendations => Set<UpdateRecommendation>();
    public DbSet<TeamWorkspace> TeamWorkspaces => Set<TeamWorkspace>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<TeamActivity> TeamActivities => Set<TeamActivity>();
    public DbSet<TeamProject> TeamProjects => Set<TeamProject>();
    public DbSet<ServiceBlueprint> ServiceBlueprints => Set<ServiceBlueprint>();
    public DbSet<WhiteLabelTenant> WhiteLabelTenants => Set<WhiteLabelTenant>();
    public DbSet<ResellerPartner> ResellerPartners => Set<ResellerPartner>();
    public DbSet<TenantUsage> TenantUsages => Set<TenantUsage>();
    public DbSet<PlatformEvent> PlatformEvents => Set<PlatformEvent>();
    public DbSet<GrowthSnapshot> GrowthSnapshots => Set<GrowthSnapshot>();
    public DbSet<SbomReport> SbomReports => Set<SbomReport>();
    public DbSet<VulnerabilityResult> VulnerabilityResults => Set<VulnerabilityResult>();
    public DbSet<InfrastructureConfig> InfrastructureConfigs => Set<InfrastructureConfig>();
    public DbSet<SecretScanResult> SecretScanResults => Set<SecretScanResult>();
    public DbSet<PreviewDeployment> PreviewDeployments => Set<PreviewDeployment>();
    public DbSet<GenerationManifest> GenerationManifests => Set<GenerationManifest>();
    public DbSet<OAuthComplianceReport> OAuthComplianceReports => Set<OAuthComplianceReport>();
    public DbSet<CompilationResult> CompilationResults => Set<CompilationResult>();
    public DbSet<ObservabilityTrace> ObservabilityTraces => Set<ObservabilityTrace>();
    public DbSet<ObservabilitySpan> ObservabilitySpans => Set<ObservabilitySpan>();
    public DbSet<WorkflowExecution> WorkflowExecutions => Set<WorkflowExecution>();
    public DbSet<DevelopmentSpec> DevelopmentSpecs => Set<DevelopmentSpec>();
    public DbSet<GitHubSync> GitHubSyncs => Set<GitHubSync>();
    public DbSet<CodeQualityReview> CodeQualityReviews => Set<CodeQualityReview>();
    public DbSet<GenerationStream> GenerationStreams => Set<GenerationStream>();
    public DbSet<BillingAccount> BillingAccounts => Set<BillingAccount>();
    public DbSet<McpConnection> McpConnections => Set<McpConnection>();
    public DbSet<AnalyticsEvent> AnalyticsEvents => Set<AnalyticsEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DevRequest>(entity =>
        {
            entity.ToTable("dev_requests");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId)
                .IsRequired()
                .HasMaxLength(100);

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

            entity.Property(e => e.Framework)
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

            entity.Property(e => e.PreviewUrl)
                .HasMaxLength(2000);

            entity.Property(e => e.GitHubRepoUrl)
                .HasMaxLength(500);

            entity.Property(e => e.GitHubRepoFullName)
                .HasMaxLength(200);

            entity.Property(e => e.FixHistory)
                .HasColumnType("jsonb");

            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.UserId);
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
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
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
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
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
            entity.Property(e => e.Provider)
                .HasConversion<string>()
                .HasMaxLength(50);
            entity.Property(e => e.CryptoChargeId).HasMaxLength(200);
            entity.Property(e => e.CryptoTransactionHash).HasMaxLength(200);
            entity.Property(e => e.CryptoCurrency).HasMaxLength(20);
            entity.Property(e => e.CryptoAmount).HasColumnType("decimal(18,8)");
            entity.Property(e => e.ExchangeRateUsd).HasColumnType("decimal(18,8)");
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

            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<TokenPackage>().WithMany().HasForeignKey(e => e.TokenPackageId).OnDelete(DeleteBehavior.SetNull);

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

            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<HostingPlan>().WithMany().HasForeignKey(e => e.HostingPlanId).OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).IsRequired().HasMaxLength(100);
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
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<TokenPackage>().WithMany().HasForeignKey(e => e.TokenPackageId).OnDelete(DeleteBehavior.Restrict);
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
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
        });

        modelBuilder.Entity<RefinementMessage>(entity =>
        {
            entity.ToTable("refinement_messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Content).IsRequired();
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
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
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<SuggestionVote>(entity =>
        {
            entity.ToTable("suggestion_votes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.HasOne<Suggestion>().WithMany().HasForeignKey(e => e.SuggestionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.SuggestionId, e.UserId }).IsUnique();
            entity.HasIndex(e => e.SuggestionId);
        });

        modelBuilder.Entity<SuggestionComment>(entity =>
        {
            entity.ToTable("suggestion_comments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(5000);
            entity.HasOne<Suggestion>().WithMany().HasForeignKey(e => e.SuggestionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
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
            entity.HasOne<Suggestion>().WithMany().HasForeignKey(e => e.SuggestionId).OnDelete(DeleteBehavior.Cascade);
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
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
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
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
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

            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Deployment>().WithMany().HasForeignKey(e => e.DeploymentId).OnDelete(DeleteBehavior.Restrict);
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

            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Domain>().WithMany().HasForeignKey(e => e.DomainId).OnDelete(DeleteBehavior.Cascade);
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

        modelBuilder.Entity<ProjectVersion>(entity =>
        {
            entity.ToTable("project_versions");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Label).HasMaxLength(255);
            entity.Property(e => e.Source).HasMaxLength(50);
            entity.Property(e => e.SnapshotPath).HasMaxLength(500);
            entity.Property(e => e.ChangedFilesJson).HasColumnType("jsonb");

            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => new { e.DevRequestId, e.VersionNumber }).IsUnique();
        });

        modelBuilder.Entity<ProjectTemplate>(entity =>
        {
            entity.ToTable("project_templates");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.Framework).HasMaxLength(50);
            entity.Property(e => e.Tags).HasMaxLength(500);
            entity.Property(e => e.PromptTemplate).HasColumnType("text");
            entity.Property(e => e.CreatedBy).HasMaxLength(100);

            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.Framework);
        });

        modelBuilder.Entity<AgentCard>(entity =>
        {
            entity.ToTable("a2a_agent_cards");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AgentKey).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.OwnerId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.InputSchemaJson).HasColumnType("jsonb");
            entity.Property(e => e.OutputSchemaJson).HasColumnType("jsonb");
            entity.Property(e => e.Scopes).HasMaxLength(500);
            entity.Property(e => e.ClientId).HasMaxLength(100);
            entity.Property(e => e.ClientSecretHash).HasMaxLength(500);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.OwnerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.AgentKey).IsUnique();
            entity.HasIndex(e => e.OwnerId);
        });

        modelBuilder.Entity<A2ATask>(entity =>
        {
            entity.ToTable("a2a_tasks");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TaskUid).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.ErrorMessage).HasMaxLength(1000);
            entity.HasOne<AgentCard>().WithMany().HasForeignKey(e => e.FromAgentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<AgentCard>().WithMany().HasForeignKey(e => e.ToAgentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.TaskUid).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<A2AArtifact>(entity =>
        {
            entity.ToTable("a2a_artifacts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ArtifactType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SchemaVersion).HasMaxLength(20);
            entity.Property(e => e.DataJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.Direction).HasMaxLength(20);
            entity.HasOne<A2ATask>().WithMany().HasForeignKey(e => e.TaskId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.TaskId);
        });

        modelBuilder.Entity<A2AConsent>(entity =>
        {
            entity.ToTable("a2a_consents");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Scopes).IsRequired().HasMaxLength(500);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<AgentCard>().WithMany().HasForeignKey(e => e.FromAgentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<AgentCard>().WithMany().HasForeignKey(e => e.ToAgentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.FromAgentId, e.ToAgentId }).IsUnique();
        });

        modelBuilder.Entity<A2AAuditLog>(entity =>
        {
            entity.ToTable("a2a_audit_logs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UserId).HasMaxLength(100);
            entity.Property(e => e.DetailJson).HasColumnType("jsonb");
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.HasIndex(e => e.TaskId);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<UserMemory>(entity =>
        {
            entity.ToTable("user_memories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Scope).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.SessionId).HasMaxLength(100);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Scope);
            entity.HasIndex(e => new { e.UserId, e.SessionId });
            entity.HasIndex(e => e.Category);
        });

        modelBuilder.Entity<UserPreference>(entity =>
        {
            entity.ToTable("user_preferences");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Key).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Value).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Confidence).HasColumnType("double precision");
            entity.Property(e => e.Source).IsRequired().HasMaxLength(20);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => new { e.UserId, e.Category, e.Key }).IsUnique();
        });

        modelBuilder.Entity<UserPreferenceSummary>(entity =>
        {
            entity.ToTable("user_preference_summaries");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SummaryText).IsRequired().HasMaxLength(5000);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<UserInterest>(entity =>
        {
            entity.ToTable("user_interests");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Confidence).HasColumnType("double precision");
            entity.Property(e => e.Source).IsRequired().HasMaxLength(20);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.Category }).IsUnique();
        });

        modelBuilder.Entity<AppRecommendation>(entity =>
        {
            entity.ToTable("app_recommendations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.Reason).IsRequired().HasMaxLength(500);
            entity.Property(e => e.PromptTemplate).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.InterestCategory).IsRequired().HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.InterestCategory);
        });

        modelBuilder.Entity<TrendReport>(entity =>
        {
            entity.ToTable("trend_reports");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.SummaryJson).IsRequired();
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.AnalyzedAt);
        });

        modelBuilder.Entity<ProjectReview>(entity =>
        {
            entity.ToTable("project_reviews");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProjectName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.FindingsJson).IsRequired();
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.DevRequestId);
        });

        modelBuilder.Entity<UpdateRecommendation>(entity =>
        {
            entity.ToTable("update_recommendations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Severity).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.CurrentVersion).HasMaxLength(50);
            entity.Property(e => e.RecommendedVersion).HasMaxLength(50);
            entity.Property(e => e.EffortEstimate).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.ProjectReviewId);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<TeamWorkspace>(entity =>
        {
            entity.ToTable("team_workspaces");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.OwnerId).IsRequired().HasMaxLength(100);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.OwnerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.OwnerId);
        });

        modelBuilder.Entity<TeamMember>(entity =>
        {
            entity.ToTable("team_members");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
            entity.HasOne<TeamWorkspace>().WithMany().HasForeignKey(e => e.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.TeamId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.TeamId, e.UserId }).IsUnique();
        });

        modelBuilder.Entity<TeamActivity>(entity =>
        {
            entity.ToTable("team_activities");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TargetUserId).HasMaxLength(100);
            entity.Property(e => e.Detail).HasMaxLength(500);
            entity.HasOne<TeamWorkspace>().WithMany().HasForeignKey(e => e.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.TeamId);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<TeamProject>(entity =>
        {
            entity.ToTable("team_projects");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SharedByUserId).IsRequired().HasMaxLength(100);
            entity.HasOne<TeamWorkspace>().WithMany().HasForeignKey(e => e.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.TeamId);
            entity.HasIndex(e => new { e.TeamId, e.DevRequestId }).IsUnique();
        });

        modelBuilder.Entity<ServiceBlueprint>(entity =>
        {
            entity.ToTable("service_blueprints");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ServicesJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.DependenciesJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.GatewayConfigJson).HasColumnType("jsonb");
            entity.Property(e => e.DockerComposeYaml).HasColumnType("text");
            entity.Property(e => e.K8sManifestYaml).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.DevRequestId);
        });

        modelBuilder.Entity<WhiteLabelTenant>(entity =>
        {
            entity.ToTable("whitelabel_tenants");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CustomDomain).HasMaxLength(255);
            entity.Property(e => e.LogoUrl).HasMaxLength(500);
            entity.Property(e => e.PrimaryColor).HasMaxLength(20);
            entity.Property(e => e.SecondaryColor).HasMaxLength(20);
            entity.Property(e => e.FaviconUrl).HasMaxLength(500);
            entity.Property(e => e.CustomCss).HasColumnType("text");
            entity.Property(e => e.AiPromptGuidelines).HasMaxLength(5000);
            entity.Property(e => e.WelcomeMessage).HasMaxLength(1000);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        modelBuilder.Entity<ResellerPartner>(entity =>
        {
            entity.ToTable("reseller_partners");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ContactEmail).HasMaxLength(255);
            entity.Property(e => e.MarginPercent).HasColumnType("decimal(5,2)");
            entity.Property(e => e.CommissionRate).HasColumnType("decimal(5,2)");
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.HasOne<WhiteLabelTenant>().WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<TenantUsage>(entity =>
        {
            entity.ToTable("tenant_usages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
            entity.Property(e => e.UserId).HasMaxLength(100);
            entity.HasOne<WhiteLabelTenant>().WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => e.RecordedAt);
        });

        modelBuilder.Entity<PlatformEvent>(entity =>
        {
            entity.ToTable("platform_events");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.UserId).HasMaxLength(100);
            entity.Property(e => e.SessionId).HasMaxLength(100);
            entity.Property(e => e.Metadata).HasColumnType("jsonb");
            entity.HasIndex(e => e.EventType);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<GrowthSnapshot>(entity =>
        {
            entity.ToTable("growth_snapshots");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Period).IsRequired().HasMaxLength(20);
            entity.Property(e => e.ConversionRate).HasColumnType("decimal(10,4)");
            entity.Property(e => e.ChurnRate).HasColumnType("decimal(10,4)");
            entity.HasIndex(e => new { e.SnapshotDate, e.Period }).IsUnique();
        });

        modelBuilder.Entity<SbomReport>(entity =>
        {
            entity.ToTable("sbom_reports");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Format).IsRequired().HasMaxLength(20);
            entity.Property(e => e.ComponentsJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.LicensesSummaryJson).HasColumnType("jsonb");
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.GeneratedAt);
        });

        modelBuilder.Entity<VulnerabilityResult>(entity =>
        {
            entity.ToTable("vulnerability_results");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PackageName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PackageVersion).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Ecosystem).IsRequired().HasMaxLength(20);
            entity.Property(e => e.VulnerabilityId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Severity).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Summary).HasMaxLength(2000);
            entity.Property(e => e.FixedVersion).HasMaxLength(50);
            entity.HasOne<SbomReport>().WithMany().HasForeignKey(e => e.SbomReportId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.SbomReportId);
            entity.HasIndex(e => e.Severity);
        });

        modelBuilder.Entity<InfrastructureConfig>(entity =>
        {
            entity.ToTable("infrastructure_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SelectedServicesJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.Tier).IsRequired().HasMaxLength(20);
            entity.Property(e => e.EstimatedMonthlyCostUsd).HasColumnType("decimal(10,2)");
            entity.Property(e => e.GeneratedBicepMain).HasColumnType("text");
            entity.Property(e => e.GeneratedBicepParameters).HasColumnType("text");
            entity.Property(e => e.AnalysisSummary).HasMaxLength(5000);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId).IsUnique();
        });

        modelBuilder.Entity<SecretScanResult>(entity =>
        {
            entity.ToTable("secret_scan_results");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FindingsJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.EnvTemplateContent).HasColumnType("text");
            entity.Property(e => e.GitignoreContent).HasColumnType("text");
            entity.Property(e => e.ConfigModuleContent).HasColumnType("text");
            entity.Property(e => e.KeyVaultConfigContent).HasColumnType("text");
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.ScannedAt);
        });

        modelBuilder.Entity<PreviewDeployment>(entity =>
        {
            entity.ToTable("preview_deployments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PreviewUrl).HasMaxLength(500);
            entity.Property(e => e.Provider).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<GenerationManifest>(entity =>
        {
            entity.ToTable("generation_manifests");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FilesJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.CrossReferencesJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.ValidationResultsJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.ValidationStatus).IsRequired().HasMaxLength(20);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.ValidationStatus);
        });

        modelBuilder.Entity<OAuthComplianceReport>(entity =>
        {
            entity.ToTable("oauth_compliance_reports");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ScopesAnalyzedJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.RecommendationsJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.ComplianceDocsJson).HasColumnType("jsonb");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<CompilationResult>(entity =>
        {
            entity.ToTable("compilation_results");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Language).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ErrorsJson).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.WarningsJson).IsRequired().HasColumnType("jsonb");
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.CompiledAt);
        });

        modelBuilder.Entity<ObservabilityTrace>(entity =>
        {
            entity.ToTable("observability_traces");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.TraceId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.TotalCost).HasColumnType("decimal(18,8)");
            entity.Property(e => e.Model).HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TraceId).IsUnique();
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<ObservabilitySpan>(entity =>
        {
            entity.ToTable("observability_spans");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SpanName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Model).HasMaxLength(50);
            entity.Property(e => e.Cost).HasColumnType("decimal(18,8)");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.HasOne<ObservabilityTrace>().WithMany().HasForeignKey(e => e.TraceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.TraceId);
            entity.HasIndex(e => e.StartedAt);
        });

        modelBuilder.Entity<WorkflowExecution>(entity =>
        {
            entity.ToTable("workflow_executions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.WorkflowType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50);
            entity.Property(e => e.StepsJson).IsRequired().HasColumnType("jsonb");
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<DevelopmentSpec>(entity =>
        {
            entity.ToTable("development_specs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Phase).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.UserStories).HasColumnType("jsonb");
            entity.Property(e => e.AcceptanceCriteria).HasColumnType("jsonb");
            entity.Property(e => e.EdgeCases).HasColumnType("jsonb");
            entity.Property(e => e.ArchitectureDecisions).HasColumnType("jsonb");
            entity.Property(e => e.ApiContracts).HasColumnType("jsonb");
            entity.Property(e => e.DataModels).HasColumnType("jsonb");
            entity.Property(e => e.ComponentBreakdown).HasColumnType("jsonb");
            entity.Property(e => e.TaskList).HasColumnType("jsonb");
            entity.Property(e => e.DependencyOrder).HasColumnType("jsonb");
            entity.Property(e => e.EstimatedFiles).HasColumnType("jsonb");
            entity.Property(e => e.TraceabilityLinks).HasColumnType("jsonb");
            entity.Property(e => e.RejectionFeedback).HasMaxLength(5000);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.Phase);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<GitHubSync>(entity =>
        {
            entity.ToTable("github_syncs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.GitHubRepoOwner).IsRequired().HasMaxLength(100);
            entity.Property(e => e.GitHubRepoName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.GitHubRepoUrl).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Branch).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.LastSyncCommitSha).HasMaxLength(100);
            entity.Property(e => e.ConflictDetails).HasColumnType("jsonb");
            entity.Property(e => e.WebhookId).HasMaxLength(100);
            entity.Property(e => e.WebhookSecret).HasMaxLength(200);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.ProjectId).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<CodeQualityReview>(entity =>
        {
            entity.ToTable("code_quality_reviews");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.OverallScore).HasColumnType("double precision");
            entity.Property(e => e.Findings).HasColumnType("jsonb");
            entity.Property(e => e.AppliedFixes).HasColumnType("jsonb");
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<GenerationStream>(entity =>
        {
            entity.ToTable("generation_streams");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CurrentFile).HasMaxLength(500);
            entity.Property(e => e.ProgressPercent).HasColumnType("double precision");
            entity.Property(e => e.GeneratedFiles).HasColumnType("jsonb");
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<BillingAccount>(entity =>
        {
            entity.ToTable("billing_accounts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Plan).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.StripeCustomerId).HasMaxLength(200);
            entity.Property(e => e.StripeSubscriptionId).HasMaxLength(200);
            entity.Property(e => e.OverageCharges).HasColumnType("decimal(10,2)");
            entity.Property(e => e.MonthlyRate).HasColumnType("decimal(10,2)");
            entity.Property(e => e.PerRequestOverageRate).HasColumnType("decimal(10,2)");
            entity.Property(e => e.InvoiceHistory).HasColumnType("jsonb");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.Plan);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<McpConnection>(entity =>
        {
            entity.ToTable("mcp_connections");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ServerUrl).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Transport).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.AuthType).HasMaxLength(20);
            entity.Property(e => e.AuthToken).HasMaxLength(1000);
            entity.Property(e => e.AvailableTools).HasColumnType("jsonb");
            entity.Property(e => e.AvailableResources).HasColumnType("jsonb");
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<AnalyticsEvent>(entity =>
        {
            entity.ToTable("analytics_events");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.EventData).HasColumnType("jsonb");
            entity.Property(e => e.SessionId).HasMaxLength(100);
            entity.Property(e => e.Page).HasMaxLength(500);
            entity.Property(e => e.Referrer).HasMaxLength(2000);
            entity.Property(e => e.UserAgent).HasMaxLength(1000);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.EventType);
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}

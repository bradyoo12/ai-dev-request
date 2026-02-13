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
    public DbSet<MarketplaceTemplate> MarketplaceTemplates => Set<MarketplaceTemplate>();
    public DbSet<ContainerConfig> ContainerConfigs => Set<ContainerConfig>();
    public DbSet<TestGenerationRecord> TestGenerationRecords => Set<TestGenerationRecord>();
    public DbSet<CollaborativeSession> CollaborativeSessions => Set<CollaborativeSession>();
    public DbSet<OnboardingProgress> OnboardingProgresses => Set<OnboardingProgress>();
    public DbSet<ComponentPreview> ComponentPreviews => Set<ComponentPreview>();
    public DbSet<GenerationVariant> GenerationVariants => Set<GenerationVariant>();
    public DbSet<PerformanceProfile> PerformanceProfiles => Set<PerformanceProfile>();
    public DbSet<DataSchema> DataSchemas => Set<DataSchema>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<DevPipeline> DevPipelines => Set<DevPipeline>();
    public DbSet<ApiDocConfig> ApiDocConfigs => Set<ApiDocConfig>();
    public DbSet<CodeSnapshot> CodeSnapshots => Set<CodeSnapshot>();
    public DbSet<VoiceConfig> VoiceConfigs => Set<VoiceConfig>();
    public DbSet<ModelRoutingConfig> ModelRoutingConfigs => Set<ModelRoutingConfig>();
    public DbSet<ProjectIndex> ProjectIndexes => Set<ProjectIndex>();
    public DbSet<DeploymentHealth> DeploymentHealths => Set<DeploymentHealth>();
    public DbSet<GenerativeUiSession> GenerativeUiSessions => Set<GenerativeUiSession>();
    public DbSet<MobileAppConfig> MobileAppConfigs => Set<MobileAppConfig>();
    public DbSet<BackgroundAgent> BackgroundAgents => Set<BackgroundAgent>();
    public DbSet<PlatformUpgrade> PlatformUpgrades => Set<PlatformUpgrade>();
    public DbSet<VisualPromptUi> VisualPromptUis => Set<VisualPromptUi>();
    public DbSet<FrameworkConfig> FrameworkConfigs => Set<FrameworkConfig>();
    public DbSet<ViewTransitionConfig> ViewTransitionConfigs => Set<ViewTransitionConfig>();
    public DbSet<NlSchema> NlSchemas => Set<NlSchema>();
    public DbSet<QueryConfig> QueryConfigs => Set<QueryConfig>();
    public DbSet<AgenticPlan> AgenticPlans => Set<AgenticPlan>();
    public DbSet<VisualRegressionResult> VisualRegressionResults => Set<VisualRegressionResult>();
    public DbSet<McpGatewayServer> McpGatewayServers => Set<McpGatewayServer>();
    public DbSet<ProjectMemory> ProjectMemories => Set<ProjectMemory>();
    public DbSet<FigmaImport> FigmaImports => Set<FigmaImport>();
    public DbSet<ArenaComparison> ArenaComparisons => Set<ArenaComparison>();
    public DbSet<VisualOverlaySession> VisualOverlaySessions => Set<VisualOverlaySession>();
    public DbSet<SemanticIndex> SemanticIndexes => Set<SemanticIndex>();
    public DbSet<PlanningSession> PlanningSessions => Set<PlanningSession>();
    public DbSet<ProjectDocumentation> ProjectDocumentations => Set<ProjectDocumentation>();
    public DbSet<AiElementsConfig> AiElementsConfigs => Set<AiElementsConfig>();
    public DbSet<ReviewPipelineConfig> ReviewPipelineConfigs => Set<ReviewPipelineConfig>();
    public DbSet<OAuthConnector> OAuthConnectors => Set<OAuthConnector>();
    public DbSet<McpToolIntegration> McpToolIntegrations => Set<McpToolIntegration>();
    public DbSet<AiModelConfig> AiModelConfigs => Set<AiModelConfig>();
    public DbSet<BidirectionalGitSync> BidirectionalGitSyncs => Set<BidirectionalGitSync>();
    public DbSet<DevRequestBranch> DevRequestBranches => Set<DevRequestBranch>();
    public DbSet<SelfHealingTestResult> SelfHealingTestResults => Set<SelfHealingTestResult>();
    public DbSet<DatabaseBranch> DatabaseBranches => Set<DatabaseBranch>();
    public DbSet<SandboxExecution> SandboxExecutions => Set<SandboxExecution>();
    public DbSet<ExchangeRate> ExchangeRates => Set<ExchangeRate>();
    public DbSet<CreditPackagePrice> CreditPackagePrices => Set<CreditPackagePrice>();
    public DbSet<SupportPost> SupportPosts => Set<SupportPost>();
    public DbSet<UsageMeter> UsageMeters => Set<UsageMeter>();
    public DbSet<AgentTask> AgentTasks => Set<AgentTask>();
    public DbSet<AgentAutomationConfig> AgentAutomationConfigs => Set<AgentAutomationConfig>();
    public DbSet<SubagentTask> SubagentTasks => Set<SubagentTask>();
    public DbSet<ParallelOrchestration> ParallelOrchestrations => Set<ParallelOrchestration>();
    public DbSet<CodeReviewAgent> CodeReviewAgents => Set<CodeReviewAgent>();
    public DbSet<MultiAgentReview> MultiAgentReviews => Set<MultiAgentReview>();
    public DbSet<LangGraphWorkflow> LangGraphWorkflows => Set<LangGraphWorkflow>();
    public DbSet<HybridCacheEntry> HybridCacheEntries => Set<HybridCacheEntry>();
    public DbSet<PlaywrightHealingResult> PlaywrightHealingResults => Set<PlaywrightHealingResult>();
    public DbSet<SelfHealingRun> SelfHealingRuns => Set<SelfHealingRun>();
    public DbSet<ProductionSandbox> ProductionSandboxes => Set<ProductionSandbox>();
    public DbSet<OrgMemory> OrgMemories => Set<OrgMemory>();
    public DbSet<AiAgentRule> AiAgentRules => Set<AiAgentRule>();
    public DbSet<ServerComponentConfig> ServerComponentConfigs => Set<ServerComponentConfig>();
    public DbSet<CodeLintResult> CodeLintResults => Set<CodeLintResult>();
    public DbSet<VectorSearchConfig> VectorSearchConfigs => Set<VectorSearchConfig>();
    public DbSet<ReplTestSession> ReplTestSessions => Set<ReplTestSession>();
    public DbSet<AgentTerminalSession> AgentTerminalSessions => Set<AgentTerminalSession>();
    public DbSet<ComposerPlan> ComposerPlans => Set<ComposerPlan>();
    public DbSet<PerformanceOptimization> PerformanceOptimizations => Set<PerformanceOptimization>();
    public DbSet<ModelRoutingRule> ModelRoutingRules => Set<ModelRoutingRule>();
    public DbSet<BiomeLintResult> BiomeLintResults => Set<BiomeLintResult>();
    public DbSet<CodebaseGraph> CodebaseGraphs => Set<CodebaseGraph>();
    public DbSet<BuildToolchainResult> BuildToolchainResults => Set<BuildToolchainResult>();
    public DbSet<VisionToCodeResult> VisionToCodeResults => Set<VisionToCodeResult>();
    public DbSet<DotnetUpgradeResult> DotnetUpgradeResults => Set<DotnetUpgradeResult>();
    public DbSet<ParallelAgentRun> ParallelAgentRuns => Set<ParallelAgentRun>();
    public DbSet<WebMcpSession> WebMcpSessions => Set<WebMcpSession>();
    public DbSet<AgentSdkSession> AgentSdkSessions => Set<AgentSdkSession>();
    public DbSet<TerminalExecution> TerminalExecutions => Set<TerminalExecution>();
    public DbSet<TursoDatabase> TursoDatabases => Set<TursoDatabase>();
    public DbSet<WorkersAiDeployment> WorkersAiDeployments => Set<WorkersAiDeployment>();
    public DbSet<ReactUseHookDemo> ReactUseHookDemos => Set<ReactUseHookDemo>();
    public DbSet<EditPrediction> EditPredictions => Set<EditPrediction>();
    public DbSet<BrowserIdeSession> BrowserIdeSessions => Set<BrowserIdeSession>();
    public DbSet<GovernanceAction> GovernanceActions => Set<GovernanceAction>();
    public DbSet<InferenceCostRecord> InferenceCostRecords => Set<InferenceCostRecord>();
    public DbSet<LanguageExpansion> LanguageExpansions => Set<LanguageExpansion>();
    public DbSet<HybridValidation> HybridValidations => Set<HybridValidation>();
    public DbSet<AgentMessage> AgentMessages => Set<AgentMessage>();

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
            entity.Property(e => e.SpanId).HasMaxLength(100);
            entity.Property(e => e.ParentSpanId).HasMaxLength(100);
            entity.Property(e => e.OperationName).HasMaxLength(50);
            entity.Property(e => e.TotalCost).HasColumnType("decimal(18,8)");
            entity.Property(e => e.EstimatedCost).HasColumnType("decimal(18,8)");
            entity.Property(e => e.Model).HasMaxLength(50);
            entity.Property(e => e.ModelTier).HasMaxLength(20);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.Property(e => e.AttributesJson).HasColumnType("jsonb");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TraceId).IsUnique();
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.OperationName);
            entity.HasIndex(e => e.StartedAt);
        });

        modelBuilder.Entity<ObservabilitySpan>(entity =>
        {
            entity.ToTable("observability_spans");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SpanName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ParentSpanId).HasMaxLength(100);
            entity.Property(e => e.Model).HasMaxLength(50);
            entity.Property(e => e.Cost).HasColumnType("decimal(18,8)");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.Property(e => e.AttributesJson).HasColumnType("jsonb");
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
            // entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);  // Removed due to FK type mismatch (int vs Guid)
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
            // entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);  // Removed due to FK type mismatch (int vs Guid)
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
            // entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);  // Removed due to FK type mismatch (int vs Guid)
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
            // entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.DevRequestId).OnDelete(DeleteBehavior.Cascade);  // Removed due to FK type mismatch (int vs Guid)
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

        modelBuilder.Entity<MarketplaceTemplate>(entity =>
        {
            entity.ToTable("marketplace_templates");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(5000);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TechStack).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.Tags).HasMaxLength(1000);
            entity.Property(e => e.TemplateData).IsRequired().HasColumnType("jsonb");
            entity.Property(e => e.PreviewImageUrl).HasMaxLength(500);
            entity.Property(e => e.Rating).HasColumnType("double precision");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.AuthorId);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.DownloadCount);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<TestGenerationRecord>(entity =>
        {
            entity.ToTable("test_generation_records");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TestFramework).HasMaxLength(100);
            entity.Property(e => e.Summary).HasMaxLength(5000);
            entity.Property(e => e.TestFilesJson).HasColumnType("jsonb");
            // entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);  // Removed due to FK type mismatch (int vs Guid)
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<ContainerConfig>(entity =>
        {
            entity.ToTable("container_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DetectedStack).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Dockerfile).IsRequired().HasColumnType("text");
            entity.Property(e => e.ComposeFile).HasColumnType("text");
            entity.Property(e => e.K8sManifest).HasColumnType("text");
            entity.Property(e => e.RegistryUrl).HasMaxLength(500);
            entity.Property(e => e.ImageName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ImageTag).IsRequired().HasMaxLength(100);
            entity.Property(e => e.BuildStatus).IsRequired().HasMaxLength(20);
            entity.Property(e => e.BuildLogs).HasColumnType("jsonb");
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            // entity.HasOne<DevRequest>().WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);  // Removed due to FK type mismatch (int vs Guid)
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.BuildStatus);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<CollaborativeSession>(entity =>
        {
            entity.ToTable("collaborative_sessions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.SessionName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ParticipantsJson).HasColumnType("jsonb");
            entity.Property(e => e.ActivityFeedJson).HasColumnType("jsonb");
            entity.Property(e => e.DocumentContent).HasColumnType("text");
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<OnboardingProgress>(entity =>
        {
            entity.ToTable("onboarding_progresses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.CompletedStepsJson).HasColumnType("jsonb");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<ComponentPreview>(entity =>
        {
            entity.ToTable("component_previews");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ComponentName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Code).HasColumnType("text");
            entity.Property(e => e.ChatHistoryJson).HasColumnType("jsonb");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DesignTokensJson).HasColumnType("jsonb");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<GenerationVariant>(entity =>
        {
            entity.ToTable("generation_variants");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Approach).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.FilesJson).HasColumnType("jsonb");
            entity.Property(e => e.ModelTier).HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<PerformanceProfile>(entity =>
        {
            entity.ToTable("performance_profiles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SuggestionsJson).HasColumnType("jsonb");
            entity.Property(e => e.MetricsJson).HasColumnType("jsonb");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<DataSchema>(entity =>
        {
            entity.ToTable("data_schemas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Prompt).HasMaxLength(2000);
            entity.Property(e => e.EntitiesJson).HasColumnType("jsonb");
            entity.Property(e => e.RelationshipsJson).HasColumnType("jsonb");
            entity.Property(e => e.ValidationJson).HasColumnType("jsonb");
            entity.Property(e => e.GeneratedSql).HasColumnType("text");
            entity.Property(e => e.GeneratedEntities).HasColumnType("text");
            entity.Property(e => e.GeneratedControllers).HasColumnType("text");
            entity.Property(e => e.GeneratedFrontend).HasColumnType("text");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.ToTable("api_keys");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.KeyHash).IsRequired().HasMaxLength(500);
            entity.Property(e => e.KeyPrefix).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.KeyHash).IsUnique();
        });

        modelBuilder.Entity<DevPipeline>(entity =>
        {
            entity.ToTable("dev_pipelines");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.StepsJson).IsRequired().HasColumnType("text");
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.TemplateCategory).HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsTemplate);
        });

        modelBuilder.Entity<ApiDocConfig>(entity =>
        {
            entity.ToTable("api_doc_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProjectName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.EndpointsJson).IsRequired().HasColumnType("text");
            entity.Property(e => e.OpenApiSpecJson).HasColumnType("text");
            entity.Property(e => e.SdkLanguages).HasMaxLength(200);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.DevRequestId);
        });

        modelBuilder.Entity<CodeSnapshot>(entity =>
        {
            entity.ToTable("code_snapshots");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.BaselineContent).IsRequired().HasColumnType("text");
            entity.Property(e => e.UserContent).HasColumnType("text");
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => new { e.UserId, e.DevRequestId, e.FilePath }).IsUnique();
        });

        modelBuilder.Entity<VoiceConfig>(entity =>
        {
            entity.ToTable("voice_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Language).IsRequired().HasMaxLength(20);
            entity.Property(e => e.TtsVoice).HasMaxLength(100);
            entity.Property(e => e.TranscriptionHistoryJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<ModelRoutingConfig>(entity =>
        {
            entity.ToTable("model_routing_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DefaultTier).IsRequired().HasMaxLength(20);
            entity.Property(e => e.TaskRoutingJson).HasColumnType("text");
            entity.Property(e => e.MonthlyBudget).HasColumnType("decimal(10,2)");
            entity.Property(e => e.CurrentMonthCost).HasColumnType("decimal(10,2)");
            entity.Property(e => e.EstimatedSavings).HasColumnType("decimal(10,2)");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<ProjectIndex>(entity =>
        {
            entity.ToTable("project_indexes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.ContentHash).HasMaxLength(64);
            entity.Property(e => e.Language).HasMaxLength(50);
            entity.Property(e => e.EmbeddingJson).HasColumnType("text");
            entity.Property(e => e.DependenciesJson).HasColumnType("text");
            entity.Property(e => e.DependentsJson).HasColumnType("text");
            entity.Property(e => e.Summary).HasMaxLength(1000);
            entity.Property(e => e.ExportedSymbols).HasMaxLength(2000);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => new { e.UserId, e.DevRequestId, e.FilePath }).IsUnique();
        });

        modelBuilder.Entity<DeploymentHealth>(entity =>
        {
            entity.ToTable("deployment_healths");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DeploymentUrl).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.HealthEventsJson).HasColumnType("text");
            entity.Property(e => e.IncidentsJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.DevRequestId }).IsUnique();
        });

        modelBuilder.Entity<GenerativeUiSession>(entity =>
        {
            entity.ToTable("generative_ui_sessions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SessionName).HasMaxLength(200);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.ActiveModel).HasMaxLength(50);
            entity.Property(e => e.MessagesJson).HasColumnType("text");
            entity.Property(e => e.ToolDefinitionsJson).HasColumnType("text");
            entity.Property(e => e.GeneratedComponentsJson).HasColumnType("text");
            entity.Property(e => e.ReasoningStepsJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.DevRequestId }).IsUnique();
        });

        modelBuilder.Entity<MobileAppConfig>(entity =>
        {
            entity.ToTable("mobile_app_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AppName).HasMaxLength(200);
            entity.Property(e => e.BundleId).HasMaxLength(100);
            entity.Property(e => e.Platform).HasMaxLength(20);
            entity.Property(e => e.Framework).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.AppDescription).HasMaxLength(500);
            entity.Property(e => e.AppVersion).HasMaxLength(20);
            entity.Property(e => e.IconUrl).HasMaxLength(500);
            entity.Property(e => e.SplashScreenUrl).HasMaxLength(500);
            entity.Property(e => e.ExpoQrCodeUrl).HasMaxLength(500);
            entity.Property(e => e.PreviewUrl).HasMaxLength(500);
            entity.Property(e => e.NavigationStructureJson).HasColumnType("text");
            entity.Property(e => e.ScreenListJson).HasColumnType("text");
            entity.Property(e => e.BuildHistoryJson).HasColumnType("text");
            entity.Property(e => e.PublishHistoryJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.DevRequestId }).IsUnique();
        });

        modelBuilder.Entity<BackgroundAgent>(entity =>
        {
            entity.ToTable("background_agents");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AgentName).HasMaxLength(200);
            entity.Property(e => e.TaskDescription).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.BranchName).HasMaxLength(200);
            entity.Property(e => e.AgentType).HasMaxLength(20);
            entity.Property(e => e.Priority).HasMaxLength(20);
            entity.Property(e => e.PullRequestUrl).HasMaxLength(500);
            entity.Property(e => e.PullRequestStatus).HasMaxLength(20);
            entity.Property(e => e.LogEntriesJson).HasColumnType("text");
            entity.Property(e => e.StepsJson).HasColumnType("text");
            entity.Property(e => e.InstalledPackagesJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.Status });
        });

        modelBuilder.Entity<PlatformUpgrade>(entity =>
        {
            entity.ToTable("platform_upgrades");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CurrentDotNetVersion).HasMaxLength(50);
            entity.Property(e => e.CurrentEfCoreVersion).HasMaxLength(50);
            entity.Property(e => e.CurrentCSharpVersion).HasMaxLength(50);
            entity.Property(e => e.UpgradeStatus).HasMaxLength(20);
            entity.Property(e => e.FeatureFlagsJson).HasColumnType("text");
            entity.Property(e => e.PerformanceHistoryJson).HasColumnType("text");
            entity.Property(e => e.MigrationLogJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<VisualPromptUi>(entity =>
        {
            entity.ToTable("visual_prompt_uis");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ComponentName).HasMaxLength(200);
            entity.Property(e => e.PromptText).HasColumnType("text");
            entity.Property(e => e.GeneratedCode).HasColumnType("text");
            entity.Property(e => e.GeneratedHtml).HasColumnType("text");
            entity.Property(e => e.Framework).HasMaxLength(50);
            entity.Property(e => e.StylingLibrary).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.Tags).HasMaxLength(500);
            entity.Property(e => e.ConversationJson).HasColumnType("text");
            entity.Property(e => e.ThemeTokensJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.Category });
        });

        modelBuilder.Entity<FrameworkConfig>(entity =>
        {
            entity.ToTable("framework_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SelectedFramework).HasMaxLength(50);
            entity.Property(e => e.SelectedBackend).HasMaxLength(50);
            entity.Property(e => e.SelectedDatabase).HasMaxLength(50);
            entity.Property(e => e.SelectedStyling).HasMaxLength(50);
            entity.Property(e => e.FavoriteFrameworks).HasMaxLength(500);
            entity.Property(e => e.CustomTemplateJson).HasColumnType("text");
            entity.Property(e => e.FrameworkHistoryJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<ViewTransitionConfig>(entity =>
        {
            entity.ToTable("view_transition_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.TransitionPreset).HasMaxLength(50);
            entity.Property(e => e.EasingFunction).HasMaxLength(50);
            entity.Property(e => e.CustomCssJson).HasColumnType("text");
            entity.Property(e => e.PresetHistoryJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<NlSchema>(entity =>
        {
            entity.ToTable("nl_schemas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SchemaName).HasMaxLength(200);
            entity.Property(e => e.NaturalLanguageInput).HasColumnType("text");
            entity.Property(e => e.GeneratedSql).HasColumnType("text");
            entity.Property(e => e.TablesJson).HasColumnType("text");
            entity.Property(e => e.RelationshipsJson).HasColumnType("text");
            entity.Property(e => e.IndexesJson).HasColumnType("text");
            entity.Property(e => e.RlsPoliciesJson).HasColumnType("text");
            entity.Property(e => e.SeedDataJson).HasColumnType("text");
            entity.Property(e => e.ConversationJson).HasColumnType("text");
            entity.Property(e => e.ExportFormat).HasMaxLength(50);
            entity.Property(e => e.DatabaseType).HasMaxLength(50);
            entity.Property(e => e.EstimatedCost).HasColumnType("decimal(10,6)");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<QueryConfig>(entity =>
        {
            entity.ToTable("query_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.QueryPatternsJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<AgenticPlan>(entity =>
        {
            entity.ToTable("agentic_plans");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PlanName).HasMaxLength(200);
            entity.Property(e => e.UserPrompt).HasColumnType("text");
            entity.Property(e => e.StepsJson).HasColumnType("text");
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.ExecutionLogJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<VisualRegressionResult>(entity =>
        {
            entity.ToTable("visual_regression_results");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProjectName).HasMaxLength(200);
            entity.Property(e => e.PageUrl).HasMaxLength(500);
            entity.Property(e => e.ViewportSize).HasMaxLength(20);
            entity.Property(e => e.BaselineImageUrl).HasMaxLength(500);
            entity.Property(e => e.ComparisonImageUrl).HasMaxLength(500);
            entity.Property(e => e.DiffImageUrl).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.IgnoreRegionsJson).HasColumnType("text");
            entity.Property(e => e.MetadataJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<McpGatewayServer>(entity =>
        {
            entity.ToTable("mcp_gateway_servers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ServerName).HasMaxLength(200);
            entity.Property(e => e.ServerUrl).HasMaxLength(500);
            entity.Property(e => e.TransportType).HasMaxLength(20);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.IconUrl).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.ToolsJson).HasColumnType("text");
            entity.Property(e => e.ResourcesJson).HasColumnType("text");
            entity.Property(e => e.HealthMessage).HasMaxLength(500);
            entity.Property(e => e.ConfigJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<ProjectMemory>(entity =>
        {
            entity.ToTable("project_memories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProjectName).HasMaxLength(200);
            entity.Property(e => e.MemoryType).HasMaxLength(50);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.Content).HasColumnType("text");
            entity.Property(e => e.Summary).HasMaxLength(500);
            entity.Property(e => e.SourceType).HasMaxLength(50);
            entity.Property(e => e.SourceRef).HasMaxLength(500);
            entity.Property(e => e.TagsJson).HasColumnType("text");
            entity.Property(e => e.EmbeddingJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.Category });
        });

        modelBuilder.Entity<FigmaImport>(entity =>
        {
            entity.ToTable("figma_imports");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FigmaFileKey).HasMaxLength(200);
            entity.Property(e => e.FigmaNodeId).HasMaxLength(200);
            entity.Property(e => e.SourceType).HasMaxLength(50);
            entity.Property(e => e.SourceUrl).HasMaxLength(2000);
            entity.Property(e => e.DesignName).HasMaxLength(500);
            entity.Property(e => e.DesignTokensJson).HasColumnType("text");
            entity.Property(e => e.ComponentTreeJson).HasColumnType("text");
            entity.Property(e => e.GeneratedCodeJson).HasColumnType("text");
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Framework).HasMaxLength(50);
            entity.Property(e => e.StylingLib).HasMaxLength(50);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<ArenaComparison>(entity =>
        {
            entity.ToTable("arena_comparisons");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PromptText).HasColumnType("text");
            entity.Property(e => e.TaskCategory).HasMaxLength(100);
            entity.Property(e => e.ModelOutputsJson).HasColumnType("text");
            entity.Property(e => e.SelectedModel).HasMaxLength(100);
            entity.Property(e => e.SelectionReason).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<VisualOverlaySession>(entity =>
        {
            entity.ToTable("visual_overlay_sessions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProjectName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.SelectedElementPath).HasMaxLength(1000);
            entity.Property(e => e.ModificationsJson).HasColumnType("text");
            entity.Property(e => e.ComponentTreeJson).HasColumnType("text");
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.PreviewUrl).HasMaxLength(2000);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<SemanticIndex>(entity =>
        {
            entity.ToTable("semantic_indexes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SourceType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.SourceId).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Content).HasColumnType("text");
            entity.Property(e => e.ContentHash).IsRequired().HasMaxLength(64);
            entity.Property(e => e.EmbeddingJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SourceType);
            entity.HasIndex(e => new { e.UserId, e.ContentHash }).IsUnique();
        });

        modelBuilder.Entity<AiElementsConfig>(entity =>
        {
            entity.ToTable("ai_elements_configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ThemeMode).HasMaxLength(20);
            entity.Property(e => e.ActiveModel).HasMaxLength(100);
            entity.Property(e => e.PreviewHistoryJson).HasColumnType("text");
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<ExchangeRate>(entity =>
        {
            entity.ToTable("exchange_rates");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CurrencyCode).IsRequired().HasMaxLength(10);
            entity.Property(e => e.RateToUsd).HasColumnType("decimal(18,6)");
            entity.HasIndex(e => e.CurrencyCode);
            entity.HasIndex(e => e.FetchedAt);
            entity.HasData(
                new ExchangeRate { Id = 1, CurrencyCode = "KRW", RateToUsd = 1400m, FetchedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new ExchangeRate { Id = 2, CurrencyCode = "JPY", RateToUsd = 155m, FetchedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new ExchangeRate { Id = 3, CurrencyCode = "EUR", RateToUsd = 0.92m, FetchedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        });

        modelBuilder.Entity<CreditPackagePrice>(entity =>
        {
            entity.ToTable("credit_package_prices");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CurrencyCode).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.HasOne<TokenPackage>().WithMany().HasForeignKey(e => e.TokenPackageId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.TokenPackageId, e.CurrencyCode }).IsUnique();
            entity.HasData(
                // USD prices (matching existing TokenPackage.PriceUsd)
                new CreditPackagePrice { Id = 1, TokenPackageId = 1, CurrencyCode = "USD", Price = 5.00m },
                new CreditPackagePrice { Id = 2, TokenPackageId = 2, CurrencyCode = "USD", Price = 10.00m },
                new CreditPackagePrice { Id = 3, TokenPackageId = 3, CurrencyCode = "USD", Price = 25.00m },
                new CreditPackagePrice { Id = 4, TokenPackageId = 4, CurrencyCode = "USD", Price = 70.00m },
                // KRW prices
                new CreditPackagePrice { Id = 5, TokenPackageId = 1, CurrencyCode = "KRW", Price = 6900m },
                new CreditPackagePrice { Id = 6, TokenPackageId = 2, CurrencyCode = "KRW", Price = 13900m },
                new CreditPackagePrice { Id = 7, TokenPackageId = 3, CurrencyCode = "KRW", Price = 34900m },
                new CreditPackagePrice { Id = 8, TokenPackageId = 4, CurrencyCode = "KRW", Price = 97900m },
                // JPY prices
                new CreditPackagePrice { Id = 9, TokenPackageId = 1, CurrencyCode = "JPY", Price = 780m },
                new CreditPackagePrice { Id = 10, TokenPackageId = 2, CurrencyCode = "JPY", Price = 1550m },
                new CreditPackagePrice { Id = 11, TokenPackageId = 3, CurrencyCode = "JPY", Price = 3900m },
                new CreditPackagePrice { Id = 12, TokenPackageId = 4, CurrencyCode = "JPY", Price = 10900m },
                // EUR prices
                new CreditPackagePrice { Id = 13, TokenPackageId = 1, CurrencyCode = "EUR", Price = 4.59m },
                new CreditPackagePrice { Id = 14, TokenPackageId = 2, CurrencyCode = "EUR", Price = 9.19m },
                new CreditPackagePrice { Id = 15, TokenPackageId = 3, CurrencyCode = "EUR", Price = 22.99m },
                new CreditPackagePrice { Id = 16, TokenPackageId = 4, CurrencyCode = "EUR", Price = 64.49m }
            );
        });

        modelBuilder.Entity<SupportPost>(entity =>
        {
            entity.ToTable("support_posts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(10000);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.RewardCredit).HasColumnType("decimal(18,2)");
            entity.Property(e => e.RewardedByUserId).HasMaxLength(100);
            entity.HasOne<User>().WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<SubagentTask>(entity =>
        {
            entity.ToTable("subagent_tasks");
            entity.HasKey(e => e.Id);
            // DevRequest navigation removed due to FK type mismatch
            entity.HasOne(e => e.ParentOrchestration)
                .WithMany(o => o.Tasks)
                .HasForeignKey(e => e.ParentOrchestrationId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.ParentOrchestrationId);
            entity.HasIndex(e => e.Status);
            entity.Property(e => e.TaskType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<ParallelOrchestration>(entity =>
        {
            entity.ToTable("parallel_orchestrations");
            entity.HasKey(e => e.Id);
            // DevRequest navigation removed due to FK type mismatch
            entity.HasIndex(e => e.DevRequestId);
            entity.HasIndex(e => e.Status);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
        });
    }
}

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
                new TokenPricing { Id = 4, ActionType = "staging", TokenCost = 50, Description = "Staging Deploy" }
            );
        });
    }
}

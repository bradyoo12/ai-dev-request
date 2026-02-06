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
    }
}

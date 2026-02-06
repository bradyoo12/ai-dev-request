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
    }
}

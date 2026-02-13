using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AiDevRequest.API.Data;

public class AiDevRequestDbContextFactory : IDesignTimeDbContextFactory<AiDevRequestDbContext>
{
    public AiDevRequestDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AiDevRequestDbContext>();

        // Use a dummy connection string for design-time
        optionsBuilder.UseNpgsql("Host=localhost;Database=dummy;Username=dummy;Password=dummy",
            options => options.MigrationsAssembly("AiDevRequest.API"));

        return new AiDevRequestDbContext(optionsBuilder.Options);
    }
}

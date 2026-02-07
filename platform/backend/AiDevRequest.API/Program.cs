using System.Text;
using AiDevRequest.API.Data;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Load local settings (secrets, API keys - not committed to git)
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Add AI Services
builder.Services.AddSingleton<IAnalysisService, AnalysisService>();
builder.Services.AddSingleton<IProposalService, ProposalService>();
builder.Services.AddSingleton<IProductionService, ProductionService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddSingleton<IDeploymentService, AzureDeploymentService>();
builder.Services.AddScoped<IPaymentService, StripePaymentService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IBuildVerificationService, BuildVerificationService>();
builder.Services.AddScoped<IRefinementService, RefinementService>();

// Add JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "dev-secret-key-change-in-production-min-32-chars!!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AiDevRequest";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });
builder.Services.AddAuthorization();

// Add DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=ai_dev_request;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AiDevRequestDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",  // Vite dev server
                "http://localhost:3000",  // Alternative port
                "https://icy-desert-07c08ba00.2.azurestaticapps.net", // Azure Static Web Apps staging
                "https://ai-dev-request.kr" // Production (future)
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Auto-migrate database on startup (applies pending EF Core migrations)
// This runs in all environments so staging/production schemas stay up to date
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Check if this is a database created by EnsureCreatedAsync() (tables exist but no migration history).
        // If so, we need to mark the InitialCreate migration as already applied before running MigrateAsync(),
        // otherwise it will try to create tables that already exist and fail.
        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
        var appliedMigrations = await dbContext.Database.GetAppliedMigrationsAsync();

        if (appliedMigrations.Any() == false && pendingMigrations.Any())
        {
            // No migrations have ever been applied. Check if the database already has tables
            // (created by the old EnsureCreatedAsync approach).
            var conn = dbContext.Database.GetDbConnection();
            await conn.OpenAsync();
            try
            {
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'languages')";
                var exists = (bool)(await cmd.ExecuteScalarAsync())!;

                if (exists)
                {
                    // Database was created by EnsureCreatedAsync -- tables exist but no migration history.
                    // First, ensure the __EFMigrationsHistory table exists (it won't if EnsureCreated was used).
                    logger.LogInformation("Detected existing database without migration history. Bootstrapping migration state...");
                    var historyRepository = dbContext.GetService<IHistoryRepository>();

                    var createScript = historyRepository.GetCreateIfNotExistsScript();
                    await dbContext.Database.ExecuteSqlRawAsync(createScript);
                    logger.LogInformation("Ensured __EFMigrationsHistory table exists.");

                    // Record the InitialCreate migration as already applied so MigrateAsync skips it.
                    var insertScript = historyRepository.GetInsertScript(new HistoryRow(
                        pendingMigrations.First(), // The InitialCreate migration ID
                        ProductInfo.GetVersion()));
                    await dbContext.Database.ExecuteSqlRawAsync(insertScript);
                    logger.LogInformation("Migration history bootstrapped. InitialCreate marked as applied.");
                }
            }
            finally
            {
                await conn.CloseAsync();
            }
        }

        await dbContext.Database.MigrateAsync();
        logger.LogInformation("Database migration completed successfully.");
    }
    catch (Exception ex)
    {
        // Log but do NOT crash the app. The endpoints will return errors individually,
        // but the health check and logs will remain accessible for debugging.
        logger.LogError(ex, "Database migration failed. The application will start but database-dependent endpoints may not work.");
    }
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("HealthCheck");

app.Run();

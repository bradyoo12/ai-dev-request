using System.Reflection;
using System.Text;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
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
        string[] allTables = { "auto_topup_configs", "build_verifications", "deployments",
            "dev_requests", "hosting_plans", "languages", "payments", "refinement_messages",
            "token_balances", "token_packages", "token_pricing", "token_transactions",
            "translations", "users" };

        // Verify actual table state regardless of what migration history says.
        // This handles: fresh DB, legacy DB (EnsureCreatedAsync), partial legacy DB, and
        // corrupted state (migration history says applied but tables are missing).
        var conn = dbContext.Database.GetDbConnection();
        await conn.OpenAsync();

        HashSet<string> existingTables;
        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY(@tables)";
            var param = cmd.CreateParameter();
            param.ParameterName = "tables";
            param.Value = allTables;
            cmd.Parameters.Add(param);

            existingTables = new HashSet<string>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                existingTables.Add(reader.GetString(0));
        }
        finally
        {
            await conn.CloseAsync();
        }

        logger.LogInformation("Database table check: {Existing}/{Total} tables exist",
            existingTables.Count, allTables.Length);

        if (existingTables.Count > 0 && existingTables.Count < allTables.Length)
        {
            // PARTIAL database: some tables exist, some don't.
            // This happens with legacy EnsureCreatedAsync or corrupted migration state.
            // Drop and recreate for a clean state (safe for staging).
            var missingTables = allTables.Where(t => !existingTables.Contains(t)).ToList();
            logger.LogInformation("Partial database detected. Missing tables: {Missing}. Recreating...",
                string.Join(", ", missingTables));
            await dbContext.Database.EnsureDeletedAsync();
            // MigrateAsync below will create everything from scratch
        }
        else if (existingTables.Count == allTables.Length)
        {
            // All tables exist. Ensure migration history is correct.
            var appliedMigrations = (await dbContext.Database.GetAppliedMigrationsAsync()).ToList();
            var pendingMigrations = (await dbContext.Database.GetPendingMigrationsAsync()).ToList();

            if (!appliedMigrations.Any() && pendingMigrations.Any())
            {
                logger.LogInformation("Complete database without migration history. Bootstrapping...");
                var historyRepository = dbContext.GetService<IHistoryRepository>();
                await dbContext.Database.ExecuteSqlRawAsync(historyRepository.GetCreateIfNotExistsScript());
                await dbContext.Database.ExecuteSqlRawAsync(historyRepository.GetInsertScript(new HistoryRow(
                    pendingMigrations.First(), ProductInfo.GetVersion())));
                logger.LogInformation("Migration history bootstrapped.");
            }
        }
        // else: existingTables.Count == 0 means fresh database, MigrateAsync handles it

        await dbContext.Database.MigrateAsync();
        logger.LogInformation("Database migration completed successfully.");

        // Auto-seed translations if the table is empty
        if (!await dbContext.Translations.AnyAsync())
        {
            logger.LogInformation("Translations table is empty. Seeding from embedded locale files...");
            var assembly = Assembly.GetExecutingAssembly();
            var locales = new[] { "ko", "en" };

            foreach (var locale in locales)
            {
                var resourceName = $"AiDevRequest.API.Data.SeedData.{locale}.json";
                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream == null)
                {
                    logger.LogWarning("Seed file not found: {Resource}", resourceName);
                    continue;
                }

                var translations = await JsonSerializer.DeserializeAsync<Dictionary<string, string>>(stream);
                if (translations == null) continue;

                foreach (var (fullKey, value) in translations)
                {
                    var dotIndex = fullKey.IndexOf('.');
                    if (dotIndex < 0) continue;

                    dbContext.Translations.Add(new Translation
                    {
                        LanguageCode = locale,
                        Namespace = fullKey[..dotIndex],
                        Key = fullKey[(dotIndex + 1)..],
                        Value = value
                    });
                }
            }

            await dbContext.SaveChangesAsync();
            logger.LogInformation("Translation seeding completed.");
        }
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

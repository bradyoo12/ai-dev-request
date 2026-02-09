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
using System.Threading.RateLimiting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Load local settings (secrets, API keys - not committed to git)
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Add AI Services (singleton: reads API key once at startup; config changes require restart)
builder.Services.AddSingleton<IAnalysisService, AnalysisService>();
builder.Services.AddSingleton<IProposalService, ProposalService>();
builder.Services.AddSingleton<IProductionService, ProductionService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddSingleton<IDeploymentService, AzureDeploymentService>();
builder.Services.AddScoped<IPaymentService, StripePaymentService>();
builder.Services.AddScoped<ICryptoPaymentService, CoinbaseCryptoPaymentService>();
builder.Services.AddScoped<IA2AService, A2AService>();
builder.Services.AddScoped<IMemoryService, MemoryService>();
builder.Services.AddScoped<IPreferenceService, PreferenceService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISocialAuthService, SocialAuthService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IBuildVerificationService, BuildVerificationService>();
builder.Services.AddScoped<IAccessibilityService, AccessibilityService>();
builder.Services.AddScoped<ITestGenerationService, TestGenerationService>();
builder.Services.AddScoped<ICodeReviewService, CodeReviewService>();
builder.Services.AddScoped<ICiCdService, CiCdService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<IRefinementService, RefinementService>();
builder.Services.AddScoped<IDomainService, CloudflareDomainService>();
builder.Services.AddScoped<IDatabaseSchemaService, DatabaseSchemaService>();
builder.Services.AddScoped<IProjectVersionService, ProjectVersionService>();
builder.Services.AddScoped<ITemplateService, TemplateService>();

// Add JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AiDevRequest";

if (string.IsNullOrEmpty(jwtSecret))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtSecret = "dev-only-secret-key-not-for-production-min-32!";
    }
    else
    {
        throw new InvalidOperationException(
            "Jwt:Secret must be configured. Set it in appsettings.json, environment variables, or appsettings.Local.json.");
    }
}

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
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    if (builder.Environment.IsDevelopment())
    {
        connectionString = "Host=localhost;Database=ai_dev_request;Username=postgres;Password=postgres";
    }
    else
    {
        throw new InvalidOperationException(
            "ConnectionStrings:DefaultConnection must be configured. Set it in appsettings.json, environment variables, or appsettings.Local.json.");
    }
}

builder.Services.AddDbContext<AiDevRequestDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add health checks with DB verification
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, name: "database", tags: ["ready"]);

// Add Rate Limiting for auth endpoints
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth-login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.AddPolicy("auth-register", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromHours(1),
                QueueLimit = 0
            }));

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            """{"error":"Too many requests. Please try again later."}""",
            cancellationToken);
    };
});

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
            .WithMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS");
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Global exception handler for consistent JSON error responses
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        var exceptionFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        if (exceptionFeature?.Error != null)
        {
            logger.LogError(exceptionFeature.Error, "Unhandled exception on {Path}", context.Request.Path);
        }
        await context.Response.WriteAsync(
            """{"error":"An unexpected error occurred. Please try again later."}""");
    });
});

// Auto-migrate database on startup (applies pending EF Core migrations)
// This runs in all environments so staging/production schemas stay up to date
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        string[] allTables = { "a2a_agent_cards", "a2a_artifacts", "a2a_audit_logs",
            "a2a_consents", "a2a_tasks",
            "auto_topup_configs", "build_verifications", "deployments",
            "dev_requests", "domains", "domain_transactions", "hosting_plans", "languages",
            "payments", "project_templates", "project_versions", "refinement_messages",
            "token_balances", "token_packages", "token_pricing", "token_transactions",
            "translations", "user_memories", "user_preferences",
            "user_preference_summaries", "users" };

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
            var missingTables = allTables.Where(t => !existingTables.Contains(t)).ToList();

            if (app.Environment.IsDevelopment())
            {
                // Only drop and recreate in development — safe to lose data
                logger.LogInformation("Partial database detected in Development. Missing tables: {Missing}. Recreating...",
                    string.Join(", ", missingTables));
                await dbContext.Database.EnsureDeletedAsync();
                // MigrateAsync below will create everything from scratch
            }
            else
            {
                // In staging/production, never drop the database — require manual intervention
                logger.LogCritical(
                    "Database in partial state — manual intervention required. Missing tables: {Missing}",
                    string.Join(", ", missingTables));
                throw new InvalidOperationException(
                    $"Database schema mismatch detected in {app.Environment.EnvironmentName}. " +
                    $"Missing tables: {string.Join(", ", missingTables)}. Manual intervention required.");
            }
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

        // Auto-seed project templates if the table is empty
        if (!await dbContext.ProjectTemplates.AnyAsync())
        {
            logger.LogInformation("Seeding built-in project templates...");
            dbContext.ProjectTemplates.AddRange(
                new AiDevRequest.API.Entities.ProjectTemplate
                {
                    Name = "SaaS Starter",
                    Description = "Full-stack SaaS with auth, billing, and dashboard",
                    Category = "saas",
                    Framework = "react",
                    Tags = "auth,billing,dashboard,stripe",
                    PromptTemplate = "Build a SaaS application with user authentication (email/password + OAuth), Stripe subscription billing with multiple tiers, an admin dashboard with analytics charts, and a user settings page. Include a landing page with pricing section.",
                    CreatedBy = "system"
                },
                new AiDevRequest.API.Entities.ProjectTemplate
                {
                    Name = "E-Commerce Store",
                    Description = "Online store with product catalog, cart, and checkout",
                    Category = "ecommerce",
                    Framework = "react",
                    Tags = "shop,cart,products,payments",
                    PromptTemplate = "Build an e-commerce store with a product catalog (grid/list view with filtering), shopping cart, checkout flow with Stripe payments, order history, and an admin panel for managing products and orders.",
                    CreatedBy = "system"
                },
                new AiDevRequest.API.Entities.ProjectTemplate
                {
                    Name = "Blog Platform",
                    Description = "Blog with markdown editor, categories, and comments",
                    Category = "content",
                    Framework = "nextjs",
                    Tags = "blog,markdown,cms,seo",
                    PromptTemplate = "Build a blog platform with a markdown editor for creating posts, category and tag management, comment system, SEO-friendly URLs, and an RSS feed. Include a clean reading experience with dark mode support.",
                    CreatedBy = "system"
                },
                new AiDevRequest.API.Entities.ProjectTemplate
                {
                    Name = "Admin Dashboard",
                    Description = "Data dashboard with charts, tables, and user management",
                    Category = "dashboard",
                    Framework = "react",
                    Tags = "admin,charts,analytics,tables",
                    PromptTemplate = "Build an admin dashboard with interactive charts (line, bar, pie), data tables with sorting/filtering/pagination, user management (CRUD), role-based access control, and a notification system.",
                    CreatedBy = "system"
                },
                new AiDevRequest.API.Entities.ProjectTemplate
                {
                    Name = "Mobile Task App",
                    Description = "Cross-platform task management with offline support",
                    Category = "productivity",
                    Framework = "flutter",
                    Tags = "tasks,mobile,offline,notifications",
                    PromptTemplate = "Build a cross-platform mobile task management app with project boards, task lists with drag-and-drop, due dates and reminders, offline support with local storage sync, and push notifications.",
                    CreatedBy = "system"
                },
                new AiDevRequest.API.Entities.ProjectTemplate
                {
                    Name = "Landing Page",
                    Description = "Modern landing page with hero, features, and CTA sections",
                    Category = "marketing",
                    Framework = "react",
                    Tags = "landing,marketing,responsive,animations",
                    PromptTemplate = "Build a modern landing page with a hero section with animated background, feature highlights with icons, testimonials carousel, pricing comparison table, FAQ accordion, and a contact form. Fully responsive with smooth scroll animations.",
                    CreatedBy = "system"
                }
            );
            await dbContext.SaveChangesAsync();
            logger.LogInformation("Template seeding completed: 6 built-in templates.");
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
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health check endpoint with DB verification
app.MapHealthChecks("/health");

app.Run();

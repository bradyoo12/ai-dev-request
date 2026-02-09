using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IRecommendationService
{
    Task<List<UserInterest>> GetInterestsAsync(string userId);
    Task<UserInterest> AddInterestAsync(string userId, string category, double confidence = 0.8, string source = "manual");
    Task DeleteInterestAsync(string userId, int interestId);
    Task<List<AppRecommendation>> GetRecommendationsAsync(string userId);
    Task<List<AppRecommendation>> GenerateRecommendationsAsync(string userId);
    Task DismissRecommendationAsync(string userId, int recommendationId);
}

public class RecommendationService : IRecommendationService
{
    private readonly AiDevRequestDbContext _db;

    public RecommendationService(AiDevRequestDbContext db)
    {
        _db = db;
    }

    public async Task<List<UserInterest>> GetInterestsAsync(string userId)
    {
        return await _db.UserInterests
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.Confidence)
            .ToListAsync();
    }

    public async Task<UserInterest> AddInterestAsync(string userId, string category, double confidence = 0.8, string source = "manual")
    {
        var existing = await _db.UserInterests
            .FirstOrDefaultAsync(i => i.UserId == userId && i.Category == category);

        if (existing != null)
        {
            existing.Confidence = Math.Max(existing.Confidence, confidence);
            if (source == "manual") existing.Source = source;
        }
        else
        {
            existing = new UserInterest
            {
                UserId = userId,
                Category = category,
                Confidence = confidence,
                Source = source,
            };
            _db.UserInterests.Add(existing);
        }

        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteInterestAsync(string userId, int interestId)
    {
        var interest = await _db.UserInterests
            .FirstOrDefaultAsync(i => i.Id == interestId && i.UserId == userId);
        if (interest != null)
        {
            _db.UserInterests.Remove(interest);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<List<AppRecommendation>> GetRecommendationsAsync(string userId)
    {
        var recs = await _db.AppRecommendations
            .Where(r => r.UserId == userId && !r.IsDismissed)
            .OrderByDescending(r => r.MatchPercent)
            .ToListAsync();

        if (recs.Count == 0)
        {
            recs = await GenerateRecommendationsAsync(userId);
        }

        return recs;
    }

    public async Task<List<AppRecommendation>> GenerateRecommendationsAsync(string userId)
    {
        // Remove old non-dismissed recommendations
        var old = await _db.AppRecommendations
            .Where(r => r.UserId == userId && !r.IsDismissed)
            .ToListAsync();
        _db.AppRecommendations.RemoveRange(old);

        var interests = await GetInterestsAsync(userId);
        var preferences = await _db.UserPreferences
            .Where(p => p.UserId == userId)
            .ToListAsync();

        var recommendations = new List<AppRecommendation>();

        // Interest-based recommendations
        var interestCategories = interests.Select(i => i.Category.ToLowerInvariant()).ToHashSet();

        // Also check preferences for tech interests
        var techPrefs = preferences.Where(p => p.Category == "tech").Select(p => p.Value.ToLowerInvariant()).ToHashSet();
        var platformPrefs = preferences.Where(p => p.Category == "platform").Select(p => p.Value.ToLowerInvariant()).ToHashSet();

        // Template-based recommendation engine
        var templates = GetRecommendationTemplates();

        foreach (var template in templates)
        {
            var score = CalculateMatchScore(template, interestCategories, techPrefs, platformPrefs);
            if (score >= 40)
            {
                recommendations.Add(new AppRecommendation
                {
                    UserId = userId,
                    Title = template.Title,
                    Description = template.Description,
                    Reason = template.Reason,
                    PromptTemplate = template.PromptTemplate,
                    MatchPercent = score,
                    InterestCategory = template.PrimaryInterest,
                });
            }
        }

        // If no interest matches, add popular/generic suggestions
        if (recommendations.Count == 0)
        {
            recommendations.AddRange(GetFallbackRecommendations(userId));
        }

        // Take top 5
        recommendations = recommendations
            .OrderByDescending(r => r.MatchPercent)
            .Take(5)
            .ToList();

        _db.AppRecommendations.AddRange(recommendations);
        await _db.SaveChangesAsync();

        return recommendations;
    }

    public async Task DismissRecommendationAsync(string userId, int recommendationId)
    {
        var rec = await _db.AppRecommendations
            .FirstOrDefaultAsync(r => r.Id == recommendationId && r.UserId == userId);
        if (rec != null)
        {
            rec.IsDismissed = true;
            await _db.SaveChangesAsync();
        }
    }

    private static int CalculateMatchScore(
        RecommendationTemplate template,
        HashSet<string> interests,
        HashSet<string> techPrefs,
        HashSet<string> platformPrefs)
    {
        var score = template.BaseScore;

        foreach (var interest in template.MatchingInterests)
        {
            if (interests.Contains(interest))
                score += 20;
        }

        foreach (var tech in template.MatchingTech)
        {
            if (techPrefs.Contains(tech))
                score += 10;
        }

        foreach (var platform in template.MatchingPlatforms)
        {
            if (platformPrefs.Contains(platform))
                score += 5;
        }

        return Math.Min(score, 99);
    }

    private static List<RecommendationTemplate> GetRecommendationTemplates()
    {
        return
        [
            new()
            {
                Title = "Restaurant Recommendation Service",
                Description = "Location-based restaurant discovery with reviews, ratings, and bookmarking. Help food lovers find their next great meal.",
                Reason = "Perfect for food enthusiasts who love discovering new restaurants.",
                PromptTemplate = "Build a restaurant recommendation app with location-based search, user reviews and ratings, photo gallery, bookmark/favorites, and a map view. Include filtering by cuisine type and price range.",
                PrimaryInterest = "food",
                MatchingInterests = ["food", "travel", "lifestyle"],
                BaseScore = 30
            },
            new()
            {
                Title = "Fitness Tracking App",
                Description = "Personal workout tracker with exercise logs, progress charts, and routine management. Stay motivated with your fitness goals.",
                Reason = "Ideal for health-conscious users who want to track their fitness journey.",
                PromptTemplate = "Build a fitness tracking app with workout logging, exercise library, progress charts and statistics, custom routine creation, and reminder notifications.",
                PrimaryInterest = "fitness",
                MatchingInterests = ["fitness", "health", "sports"],
                BaseScore = 30
            },
            new()
            {
                Title = "Travel Journal Platform",
                Description = "Document your travels with photos, maps, and stories. Share your adventures and discover new destinations.",
                Reason = "Great for travel lovers who want to document and share their experiences.",
                PromptTemplate = "Build a travel journal app with trip planning, photo diary with geolocation, interactive maps with visited places, travel expense tracker, and social sharing features.",
                PrimaryInterest = "travel",
                MatchingInterests = ["travel", "photography", "lifestyle"],
                BaseScore = 30
            },
            new()
            {
                Title = "Music Discovery Platform",
                Description = "Discover new music based on your taste. Create playlists, share with friends, and explore new genres.",
                Reason = "Built for music enthusiasts who love discovering and sharing new songs.",
                PromptTemplate = "Build a music discovery platform with playlist management, genre-based browsing, social sharing, artist profiles, and a recommendation feed based on listening history.",
                PrimaryInterest = "music",
                MatchingInterests = ["music", "entertainment", "social"],
                BaseScore = 30
            },
            new()
            {
                Title = "Study Group Organizer",
                Description = "Connect with study partners, schedule sessions, and share study materials. Make learning collaborative and effective.",
                Reason = "Perfect for students and lifelong learners who want to study together.",
                PromptTemplate = "Build a study group app with group creation and management, session scheduling with calendar integration, shared document library, chat messaging, and progress tracking.",
                PrimaryInterest = "education",
                MatchingInterests = ["education", "tech", "productivity"],
                BaseScore = 30
            },
            new()
            {
                Title = "Budget Tracker App",
                Description = "Track expenses, set budgets, and visualize spending patterns. Take control of your finances with smart insights.",
                Reason = "Ideal for users who want better control over their personal finances.",
                PromptTemplate = "Build a personal budget tracker with expense logging, category-based budgeting, spending charts and analytics, recurring expense tracking, and monthly financial reports.",
                PrimaryInterest = "finance",
                MatchingInterests = ["finance", "productivity", "lifestyle"],
                BaseScore = 30
            },
            new()
            {
                Title = "Pet Care Companion",
                Description = "Manage your pet's health, schedule vet appointments, and connect with other pet owners in your area.",
                Reason = "Built for pet lovers who want the best care for their furry friends.",
                PromptTemplate = "Build a pet care app with pet profile management, vet appointment scheduling, health record tracking, feeding and medication reminders, and a community forum for pet owners.",
                PrimaryInterest = "pets",
                MatchingInterests = ["pets", "lifestyle", "health"],
                BaseScore = 30
            },
            new()
            {
                Title = "Developer Portfolio Builder",
                Description = "Create a stunning developer portfolio with project showcases, skill badges, and GitHub integration.",
                Reason = "Great for developers who want to showcase their work professionally.",
                PromptTemplate = "Build a developer portfolio website with project showcase gallery, skill and technology badges, GitHub repository integration, blog section, and contact form with email integration.",
                PrimaryInterest = "tech",
                MatchingInterests = ["tech", "productivity", "education"],
                MatchingTech = ["react", "nextjs", "typescript"],
                BaseScore = 25
            },
            new()
            {
                Title = "Recipe Manager",
                Description = "Organize your recipes, plan meals for the week, and generate shopping lists automatically.",
                Reason = "Perfect for home cooks who want to organize their culinary adventures.",
                PromptTemplate = "Build a recipe management app with recipe storage and search, meal planning calendar, automatic shopping list generation, cooking timer, and social recipe sharing.",
                PrimaryInterest = "food",
                MatchingInterests = ["food", "health", "lifestyle"],
                BaseScore = 25
            },
            new()
            {
                Title = "Event Planning App",
                Description = "Plan events, manage guest lists, and coordinate with vendors. Make event planning stress-free.",
                Reason = "Ideal for social butterflies who love organizing gatherings and events.",
                PromptTemplate = "Build an event planning app with event creation and management, guest list with RSVP tracking, vendor contact management, budget tracking, and timeline/checklist features.",
                PrimaryInterest = "social",
                MatchingInterests = ["social", "lifestyle", "entertainment"],
                BaseScore = 25
            },
        ];
    }

    private static List<AppRecommendation> GetFallbackRecommendations(string userId)
    {
        return
        [
            new AppRecommendation
            {
                UserId = userId,
                Title = "Personal Blog Platform",
                Description = "Create a beautiful blog to share your thoughts, stories, and expertise with the world.",
                Reason = "A blog is a great starting point for anyone looking to build their online presence.",
                PromptTemplate = "Build a blog platform with a markdown editor for creating posts, category and tag management, comment system, SEO-friendly URLs, and an RSS feed.",
                MatchPercent = 60,
                InterestCategory = "general",
            },
            new AppRecommendation
            {
                UserId = userId,
                Title = "Task Management App",
                Description = "Organize your tasks, set priorities, and track progress with an intuitive project board.",
                Reason = "Everyone needs better task management — build your perfect productivity tool.",
                PromptTemplate = "Build a task management app with project boards, task lists with drag-and-drop, due dates and reminders, priority labels, and progress tracking.",
                MatchPercent = 55,
                InterestCategory = "general",
            },
            new AppRecommendation
            {
                UserId = userId,
                Title = "Landing Page Builder",
                Description = "Create a modern landing page with hero sections, features showcase, and call-to-action elements.",
                Reason = "Perfect for learning web development or promoting a new project.",
                PromptTemplate = "Build a modern landing page with a hero section with animated background, feature highlights with icons, testimonials carousel, pricing comparison table, and a contact form.",
                MatchPercent = 50,
                InterestCategory = "general",
            },
        ];
    }

    private record RecommendationTemplate
    {
        public string Title { get; init; } = "";
        public string Description { get; init; } = "";
        public string Reason { get; init; } = "";
        public string PromptTemplate { get; init; } = "";
        public string PrimaryInterest { get; init; } = "";
        public string[] MatchingInterests { get; init; } = [];
        public string[] MatchingTech { get; init; } = [];
        public string[] MatchingPlatforms { get; init; } = [];
        public int BaseScore { get; init; }
    }
}

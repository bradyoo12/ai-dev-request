using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.DTOs;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IDiscoveryService
{
    Task<List<DiscoveryRecommendationDto>> GenerateRecommendationsAsync(string userId, QuestionnaireAnswersDto answers);
    Task<List<DiscoveryRecommendationDto>> GetSavedRecommendationsAsync(string userId);
}

public class DiscoveryService : IDiscoveryService
{
    private readonly AnthropicClient _client;
    private readonly IModelRouterService _modelRouter;
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<DiscoveryService> _logger;

    public DiscoveryService(
        IConfiguration configuration,
        IModelRouterService modelRouter,
        AiDevRequestDbContext db,
        ILogger<DiscoveryService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _modelRouter = modelRouter;
        _db = db;
        _logger = logger;
    }

    public async Task<List<DiscoveryRecommendationDto>> GenerateRecommendationsAsync(string userId, QuestionnaireAnswersDto answers)
    {
        var prompt = $@"You are a creative software development mentor. A beginner user has answered questions about their interests.

User Profile:
- Hobbies: {answers.Hobbies}
- Daily pain points: {answers.PainPoints}
- Learning interests: {answers.LearningGoals}
- Geographic context: {answers.Location}
- Food/culture interests: {answers.FoodCulture}

Generate 3-5 software project ideas that:
1. Are genuinely beginner-friendly (achievable in 2-4 hours)
2. Directly relate to their stated interests
3. Solve a real problem or provide genuine value
4. Use modern web technologies (React, TypeScript, simple APIs)

For each project, provide:
- title (concise, exciting)
- description (2-3 sentences, plain language)
- matchReason (why it matches their interests - personalized reasoning)
- exampleUseCase (example use case from their life)
- difficultyLevel (""beginner"" or ""intermediate"")
- estimatedHours (hours as integer)
- projectTypeTag (""web"", ""mobile"", ""api"", or ""data"")

Format as JSON array of objects with these exact keys. Respond with ONLY the JSON array, no other text.";

        try
        {
            var modelTier = _modelRouter.GetRecommendedTier(TaskCategory.StandardGeneration);
            var modelId = _modelRouter.GetModelId(modelTier);

            var parameters = new MessageParameters
            {
                Messages = new List<Message>
                {
                    new Message
                    {
                        Role = RoleType.User,
                        Content = new List<ContentBase> { new TextContent { Text = prompt } }
                    }
                },
                Model = modelId,
                MaxTokens = 2000,
                Temperature = 0.7m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "";

            // Parse JSON response
            var recommendationsJson = JsonSerializer.Deserialize<List<RecommendationJson>>(content);

            if (recommendationsJson == null || !recommendationsJson.Any())
            {
                _logger.LogWarning("Claude API returned empty or invalid recommendations");
                return new List<DiscoveryRecommendationDto>();
            }

            // Store questionnaire
            var questionnaire = new DiscoveryQuestionnaire
            {
                UserId = userId,
                AnswersJson = JsonSerializer.Serialize(answers),
                CreatedAt = DateTime.UtcNow
            };

            _db.DiscoveryQuestionnaires.Add(questionnaire);
            await _db.SaveChangesAsync();

            // Store recommendations
            var recommendations = new List<DiscoveryRecommendation>();
            foreach (var rec in recommendationsJson)
            {
                var recommendation = new DiscoveryRecommendation
                {
                    QuestionnaireId = questionnaire.Id,
                    UserId = userId,
                    Title = rec.Title,
                    Description = rec.Description,
                    MatchReason = rec.MatchReason,
                    ExampleUseCase = rec.ExampleUseCase,
                    DifficultyLevel = rec.DifficultyLevel,
                    EstimatedHours = rec.EstimatedHours,
                    ProjectTypeTag = rec.ProjectTypeTag
                };

                recommendations.Add(recommendation);
                _db.DiscoveryRecommendations.Add(recommendation);
            }

            await _db.SaveChangesAsync();

            // Map to DTOs
            return recommendations.Select(r => new DiscoveryRecommendationDto
            {
                Id = r.Id,
                Title = r.Title,
                Description = r.Description,
                MatchReason = r.MatchReason,
                ExampleUseCase = r.ExampleUseCase,
                DifficultyLevel = r.DifficultyLevel,
                EstimatedHours = r.EstimatedHours,
                ProjectTypeTag = r.ProjectTypeTag
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating discovery recommendations");
            throw;
        }
    }

    public async Task<List<DiscoveryRecommendationDto>> GetSavedRecommendationsAsync(string userId)
    {
        var recommendations = await _db.DiscoveryRecommendations
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .ToListAsync();

        return recommendations.Select(r => new DiscoveryRecommendationDto
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            MatchReason = r.MatchReason,
            ExampleUseCase = r.ExampleUseCase,
            DifficultyLevel = r.DifficultyLevel,
            EstimatedHours = r.EstimatedHours,
            ProjectTypeTag = r.ProjectTypeTag
        }).ToList();
    }

    // Helper class for JSON deserialization
    private class RecommendationJson
    {
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string MatchReason { get; set; } = "";
        public string ExampleUseCase { get; set; } = "";
        public string DifficultyLevel { get; set; } = "";
        public int EstimatedHours { get; set; }
        public string ProjectTypeTag { get; set; } = "";
    }
}

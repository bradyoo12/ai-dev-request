namespace AiDevRequest.API.DTOs;

public record QuestionnaireAnswersDto
{
    public string Hobbies { get; init; } = "";
    public string PainPoints { get; init; } = "";
    public string LearningGoals { get; init; } = "";
    public string Location { get; init; } = "";
    public string FoodCulture { get; init; } = "";
}

public record DiscoveryRecommendationDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = "";
    public string Description { get; init; } = "";
    public string MatchReason { get; init; } = "";
    public string ExampleUseCase { get; init; } = "";
    public string DifficultyLevel { get; init; } = "";
    public int EstimatedHours { get; init; }
    public string ProjectTypeTag { get; init; } = "";
}

public record DiscoveryQuestionnaireDto
{
    public Guid Id { get; init; }
    public QuestionnaireAnswersDto Answers { get; init; } = new();
    public DateTime CreatedAt { get; init; }
}

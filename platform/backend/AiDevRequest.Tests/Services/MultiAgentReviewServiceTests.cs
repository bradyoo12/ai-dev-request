using AiDevRequest.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class MultiAgentReviewServiceTests
{
    [Fact]
    public void Constructor_ThrowsWhenNoApiKey()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();

        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            Assert.Throws<InvalidOperationException>(() => new MultiAgentReviewService(config, logger.Object));
        }
        finally
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", originalKey);
        }
    }

    [Fact]
    public void Constructor_SucceedsWithApiKey()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();

        var service = new MultiAgentReviewService(config, logger.Object);

        Assert.NotNull(service);
    }

    [Fact]
    public void ComputeRiskScore_WithAllAgents_ReturnsWeightedAverage()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();
        var service = new MultiAgentReviewService(config, logger.Object);

        var result = new MultiAgentReviewResult
        {
            AgentResults = new List<AgentReviewResult>
            {
                new() { AgentType = "Security", RiskScore = 80 },
                new() { AgentType = "Performance", RiskScore = 40 },
                new() { AgentType = "Architecture", RiskScore = 60 },
                new() { AgentType = "Testing", RiskScore = 70 }
            }
        };

        var compositeRisk = service.ComputeRiskScore(result);

        // Expected: 80*0.35 + 70*0.30 + 60*0.20 + 40*0.15 = 28 + 21 + 12 + 6 = 67
        Assert.Equal(67, compositeRisk);
    }

    [Fact]
    public void ComputeRiskScore_WithNoAgents_ReturnsZero()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();
        var service = new MultiAgentReviewService(config, logger.Object);

        var result = new MultiAgentReviewResult
        {
            AgentResults = new List<AgentReviewResult>()
        };

        var compositeRisk = service.ComputeRiskScore(result);

        Assert.Equal(0, compositeRisk);
    }

    [Fact]
    public void ComputeRiskScore_WithMissingAgents_HandlesGracefully()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();
        var service = new MultiAgentReviewService(config, logger.Object);

        var result = new MultiAgentReviewResult
        {
            AgentResults = new List<AgentReviewResult>
            {
                new() { AgentType = "Security", RiskScore = 100 },
                new() { AgentType = "Testing", RiskScore = 50 }
            }
        };

        var compositeRisk = service.ComputeRiskScore(result);

        // Expected: 100*0.35 + 50*0.30 + 0*0.20 + 0*0.15 = 35 + 15 = 50
        Assert.Equal(50, compositeRisk);
    }

    [Fact]
    public void ComputeRiskScore_ClampsTo100()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();
        var service = new MultiAgentReviewService(config, logger.Object);

        var result = new MultiAgentReviewResult
        {
            AgentResults = new List<AgentReviewResult>
            {
                new() { AgentType = "Security", RiskScore = 100 },
                new() { AgentType = "Performance", RiskScore = 100 },
                new() { AgentType = "Architecture", RiskScore = 100 },
                new() { AgentType = "Testing", RiskScore = 100 }
            }
        };

        var compositeRisk = service.ComputeRiskScore(result);

        Assert.Equal(100, compositeRisk);
    }

    [Fact]
    public void ComputeRiskScore_ClampsToZero()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();
        var service = new MultiAgentReviewService(config, logger.Object);

        var result = new MultiAgentReviewResult
        {
            AgentResults = new List<AgentReviewResult>
            {
                new() { AgentType = "Security", RiskScore = 0 },
                new() { AgentType = "Performance", RiskScore = 0 },
                new() { AgentType = "Architecture", RiskScore = 0 },
                new() { AgentType = "Testing", RiskScore = 0 }
            }
        };

        var compositeRisk = service.ComputeRiskScore(result);

        Assert.Equal(0, compositeRisk);
    }

    [Fact]
    public void GenerateTestSuggestions_WithUntestedPaths_GeneratesSuggestions()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();
        var service = new MultiAgentReviewService(config, logger.Object);

        var result = new MultiAgentReviewResult
        {
            AgentResults = new List<AgentReviewResult>
            {
                new()
                {
                    AgentType = "Testing",
                    RiskScore = 70,
                    UntestedPaths = new List<UntestedPath>
                    {
                        new() { File = "src/service.ts", Function = "processPayment", Reason = "Critical payment logic lacks tests" },
                        new() { File = "src/auth.ts", Function = "validateToken", Reason = "Security-critical authentication not tested" }
                    }
                }
            }
        };

        var suggestions = service.GenerateTestSuggestions(result);

        Assert.Equal(2, suggestions.Count);
        Assert.Equal("src/service.ts", suggestions[0].File);
        Assert.Equal("processPayment", suggestions[0].Function);
        Assert.Equal(4, suggestions[0].SuggestedTestCases.Count);
        Assert.Contains("valid input", suggestions[0].SuggestedTestCases[0]);
    }

    [Fact]
    public void GenerateTestSuggestions_WithNoTestingAgent_ReturnsEmpty()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();
        var service = new MultiAgentReviewService(config, logger.Object);

        var result = new MultiAgentReviewResult
        {
            AgentResults = new List<AgentReviewResult>
            {
                new() { AgentType = "Security", RiskScore = 50 }
            }
        };

        var suggestions = service.GenerateTestSuggestions(result);

        Assert.Empty(suggestions);
    }

    [Fact]
    public void GenerateTestSuggestions_WithNoUntestedPaths_ReturnsEmpty()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<MultiAgentReviewService>>();
        var service = new MultiAgentReviewService(config, logger.Object);

        var result = new MultiAgentReviewResult
        {
            AgentResults = new List<AgentReviewResult>
            {
                new()
                {
                    AgentType = "Testing",
                    RiskScore = 10,
                    UntestedPaths = null
                }
            }
        };

        var suggestions = service.GenerateTestSuggestions(result);

        Assert.Empty(suggestions);
    }
}

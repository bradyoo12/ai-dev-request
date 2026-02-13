using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/ai-model-integrations")]
public class AiModelIntegrationController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public AiModelIntegrationController(AiDevRequestDbContext db) => _db = db;

    [HttpPost("integrate")]
    public async Task<IActionResult> Integrate([FromBody] IntegrateRequest req)
    {
        var provider = GetProvider(req.ProviderId);
        var model = GetModel(req.ProviderId, req.ModelId);

        var codeSnippet = GenerateCodeSnippet(req.ProviderId, req.ModelId, req.Capability);
        var costPerRequest = model?.CostPer1kTokens ?? 0.01;

        var integration = new AiModelIntegration
        {
            UserId = User.FindFirst("sub")?.Value ?? "anonymous",
            ProjectName = req.ProjectName,
            ProviderId = req.ProviderId,
            ModelId = req.ModelId,
            Capability = req.Capability,
            IntegrationStatus = "configured",
            CredentialSecured = true,
            ConfigJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                provider = req.ProviderId,
                model = req.ModelId,
                capability = req.Capability,
                envVar = $"{req.ProviderId.ToUpperInvariant()}_API_KEY",
                maxTokens = 4096,
                temperature = 0.7
            }),
            EstimatedCostPerRequest = costPerRequest,
            GeneratedCodeSnippet = codeSnippet
        };
        _db.AiModelIntegrations.Add(integration);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            integration.Id,
            integration.ProjectName,
            integration.ProviderId,
            integration.ModelId,
            integration.Capability,
            integration.IntegrationStatus,
            integration.CredentialSecured,
            integration.EstimatedCostPerRequest,
            codeSnippet,
            provider = provider != null ? new { provider.Name, provider.Description, provider.ModelCount } : null,
            securityNote = "API key stored in environment variable — never committed to source code",
            recommendation = $"Integration configured for {req.ModelId}. Add your API key to the .env file as {req.ProviderId.ToUpperInvariant()}_API_KEY before deploying."
        });
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var integrations = await _db.AiModelIntegrations
            .OrderByDescending(i => i.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(integrations);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var integration = await _db.AiModelIntegrations.FindAsync(id);
        if (integration == null) return NotFound();
        _db.AiModelIntegrations.Remove(integration);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var integrations = await _db.AiModelIntegrations.ToListAsync();
        var byProvider = integrations.GroupBy(i => i.ProviderId).Select(g => new
        {
            provider = g.Key,
            count = g.Count(),
            avgCost = Math.Round(g.Average(i => i.EstimatedCostPerRequest), 4)
        }).ToList();
        return Ok(new { total = integrations.Count, byProvider });
    }

    [HttpGet("providers")]
    [AllowAnonymous]
    public IActionResult GetProviders()
    {
        return Ok(new[]
        {
            new ProviderInfo { Id = "anthropic", Name = "Anthropic", Description = "Claude model family — best for code generation and reasoning", ModelCount = 6, Logo = "anthropic",
                Models = new[] {
                    new ModelInfo { Id = "claude-opus-4-6", Name = "Claude Opus 4.6", Capability = "chat", CostPer1kTokens = 0.075, Quality = "highest", Speed = "medium" },
                    new ModelInfo { Id = "claude-sonnet-4-5", Name = "Claude Sonnet 4.5", Capability = "chat", CostPer1kTokens = 0.015, Quality = "high", Speed = "fast" },
                    new ModelInfo { Id = "claude-haiku-4-5", Name = "Claude Haiku 4.5", Capability = "chat", CostPer1kTokens = 0.005, Quality = "good", Speed = "fastest" }
                }},
            new ProviderInfo { Id = "openai", Name = "OpenAI", Description = "GPT model family — versatile general-purpose AI", ModelCount = 8, Logo = "openai",
                Models = new[] {
                    new ModelInfo { Id = "gpt-4o", Name = "GPT-4o", Capability = "chat", CostPer1kTokens = 0.01, Quality = "high", Speed = "fast" },
                    new ModelInfo { Id = "dall-e-3", Name = "DALL-E 3", Capability = "image-gen", CostPer1kTokens = 0.04, Quality = "highest", Speed = "medium" },
                    new ModelInfo { Id = "whisper-1", Name = "Whisper", Capability = "speech", CostPer1kTokens = 0.006, Quality = "high", Speed = "fast" }
                }},
            new ProviderInfo { Id = "google", Name = "Google AI", Description = "Gemini model family — multimodal AI with large context", ModelCount = 5, Logo = "google",
                Models = new[] {
                    new ModelInfo { Id = "gemini-2.5-pro", Name = "Gemini 2.5 Pro", Capability = "chat", CostPer1kTokens = 0.007, Quality = "high", Speed = "fast" },
                    new ModelInfo { Id = "gemini-2.5-flash", Name = "Gemini 2.5 Flash", Capability = "chat", CostPer1kTokens = 0.001, Quality = "good", Speed = "fastest" }
                }},
            new ProviderInfo { Id = "huggingface", Name = "Hugging Face", Description = "Open-source model hub — 300K+ models for every task", ModelCount = 300000, Logo = "huggingface",
                Models = new[] {
                    new ModelInfo { Id = "meta-llama-3.1-70b", Name = "Llama 3.1 70B", Capability = "chat", CostPer1kTokens = 0.002, Quality = "good", Speed = "medium" },
                    new ModelInfo { Id = "stable-diffusion-xl", Name = "Stable Diffusion XL", Capability = "image-gen", CostPer1kTokens = 0.02, Quality = "high", Speed = "slow" }
                }},
            new ProviderInfo { Id = "openrouter", Name = "OpenRouter", Description = "AI model aggregator — access 200+ models through one API", ModelCount = 200, Logo = "openrouter",
                Models = new[] {
                    new ModelInfo { Id = "auto", Name = "Auto Router", Capability = "chat", CostPer1kTokens = 0.005, Quality = "varies", Speed = "varies" }
                }}
        });
    }

    private ProviderInfo? GetProvider(string id) => id switch
    {
        "anthropic" => new ProviderInfo { Id = "anthropic", Name = "Anthropic", Description = "Claude models", ModelCount = 6 },
        "openai" => new ProviderInfo { Id = "openai", Name = "OpenAI", Description = "GPT models", ModelCount = 8 },
        "google" => new ProviderInfo { Id = "google", Name = "Google AI", Description = "Gemini models", ModelCount = 5 },
        "huggingface" => new ProviderInfo { Id = "huggingface", Name = "Hugging Face", Description = "Open-source models", ModelCount = 300000 },
        "openrouter" => new ProviderInfo { Id = "openrouter", Name = "OpenRouter", Description = "Model aggregator", ModelCount = 200 },
        _ => null
    };

    private ModelInfo? GetModel(string provider, string model) => new ModelInfo
    {
        Id = model,
        Name = model,
        CostPer1kTokens = provider switch { "anthropic" => 0.015, "openai" => 0.01, "google" => 0.007, _ => 0.005 }
    };

    private static string GenerateCodeSnippet(string provider, string model, string capability) =>
        provider switch
        {
            "anthropic" => $"import Anthropic from '@anthropic-ai/sdk';\n\nconst client = new Anthropic({{ apiKey: process.env.ANTHROPIC_API_KEY }});\n\nconst response = await client.messages.create({{\n  model: '{model}',\n  max_tokens: 4096,\n  messages: [{{ role: 'user', content: 'Your prompt here' }}]\n}});",
            "openai" => capability == "image-gen"
                ? $"import OpenAI from 'openai';\n\nconst client = new OpenAI({{ apiKey: process.env.OPENAI_API_KEY }});\n\nconst image = await client.images.generate({{\n  model: '{model}',\n  prompt: 'Your image description',\n  size: '1024x1024'\n}});"
                : $"import OpenAI from 'openai';\n\nconst client = new OpenAI({{ apiKey: process.env.OPENAI_API_KEY }});\n\nconst response = await client.chat.completions.create({{\n  model: '{model}',\n  messages: [{{ role: 'user', content: 'Your prompt here' }}]\n}});",
            "google" => $"import {{ GoogleGenerativeAI }} from '@google/generative-ai';\n\nconst genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);\nconst model = genAI.getGenerativeModel({{ model: '{model}' }});\n\nconst result = await model.generateContent('Your prompt here');",
            _ => $"// Integration code for {provider}/{model}\n// Add your API key to .env as {provider.ToUpperInvariant()}_API_KEY"
        };

    public record IntegrateRequest(string ProjectName, string ProviderId, string ModelId, string Capability = "chat");

    public class ProviderInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int ModelCount { get; set; }
        public string Logo { get; set; } = string.Empty;
        public ModelInfo[] Models { get; set; } = Array.Empty<ModelInfo>();
    }

    public class ModelInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Capability { get; set; } = string.Empty;
        public double CostPer1kTokens { get; set; }
        public string Quality { get; set; } = string.Empty;
        public string Speed { get; set; } = string.Empty;
    }
}

## Summary

Adopt the **Plan-and-Execute heterogeneous model architecture** for the AI engine, using cheap/fast models for planning and scaffolding while reserving expensive frontier models for complex code generation. Industry reports show this pattern can reduce AI API costs by up to 90%.

## Problem

The current AI engine uses a single model (Claude) for all tasks — from understanding requirements to generating boilerplate to writing complex business logic. This is expensive and slow, as frontier model tokens are used even for simple scaffolding tasks that cheaper models handle well.

## Proposed Solution

Implement a **tiered model architecture** with three levels:

### Tier 1 — Planning (Cheap/Fast Model)
- Requirement analysis and decomposition
- File structure planning
- Dependency identification
- Task ordering and prioritization
- **Model**: Claude Haiku or equivalent (~10x cheaper than Opus)

### Tier 2 — Standard Generation (Mid-Tier Model)
- Boilerplate code generation
- Standard CRUD operations
- Configuration files
- Common UI patterns
- **Model**: Claude Sonnet (~3x cheaper than Opus)

### Tier 3 — Complex Generation (Frontier Model)
- Complex business logic
- Security-critical code
- Performance-sensitive algorithms
- Architecture decisions
- **Model**: Claude Opus (current default)

### Orchestrator
A lightweight orchestrator classifies each generation task by complexity and routes to the appropriate tier. Classification is based on:
- Task type (planning vs. generation vs. review)
- Complexity signals (number of dependencies, domain specificity)
- User plan tier (free users get more Tier 1/2, paid users get more Tier 3)

## Expected Impact

| Metric | Current | Projected |
|--------|---------|-----------|
| Avg cost per project | ~$2-5 | ~$0.30-0.80 |
| Planning speed | 10-15s | 2-3s |
| Boilerplate generation | 8-12s | 3-5s |
| Complex logic generation | 15-25s | 15-25s (same) |

## Technical Approach

- Add model routing configuration to AI engine
- Implement task complexity classifier (rule-based initially, ML later)
- Create prompt templates optimized for each model tier
- Add cost tracking and analytics per tier
- Integrate with existing `BradYoo.Core.AI` service abstraction

## Competitive Context

- Leading AI agent platforms use heterogeneous architectures (per [AIMultiple research](https://aimultiple.com/agentic-orchestration))
- The Plan-and-Execute pattern is documented as reducing costs by 90% in production
- Enables more generous free tier without increasing costs

## Scores

| Metric | Score |
|--------|-------|
| Relevance | 5/5 |
| Impact | 4/5 |
| Effort | 3/5 |

## References

- [Agentic Orchestration Frameworks 2026](https://aimultiple.com/agentic-orchestration)
- [AI Agent Design Patterns - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [LLM Orchestration Frameworks 2026](https://research.aimultiple.com/llm-orchestration/)

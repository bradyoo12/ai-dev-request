## Summary

Implement a self-testing and self-healing code generation loop in the AI engine, inspired by Replit Agent 3's reflection loop architecture. After generating code, the system automatically runs tests, detects failures, and iteratively fixes issues until the code passes — all before presenting results to the user.

## Problem

Currently, code generation is a single-pass process. If the generated code has bugs, syntax errors, or runtime failures, the user discovers them only after receiving the output. Competitors like Replit Agent 3 now test and fix code autonomously in a reflection loop, achieving significantly higher first-time success rates.

## Proposed Solution

Add a **generate → test → fix** feedback loop to the AI engine pipeline:

1. **Generate**: AI produces code for the requested feature
2. **Build Check**: Automatically compile/build the generated project (extends existing #141 compiler-in-loop)
3. **Runtime Test**: Execute generated test cases or smoke tests in a sandboxed environment
4. **Diagnose**: If tests fail, feed error output back to the AI with the original context
5. **Fix**: AI generates a corrected version
6. **Repeat**: Loop up to N iterations (configurable, default 3) until tests pass or max retries reached

### Key Differences from #141 (Compiler-in-Loop)

- #141 validates compilation only — this adds **runtime testing and behavioral validation**
- Includes automatic **test generation** alongside feature code
- Implements a **reflection loop** where the AI learns from its own errors
- Tracks and reports **iteration count and fix history** to the user

## Technical Approach

- Integrate sandboxed execution (Docker/WebContainer) into the generation pipeline
- Add test runner step after code generation (language-appropriate: `dotnet test`, `npm test`, `pytest`)
- Implement retry logic with exponential backoff and context window management
- Add metrics: pass rate, average iterations to success, common failure categories

## Competitive Context

- **Replit Agent 3**: Proprietary self-testing system, 3x faster and 10x more cost-effective than alternatives
- **Bolt.new / Lovable**: Increasingly adding validation steps to their pipelines
- This feature would be a major differentiator for AI Dev Request

## Scores

| Metric | Score |
|--------|-------|
| Relevance | 5/5 |
| Impact | 5/5 |
| Effort | 3/5 |

## References

- [Replit Agent 3 announcement](https://blog.replit.com/introducing-agent-3-our-most-autonomous-agent-yet)
- [Replit Agent 3 review](https://hackceleration.com/replit-review/)

# Initialize AI Dev Request Environment

Switch to the bradyoo12 GitHub account and verify the project status.

## Steps

1. Switch GitHub account:
```bash
gh auth switch --user bradyoo12
```

2. Verify GitHub account:
```bash
gh auth status
```

3. Show project overview:
- platform/backend: .NET 10 LTS API server
- platform/frontend: React + Vite web app
- platform/ai-engine: Claude API integration

4. Check repository status:
```bash
git status -s
```

5. Load project context from:
- `.claude/CLAUDE.md`
- `.claude/policy.md`
- `.claude/design.md`

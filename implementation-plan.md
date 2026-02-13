## Implementation Plan for #538: Interest-Based Discovery Wizard

### Overview
This ticket adds a new **interest-based discovery flow** to help beginners and users with decision paralysis find project ideas based on their personal interests. The wizard will use a conversational questionnaire to learn about users' hobbies, pain points, and interests, then use Claude AI to generate personalized, beginner-friendly project recommendations.

---

## Architecture Summary

### Frontend Components
- **New Route**: `/onboarding/discovery` (separate from `/settings/onboarding`)
- **Multi-step Wizard**: 5-7 question flow with progress tracking
- **Results Page**: Visual project recommendation cards with CTA buttons
- **Integration**: One-click flow to create request from recommendation

### Backend Services
- **New Controller**: `DiscoveryController` at `/api/discovery`
- **New Service**: `DiscoveryService` for AI-powered recommendation generation
- **Existing Integration**: Leverage `ModelRouterService` for Claude Sonnet 4.5 routing
- **Data Storage**: New `DiscoveryRecommendation` entity + extend `AppRecommendation`

---

## Implementation Tasks

### Phase 1: Backend Foundation

#### 1.1 Create Discovery Entities
**File**: `platform/backend/AiDevRequest.API/Entities/DiscoveryQuestionnaire.cs`
```csharp
public class DiscoveryQuestionnaire
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    public string AnswersJson { get; set; } = "{}"; // Store question responses
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

**File**: `platform/backend/AiDevRequest.API/Entities/DiscoveryRecommendation.cs`
```csharp
public class DiscoveryRecommendation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QuestionnaireId { get; set; }
    public required string UserId { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string MatchReason { get; set; }
    public required string ExampleUseCase { get; set; }
    public required string DifficultyLevel { get; set; } // "beginner" | "intermediate"
    public int EstimatedHours { get; set; }
    public string ProjectTypeTag { get; set; } = ""; // "web" | "mobile" | "api" | "data"
    public bool IsSelected { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

**Action**: Add `DbSet` entries to `AiDevRequestDbContext`, run migration

---

#### 1.2 Create DiscoveryService
**File**: `platform/backend/AiDevRequest.API/Services/DiscoveryService.cs`

**Interface**:
```csharp
public interface IDiscoveryService
{
    Task<List<DiscoveryRecommendationDto>> GenerateRecommendationsAsync(string userId, QuestionnaireAnswersDto answers);
    Task<DiscoveryQuestionnaireDto> GetQuestionnaireAsync(string userId);
    Task<List<DiscoveryRecommendationDto>> GetSavedRecommendationsAsync(string userId);
}
```

**Key Methods**:
1. `GenerateRecommendationsAsync()` - Uses Claude Sonnet 4.5 via `ModelRouterService`
   - Prompt engineering: Transform interest answers into 3-5 beginner projects
   - Structured output: Parse into recommendation DTOs
   - Store in database for future reference

2. Claude Prompt Template (optimized for personalization):
```
You are a creative software development mentor. A beginner user has answered questions about their interests.

User Profile:
- Hobbies: {hobbies}
- Daily pain points: {painPoints}
- Learning interests: {learningGoals}
- Geographic context: {location}
- Food/culture interests: {foodCulture}

Generate 3-5 software project ideas that:
1. Are genuinely beginner-friendly (achievable in 2-4 hours)
2. Directly relate to their stated interests
3. Solve a real problem or provide genuine value
4. Use modern web technologies (React, TypeScript, simple APIs)

For each project, provide:
- Title (concise, exciting)
- Description (2-3 sentences, plain language)
- Why it matches their interests (personalized reasoning)
- Example use case from their life
- Difficulty (beginner/intermediate)
- Estimated time (hours)
- Project type (web/mobile/api/data)

Format as JSON array.
```

**Service Registration**: Add to `Program.cs` as `Scoped`

---

#### 1.3 Create DiscoveryController
**File**: `platform/backend/AiDevRequest.API/Controllers/DiscoveryController.cs`

**Endpoints**:
```csharp
[ApiController]
[Route("api/discovery")]
public class DiscoveryController : ControllerBase
{
    [HttpPost("questionnaire")]
    [Action(typeof(List<DiscoveryRecommendationDto>))]
    public async Task<List<DiscoveryRecommendationDto>> SubmitQuestionnaire(
        [FromBody] QuestionnaireAnswersDto answers)
    {
        // Generate AI recommendations
        return await _discoveryService.GenerateRecommendationsAsync(GetUserId(), answers);
    }

    [HttpGet("recommendations")]
    public async Task<List<DiscoveryRecommendationDto>> GetRecommendations()
    {
        return await _discoveryService.GetSavedRecommendationsAsync(GetUserId());
    }
}
```

**DTOs**:
```csharp
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
```

---

### Phase 2: Frontend Implementation

#### 2.1 Create Discovery Wizard Page
**File**: `platform/frontend/src/pages/DiscoveryWizardPage.tsx`

**Structure**:
- Multi-step form with 5 questions (one per step)
- Progress bar showing current step (e.g., "Step 2 of 5")
- Navigation: Previous/Next buttons
- Final step: Submit → API call → Show recommendations

**Questions**:
1. "What do you enjoy doing in your free time?" (hobbies)
2. "What's something you wish was easier in your daily life?" (pain points)
3. "What topics do you love learning about?" (learning goals)
4. "Where do you live or want to explore?" (location)
5. "What's your favorite cuisine or food activity?" (food/culture)

**State Management**:
```typescript
const [currentStep, setCurrentStep] = useState(0);
const [answers, setAnswers] = useState<QuestionnaireAnswers>({
  hobbies: '',
  painPoints: '',
  learningGoals: '',
  location: '',
  foodCulture: '',
});
const { execute: submitQuestionnaire, isLoading, data: recommendations } =
  useAction<DiscoveryRecommendation[]>('/api/discovery/questionnaire');
```

**UI Pattern** (from OnboardingPage reference):
- Use existing `bg-warm-900 rounded-lg p-6` containers
- Progress bar with percentage
- Transition animations with Framer Motion
- Error handling with error state display

---

#### 2.2 Create Recommendation Results Page
**File**: `platform/frontend/src/pages/DiscoveryResultsPage.tsx` (or embed in wizard)

**Recommendation Card** (shadcn/ui Card):
```tsx
<Card className="p-6 space-y-4 hover:border-blue-500 transition-colors">
  <div className="flex items-start justify-between">
    <div>
      <h3 className="text-xl font-bold">{rec.title}</h3>
      <Badge variant={rec.difficultyLevel === 'beginner' ? 'success' : 'warning'}>
        {rec.difficultyLevel.toUpperCase()}
      </Badge>
    </div>
    <div className="text-sm text-warm-400">
      ⏱️ {rec.estimatedHours}h
    </div>
  </div>

  <p className="text-warm-300">{rec.description}</p>

  <div className="bg-warm-800/50 rounded p-3">
    <p className="text-sm font-medium text-blue-400">Why this matches:</p>
    <p className="text-sm text-warm-400">{rec.matchReason}</p>
  </div>

  <div className="bg-warm-800/50 rounded p-3">
    <p className="text-sm font-medium text-green-400">Example use case:</p>
    <p className="text-sm text-warm-400">{rec.exampleUseCase}</p>
  </div>

  <Button onClick={() => handleStartBuilding(rec)} className="w-full">
    Start Building →
  </Button>
</Card>
```

**CTA Flow**: `handleStartBuilding()` navigates to `/requests/new` with pre-populated description from recommendation

---

#### 2.3 Create API Module
**File**: `platform/frontend/src/api/discovery.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL;

export interface QuestionnaireAnswers {
  hobbies: string;
  painPoints: string;
  learningGoals: string;
  location: string;
  foodCulture: string;
}

export interface DiscoveryRecommendation {
  id: string;
  title: string;
  description: string;
  matchReason: string;
  exampleUseCase: string;
  difficultyLevel: 'beginner' | 'intermediate';
  estimatedHours: number;
  projectTypeTag: string;
}

export async function submitQuestionnaire(answers: QuestionnaireAnswers): Promise<DiscoveryRecommendation[]> {
  const res = await authFetch(`${API_URL}/api/discovery/questionnaire`, {
    method: 'POST',
    body: JSON.stringify(answers),
  });
  return res.json();
}

export async function getRecommendations(): Promise<DiscoveryRecommendation[]> {
  const res = await authFetch(`${API_URL}/api/discovery/recommendations`);
  return res.json();
}
```

---

#### 2.4 Update Navigation & Homepage
**Files**:
- `platform/frontend/src/App.tsx` - Add route: `<Route path="/onboarding/discovery" element={<DiscoveryWizardPage />} />`
- `platform/frontend/src/pages/HomePage.tsx` - Add CTA button:
  ```tsx
  <Button variant="outline" onClick={() => navigate('/onboarding/discovery')}>
    Not sure what to build? Try Discovery Wizard ✨
  </Button>
  ```

---

#### 2.5 Add Translations (i18n)
**Files**:
- `platform/frontend/src/locales/en/translation.json`
- `platform/frontend/src/locales/ko/translation.json`

**Keys**:
```json
{
  "discovery": {
    "title": "Discover Your Perfect Project",
    "subtitle": "Answer a few questions to get personalized project ideas",
    "step": "Step {{current}} of {{total}}",
    "questions": {
      "hobbies": "What do you enjoy doing in your free time?",
      "painPoints": "What's something you wish was easier in your daily life?",
      "learningGoals": "What topics do you love learning about?",
      "location": "Where do you live or want to explore?",
      "foodCulture": "What's your favorite cuisine or food activity?"
    },
    "results": {
      "title": "We Found {{count}} Perfect Projects for You!",
      "matchReason": "Why this matches",
      "exampleUseCase": "Example use case",
      "difficulty": "Difficulty",
      "estimatedTime": "Estimated time"
    },
    "buttons": {
      "next": "Next",
      "previous": "Previous",
      "submit": "Show Recommendations",
      "startBuilding": "Start Building"
    }
  }
}
```

**Korean translations** (from original request context):
```json
{
  "discovery": {
    "title": "완벽한 프로젝트 찾기",
    "subtitle": "몇 가지 질문에 답하고 맞춤형 프로젝트 아이디어를 받아보세요",
    "step": "{{current}} / {{total}} 단계",
    "questions": {
      "hobbies": "여가 시간에 무엇을 즐기시나요?",
      "painPoints": "일상 생활에서 더 쉬워졌으면 하는 것이 있나요?",
      "learningGoals": "어떤 주제에 대해 배우는 것을 좋아하시나요?",
      "location": "어디에 살고 계시거나 탐험하고 싶으신가요?",
      "foodCulture": "좋아하는 요리나 음식 활동이 있나요?"
    },
    "results": {
      "title": "당신에게 딱 맞는 {{count}}개의 프로젝트를 찾았습니다!",
      "matchReason": "이 프로젝트가 맞는 이유",
      "exampleUseCase": "예시 사용 사례",
      "difficulty": "난이도",
      "estimatedTime": "예상 소요 시간"
    },
    "buttons": {
      "next": "다음",
      "previous": "이전",
      "submit": "추천 프로젝트 보기",
      "startBuilding": "만들기 시작"
    }
  }
}
```

---

### Phase 3: Testing

#### 3.1 Backend Unit Tests
**File**: `platform/backend/AiDevRequest.Tests/Services/DiscoveryServiceTests.cs`

**Test Cases**:
- `GenerateRecommendations_WithValidAnswers_ReturnsRecommendations()`
- `GenerateRecommendations_WithKoreanCuisineInterest_ReturnsKoreanFoodApp()`
- `GenerateRecommendations_WithHikingInterest_ReturnsTrailFinderApp()`
- `GetSavedRecommendations_ReturnsUserRecommendations()`

**File**: `platform/backend/AiDevRequest.Tests/Controllers/DiscoveryControllerTests.cs`

---

#### 3.2 Frontend Unit Tests
**File**: `platform/frontend/src/pages/DiscoveryWizardPage.test.tsx`

**Test Cases**:
- Renders question form
- Navigation between steps works
- Submit button appears on final step
- API call triggered on submit

---

#### 3.3 E2E Tests
**File**: `platform/frontend/e2e/discovery-wizard.spec.ts`

**Scenarios**:
```typescript
test('complete discovery wizard flow', async ({ page }) => {
  await page.goto('/onboarding/discovery');

  // Step 1: Hobbies
  await page.fill('[name="hobbies"]', 'cooking Korean food');
  await page.click('text=Next');

  // ... (repeat for all steps)

  // Submit and verify recommendations
  await page.click('text=Show Recommendations');
  await expect(page.locator('.recommendation-card')).toHaveCount(3);

  // Click "Start Building" on first recommendation
  await page.locator('.recommendation-card').first().click('text=Start Building');
  await expect(page).toHaveURL(/\/requests\/new/);
});
```

---

### Phase 4: Integration & Polish

#### 4.1 Integration with RequestsController
When user clicks "Start Building" on a recommendation:
1. Navigate to `/requests/new` with query param: `?recommendationId={id}`
2. Pre-populate the request description field with recommendation details
3. Store `recommendationId` reference in `DevRequest` entity (optional FK)

**Update**: `platform/frontend/src/pages/NewRequestPage.tsx`
```typescript
const searchParams = new URLSearchParams(location.search);
const recommendationId = searchParams.get('recommendationId');

useEffect(() => {
  if (recommendationId) {
    loadRecommendationAndPopulate(recommendationId);
  }
}, [recommendationId]);
```

---

#### 4.2 UI Polish
- Add Framer Motion transitions between wizard steps
- Add celebration animation on recommendations reveal
- Add empty state if no recommendations generated
- Add "Try Again" button to restart wizard

---

## Database Migration

**Commands**:
```bash
cd platform/backend/AiDevRequest.API
dotnet ef migrations add AddDiscoveryFeature
```

**Migration will create**:
- `DiscoveryQuestionnaires` table
- `DiscoveryRecommendations` table

---

## Cost Optimization

**Claude API Usage**:
- Single API call per questionnaire submission
- Use Sonnet 4.5 (mid-tier) via `ModelRouterService`
- Batch all 5 questions into one prompt (not 5 separate calls)
- Estimated: ~1,000 tokens input + 1,500 tokens output = ~$0.01 per submission

**Caching Strategy**:
- Store recommendations in database
- `GetRecommendations()` endpoint returns cached results
- Only regenerate on explicit "Refresh" action

---

## Success Metrics

**Completion Criteria**:
- [ ] Backend: DiscoveryController + DiscoveryService implemented
- [ ] Frontend: Multi-step wizard with 5 questions
- [ ] Frontend: Recommendation results page with cards
- [ ] Integration: "Start Building" CTA auto-populates request form
- [ ] Tests: 80%+ coverage for new code
- [ ] E2E: Full wizard flow test passes
- [ ] i18n: English and Korean translations added

**Quality Checks**:
- [ ] Recommendations feel personalized (not generic)
- [ ] Projects are beginner-friendly
- [ ] UI feels encouraging and celebratory
- [ ] Response time < 3 seconds for recommendation generation

---

## Timeline Estimate

| Phase | Estimated Time |
|-------|---------------|
| Backend (entities, service, controller) | 3-4 hours |
| Frontend (wizard page, results page) | 4-5 hours |
| API integration + routing | 1-2 hours |
| Testing (unit + E2E) | 2-3 hours |
| Polish + translations | 1-2 hours |
| **Total** | **11-16 hours** |

---

## Next Steps

1. **Spawn `backend-dev` agent**: Implement Phase 1 (backend foundation)
2. **Spawn `frontend-dev` agent**: Implement Phase 2 (frontend wizard)
3. **Spawn `unit-test-analyst` agent**: Add unit tests for both layers
4. **Spawn `e2e-test-analyst` agent**: Add E2E test for full flow
5. **Spawn `tester` agent**: Run full test suite
6. **Final review**: Commit, push, create PR

---

## References

- Existing pattern: `OnboardingController.cs`, `OnboardingPage.tsx`
- AI integration: `ModelRouterService.cs`, `AnalysisService.cs`
- Recommendation system: `RecommendationController.cs`, `AppRecommendation.cs`
- Conventions: `.claude/conventions.md`
- Inventory: `.claude/inventory.md` (avoid duplicates)

---

**Plan created by**: planner agent
**Branch**: `538-interest-discovery-wizard`
**Status**: Ready for implementation

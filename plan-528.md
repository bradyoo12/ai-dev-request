## Implementation Plan: Chat-Based Iterative Code Refinement (#528)

### Overview
This feature adds conversational chat interface for iterating on generated projects after initial code generation. Users can refine their app through natural language (e.g., "Make the header sticky", "Add a login page", "Change the color scheme to dark blue").

### Architecture

#### 1. Backend Implementation

**New Entity: `RefinementMessage`** (Already exists per inventory.md)
```csharp
// Entity already defined - verify structure:
// - Id (Guid)
// - DevRequestId (Guid, FK to DevRequest)
// - UserId (string)
// - Role (user/assistant)
// - Content (text)
// - FileChangesJson (jsonb) - which files were changed
// - CreatedAt (DateTime)
```

**New Endpoint: `/api/dev-request/{id}/iterate`**
- Controller: Extend existing `RefinementController` (already exists per inventory.md)
- Service: Use existing `RefinementService` (already exists per inventory.md)
- Methods to implement:
  - `POST /api/dev-request/{id}/iterate` - Send chat message, get file changes
  - `GET /api/dev-request/{id}/chat-history` - Retrieve conversation history
  - `POST /api/dev-request/{id}/iterate/undo` - Undo last iteration
  - `GET /api/dev-request/{id}/iterate/diff` - Get diff preview before applying

**Service Layer: `RefinementService`**
- `SendMessageAsync(Guid devRequestId, string userMessage)` - Main iteration method
  - Load project context (all generated files)
  - Retrieve chat history from `RefinementMessage` table
  - Build Claude API prompt with full project context + chat history
  - Call Claude API (use Sonnet 4.5 via `ModelRouterService`)
  - Parse response for file changes
  - Apply changes atomically to project files
  - Store chat message + file changes in `RefinementMessage`
  - Return updated file list + diff preview
- `GetChatHistoryAsync(Guid devRequestId)` - Retrieve conversation
- `UndoLastIterationAsync(Guid devRequestId)` - Rollback last change
- `GetDiffPreviewAsync(Guid devRequestId, string message)` - Preview without applying

**Integration Points:**
- Use existing `ProjectVersionService` for snapshots before each iteration
- Use existing `FileGenerationService` for file manifest updates
- Use existing `CompilerValidationService` for post-iteration validation
- Use existing `ModelRouterService` for AI model selection

#### 2. Frontend Implementation

**New Page: `ChatRefinementPage`** (or extend `RefinementChat` component)
- Path: `/sites/{siteId}/refine` or `/requests/{id}/refine`
- Layout: Split view - Chat | Code Editor | Live Preview

**Components to create:**
```
src/components/refinement/
  ├── ChatPanel.tsx          - Chat interface with message history
  ├── CodeEditorPanel.tsx    - Monaco editor with file tabs
  ├── LivePreviewPanel.tsx   - Live preview iframe
  ├── DiffViewer.tsx         - Side-by-side diff view
  ├── FileChangeIndicator.tsx - Shows which files changed per message
  └── IterationHistory.tsx   - Timeline of iterations with undo
```

**API Module: `refinement.ts`** (already exists per inventory.md - extend it)
```typescript
export const sendRefinementMessage = async (devRequestId: string, message: string) => {
  return authFetch(`${API_URL}/api/dev-request/${devRequestId}/iterate`, {
    method: 'POST',
    body: JSON.stringify({ message })
  });
};

export const getChatHistory = async (devRequestId: string) => {
  return authFetch(`${API_URL}/api/dev-request/${devRequestId}/chat-history`);
};

export const undoLastIteration = async (devRequestId: string) => {
  return authFetch(`${API_URL}/api/dev-request/${devRequestId}/iterate/undo`, {
    method: 'POST'
  });
};

export const getDiffPreview = async (devRequestId: string, message: string) => {
  return authFetch(`${API_URL}/api/dev-request/${devRequestId}/iterate/diff`, {
    method: 'POST',
    body: JSON.stringify({ message })
  });
};
```

**State Management:**
- Use `useState` for chat messages, file changes, diff preview
- Use `useEffect` to load chat history on mount
- Real-time updates via optimistic UI (add message immediately, update with response)

**UX Flow:**
1. User types message in chat input
2. Show "typing" indicator
3. Send message to backend
4. Backend returns file changes + diff
5. Show diff preview modal with "Accept" / "Revert" buttons
6. On accept: apply changes, update code editor, update live preview
7. On revert: discard changes, keep previous state
8. Append message to chat history with file change indicators

#### 3. AI Context Management

**Project Context Building:**
- Load all generated files from project directory
- Include file tree structure
- Send to Claude API as context
- Use existing `OrganizationalMemoryController` + `MemoryRetrievalService` for learning user preferences

**Prompt Structure:**
```
You are an AI assistant helping refine a generated project.

Project Context:
- File Tree: [tree structure]
- File Contents: [all files]
- Chat History: [previous messages]

User Request: "{user message}"

Generate targeted file changes in JSON format:
{
  "changes": [
    {
      "file": "src/App.tsx",
      "operation": "modify",
      "diff": "...",
      "explanation": "Made header sticky with position: sticky"
    }
  ]
}
```

**Memory Integration:**
- Store user preferences in `OrganizationalMemory` table (already exists)
- Retrieve relevant memories before each iteration
- Example: "User prefers Tailwind over CSS modules", "User likes dark themes"

#### 4. Database Schema

**Existing Tables (verify in migration):**
- `RefinementMessages` (main chat history)
- `ProjectVersions` (snapshots for undo)
- `OrganizationalMemory` (user preferences)

**New Migration (if needed):**
```csharp
dotnet ef migrations add AddChatRefinement
```

#### 5. Testing Strategy

**Backend Unit Tests:**
```csharp
// AiDevRequest.Tests/Services/RefinementServiceTests.cs
- SendMessageAsync_ShouldReturnFileChanges
- SendMessageAsync_ShouldStoreInDatabase
- UndoLastIteration_ShouldRevertChanges
- GetDiffPreview_ShouldNotApplyChanges
```

**Frontend E2E Tests:**
```typescript
// platform/frontend/e2e/chat-refinement.spec.ts
test('user can refine project via chat', async ({ page }) => {
  await page.goto('/sites/test-site/refine');
  await page.fill('[data-testid="chat-input"]', 'Make the header blue');
  await page.click('[data-testid="send-button"]');
  await expect(page.locator('[data-testid="diff-modal"]')).toBeVisible();
  await page.click('[data-testid="accept-button"]');
  await expect(page.locator('.header')).toHaveCSS('background-color', 'rgb(0, 0, 255)');
});
```

### Implementation Phases

**Phase 1: Backend Foundation** (backend-dev agent)
1. Verify/extend `RefinementMessage` entity
2. Implement `RefinementService` methods
3. Add endpoints to `RefinementController`
4. Integrate with `ProjectVersionService` for snapshots
5. Write unit tests

**Phase 2: Frontend UI** (frontend-dev agent)
1. Create chat panel component
2. Create code editor panel with Monaco
3. Create live preview panel
4. Implement diff viewer
5. Wire up API calls
6. Add routing

**Phase 3: AI Integration** (backend-dev agent)
1. Build project context loader
2. Implement Claude API prompt with full context
3. Parse AI response for file changes
4. Integrate organizational memory for preferences
5. Test with real projects

**Phase 4: Testing** (unit-test-analyst, e2e-test-analyst, tester)
1. Backend unit tests (xUnit)
2. Frontend unit tests (Vitest)
3. E2E tests (Playwright)
4. Manual testing of full flow

### Acceptance Criteria

- [ ] User can open chat refinement view from any generated project
- [ ] Chat interface displays message history
- [ ] User can send natural language requests (e.g., "Make header sticky")
- [ ] AI generates targeted file changes with explanations
- [ ] Diff preview modal shows before/after code side-by-side
- [ ] User can accept or revert changes
- [ ] Code editor updates in real-time
- [ ] Live preview updates after accepting changes
- [ ] Undo/redo support for iterations
- [ ] Chat history persists across sessions
- [ ] File change indicators show which files were modified per message
- [ ] Integration with organizational memory for learning preferences
- [ ] Unit tests pass (backend + frontend)
- [ ] E2E tests pass
- [ ] Works with React, Vue, and .NET project types

### Dependencies

- Claude API (Anthropic SDK 5.9) - already integrated
- Monaco Editor for code editing - need to add `@monaco-editor/react`
- Diff library for side-by-side view - use `react-diff-viewer-continued`
- Existing services: `ProjectVersionService`, `FileGenerationService`, `ModelRouterService`, `OrganizationalMemoryController`

### Estimated Effort

- Backend: ~2 days
- Frontend: ~3 days
- AI Integration: ~1 day
- Testing: ~1 day
- **Total**: ~7 days

### Notes

- Follow existing patterns in `ComponentPreviewPage` for chat iteration UI
- Reuse `ProjectVersionService` for undo/redo (already has snapshot logic)
- Use existing `RefinementService` and `RefinementController` as starting point
- Model routing: Use Sonnet 4.5 for iterations (balance cost/quality)
- Consider rate limiting per user to prevent abuse
- Add telemetry via `AnalyticsDashboardService` to track iteration usage

---

**Next Steps:**
1. Create feature branch: `528-chat-based-iterative-code-refinement`
2. Spawn backend-dev and frontend-dev agents
3. Coordinate parallel implementation
4. Run test suite after both complete
5. Create PR for review

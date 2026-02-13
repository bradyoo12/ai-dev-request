# Coding Conventions & Patterns

Quick reference for how to write code that fits this project.

## File Placement

| What | Where | Example |
|------|-------|---------|
| Controller | `Controllers/{Name}Controller.cs` | `Controllers/FooController.cs` |
| Service | `Services/{Name}Service.cs` | `Services/FooService.cs` |
| Service Interface | Inline in service file or separate `I{Name}Service.cs` | `IFooService` |
| Entity | `Entities/{Name}.cs` | `Entities/Foo.cs` |
| DTO | `DTOs/RequestDTOs.cs` (shared) or inline | — |
| Migration | `Data/Migrations/` (auto-generated) | `dotnet ef migrations add AddFoo` |
| Frontend Page | `src/pages/{Name}Page.tsx` | `src/pages/FooPage.tsx` |
| Frontend Component | `src/components/{Name}.tsx` | `src/components/FooBar.tsx` |
| API Module | `src/api/{name}.ts` | `src/api/foo.ts` |
| Frontend Action | `src/actions/{name}.ts` | `src/actions/foo.ts` |
| Custom Hook | `src/hooks/use{Name}.ts` | `src/hooks/useFoo.ts` |
| Backend Test | `AiDevRequest.Tests/Controllers/{Name}ControllerTests.cs` | — |
| Backend Service Test | `AiDevRequest.Tests/Services/{Name}ServiceTests.cs` | — |
| Frontend Unit Test | `src/**/*.test.{ts,tsx}` alongside source | — |
| E2E Test | `platform/frontend/e2e/{name}.spec.ts` | `e2e/foo.spec.ts` |
| Locale Files | `src/locales/{lang}/translation.json` | `en`, `ko` |

## Naming Conventions

### Backend (.NET)
- Classes: `PascalCase` — `FooController`, `FooService`, `FooEntity`
- Properties: `PascalCase` — `public string UserName { get; set; }`
- Private fields: `_camelCase` — `private readonly IFooService _fooService;`
- Methods: `PascalCase` — `GetAllAsync()`, `CreateAsync()`
- Interfaces: `I` prefix — `IFooService`
- Namespaces: `AiDevRequest.API.{Folder}` — `AiDevRequest.API.Services`
- Entity IDs: `Guid` with `Guid.NewGuid()` default
- User IDs: `string` (from BradYoo.Core OAuth)

### Frontend (TypeScript/React)
- Components: `PascalCase` — `FooPage`, `BarWidget`
- Files: `PascalCase` for components/pages, `camelCase` for utilities — `FooPage.tsx`, `fooUtils.ts`
- API modules: `kebab-case` — `foo-bar.ts`
- Routes: `kebab-case` — `/settings/foo-bar`
- Hooks: `camelCase` with `use` prefix — `useFoo`
- Constants: `UPPER_SNAKE_CASE`
- CSS classes: Tailwind utility classes

## Backend Patterns

### Controller Pattern
```csharp
[ApiController]
[Route("api/[controller]")]
public class FooController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public FooController(AiDevRequestDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<FooDto>>> GetAll()
    {
        var items = await _db.Foos.Where(...).ToListAsync();
        return Ok(items);
    }
}
```

### Service Registration (Program.cs)
```csharp
// Singleton — stateless, no DB access
builder.Services.AddSingleton<IFooService, FooService>();

// Scoped — per-request, can use DbContext
builder.Services.AddScoped<IFooService, FooService>();
```

### Entity Pattern
```csharp
public class Foo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required] [MaxLength(100)]
    public required string UserId { get; set; }
    // JSON columns use string with Json suffix
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

### DbContext Registration
After creating a new entity:
1. Add `public DbSet<Foo> Foos { get; set; }` to `AiDevRequestDbContext`
2. Run `dotnet ef migrations add AddFoo`

### API Response Format
Standard responses use raw data. For Server Actions pattern:
```json
{ "success": true, "data": {...}, "error": null, "timestamp": "..." }
```

## Frontend Patterns

### Server Actions Pattern (Primary Mutation Pattern)
Reduces boilerplate by 60-80% vs traditional fetch.

**Backend**: Add `[Action]` attribute — middleware wraps response in `ActionResponse<T>`:
```csharp
[HttpPost("create")]
[Action(typeof(FooDto))]
public async Task<FooDto> Create([FromBody] CreateFooDto input)
    => await _service.CreateAsync(input);
```

**Frontend**: Use `useAction` hook:
```typescript
const { execute, isLoading, error, data } = useAction<Foo>('/api/foo/create');
await execute({ name: 'Test' });
```

**Or `createAction` for reusable functions:**
```typescript
export const createFoo = createAction<Foo, CreateFooInput>('/api/foo/create');
const result = await createFoo({ name: 'Test' });
```

**When to use**: Simple mutations, form submissions, data updates.
**When NOT to use**: Streaming (SSE), file uploads, complex orchestration.

**Files**:
- Backend: `Attributes/ActionAttribute.cs`, `Middleware/ActionResultMiddleware.cs`
- Frontend: `hooks/useAction.ts`, `lib/actionClient.ts`, `actions/*.ts`

### Page Component Pattern
```typescript
const FooPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<Foo[]>([]);

  useEffect(() => { loadData(); }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('foo.title')}</h1>
      {/* content */}
    </div>
  );
};
export default FooPage;
```

### Route Registration (App.tsx)
```typescript
const FooPage = lazy(() => import('./pages/FooPage'));
// Inside <Routes>:
<Route path="/settings/foo" element={<FooPage />} />
```

### API Module Pattern
```typescript
const API_URL = import.meta.env.VITE_API_URL;

export async function getFoos(): Promise<Foo[]> {
  const res = await fetch(`${API_URL}/api/foo`);
  return res.json();
}
```

### Auth-Protected API Calls
Use `authFetch` wrapper from `auth.ts` for authenticated endpoints:
```typescript
import { authFetch } from './auth';
const res = await authFetch(`${API_URL}/api/foo`);
```
Auto-handles JWT headers and 401 → login redirect.

## Testing Patterns

### Backend (xUnit + Moq)
```csharp
public class FooServiceTests
{
    private readonly AiDevRequestDbContext _db;
    public FooServiceTests()
    {
        _db = TestDbContextFactory.Create();
    }

    [Fact]
    public async Task Create_ShouldReturnFoo()
    {
        var service = new FooService(_db);
        var result = await service.CreateAsync(new() { Name = "Test" });
        result.Should().NotBeNull();
        result.Name.Should().Be("Test");
    }
}
```

### Frontend E2E (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('foo page loads correctly', async ({ page }) => {
  await page.goto('/settings/foo');
  await expect(page.getByRole('heading', { name: /foo/i })).toBeVisible();
});
```

### Frontend Unit (Vitest + RTL)
```typescript
import { render, screen } from '@testing-library/react';
import FooComponent from './FooComponent';

test('renders foo', () => {
  render(<FooComponent />);
  expect(screen.getByText('Foo')).toBeInTheDocument();
});
```

## Database Conventions

- **Provider**: PostgreSQL via Npgsql
- **ORM**: EF Core 10 with migrations
- **Vector search**: pgvector with HNSW indexing (via EF Core native support)
- **JSON columns**: Store as `string` with `Json` suffix (e.g., `MetadataJson`)
- **Migration naming**: `Add{Feature}` — `dotnet ef migrations add AddFoo`
- **Seed data**: Embedded JSON resources in `Data/SeedData/`
- **Auto-migration**: Applied on startup in `Program.cs`

## i18n

- English and Korean translations in `src/locales/{en,ko}/translation.json`
- Use `useTranslation()` hook: `const { t } = useTranslation()`
- Key format: `{feature}.{element}` — `foo.title`, `foo.description`

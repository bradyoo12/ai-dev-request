# Infrastructure & Deployment

## Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local Dev (Frontend) | http://localhost:5173 | Vite dev server |
| Local Dev (Backend) | http://localhost:5000 | .NET API server |
| Staging (Frontend) | https://icy-desert-07c08ba00.2.azurestaticapps.net | Azure Static Web Apps |
| Staging (Backend) | https://ai-dev-request-api.azurewebsites.net | Azure Web App |
| Production | https://ai-dev-request.kr | Custom domain |

## .NET 10 LTS Preparation

**Status**: Foundation in place, awaiting .NET 10 SDK release (expected November 2025)

**Configuration**:
- `global.json` pins SDK version with `rollForward: "latestMinor"` policy
- Current target framework: `net9.0` (marked with TODO comments for upgrade)
- Native pgvector support ready via EF Core 10 (OrganizationalMemory entity uses JSON embeddings until migration)

**Migration Guide**: See `.claude/dotnet10-upgrade-notes.md` for detailed upgrade steps

**Expected Benefits** (when migrated):
- **100x faster** vector search (500ms → 5ms for 10K vectors)
- **30x memory reduction** (1.5GB → 50MB for vector storage)
- **15% faster** hot paths with JIT inlining improvements
- **50% faster** API startup in containers
- **3-year LTS** support until November 2028

## CI/CD Pipeline

**File**: `.github/workflows/deploy.yml`
**Triggers**: Push to `main`, manual workflow dispatch

### Jobs

#### 1. build-and-deploy-api
- Runner: `ubuntu-latest`
- Steps: Checkout → Setup .NET 10.0.x → Restore → Build (Release) → Publish → Deploy to Azure Web App
- Deployment: `azure/webapps-deploy@v3` with publish profile from secrets
- Working dir: `platform/backend/AiDevRequest.API`

#### 2. build-and-deploy-frontend
- Runner: `ubuntu-latest`
- Steps: Checkout → Setup Node 20 → npm ci → Check for merge conflict markers → npm run build → Deploy to Azure Static Web Apps
- Pre-build check: Scans `platform/frontend/src/locales/*.json` for merge conflict markers (`<<<<<<`, `======`, `>>>>>>`)
- Build env: `VITE_API_URL=https://{AZURE_WEBAPP_NAME_API}.azurewebsites.net`
- Deployment: `Azure/static-web-apps-deploy@v1`
- Working dir: `platform/frontend`

### Workflow Environment Variables
```yaml
DOTNET_VERSION: 10.0.x
NODE_VERSION: 20
AZURE_WEBAPP_NAME_API: ai-dev-request-api
AZURE_WEBAPP_NAME_WEB: ai-dev-request-web
```

## Azure Configuration

| Resource | Type | Details |
|----------|------|---------|
| API Server | Azure Web App | ai-dev-request-api, B1 tier (min), .NET 10 LTS |
| Frontend | Azure Static Web Apps | Auto-deployed from GitHub Actions |
| Database | PostgreSQL Flexible Server | db-bradyoo-staging, database: ai_dev_request |
| Storage | Azure Blob Storage | Generated project artifacts |

**Lesson Learned**: Never use F1 (Free) tier — CPU quota easily exhausted by startup crashes (see b-start.md Lessons Learned).

## Database

### Connection Strategy
- **Development**: `Host=localhost;Database=ai_dev_request;Username=postgres;Password=postgres`
- **Production**: Configured via Azure App Settings (`ConnectionStrings__DefaultConnection`)
- **Tests**: EF Core InMemory provider (isolated per test)

### PostgreSQL + pgvector
- EF Core 10 native vector support with HNSW indexing
- Used for: organizational memory semantic search, template matching
- Embedding dimension: 1536

### Migrations
- Auto-applied on startup (`MigrateAsync()` in Program.cs)
- Generate: `dotnet ef migrations add {Name}` from `platform/backend/AiDevRequest.API/`
- **Never use `EnsureCreatedAsync()`** — always use migrations

### Seed Data
- Translation files: `Data/SeedData/ko.json`, `Data/SeedData/en.json` (embedded resources)
- 6 project templates auto-seeded on startup

## Environment Variables

### Backend (Required in Production)
| Variable | Purpose |
|----------|---------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key |
| `Jwt__Secret` | JWT signing key (min 32 chars) |
| `Jwt__Issuer` | JWT issuer (default: `AiDevRequest`) |
| `Stripe__SecretKey` | Stripe payment API key |
| `Stripe__WebhookSecret` | Stripe webhook signing secret |
| `OAuth__Google__ClientId` | Google OAuth Client ID |
| `OAuth__Google__ClientSecret` | Google OAuth Client Secret |
| `OAuth__Kakao__ClientId` | Kakao REST API Key |
| `OAuth__Kakao__ClientSecret` | Kakao Client Secret (optional but recommended) |
| `OAuth__Apple__ClientId` | Apple Service ID |
| `OAuth__Apple__TeamId` | Apple Team ID |
| `OAuth__Apple__KeyId` | Apple Key ID |
| `OAuth__Apple__PrivateKey` | Apple Private Key (PEM format) |
| `OAuth__Line__ChannelId` | LINE Channel ID |
| `OAuth__Line__ChannelSecret` | LINE Channel Secret |

### Frontend
| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base URL |

### Local Development
- Backend: `appsettings.Development.json` (dev secrets, localhost DB)
- Frontend: `.env.development` (VITE_API_URL=http://localhost:5000)
- Optional: `appsettings.Local.json` (personal overrides, gitignored)

## CORS Configuration

Allowed origins:
- `http://localhost:5173` (Vite dev)
- `http://localhost:3000` (alt)
- `https://icy-desert-07c08ba00.2.azurestaticapps.net` (staging)
- `https://ai-dev-request.kr` (production)

## Health Checks

- Endpoint: `GET /health`
- Checks: PostgreSQL connectivity
- Used by: Azure health probes, deployment verification

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Login (`/api/auth/login`) | 5 requests/min per IP |
| Register (`/api/auth/register`) | 3 requests/hour per IP |

## Authentication

- **Method**: JWT Bearer tokens
- **Providers**: Google, Kakao, Apple, Line OAuth (via BradYoo.Core)
- **Token expiry**: 7 days (dev), configurable
- **Frontend**: Stored in localStorage, sent via `Authorization: Bearer` header
- **Auth wrapper**: `authFetch()` in `src/api/auth.ts` auto-handles JWT + 401 redirect

### OAuth Redirect URIs (Register in Provider Consoles)

**Development**:
- `http://localhost:5173/auth/callback/{provider}`

**Staging**:
- `https://icy-desert-07c08ba00.2.azurestaticapps.net/auth/callback/{provider}`

**Production**:
- `https://ai-dev-request.kr/auth/callback/{provider}`

Replace `{provider}` with: `google`, `kakao`, `apple`, or `line`

### Kakao OAuth Setup

1. Go to [Kakao Developers Console](https://developers.kakao.com)
2. Create/select your app
3. **Web Platform**: Add redirect URIs (see above)
4. **Kakao Login**: Activate
5. **Consent Items**: Enable `profile_nickname`, `profile_image` (required), `account_email` (optional, needs business verification)
6. **Security**: Get REST API Key (Client ID) from App Settings → App Keys
7. **Client Secret**: Enable in Security → Client Secret (recommended for production)

## BradYoo.Core Dependency

Shared infrastructure library referenced via project reference:
```xml
<ProjectReference Include="..\..\bradyoo-core\packages\core-backend\src\BradYoo.Core\BradYoo.Core.csproj" />
```

Provides:
- **Auth**: Google/Kakao OAuth, JWT infrastructure
- **AI**: Claude API client wrapper
- **Data**: Base DbContext, shared entities

**Impact**: Changes to bradyoo-core may affect this project. Always test after core updates.

## Docker

**Dockerfile**: `platform/backend/AiDevRequest.API/Dockerfile`
- Multi-stage build: aspnet:9.0 (base) → sdk:9.0 (build) → publish → final
- Port: 8080
- Entry: `dotnet AiDevRequest.API.dll`

## Alternative Deployment (Render.com)

**Blueprint**: `render.yaml`
- Backend: Docker web service with health check at `/health`
- Frontend: Static site from `platform/frontend/dist`
- Database: PostgreSQL Flexible Server (free plan)

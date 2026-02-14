## Original Request

왜 카카오 로그인 버튼이 없어졌냐... (Why did the Kakao login button disappear...)

**User Follow-up**: 한참 있으니 나오긴 하네 (It does appear after a while)

## Problem Statement

The login page has multiple OAuth-related UX issues:

1. **Unconfigured providers showing errors**: Social login buttons appear for ALL providers (Google, Apple, Kakao, LINE), but when OAuth credentials are not configured in the deployment environment, the frontend displays error messages like `google_oauth_not_configured` instead of hiding those providers entirely.

2. **Slow provider button rendering**: The social login buttons take a long time to appear ("한참 있으니" = after a while), causing poor UX and potential confusion about whether Kakao login is available.

3. **Provider filtering not implemented**: The `/api/auth/providers` endpoint (via `SocialAuthService.GetOrderedProviders`) returns ALL providers regardless of configuration status. Recent commits (#661, #614) added 503 error handling when providers aren't configured, but the providers list endpoint doesn't filter based on this.

## Current Behavior

- Frontend calls `/api/auth/providers` which returns `["kakao", "google", "apple", "line"]` for Korean users
- Frontend renders buttons for all returned providers
- When user clicks on an unconfigured provider OR when the page tries to pre-fetch auth URLs, a 503 error is returned
- Error messages are displayed to users (`google_oauth_not_configured`)
- Buttons appear slowly, causing users to think features are missing

## Expected Behavior

- `/api/auth/providers` endpoint should **only return providers that are properly configured** (i.e., have required OAuth credentials in configuration)
- Unconfigured providers should not appear in the UI at all
- No error messages should be shown for providers that don't have buttons
- Buttons should appear immediately on page load

## Success Criteria

1. ✅ `GetOrderedProviders` filters out providers missing required OAuth config (ClientId/ClientSecret/etc.)
2. ✅ Frontend only displays buttons for providers returned by the API
3. ✅ No `*_oauth_not_configured` error messages appear on login page
4. ✅ Social login buttons render immediately without delay
5. ✅ Existing provider ordering logic (geo-based) still works for configured providers
6. ✅ Unit tests updated to verify filtering behavior

## Implementation Guidance

### Backend Changes

**File**: `platform/backend/AiDevRequest.API/Services/SocialAuthService.cs`

In `GetOrderedProviders()` method:
1. Get the ordered provider list based on language (existing logic)
2. **Filter the list** to only include providers with valid configuration:
   - Check if required config keys exist and are non-empty
   - Google: `OAuth:Google:ClientId` AND `OAuth:Google:ClientSecret`
   - Kakao: `OAuth:Kakao:ClientId`
   - LINE: `OAuth:Line:ChannelId` AND `OAuth:Line:ChannelSecret`
   - Apple: `OAuth:Apple:ClientId` AND `OAuth:Apple:TeamId` AND `OAuth:Apple:KeyId` AND `OAuth:Apple:PrivateKey`
3. Return only the configured providers in the original geo-ordered sequence

Example:
```csharp
public string[] GetOrderedProviders(string? acceptLanguage)
{
    var ordered = /* existing geo-ordering logic */;

    return ordered
        .Where(provider => IsProviderConfigured(provider))
        .ToArray();
}

private bool IsProviderConfigured(string provider)
{
    return provider.ToLower() switch
    {
        "google" => !string.IsNullOrEmpty(_configuration["OAuth:Google:ClientId"])
                    && !string.IsNullOrEmpty(_configuration["OAuth:Google:ClientSecret"]),
        "kakao" => !string.IsNullOrEmpty(_configuration["OAuth:Kakao:ClientId"]),
        "line" => !string.IsNullOrEmpty(_configuration["OAuth:Line:ChannelId"])
                  && !string.IsNullOrEmpty(_configuration["OAuth:Line:ChannelSecret"]),
        "apple" => !string.IsNullOrEmpty(_configuration["OAuth:Apple:ClientId"])
                   && !string.IsNullOrEmpty(_configuration["OAuth:Apple:TeamId"])
                   && !string.IsNullOrEmpty(_configuration["OAuth:Apple:KeyId"])
                   && !string.IsNullOrEmpty(_configuration["OAuth:Apple:PrivateKey"]),
        _ => false
    };
}
```

### Frontend Changes (if needed)

**File**: `platform/frontend/src/api/auth.ts`

Line 158 - Update fallback to only include Google (most universally available):
```typescript
if (!response.ok) return ['google'] // Instead of all providers
```

### Testing Updates

**File**: `platform/backend/AiDevRequest.Tests/Services/SocialAuthServiceTests.cs`

Add tests:
- `GetOrderedProviders_FiltersOutUnconfiguredProviders()` - verify providers without config are excluded
- `GetOrderedProviders_IncludesOnlyConfiguredProviders()` - verify only configured providers appear
- `GetOrderedProviders_MaintainsGeoOrdering()` - verify filtering preserves original order

**File**: `platform/backend/AiDevRequest.Tests/Controllers/AuthControllerTests.cs`

Update existing test at line 351-362 to use mock configuration that filters providers appropriately.

## Performance Investigation

Investigate why social login buttons render slowly:
- Check if `getProviders()` API call has network latency
- Check if there are multiple sequential API calls blocking render
- Consider adding loading state while fetching providers
- Verify frontend isn't pre-fetching auth URLs on mount (this could cause slow 503 errors)

## Out of Scope

- Changing the geo-based provider ordering algorithm
- Adding new OAuth providers
- Modifying the OAuth error response format (already fixed in #661)
- Backend configuration management (assume config is set via environment variables)

## Dependencies

- None (this is a self-contained fix)

## Related Issues

- #661: OAuth 503 error handling (already implemented)
- #614: OAuth provider config validation (already implemented)
- #516: Kakao OAuth login fixes
- #403: Kakao OAuth 400 error

## Visual Evidence

**Initial State** (first screenshot from user):
- Login page shows only "로그인" and "회원가입" buttons
- Email/password form visible
- Social login buttons not yet loaded
- Network tab shows page is still loading resources

**After Delay** (second screenshot from user):
- Kakao button appears (yellow: "Kakao로 계속하기")
- Google, Apple, LINE buttons also visible
- Red error message displayed: `google_oauth_not_configured`
- Network tab shows 503 errors for unconfigured providers

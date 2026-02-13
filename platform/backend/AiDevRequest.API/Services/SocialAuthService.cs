using System.Net.Http.Headers;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISocialAuthService
{
    Task<(User User, string Token)> SocialLoginAsync(string provider, string code, string redirectUri, string? anonymousUserId);
    string GetAuthorizationUrl(string provider, string redirectUri, string state);
    string[] GetOrderedProviders(string? acceptLanguage);
}

public class SocialAuthService : ISocialAuthService
{
    private readonly AiDevRequestDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IAuthService _authService;
    private readonly ILogger<SocialAuthService> _logger;

    private static readonly Dictionary<string, string[]> ProviderOrderByCountry = new()
    {
        ["KR"] = ["kakao", "google", "apple", "line"],
        ["JP"] = ["line", "google", "apple", "kakao"],
        ["US"] = ["google", "apple", "line", "kakao"],
        ["GB"] = ["google", "apple", "kakao", "line"],
        ["DE"] = ["google", "apple", "kakao", "line"],
        ["FR"] = ["google", "apple", "kakao", "line"],
        ["TH"] = ["google", "line", "apple", "kakao"],
        ["TW"] = ["google", "line", "apple", "kakao"],
        ["ID"] = ["google", "line", "apple", "kakao"],
    };

    private static readonly string[] DefaultOrder = ["google", "apple", "kakao", "line"];

    public SocialAuthService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        IAuthService authService,
        ILogger<SocialAuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _authService = authService;
        _logger = logger;
    }

    public async Task<(User User, string Token)> SocialLoginAsync(string provider, string code, string redirectUri, string? anonymousUserId)
    {
        var userInfo = provider.ToLower() switch
        {
            "google" => await ExchangeGoogleCodeAsync(code, redirectUri),
            "kakao" => await ExchangeKakaoCodeAsync(code, redirectUri),
            "line" => await ExchangeLineCodeAsync(code, redirectUri),
            "apple" => await ExchangeAppleCodeAsync(code, redirectUri),
            _ => throw new ArgumentException($"Unknown provider: {provider}")
        };

        var user = await FindOrCreateUserAsync(provider.ToLower(), userInfo, anonymousUserId);

        user.LastLoginAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var token = _authService.GenerateJwt(user);
        _logger.LogInformation("Social login via {Provider} for {Email}", provider, user.Email);

        return (user, token);
    }

    public string GetAuthorizationUrl(string provider, string redirectUri, string state)
    {
        return provider.ToLower() switch
        {
            "google" => BuildGoogleAuthUrl(redirectUri, state),
            "kakao" => BuildKakaoAuthUrl(redirectUri, state),
            "line" => BuildLineAuthUrl(redirectUri, state),
            "apple" => BuildAppleAuthUrl(redirectUri, state),
            _ => throw new ArgumentException($"Unknown provider: {provider}")
        };
    }

    public string[] GetOrderedProviders(string? acceptLanguage)
    {
        if (string.IsNullOrEmpty(acceptLanguage))
            return DefaultOrder;

        // Parse Accept-Language to detect country
        // e.g., "ko-KR,ko;q=0.9,en-US;q=0.8" → KR
        var parts = acceptLanguage.Split(',');
        foreach (var part in parts)
        {
            var lang = part.Split(';')[0].Trim();
            if (lang.Contains('-'))
            {
                var country = lang.Split('-')[1].ToUpper();
                if (ProviderOrderByCountry.TryGetValue(country, out var order))
                    return order;
            }
            // Map language-only codes
            var langCode = lang.ToLower();
            if (langCode == "ko" && ProviderOrderByCountry.TryGetValue("KR", out var krOrder)) return krOrder;
            if (langCode == "ja" && ProviderOrderByCountry.TryGetValue("JP", out var jpOrder)) return jpOrder;
        }

        return DefaultOrder;
    }

    private async Task<SocialUserInfo> ExchangeGoogleCodeAsync(string code, string redirectUri)
    {
        var clientId = _configuration["OAuth:Google:ClientId"] ?? throw new InvalidOperationException("Google ClientId not configured");
        var clientSecret = _configuration["OAuth:Google:ClientSecret"] ?? throw new InvalidOperationException("Google ClientSecret not configured");

        var client = _httpClientFactory.CreateClient();

        // Exchange code for tokens
        var tokenResponse = await client.PostAsync("https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret,
                ["redirect_uri"] = redirectUri,
                ["grant_type"] = "authorization_code"
            }));

        var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
        if (!tokenResponse.IsSuccessStatusCode)
            throw new InvalidOperationException($"Google token exchange failed: {tokenJson}");

        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenJson);
        var accessToken = tokenData.GetProperty("access_token").GetString()!;

        // Get user info
        var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v2/userinfo");
        userInfoRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var userInfoResponse = await client.SendAsync(userInfoRequest);
        var userInfoJson = await userInfoResponse.Content.ReadAsStringAsync();
        var userInfo = JsonSerializer.Deserialize<JsonElement>(userInfoJson);

        return new SocialUserInfo
        {
            ProviderId = userInfo.GetProperty("id").GetString()!,
            Email = userInfo.GetProperty("email").GetString()!,
            Name = userInfo.TryGetProperty("name", out var name) ? name.GetString() : null,
            Picture = userInfo.TryGetProperty("picture", out var pic) ? pic.GetString() : null
        };
    }

    private async Task<SocialUserInfo> ExchangeKakaoCodeAsync(string code, string redirectUri)
    {
        var clientId = _configuration["OAuth:Kakao:ClientId"] ?? throw new InvalidOperationException("Kakao ClientId not configured");
        var clientSecret = _configuration["OAuth:Kakao:ClientSecret"];

        if (string.IsNullOrEmpty(clientSecret))
        {
            _logger.LogWarning("Kakao ClientSecret is not configured. Kakao requires client_secret by default — token exchange may fail.");
        }

        var client = _httpClientFactory.CreateClient();

        // Exchange code for tokens
        // Kakao requires Content-Type: application/x-www-form-urlencoded;charset=utf-8
        var tokenParams = new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["client_id"] = clientId,
            ["redirect_uri"] = redirectUri,
            ["code"] = code
        };
        if (!string.IsNullOrEmpty(clientSecret))
            tokenParams["client_secret"] = clientSecret;

        _logger.LogInformation("Kakao OAuth token exchange - RedirectUri: {RedirectUri}, ClientId: {ClientId}, HasClientSecret: {HasClientSecret}",
            redirectUri, clientId, !string.IsNullOrEmpty(clientSecret));

        var tokenContent = new FormUrlEncodedContent(tokenParams);
        tokenContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-www-form-urlencoded") { CharSet = "utf-8" };
        var tokenResponse = await client.PostAsync("https://kauth.kakao.com/oauth/token", tokenContent);

        var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
        if (!tokenResponse.IsSuccessStatusCode)
        {
            _logger.LogError("Kakao token exchange failed - Status: {StatusCode}, Response: {Response}, RedirectUri: {RedirectUri}",
                (int)tokenResponse.StatusCode, tokenJson, redirectUri);
            throw new InvalidOperationException($"Kakao token exchange failed (HTTP {(int)tokenResponse.StatusCode}): {tokenJson}");
        }

        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenJson);
        var accessToken = tokenData.GetProperty("access_token").GetString()!;

        _logger.LogInformation("Kakao OAuth token exchange successful - AccessToken received");

        // Get user info
        var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, "https://kapi.kakao.com/v2/user/me");
        userInfoRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var userInfoResponse = await client.SendAsync(userInfoRequest);
        var userInfoJson = await userInfoResponse.Content.ReadAsStringAsync();

        if (!userInfoResponse.IsSuccessStatusCode)
        {
            _logger.LogError("Kakao user info request failed - Status: {StatusCode}, Response: {Response}",
                (int)userInfoResponse.StatusCode, userInfoJson);
            throw new InvalidOperationException($"Kakao user info request failed (HTTP {(int)userInfoResponse.StatusCode}): {userInfoJson}");
        }

        var userInfo = JsonSerializer.Deserialize<JsonElement>(userInfoJson);

        var kakaoId = userInfo.GetProperty("id").GetInt64().ToString();

        // kakao_account may be absent if consent scopes were not granted
        string? email = null;
        JsonElement? profile = null;
        if (userInfo.TryGetProperty("kakao_account", out var account))
        {
            email = account.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
            profile = account.TryGetProperty("profile", out var profileProp) ? profileProp : null;
        }

        return new SocialUserInfo
        {
            ProviderId = kakaoId,
            Email = email ?? $"{kakaoId}@kakao.placeholder",
            Name = profile?.TryGetProperty("nickname", out var nick) == true ? nick.GetString() : null,
            Picture = profile?.TryGetProperty("profile_image_url", out var img) == true ? img.GetString() : null
        };
    }

    private async Task<SocialUserInfo> ExchangeLineCodeAsync(string code, string redirectUri)
    {
        var channelId = _configuration["OAuth:Line:ChannelId"] ?? throw new InvalidOperationException("LINE ChannelId not configured");
        var channelSecret = _configuration["OAuth:Line:ChannelSecret"] ?? throw new InvalidOperationException("LINE ChannelSecret not configured");

        var client = _httpClientFactory.CreateClient();

        // Exchange code for tokens
        var tokenResponse = await client.PostAsync("https://api.line.me/oauth2/v2.1/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = channelId,
                ["client_secret"] = channelSecret,
                ["redirect_uri"] = redirectUri,
                ["grant_type"] = "authorization_code"
            }));

        var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
        if (!tokenResponse.IsSuccessStatusCode)
            throw new InvalidOperationException($"LINE token exchange failed: {tokenJson}");

        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenJson);
        var accessToken = tokenData.GetProperty("access_token").GetString()!;

        // Get user profile
        var profileRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.line.me/v2/profile");
        profileRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var profileResponse = await client.SendAsync(profileRequest);
        var profileJson = await profileResponse.Content.ReadAsStringAsync();
        var profile = JsonSerializer.Deserialize<JsonElement>(profileJson);

        var lineId = profile.GetProperty("userId").GetString()!;

        // Try to get email from ID token if available
        string? email = null;
        if (tokenData.TryGetProperty("id_token", out var idTokenProp))
        {
            var idToken = idTokenProp.GetString();
            if (idToken != null)
            {
                var payload = idToken.Split('.')[1];
                var padded = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
                var decoded = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(padded));
                var claims = JsonSerializer.Deserialize<JsonElement>(decoded);
                if (claims.TryGetProperty("email", out var emailClaim))
                    email = emailClaim.GetString();
            }
        }

        return new SocialUserInfo
        {
            ProviderId = lineId,
            Email = email ?? $"{lineId}@line.placeholder",
            Name = profile.TryGetProperty("displayName", out var displayName) ? displayName.GetString() : null,
            Picture = profile.TryGetProperty("pictureUrl", out var pic) ? pic.GetString() : null
        };
    }

    private async Task<SocialUserInfo> ExchangeAppleCodeAsync(string code, string redirectUri)
    {
        var clientId = _configuration["OAuth:Apple:ClientId"] ?? throw new InvalidOperationException("Apple ClientId not configured");
        var teamId = _configuration["OAuth:Apple:TeamId"] ?? throw new InvalidOperationException("Apple TeamId not configured");
        var keyId = _configuration["OAuth:Apple:KeyId"] ?? throw new InvalidOperationException("Apple KeyId not configured");

        var client = _httpClientFactory.CreateClient();

        // Generate client_secret JWT for Apple
        var clientSecret = GenerateAppleClientSecret(clientId, teamId, keyId);

        var tokenResponse = await client.PostAsync("https://appleid.apple.com/auth/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret,
                ["redirect_uri"] = redirectUri,
                ["grant_type"] = "authorization_code"
            }));

        var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
        if (!tokenResponse.IsSuccessStatusCode)
            throw new InvalidOperationException($"Apple token exchange failed: {tokenJson}");

        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenJson);
        var idToken = tokenData.GetProperty("id_token").GetString()!;

        // Decode ID token to get user info (Apple sends user info in the ID token)
        var payload = idToken.Split('.')[1];
        var padded = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
        var decoded = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(padded));
        var claims = JsonSerializer.Deserialize<JsonElement>(decoded);

        return new SocialUserInfo
        {
            ProviderId = claims.GetProperty("sub").GetString()!,
            Email = claims.TryGetProperty("email", out var email) ? email.GetString()! : $"{claims.GetProperty("sub").GetString()}@apple.placeholder",
            Name = null, // Apple only sends name on first auth, handled client-side
            Picture = null
        };
    }

    private string GenerateAppleClientSecret(string clientId, string teamId, string keyId)
    {
        var privateKeyPem = _configuration["OAuth:Apple:PrivateKey"];
        if (string.IsNullOrEmpty(privateKeyPem))
            throw new InvalidOperationException("Apple PrivateKey not configured");

        // Use ECDsa to create Apple client secret JWT
        var key = System.Security.Cryptography.ECDsa.Create();
        var pemContent = privateKeyPem.Replace("-----BEGIN PRIVATE KEY-----", "")
            .Replace("-----END PRIVATE KEY-----", "")
            .Replace("\n", "").Replace("\r", "").Trim();
        key.ImportPkcs8PrivateKey(Convert.FromBase64String(pemContent), out _);

        var securityKey = new Microsoft.IdentityModel.Tokens.ECDsaSecurityKey(key);
        var credentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(securityKey, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.EcdsaSha256);

        var now = DateTime.UtcNow;
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var token = handler.CreateJwtSecurityToken(
            issuer: teamId,
            audience: "https://appleid.apple.com",
            subject: new System.Security.Claims.ClaimsIdentity(new[] { new System.Security.Claims.Claim("sub", clientId) }),
            notBefore: now,
            expires: now.AddMinutes(5),
            issuedAt: now,
            signingCredentials: credentials
        );
        token.Header["kid"] = keyId;

        return handler.WriteToken(token);
    }

    private async Task<User> FindOrCreateUserAsync(string provider, SocialUserInfo info, string? anonymousUserId)
    {
        // Find by provider-specific ID first
        User? user = provider switch
        {
            "google" => await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == info.ProviderId),
            "kakao" => await _context.Users.FirstOrDefaultAsync(u => u.KakaoId == info.ProviderId),
            "line" => await _context.Users.FirstOrDefaultAsync(u => u.LineId == info.ProviderId),
            "apple" => await _context.Users.FirstOrDefaultAsync(u => u.AppleId == info.ProviderId),
            _ => null
        };

        if (user != null)
        {
            // Update profile info on each login
            if (info.Name != null) user.DisplayName ??= info.Name;
            if (info.Picture != null) user.ProfileImageUrl = info.Picture;
            return user;
        }

        // Try to find by email (link accounts)
        var normalizedEmail = info.Email.Trim().ToLowerInvariant();
        user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user != null)
        {
            // Link social account to existing email account
            SetProviderIdOnUser(user, provider, info.ProviderId);
            if (info.Picture != null) user.ProfileImageUrl ??= info.Picture;
            return user;
        }

        // Create new user
        user = new User
        {
            Email = normalizedEmail,
            DisplayName = info.Name,
            ProfileImageUrl = info.Picture,
            AnonymousUserId = anonymousUserId,
        };
        SetProviderIdOnUser(user, provider, info.ProviderId);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Migrate anonymous data if provided
        if (!string.IsNullOrEmpty(anonymousUserId))
        {
            await MigrateAnonymousDataAsync(anonymousUserId, user.Id);
        }

        _logger.LogInformation("New user created via {Provider}: {Email}", provider, normalizedEmail);
        return user;
    }

    private static void SetProviderIdOnUser(User user, string provider, string providerId)
    {
        switch (provider)
        {
            case "google": user.GoogleId = providerId; break;
            case "kakao": user.KakaoId = providerId; break;
            case "line": user.LineId = providerId; break;
            case "apple": user.AppleId = providerId; break;
        }
    }

    private string BuildGoogleAuthUrl(string redirectUri, string state)
    {
        var clientId = _configuration["OAuth:Google:ClientId"]
            ?? throw new InvalidOperationException("Google ClientId not configured");
        return $"https://accounts.google.com/o/oauth2/v2/auth?client_id={Uri.EscapeDataString(clientId)}&redirect_uri={Uri.EscapeDataString(redirectUri)}&response_type=code&scope={Uri.EscapeDataString("openid email profile")}&state={Uri.EscapeDataString(state)}&access_type=offline&prompt=consent";
    }

    private string BuildKakaoAuthUrl(string redirectUri, string state)
    {
        var clientId = _configuration["OAuth:Kakao:ClientId"]
            ?? throw new InvalidOperationException("Kakao ClientId not configured");
        // Kakao requires comma-separated scopes (not space-separated like OAuth2 standard)
        var scope = "profile_nickname,profile_image,account_email";
        return $"https://kauth.kakao.com/oauth/authorize?client_id={Uri.EscapeDataString(clientId)}&redirect_uri={Uri.EscapeDataString(redirectUri)}&response_type=code&scope={Uri.EscapeDataString(scope)}&state={Uri.EscapeDataString(state)}";
    }

    private string BuildLineAuthUrl(string redirectUri, string state)
    {
        var channelId = _configuration["OAuth:Line:ChannelId"]
            ?? throw new InvalidOperationException("LINE ChannelId not configured");
        return $"https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id={Uri.EscapeDataString(channelId)}&redirect_uri={Uri.EscapeDataString(redirectUri)}&state={Uri.EscapeDataString(state)}&scope={Uri.EscapeDataString("profile openid email")}";
    }

    private string BuildAppleAuthUrl(string redirectUri, string state)
    {
        var clientId = _configuration["OAuth:Apple:ClientId"]
            ?? throw new InvalidOperationException("Apple ClientId not configured");
        return $"https://appleid.apple.com/auth/authorize?client_id={Uri.EscapeDataString(clientId)}&redirect_uri={Uri.EscapeDataString(redirectUri)}&response_type=code&scope={Uri.EscapeDataString("name email")}&response_mode=query&state={Uri.EscapeDataString(state)}";
    }

    private async Task MigrateAnonymousDataAsync(string anonymousUserId, string newUserId)
    {
        try
        {
            var balances = await _context.TokenBalances.Where(t => t.UserId == anonymousUserId).ToListAsync();
            foreach (var b in balances) b.UserId = newUserId;

            var transactions = await _context.TokenTransactions.Where(t => t.UserId == anonymousUserId).ToListAsync();
            foreach (var t in transactions) t.UserId = newUserId;

            var payments = await _context.Payments.Where(p => p.UserId == anonymousUserId).ToListAsync();
            foreach (var p in payments) p.UserId = newUserId;

            var deployments = await _context.Deployments.Where(d => d.UserId == anonymousUserId).ToListAsync();
            foreach (var d in deployments) d.UserId = newUserId;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Migrated anonymous data from {OldId} to {NewId}", anonymousUserId, newUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to migrate anonymous data from {OldId} to {NewId}", anonymousUserId, newUserId);
        }
    }
}

internal class SocialUserInfo
{
    public required string ProviderId { get; set; }
    public required string Email { get; set; }
    public string? Name { get; set; }
    public string? Picture { get; set; }
}

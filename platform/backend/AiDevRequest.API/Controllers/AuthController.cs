using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ISocialAuthService _socialAuthService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ISocialAuthService socialAuthService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _socialAuthService = socialAuthService;
        _logger = logger;
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth-register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { error = "Email and password are required." });
        }

        if (dto.Password.Length < 8)
        {
            return BadRequest(new { error = "Password must be at least 8 characters." });
        }

        try
        {
            var (user, token) = await _authService.RegisterAsync(
                dto.Email, dto.Password, dto.DisplayName, dto.AnonymousUserId);

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    DisplayName = user.DisplayName,
                    ProfileImageUrl = user.ProfileImageUrl,
                    IsAdmin = user.IsAdmin,
                    CreatedAt = user.CreatedAt
                }
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed for {Email}", dto.Email);
            return StatusCode(500, new { error = "Registration failed." });
        }
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth-login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { error = "Email and password are required." });
        }

        try
        {
            var (user, token) = await _authService.LoginAsync(dto.Email, dto.Password);

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    DisplayName = user.DisplayName,
                    ProfileImageUrl = user.ProfileImageUrl,
                    IsAdmin = user.IsAdmin,
                    CreatedAt = user.CreatedAt
                }
            });
        }
        catch (InvalidOperationException)
        {
            return Unauthorized(new { error = "Invalid email or password." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for {Email}", dto.Email);
            return StatusCode(500, new { error = "Login failed." });
        }
    }

    [HttpPost("{provider}")]
    [EnableRateLimiting("auth-login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> SocialLogin(string provider, [FromBody] SocialLoginRequestDto dto)
    {
        var validProviders = new[] { "google", "kakao", "line", "apple" };
        if (!validProviders.Contains(provider.ToLower()))
        {
            return BadRequest(new { error = $"Unknown provider: {provider}" });
        }

        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            return BadRequest(new { error = "Authorization code is required." });
        }

        try
        {
            var (user, token) = await _socialAuthService.SocialLoginAsync(
                provider, dto.Code, dto.RedirectUri, dto.AnonymousUserId);

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    DisplayName = user.DisplayName,
                    ProfileImageUrl = user.ProfileImageUrl,
                    IsAdmin = user.IsAdmin,
                    CreatedAt = user.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Social login failed for {Provider}", provider);
            return BadRequest(new { error = "Social login failed. Please try again." });
        }
    }

    [HttpGet("providers")]
    [ProducesResponseType(typeof(ProvidersResponseDto), StatusCodes.Status200OK)]
    public ActionResult<ProvidersResponseDto> GetProviders()
    {
        var acceptLanguage = Request.Headers.AcceptLanguage.FirstOrDefault();
        var providers = _socialAuthService.GetOrderedProviders(acceptLanguage);

        return Ok(new ProvidersResponseDto { Providers = providers });
    }

    [HttpGet("{provider}/url")]
    [ProducesResponseType(typeof(AuthUrlResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<AuthUrlResponseDto> GetAuthUrl(string provider, [FromQuery] string redirectUri, [FromQuery] string? state)
    {
        var validProviders = new[] { "google", "kakao", "line", "apple" };
        if (!validProviders.Contains(provider.ToLower()))
        {
            return BadRequest(new { error = $"Unknown provider: {provider}" });
        }

        try
        {
            var url = _socialAuthService.GetAuthorizationUrl(provider, redirectUri, state ?? Guid.NewGuid().ToString("N"));
            return Ok(new AuthUrlResponseDto { Url = url });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "OAuth configuration error for {Provider}", provider);
            return BadRequest(new { error = $"{provider} login is not configured. Please contact support." });
        }
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetUserAsync(userId);
        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            ProfileImageUrl = user.ProfileImageUrl,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt
        });
    }
}

public record RegisterRequestDto
{
    public string Email { get; init; } = "";
    public string Password { get; init; } = "";
    public string? DisplayName { get; init; }
    public string? AnonymousUserId { get; init; }
}

public record LoginRequestDto
{
    public string Email { get; init; } = "";
    public string Password { get; init; } = "";
}

public record SocialLoginRequestDto
{
    public string Code { get; init; } = "";
    public string RedirectUri { get; init; } = "";
    public string? AnonymousUserId { get; init; }
}

public record AuthResponseDto
{
    public string Token { get; init; } = "";
    public UserDto User { get; init; } = new();
}

public record UserDto
{
    public string Id { get; init; } = "";
    public string Email { get; init; } = "";
    public string? DisplayName { get; init; }
    public string? ProfileImageUrl { get; init; }
    public bool IsAdmin { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record ProvidersResponseDto
{
    public string[] Providers { get; init; } = [];
}

public record AuthUrlResponseDto
{
    public string Url { get; init; } = "";
}

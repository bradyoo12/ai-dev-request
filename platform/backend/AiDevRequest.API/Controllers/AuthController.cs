using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
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
                    Id = user.Id.ToString(),
                    Email = user.Email,
                    DisplayName = user.DisplayName,
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
                    Id = user.Id.ToString(),
                    Email = user.Email,
                    DisplayName = user.DisplayName,
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

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
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
            Id = user.Id.ToString(),
            Email = user.Email,
            DisplayName = user.DisplayName,
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
    public DateTime CreatedAt { get; init; }
}

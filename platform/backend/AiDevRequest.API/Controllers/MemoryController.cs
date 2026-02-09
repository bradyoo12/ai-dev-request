using System.Security.Claims;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/memories")]
public class MemoryController : ControllerBase
{
    private readonly IMemoryService _memoryService;

    public MemoryController(IMemoryService memoryService)
    {
        _memoryService = memoryService;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    [HttpGet]
    public async Task<ActionResult<MemoryListDto>> GetMemories(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var userId = GetUserId();
        var memories = await _memoryService.GetAllMemoriesAsync(userId, page, pageSize);
        var totalCount = await _memoryService.GetMemoryCountAsync(userId);

        return Ok(new MemoryListDto
        {
            Memories = memories.Select(m => new MemoryDto
            {
                Id = m.Id,
                Content = m.Content,
                Category = m.Category,
                Scope = m.Scope.ToString(),
                SessionId = m.SessionId,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        });
    }

    [HttpPost]
    public async Task<ActionResult<MemoryDto>> AddMemory([FromBody] AddMemoryDto dto)
    {
        var userId = GetUserId();
        var scope = Enum.TryParse<MemoryScope>(dto.Scope, true, out var s) ? s : MemoryScope.User;

        var memory = await _memoryService.AddMemoryAsync(
            userId, dto.Content, dto.Category, scope, dto.SessionId);

        return Ok(new MemoryDto
        {
            Id = memory.Id,
            Content = memory.Content,
            Category = memory.Category,
            Scope = memory.Scope.ToString(),
            SessionId = memory.SessionId,
            CreatedAt = memory.CreatedAt,
            UpdatedAt = memory.UpdatedAt,
        });
    }

    [HttpDelete("{memoryId:int}")]
    public async Task<IActionResult> DeleteMemory(int memoryId)
    {
        await _memoryService.DeleteMemoryAsync(GetUserId(), memoryId);
        return Ok();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAllMemories()
    {
        await _memoryService.DeleteAllMemoriesAsync(GetUserId());
        return Ok();
    }
}

public record MemoryDto
{
    public int Id { get; init; }
    public string Content { get; init; } = "";
    public string Category { get; init; } = "";
    public string Scope { get; init; } = "User";
    public string? SessionId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record MemoryListDto
{
    public List<MemoryDto> Memories { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

public record AddMemoryDto
{
    public required string Content { get; init; }
    public required string Category { get; init; }
    public string Scope { get; init; } = "User";
    public string? SessionId { get; init; }
}

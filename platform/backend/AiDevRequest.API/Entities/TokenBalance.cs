using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class TokenBalance
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public int Balance { get; set; } = 1000;

    public int TotalEarned { get; set; } = 1000;

    public int TotalSpent { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class TokenTransaction
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(20)]
    public required string Type { get; set; } // "credit" or "debit"

    public int Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public required string Action { get; set; } // welcome_bonus, analysis, proposal, build, purchase

    [MaxLength(100)]
    public string? ReferenceId { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public int BalanceAfter { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TokenPackage
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    public int TokenAmount { get; set; }

    public decimal PriceUsd { get; set; }

    public int DiscountPercent { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; } = 0;
}

public class TokenPricing
{
    /// <summary>
    /// Conversion rate: 1 token = $0.01 USD. Used for display purposes.
    /// </summary>
    public const decimal TokenToUsdRate = 0.01m;

    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public required string ActionType { get; set; } // analysis, proposal, build, staging

    public int TokenCost { get; set; }

    [MaxLength(200)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

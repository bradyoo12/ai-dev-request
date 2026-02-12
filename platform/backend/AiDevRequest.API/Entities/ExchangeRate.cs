using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ExchangeRate
{
    public int Id { get; set; }

    [Required]
    [MaxLength(10)]
    public string CurrencyCode { get; set; } = ""; // "KRW", "JPY", "EUR"

    public decimal RateToUsd { get; set; } // e.g., 1400.00 for KRW

    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class CreditPackagePrice
{
    public int Id { get; set; }

    public int TokenPackageId { get; set; } // FK to TokenPackage

    [Required]
    [MaxLength(10)]
    public string CurrencyCode { get; set; } = "USD";

    public decimal Price { get; set; } // 9900 for KRW, 9.99 for USD (fixed local price)

    public bool IsActive { get; set; } = true;
}

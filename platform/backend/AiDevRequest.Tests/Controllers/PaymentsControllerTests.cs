using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class PaymentsControllerTests
{
    private PaymentsController CreateController(
        Mock<IPaymentService>? paymentService = null,
        Mock<ICryptoPaymentService>? cryptoPaymentService = null)
    {
        paymentService ??= new Mock<IPaymentService>();
        cryptoPaymentService ??= new Mock<ICryptoPaymentService>();
        var logger = new Mock<ILogger<PaymentsController>>();
        return new PaymentsController(paymentService.Object, cryptoPaymentService.Object, logger.Object);
    }

    [Fact]
    public async Task CreateCheckout_ReturnsOk()
    {
        var paymentService = new Mock<IPaymentService>();
        paymentService.Setup(s => s.CreateCheckoutSessionAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync("https://checkout.stripe.com/session123");

        var controller = CreateController(paymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateCheckout(new CheckoutRequestDto { PackageId = 1 });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CheckoutResponseDto>(okResult.Value);
        Assert.Contains("stripe.com", response.CheckoutUrl);
    }

    [Fact]
    public async Task CreateCheckout_ReturnsBadRequest_OnInvalidOperation()
    {
        var paymentService = new Mock<IPaymentService>();
        paymentService.Setup(s => s.CreateCheckoutSessionAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Package not found"));

        var controller = CreateController(paymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateCheckout(new CheckoutRequestDto { PackageId = 999 });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetHistory_ReturnsOk()
    {
        var paymentService = new Mock<IPaymentService>();
        paymentService.Setup(s => s.GetPaymentHistoryAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(new List<Payment>());
        paymentService.Setup(s => s.GetPaymentCountAsync(It.IsAny<string>()))
            .ReturnsAsync(0);

        var controller = CreateController(paymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetHistory();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PaymentHistoryResponseDto>(okResult.Value);
        Assert.Empty(response.Payments);
    }
}

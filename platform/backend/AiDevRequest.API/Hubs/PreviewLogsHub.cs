using Microsoft.AspNetCore.SignalR;

namespace AiDevRequest.API.Hubs;

public class PreviewLogsHub : Hub
{
    private readonly ILogger<PreviewLogsHub> _logger;

    public PreviewLogsHub(ILogger<PreviewLogsHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinPreviewRoom(string previewId)
    {
        var groupName = $"preview-{previewId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation(
            "Client {ConnectionId} joined preview room {PreviewId}",
            Context.ConnectionId,
            previewId);
    }

    public async Task LeavePreviewRoom(string previewId)
    {
        var groupName = $"preview-{previewId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation(
            "Client {ConnectionId} left preview room {PreviewId}",
            Context.ConnectionId,
            previewId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogWarning(
                exception,
                "Client {ConnectionId} disconnected with error",
                Context.ConnectionId);
        }
        else
        {
            _logger.LogInformation(
                "Client {ConnectionId} disconnected",
                Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }
}

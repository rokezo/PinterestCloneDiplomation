namespace ClonePinterest.API.DTOs.Settings;

public class UpdateNotificationSettingsDto
{
    public bool? EmailNotifications { get; set; }
    public bool? PushNotifications { get; set; }
}

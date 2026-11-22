namespace ClonePinterest.API.DTOs.Settings;

public class UserSettingsDto
{
    // Рекомендації
    public bool RecommendationsEnabled { get; set; }
    public bool PersonalizedAds { get; set; }

    // Приватність
    public string Visibility { get; set; } = "Public";
    public bool Searchable { get; set; }
    public bool ShowEmail { get; set; }

    // notification preferences
    public bool EmailNotifications { get; set; }
    public bool PushNotifications { get; set; }
}

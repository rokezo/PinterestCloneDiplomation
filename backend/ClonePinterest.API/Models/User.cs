using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("Users")]
public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Bio { get; set; }

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "User"; // User, Admin

    [Required]
    [MaxLength(20)]
    public string Visibility { get; set; } = "Public"; // Public, Private

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [MaxLength(50)]
    public string? Language { get; set; }

    // Поля для скидання пароля
    public string? PasswordResetCode { get; set; }
    public DateTime? PasswordResetCodeSentAt { get; set; }

    // Налаштування рекомендацій
    public bool RecommendationsEnabled { get; set; } = true;

    public bool PersonalizedAds { get; set; } = true;

    // Налаштування приватності
    public bool Searchable { get; set; } = true;
    public bool ShowEmail { get; set; } = false;

    // Налаштування сповіщень
    public bool EmailNotifications { get; set; } = true;
    public bool PushNotifications { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Flag used for temporary account deactivation. When true the account
    /// is hidden from other users and login is blocked.
    /// </summary>
    public bool IsDeactivated { get; set; } = false;

    /// <summary>
    /// Indicates whether two-factor authentication is enabled for the account.
    /// </summary>
    public bool TwoFactorEnabled { get; set; } = false;

    // Navigation properties
    public virtual ICollection<Pin> Pins { get; set; } = new List<Pin>();
    public virtual ICollection<Board> Boards { get; set; } = new List<Board>();
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
    public virtual ICollection<Session> Sessions { get; set; } = new List<Session>();
}



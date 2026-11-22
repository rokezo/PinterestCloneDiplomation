using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("Sessions")]
public class Session
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? DeviceInfo { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // navigation
    public virtual User? User { get; set; }
}

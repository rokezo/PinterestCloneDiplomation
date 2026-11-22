namespace ClonePinterest.API.DTOs.Auth {
    public class PasswordResetDto {
        public string Email { get; set; }
        public string Code { get; set; }
        public string NewPassword { get; set; }
    }
}

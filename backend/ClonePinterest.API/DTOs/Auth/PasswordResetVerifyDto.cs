namespace ClonePinterest.API.DTOs.Auth {
    public class PasswordResetVerifyDto {
        public string Email { get; set; }
        public string Code { get; set; }
    }
}

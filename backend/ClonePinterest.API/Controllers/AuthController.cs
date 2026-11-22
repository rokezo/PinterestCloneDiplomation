using ClonePinterest.API.Data;
using ClonePinterest.API.DTOs.Auth;
using ClonePinterest.API.Models;
using ClonePinterest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using Google.Apis.Auth;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IJwtService _jwtService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;

    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB для аватара

    public AuthController(
        ApplicationDbContext context,
        IPasswordService passwordService,
        IJwtService jwtService,
        IWebHostEnvironment environment,
        ILogger<AuthController> logger,
        IConfiguration configuration)
    {
        _context = context;
        _passwordService = passwordService;
        _jwtService = jwtService;
        _environment = environment;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for registration");
                return BadRequest(ModelState);
            }

            // Перевірка чи існує користувач з таким email
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                _logger.LogWarning("Registration attempt with existing email: {Email}", registerDto.Email);
                return BadRequest(new { message = "User with this email already exists" });
            }

            // Перевірка чи існує користувач з таким username
            if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
            {
                _logger.LogWarning("Registration attempt with existing username: {Username}", registerDto.Username);
                return BadRequest(new { message = "User with this username already exists" });
            }

            // Створення нового користувача
            var user = new User
            {
                Email = registerDto.Email,
                Username = registerDto.Username,
                PasswordHash = _passwordService.HashPassword(registerDto.Password),
                Role = "User",
                Visibility = "Public",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User registered successfully: {Username} (ID: {UserId})", user.Username, user.Id);

            // Генерація токену
            var token = _jwtService.GenerateToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration");
            return StatusCode(500, new { message = "An error occurred during registration. Please try again." });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Пошук користувача за email
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);

        if (user == null || !_passwordService.VerifyPassword(loginDto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        if (user.IsDeactivated)
        {
            _logger.LogWarning("Login attempt for deactivated user {Email}", loginDto.Email);
            return Unauthorized(new { message = "Account is deactivated" });
        }

        // create session entry
        try
        {
            var session = new Models.Session
            {
                UserId = user.Id,
                DeviceInfo = Request.Headers["User-Agent"].ToString(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create login session for user {UserId}", user.Id);
        }

        // Генерація токену
        var token = _jwtService.GenerateToken(user);

        var response = new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email
        };

        return Ok(response);
    }

    /// <summary>
    /// Authenticate or register a user using a Google ID token.
    /// Client obtains the id_token from Google Identity Services and posts it here.
    /// </summary>
    [HttpPost("google")]
    public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleLoginRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.IdToken))
            return BadRequest(new { message = "IdToken is required" });

        GoogleJsonWebSignature.Payload? payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _configuration["Google:ClientId"] }
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invalid Google ID token");
            return Unauthorized(new { message = "Invalid Google token" });
        }

        if (payload == null || string.IsNullOrEmpty(payload.Email))
            return Unauthorized(new { message = "Google token did not contain email" });

        var email = payload.Email.ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            // create new account for Google login; no local password, store empty hash
            user = new User
            {
                Email = email,
                Username = payload.Name?.Replace(" ", "_") ?? email.Split('@')[0],
                PasswordHash = string.Empty,
                Role = "User",
                Visibility = "Public",
                AvatarUrl = payload.Picture,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Created new user via Google login: {Email}", email);
        }
        else if (user.IsDeactivated)
        {
            return Unauthorized(new { message = "Account is deactivated" });
        }

        var token = _jwtService.GenerateToken(user);
        return Ok(new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email
        });
    }

    public class GoogleLoginRequest
    {
        public string IdToken { get; set; } = string.Empty;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null || user.IsDeactivated)
        {
            // treat deactivated account as not found so client clears state
            return NotFound(new { message = "User not found" });
        }

        // if role claim in token is out of date, issue a new JWT so the client
        // can continue using the updated permissions without a full relogin
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        string? refreshedToken = null;
        if (roleClaim != user.Role)
        {
            refreshedToken = _jwtService.GenerateToken(user);
            _logger.LogInformation("Refreshing JWT for user {UserId} due to role change ({OldRole} -> {NewRole})", userId, roleClaim, user.Role);
        }

        var response = new
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role,
            Token = refreshedToken
        };

        // if Token is null, the JSON serializer will omit the property automatically
        return Ok(response);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (dto == null || string.IsNullOrEmpty(dto.CurrentPassword) || string.IsNullOrEmpty(dto.NewPassword))
        {
            return BadRequest(new { message = "Current and new passwords are required" });
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (!_passwordService.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "Current password is incorrect" });
        }

        user.PasswordHash = _passwordService.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} changed password", userId);
        return Ok(new { message = "Password changed successfully" });
    }

    [HttpPost("two-factor")]
    [Authorize]
    public async Task<IActionResult> SetTwoFactor([FromBody] TwoFactorDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return Unauthorized();
        }
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }
        user.TwoFactorEnabled = dto.Enabled;
        await _context.SaveChangesAsync();
        return Ok(new { enabled = user.TwoFactorEnabled });
    }

    [HttpPut("profile")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileDto updateProfileDto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            _logger.LogInformation("Updating profile for user {UserId}. Username: {Username}, Bio: {Bio}, HasAvatar: {HasAvatar}",
                userId, updateProfileDto.Username, updateProfileDto.Bio, updateProfileDto.Avatar != null);

            // Обновление username (если передан)
            if (updateProfileDto.Username != null)
            {
                var newUsername = updateProfileDto.Username.Trim();
                if (string.IsNullOrEmpty(newUsername))
                {
                    return BadRequest(new { message = "Username cannot be empty" });
                }
                
                if (newUsername != user.Username)
                {
                    // Проверяем, не занят ли username другим пользователем
                    if (await _context.Users.AnyAsync(u => u.Username == newUsername && u.Id != userId))
                    {
                        return BadRequest(new { message = "User with this username already exists" });
                    }
                    user.Username = newUsername;
                }
            }

            // Обновление bio (если передан)
            if (updateProfileDto.Bio != null)
            {
                user.Bio = updateProfileDto.Bio.Trim();
            }

            // Обработка загрузки аватара
            var avatarFile = updateProfileDto.Avatar ?? Request.Form.Files.FirstOrDefault(f => f.Name == "avatar");
            if (avatarFile != null && avatarFile.Length > 0)
            {
                // Валидация файла
                var extension = Path.GetExtension(avatarFile.FileName).ToLowerInvariant();
                if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                {
                    return BadRequest(new { message = "Invalid file format. Allowed: jpg, jpeg, png, gif, webp" });
                }

                if (avatarFile.Length > MaxFileSize)
                {
                    return BadRequest(new { message = "File size cannot exceed 5MB" });
                }

                // Удаляем старый аватар, если он был загружен локально
                if (!string.IsNullOrEmpty(user.AvatarUrl) && user.AvatarUrl.StartsWith("/uploads/"))
                {
                    var oldFilePath = Path.Combine(_environment.ContentRootPath, "wwwroot", user.AvatarUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        try
                        {
                            System.IO.File.Delete(oldFilePath);
                        }
                        catch
                        {
                            // Игнорируем ошибки при удалении старого файла
                        }
                    }
                }

                // Создаем уникальное имя файла
                var fileName = $"avatar_{userId}_{Guid.NewGuid()}{extension}";
                var uploadsPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "avatars");

                // Создаем папку если её нет
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                var filePath = Path.Combine(uploadsPath, fileName);

                // Сохраняем файл
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await avatarFile.CopyToAsync(fileStream);
                }

                    // Обновляем URL аватара
                user.AvatarUrl = $"/uploads/avatars/{fileName}";
            }
            // Если передан avatarUrl (для внешних URL) и файл не загружен, обновляем его
            else if (!string.IsNullOrEmpty(updateProfileDto.AvatarUrl))
            {
                user.AvatarUrl = updateProfileDto.AvatarUrl;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Profile updated successfully for user {UserId}", userId);

            return Ok(new
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role,
                message = "Profile updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile for user");
            return StatusCode(500, new { message = "Error updating profile", error = ex.Message });
        }
    }

    [HttpGet("settings")]
    [Authorize]
    public async Task<IActionResult> GetSettings()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var settings = new
            {
                RecommendationsEnabled = user.RecommendationsEnabled,
                PersonalizedAds = user.PersonalizedAds,
                Visibility = user.Visibility,
                Searchable = user.Searchable,
                ShowEmail = user.ShowEmail,
                EmailNotifications = user.EmailNotifications,
                PushNotifications = user.PushNotifications
            };

            return Ok(settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user settings");
            return StatusCode(500, new { message = "Error getting settings", error = ex.Message });
        }
    }

    [HttpPut("settings/recommendations")]
    [Authorize]
    public async Task<IActionResult> UpdateRecommendations([FromBody] DTOs.Settings.UpdateRecommendationsDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (dto.RecommendationsEnabled.HasValue)
            {
                user.RecommendationsEnabled = dto.RecommendationsEnabled.Value;
            }

            if (dto.PersonalizedAds.HasValue)
            {
                user.PersonalizedAds = dto.PersonalizedAds.Value;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Recommendations settings updated for user {UserId}", userId);

            return Ok(new
            {
                RecommendationsEnabled = user.RecommendationsEnabled,
                PersonalizedAds = user.PersonalizedAds,
                message = "Recommendations settings updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating recommendations settings");
            return StatusCode(500, new { message = "Error updating recommendations settings", error = ex.Message });
        }
    }

    [HttpPut("settings/privacy")]
    [Authorize]
    public async Task<IActionResult> UpdatePrivacy([FromBody] DTOs.Settings.UpdatePrivacyDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (!string.IsNullOrEmpty(dto.Visibility))
            {
                if (dto.Visibility != "Public" && dto.Visibility != "Private")
                {
                    return BadRequest(new { message = "Visibility must be 'Public' or 'Private'" });
                }
                user.Visibility = dto.Visibility;
            }

            if (dto.Searchable.HasValue)
            {
                user.Searchable = dto.Searchable.Value;
            }

            if (dto.ShowEmail.HasValue)
            {
                user.ShowEmail = dto.ShowEmail.Value;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Privacy settings updated for user {UserId}", userId);

            return Ok(new
            {
                Visibility = user.Visibility,
                Searchable = user.Searchable,
                ShowEmail = user.ShowEmail,
                message = "Privacy settings updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating privacy settings");
            return StatusCode(500, new { message = "Error updating privacy settings", error = ex.Message });
        }
    }

    [HttpPut("settings/notifications")]
    [Authorize]
    public async Task<IActionResult> UpdateNotificationSettings([FromBody] DTOs.Settings.UpdateNotificationSettingsDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (dto.EmailNotifications.HasValue)
            {
                user.EmailNotifications = dto.EmailNotifications.Value;
            }
            if (dto.PushNotifications.HasValue)
            {
                user.PushNotifications = dto.PushNotifications.Value;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification settings updated for user {UserId}", userId);

            return Ok(new
            {
                EmailNotifications = user.EmailNotifications,
                PushNotifications = user.PushNotifications,
                message = "Notification settings updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notification settings");
            return StatusCode(500, new { message = "Error updating notification settings", error = ex.Message });
        }
    }

    [HttpPost("request-password-reset")]
    public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequestDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null)
            return Ok(new { success = false, message = "Користувача не знайдено" });
        var code = new Random().Next(100000, 999999).ToString();
        user.PasswordResetCode = code;
        user.PasswordResetCodeSentAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        // TODO: Send code to user's email
        try
        {
            using var smtp = new System.Net.Mail.SmtpClient();
            smtp.Host = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
            smtp.Port = int.TryParse(_configuration["Smtp:Port"], out var port) ? port : 587;
            smtp.EnableSsl = true;
            smtp.Credentials = new System.Net.NetworkCredential(
                _configuration["Smtp:Username"] ?? "your.email@gmail.com",
                _configuration["Smtp:Password"] ?? "your-app-password"
            );
            var mail = new System.Net.Mail.MailMessage(
                _configuration["Smtp:Username"] ?? "your.email@gmail.com",
                user.Email
            );
            mail.Subject = "Код для скидання пароля";
            mail.Body = $"Ваш код для скидання пароля: {code}\n\nВін дійсний 15 хвилин.";
            await smtp.SendMailAsync(mail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Не вдалося надіслати email для скидання пароля");
        }
        return Ok(new { success = true });
    }

    [HttpPost("verify-reset-code")]
    public async Task<IActionResult> VerifyResetCode([FromBody] PasswordResetVerifyDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || user.PasswordResetCode != dto.Code || user.PasswordResetCodeSentAt == null || (DateTime.UtcNow - user.PasswordResetCodeSentAt.Value).TotalMinutes > 15)
            return Ok(new { success = false, message = "Невірний або прострочений код" });
        return Ok(new { success = true });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] PasswordResetDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || user.PasswordResetCode != dto.Code)
            return Ok(new { success = false, message = "Невірний код" });
        user.PasswordHash = _passwordService.HashPassword(dto.NewPassword);
        user.PasswordResetCode = null;
        user.PasswordResetCodeSentAt = null;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}



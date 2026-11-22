using ClonePinterest.API.Data;
using ClonePinterest.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(ApplicationDbContext context, ILogger<AdminController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Retrieve a paged list of all users along with basic info and status.
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 200) pageSize = 50;

        var query = _context.Users.AsQueryable();
        var total = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var adminId = int.Parse(User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var userDtos = new List<object>();

        foreach (var u in users)
        {
            // simple online calculation: any session in last 5 minutes
            var lastSession = await _context.Sessions
                .Where(s => s.UserId == u.Id)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            string status;
            if (u.IsDeactivated)
                status = "Deactivated";
            else if (lastSession != null && lastSession.CreatedAt > now.AddMinutes(-5))
                status = "Online";
            else
                status = "Offline";

            bool isBlocked = await _context.UserBlocks
                .AnyAsync(b => b.BlockerId == adminId && b.BlockedId == u.Id);

            userDtos.Add(new
            {
                u.Id,
                u.Email,
                u.Username,
                u.Role,
                u.Visibility,
                u.IsDeactivated,
                Status = status,
                u.CreatedAt,
                AvatarUrl = u.AvatarUrl,
                IsBlocked = isBlocked
            });
        }

        return Ok(new
        {
            users = userDtos,
            totalCount = total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize)
        });
    }

    /// <summary>
    /// Change a user's role ("User" or "Admin").
    /// </summary>
    [HttpPatch("users/{id}/role")]
    public async Task<IActionResult> ChangeUserRole(int id, [FromBody] RoleChangeRequest request)
    {
        if (request == null || (request.Role != "User" && request.Role != "Admin"))
            return BadRequest(new { message = "Role must be either 'User' or 'Admin'" });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        user.Role = request.Role;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Role updated" });
    }

    /// <summary>
    /// Deactivate (soft-delete) a user account.
    /// </summary>
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        user.IsDeactivated = true;
        await _context.SaveChangesAsync();
        return Ok(new { message = "User deactivated" });
    }

    public class RoleChangeRequest
    {
        public string Role { get; set; } = string.Empty;
    }
}

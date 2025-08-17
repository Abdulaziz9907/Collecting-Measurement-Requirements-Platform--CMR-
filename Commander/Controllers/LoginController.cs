using AutoMapper;
using Commander.Data;
using Commander.Dtos;
using Commander.Models;
using Commander.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Commander.Controllers
{
    [Route("api/login")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly InterfaceRepo _repository;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;
        private readonly IHostEnvironment _env;
        private readonly ILogger<LoginController> _logger;

        private sealed class ResetEntry
        {
            public string Email { get; init; } = "";
            public string Code { get; init; } = "";
            public DateTimeOffset ExpiresAt { get; init; }
        }

        // username::email (username trimmed, email lowercased) → entry
        private static readonly ConcurrentDictionary<string, ResetEntry> _resetStore = new();

        private sealed class EmailCurrentEntry
        {
            public int UserId { get; init; }
            public string Code { get; init; } = "";
            public DateTimeOffset ExpiresAt { get; init; }
        }

        private static readonly ConcurrentDictionary<int, EmailCurrentEntry> _emailCurrentStore = new();
        private static readonly ConcurrentDictionary<int, DateTimeOffset> _emailCurrentVerified = new();

        public LoginController(
            InterfaceRepo repository,
            IMapper mapper,
            IEmailService emailService,
            IHostEnvironment env,
            ILogger<LoginController> logger)
        {
            _repository = repository;
            _mapper = mapper;
            _emailService = emailService;
            _env = env;
            _logger = logger;
        }

        // ---------- helpers ----------
        private static string NormalizeDigits(string input)
        {
            if (string.IsNullOrEmpty(input)) return string.Empty;
            var sb = new StringBuilder(input.Length);
            foreach (var ch in input)
            {
                if (ch >= '\u0660' && ch <= '\u0669') sb.Append((char)('0' + (ch - '\u0660')));
                else if (ch >= '\u06F0' && ch <= '\u06F9') sb.Append((char)('0' + (ch - '\u06F0')));
                else sb.Append(ch);
            }
            return sb.ToString();
        }

        private static string KeyFor(string username, string email)
        {
            var u = NormalizeDigits(username ?? "").Trim();
            var e = (email ?? "").Trim().ToLowerInvariant();
            return $"{u}::{e}";
        }

        // Map Arabic-Indic & Eastern Arabic-Indic digits to ASCII and keep only digits (max 6)
        private static string NormalizeCode(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return "";
            var sb = new StringBuilder(6);
            foreach (var ch in input.Trim())
            {
                char mapped = ch;
                if (ch >= '\u0660' && ch <= '\u0669') mapped = (char)('0' + (ch - '\u0660')); // Arabic-Indic
                else if (ch >= '\u06F0' && ch <= '\u06F9') mapped = (char)('0' + (ch - '\u06F0')); // Eastern Arabic-Indic

                if (mapped >= '0' && mapped <= '9')
                {
                    sb.Append(mapped);
                    if (sb.Length == 6) break;
                }
            }
            return sb.ToString();
        }

        // ---------- login ----------
        [HttpPost]
        public ActionResult<UserReadDto> Login([FromBody] UserLoginDto loginDto)
        {
            if (loginDto == null) return BadRequest("Invalid payload.");
            var login = NormalizeDigits(loginDto.Username);
            var user = _repository.AuthenticateUser(login, loginDto.Password);
            if (user == null) return Unauthorized();
            return Ok(_mapper.Map<UserReadDto>(user));
        }

        // ---------- send code (5 minutes) ----------
        [HttpPost("forgot")]
        public async Task<ActionResult> SendResetCode([FromBody] ForgotPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Username) || string.IsNullOrWhiteSpace(dto?.Email))
                return BadRequest("Username and email are required.");

            var username = NormalizeDigits(dto.Username.Trim());
            var email = dto.Email.Trim();

            var user = _repository.GetUserByLoginAndEmail(username, email);
            if (user == null)
            {
                _logger.LogInformation("Forgot: user not found for {User}/{Email}", username, email);
                return NotFound("User with provided username and email was not found.");
            }

            var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString(); // 6 digits (no leading zeros)

            _resetStore[KeyFor(username, email)] = new ResetEntry
            {
                Email = email,
                Code = code,
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5) // 5 minutes
            };

            try
            {
                // Use the templated email from MailjetEmailService (brand: منصة التحول الرقمي)
                var resetUrl = $"{Request.Scheme}://{Request.Host}/reset"; // adjust to your SPA route if needed
                await _emailService.SendPasswordResetAsync(
                    toEmail: email,
                    toName: user?.First_name ?? username,
                    code: code,
                    username: username,
                    resetUrl: resetUrl
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reset email to {Email}", email);
                if (_env.IsDevelopment()) return Ok(new { sent = false, error = ex.Message });
                return StatusCode(500, "Failed to send reset email. Please try again later.");
            }

            return Ok(new { sent = true });
        }

        // ---------- verify code (server-side) ----------
        [HttpPost("verify")]
        public ActionResult VerifyCode([FromBody] VerifyCodeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Username) ||
                string.IsNullOrWhiteSpace(dto?.Email) ||
                string.IsNullOrWhiteSpace(dto?.Code))
                return BadRequest(new { message = "Incomplete payload." });

            var key = KeyFor(dto.Username, dto.Email);
            if (!_resetStore.TryGetValue(key, out var entry))
                return NotFound(new { message = "No reset request found for this user." });

            if (DateTimeOffset.UtcNow > entry.ExpiresAt)
            {
                _resetStore.TryRemove(key, out _);
                return BadRequest(new { message = "Verification code expired." });
            }

            var provided = NormalizeCode(dto.Code);

            if (_env.IsDevelopment())
                _logger.LogInformation("DEBUG VERIFY stored={Stored} provided={Provided} key={Key}", entry.Code, provided, key);

            if (!string.Equals(entry.Code, provided, StringComparison.Ordinal))
                return BadRequest(new { message = "يرجى التأكد من صحة كود التحقق." });

            var remaining = (int)Math.Max(0, (entry.ExpiresAt - DateTimeOffset.UtcNow).TotalSeconds);
            return Ok(new { valid = true, secondsLeft = remaining });
        }

        // ---------- reset password ----------
        [HttpPost("reset")]
        public ActionResult ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Username) ||
                string.IsNullOrWhiteSpace(dto?.Email) ||
                string.IsNullOrWhiteSpace(dto?.Code) ||
                string.IsNullOrWhiteSpace(dto?.NewPassword))
                return BadRequest(new { message = "All fields are required." });

            if (dto.NewPassword.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters." });

            var username = NormalizeDigits(dto.Username);
            var key = KeyFor(username, dto.Email);
            if (!_resetStore.TryGetValue(key, out var entry))
                return NotFound(new { message = "No reset request found for the specified user." });

            if (DateTimeOffset.UtcNow > entry.ExpiresAt)
            {
                _resetStore.TryRemove(key, out _);
                return BadRequest(new { message = "The verification code has expired." });
            }

            var provided = NormalizeCode(dto.Code);
            if (!string.Equals(entry.Code, provided, StringComparison.Ordinal))
                return BadRequest(new { message = "يرجى التأكد من صحة كود التحقق." });

            var user = _repository.GetUserByLoginAndEmail(username, dto.Email);
            if (user == null)
                return NotFound(new { message = "User could not be located." });

            // TODO: hash & salt in production
            user.Password = dto.NewPassword;
            _repository.UpdateUser(user);
            _repository.SaveChanges();

            _resetStore.TryRemove(key, out _);
            return Ok(new { reset = true });
        }

        // ---------- email change: verify current email (send code) ----------
        [HttpPost("email/current/request")]
        public async Task<ActionResult> SendCurrentEmailCode([FromBody] EmailChangeCurrentRequestDto dto)
        {
            if (dto == null || dto.UserId <= 0)
                return BadRequest("UserId is required.");

            var user = _repository.GetUserById(dto.UserId);
            var email = user?.Email?.Trim();
            if (user == null || string.IsNullOrWhiteSpace(email))
                return NotFound("User not found.");

            var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
            _emailCurrentStore[dto.UserId] = new EmailCurrentEntry
            {
                UserId = dto.UserId,
                Code = code,
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5)
            };

            try
            {
                await _emailService.SendVerificationCodeAsync(email, user.First_name, code, "رمز تأكيد البريد الحالي");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send current email code to {Email}", email);
                if (_env.IsDevelopment()) return Ok(new { sent = false, error = ex.Message });
                return StatusCode(500, "Failed to send verification email. Please try again later.");
            }

            return Ok(new { sent = true });
        }

        // ---------- email change: verify current email ----------
        [HttpPost("email/current/verify")]
        public ActionResult VerifyCurrentEmail([FromBody] EmailChangeCurrentVerifyDto dto)
        {
            if (dto == null || dto.UserId <= 0 || string.IsNullOrWhiteSpace(dto.Code))
                return BadRequest(new { message = "Incomplete payload." });

            if (!_emailCurrentStore.TryGetValue(dto.UserId, out var entry))
            {
                if (_emailCurrentVerified.TryGetValue(dto.UserId, out var already) && DateTimeOffset.UtcNow <= already)
                    return Ok(new { valid = true });
                return NotFound(new { message = "No verification request found." });
            }

            if (DateTimeOffset.UtcNow > entry.ExpiresAt)
            {
                _emailCurrentStore.TryRemove(dto.UserId, out _);
                return BadRequest(new { message = "Verification code expired." });
            }

            var provided = NormalizeCode(dto.Code);
            if (!string.Equals(entry.Code, provided, StringComparison.Ordinal))
                return BadRequest(new { message = "يرجى التأكد من صحة كود التحقق." });

            _emailCurrentStore.TryRemove(dto.UserId, out _);
            _emailCurrentVerified[dto.UserId] = DateTimeOffset.UtcNow.AddMinutes(10);
            return Ok(new { valid = true });
        }

        // ---------- email change: save new email ----------
        [HttpPost("email/change")]
        public ActionResult ChangeEmail([FromBody] EmailChangeCommitDto dto)
        {
            if (dto == null || dto.UserId <= 0 || string.IsNullOrWhiteSpace(dto.NewEmail))
                return BadRequest("UserId and new email are required.");

            if (!_emailCurrentVerified.TryGetValue(dto.UserId, out var verified) || DateTimeOffset.UtcNow > verified)
                return BadRequest("Current email not verified.");

            var user = _repository.GetUserById(dto.UserId);
            if (user == null)
                return NotFound("User not found.");

            user.Email = dto.NewEmail.Trim();
            _repository.UpdateUser(user);
            _repository.SaveChanges();

            _emailCurrentVerified.TryRemove(dto.UserId, out _);
            return Ok(new { changed = true });
        }
    }
}

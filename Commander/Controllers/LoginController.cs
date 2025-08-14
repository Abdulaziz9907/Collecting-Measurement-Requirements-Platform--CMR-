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
            public string Email { get; init; }
            public string Code { get; init; }
            public DateTimeOffset ExpiresAt { get; init; }
        }

        private static readonly ConcurrentDictionary<string, ResetEntry> _resetStore = new();

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

        [HttpPost]
        public ActionResult<UserReadDto> Login([FromBody] UserLoginDto loginDto)
        {
            var user = _repository.AuthenticateUser(loginDto.Username, loginDto.Password);
            if (user == null) return Unauthorized();
            return Ok(_mapper.Map<UserReadDto>(user));
        }

        [HttpPost("forgot")]
        public async Task<ActionResult> SendResetCode([FromBody] ForgotPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Username) || string.IsNullOrWhiteSpace(dto?.Email))
                return BadRequest("Username and email are required.");

            var username = dto.Username.Trim();
            var email = dto.Email.Trim();

            // Case-insensitive lookup recommended in your repo
            var user = _repository.GetUserByUsernameAndEmail(username, email);
            if (user == null)
            {
                _logger.LogInformation("Forgot: user not found for {User}/{Email}", username, email);
                return NotFound("User with provided username and email was not found.");
            }

            // 6-digit cryptographically secure code
            var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

            _resetStore[username.ToLowerInvariant()] = new ResetEntry
            {
                Email = email,
                Code = code,
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10)
            };

            var subject = "إعادة تعيين كلمة المرور";
            var textPart = $"رمز التحقق: {code} (صالح 10 دقائق)";
            var htmlPart = $"<p>رمز التحقق لإعادة تعيين كلمة المرور:</p>" +
                           $"<p style='font-size:20px;font-weight:bold'>{code}</p>" +
                           $"<p>صالح لمدة 10 دقائق.</p>";

            try
            {
                await _emailService.SendAsync(email, subject, textPart, htmlPart);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reset email to {Email}", email);

                if (_env.IsDevelopment())
                    return Ok(new { sent = false, code, error = ex.Message });

                return StatusCode(500, "Failed to send reset email. Please try again later.");
            }

            // Return code in Dev to speed testing
            if (_env.IsDevelopment())
                return Ok(new { sent = true, code });

            return Ok(new { sent = true });
        }

        [HttpPost("reset")]
        public ActionResult ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Username) ||
                string.IsNullOrWhiteSpace(dto?.Email) ||
                string.IsNullOrWhiteSpace(dto?.Code) ||
                string.IsNullOrWhiteSpace(dto?.NewPassword))
            {
                return BadRequest("All fields are required.");
            }

            var key = dto.Username.Trim().ToLowerInvariant();

            if (!_resetStore.TryGetValue(key, out var entry))
                return NotFound("No reset request found for the specified user.");

            if (DateTimeOffset.UtcNow > entry.ExpiresAt)
            {
                _resetStore.TryRemove(key, out _);
                return BadRequest("The verification code has expired.");
            }

            var providedEmail = dto.Email.Trim();
            var providedCode = dto.Code.Trim();

            if (!entry.Email.Equals(providedEmail, StringComparison.OrdinalIgnoreCase))
                return BadRequest("Email does not match the reset request.");

            if (!entry.Code.Equals(providedCode, StringComparison.Ordinal))
                return BadRequest("Incorrect verification code.");

            var user = _repository.GetUserByUsernameAndEmail(dto.Username, dto.Email);
            if (user == null)
                return NotFound("User could not be located.");

            // TODO: hash your password!
            user.Password = dto.NewPassword;
            _repository.UpdateUser(user);
            _repository.SaveChanges();

            _resetStore.TryRemove(key, out _);
            return Ok(new { reset = true });
        }
    }
}

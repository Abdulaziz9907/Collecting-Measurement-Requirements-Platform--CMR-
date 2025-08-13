using AutoMapper;
using Commander.Data;
using Commander.Dtos;
using Commander.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace Commander.Controllers
{
    [Route("api/login")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly InterfaceRepo _repository;
        private readonly IMapper _mapper;
        private static readonly Dictionary<string, string> _resetCodes = new();
        private static readonly object _codeLock = new();

        public LoginController(InterfaceRepo repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        [HttpPost]
        public ActionResult<UserReadDto> Login(UserLoginDto loginDto)
        {
            var user = _repository.AuthenticateUser(loginDto.Username, loginDto.Password);
            if (user == null)
                return Unauthorized();

            return Ok(_mapper.Map<UserReadDto>(user));
        }

        [HttpPost("forgot")]
        public ActionResult SendResetCode(ForgotPasswordDto dto)
        {
            var user = _repository.GetUserByUsernameAndEmail(dto.Username, dto.Email);
            if (user == null)
            {
                return NotFound();
            }

            var code = new Random().Next(100000, 999999).ToString();
            lock (_codeLock)
            {
                _resetCodes[dto.Username] = code;
            }
            Console.WriteLine($"Reset code for {dto.Username}: {code}");
            return Ok(new { code });
        }

        [HttpPost("reset")]
        public ActionResult ResetPassword(ResetPasswordDto dto)
        {
            string storedCode;
            lock (_codeLock)
            {
                _resetCodes.TryGetValue(dto.Username, out storedCode);
            }

            if (storedCode == null || storedCode != dto.Code)
            {
                return BadRequest();
            }

            var user = _repository.GetUserByUsernameAndEmail(dto.Username, dto.Email);
            if (user == null)
            {
                return NotFound();
            }

            user.Password = dto.NewPassword;
            _repository.UpdateUser(user);
            _repository.SaveChanges();

            lock (_codeLock)
            {
                _resetCodes.Remove(dto.Username);
            }

            return Ok();
        }
    }
}

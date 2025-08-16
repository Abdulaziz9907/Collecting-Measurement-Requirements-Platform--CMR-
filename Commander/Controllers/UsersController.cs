using System;
using System.Collections.Generic;
using AutoMapper;
using Commander.Data;
using Commander.Dtos;
using Commander.Models;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;

namespace Commander.Controllers
{
    [Route("api/users")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly InterfaceRepo _repository;
        private readonly IMapper _mapper;

        public UsersController(InterfaceRepo repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        private static string NormalizeDigits(string input)
        {
            if (string.IsNullOrEmpty(input)) return string.Empty;
            var sb = new System.Text.StringBuilder(input.Length);
            foreach (var ch in input)
            {
                if (ch >= '\u0660' && ch <= '\u0669') sb.Append((char)('0' + (ch - '\u0660')));
                else if (ch >= '\u06F0' && ch <= '\u06F9') sb.Append((char)('0' + (ch - '\u06F0')));
                else sb.Append(ch);
            }
            return sb.ToString();
        }

        // POST api/users/login
        [HttpPost("login")]
        public ActionResult<UserReadDto> Login(UserLoginDto loginDto)
        {
            var login = NormalizeDigits(loginDto.Username);
            var user = _repository.AuthenticateUser(login, loginDto.Password);
            if (user == null)
                return Unauthorized();

            return Ok(_mapper.Map<UserReadDto>(user));
        }

        // GET api/users
        [HttpGet]
        public ActionResult<IEnumerable<UserReadDto>> GetAllUsers()
        {
            var userItems = _repository.GetAllUsers();
            return Ok(_mapper.Map<IEnumerable<UserReadDto>>(userItems));
        }

        // GET api/users/{Id}
        [HttpGet("{Id}", Name = "GetUserById")]
        public ActionResult<UserReadDto> GetUserById(int Id)
        {
            var userItem = _repository.GetUserById(Id);
            if (userItem == null)
                return NotFound();

            return Ok(_mapper.Map<UserReadDto>(userItem));
        }

        // POST api/users
        [HttpPost]
        public ActionResult<UserReadDto> CreateUser(UserCreateDto userCreateDto)
        {
            var username = NormalizeDigits(userCreateDto.Username).Trim();
            if (_repository.GetUserByUsername(username) != null)
                return Conflict(new { message = "Username already exists." });

            var userModel = _mapper.Map<User>(userCreateDto);
            userModel.Username = username;
            _repository.CreateUser(userModel);
            _repository.SaveChanges();

            var userReadDto = _mapper.Map<UserReadDto>(userModel);
            return CreatedAtRoute(nameof(GetUserById), new { Id = userReadDto.Id }, userReadDto);
        }

        // PUT api/users/{Id}
        [HttpPut("{Id}")]
        public ActionResult UpdateUser(int Id, UserUpdateDto userUpdateDto)
        {
            var userModelFromRepo = _repository.GetUserById(Id);
            if (userModelFromRepo == null)
                return NotFound();

            var newUsername = NormalizeDigits(userUpdateDto.Username).Trim();
            if (!string.Equals(userModelFromRepo.Username, newUsername, StringComparison.Ordinal))
            {
                var existing = _repository.GetUserByUsername(newUsername);
                if (existing != null && existing.Id != userModelFromRepo.Id)
                    return Conflict(new { message = "Username already exists." });
            }

            _mapper.Map(userUpdateDto, userModelFromRepo);
            userModelFromRepo.Username = newUsername;
            _repository.UpdateUser(userModelFromRepo);
            _repository.SaveChanges();

            return NoContent();
        }

        // PATCH api/users/{Id}
        [HttpPatch("{Id}")]
        public ActionResult PartialUserUpdate(int Id, JsonPatchDocument<UserUpdateDto> patchDocument)
        {
            var userModelFromRepo = _repository.GetUserById(Id);
            if (userModelFromRepo == null)
                return NotFound();

            var userToPatch = _mapper.Map<UserUpdateDto>(userModelFromRepo);
            patchDocument.ApplyTo(userToPatch, ModelState);

            if (!TryValidateModel(userToPatch))
                return ValidationProblem(ModelState);

            var newUsername = NormalizeDigits(userToPatch.Username).Trim();
            if (!string.Equals(userModelFromRepo.Username, newUsername, StringComparison.Ordinal))
            {
                var existing = _repository.GetUserByUsername(newUsername);
                if (existing != null && existing.Id != userModelFromRepo.Id)
                    return Conflict(new { message = "Username already exists." });
            }

            _mapper.Map(userToPatch, userModelFromRepo);
            userModelFromRepo.Username = newUsername;
            _repository.UpdateUser(userModelFromRepo);
            _repository.SaveChanges();

            return NoContent();
        }

        // DELETE api/users/{Id}
        [HttpDelete("{Id}")]
        public ActionResult DeleteUser(int Id)
        {
            var userModelFromRepo = _repository.GetUserById(Id);
            if (userModelFromRepo == null)
                return NotFound();

            _repository.DeleteUser(userModelFromRepo);
            _repository.SaveChanges();

            return NoContent();
        }
    }
}

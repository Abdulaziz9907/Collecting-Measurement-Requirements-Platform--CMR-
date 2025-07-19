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

        // POST api/users/login
        [HttpPost("login")]
        public ActionResult<UserReadDto> Login(UserLoginDto loginDto)
        {
            var user = _repository.AuthenticateUser(loginDto.Username, loginDto.Password);
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

        // GET api/users/{Employee_id}
        [HttpGet("{Employee_id}", Name = "GetUserById")]
        public ActionResult<UserReadDto> GetUserById(int Employee_id)
        {
            var userItem = _repository.GetUserById(Employee_id);
            if (userItem == null)
                return NotFound();

            return Ok(_mapper.Map<UserReadDto>(userItem));
        }

        // POST api/users
        [HttpPost]
        public ActionResult<UserReadDto> CreateUser(UserCreateDto userCreateDto)
        {
            var userModel = _mapper.Map<User>(userCreateDto);
            _repository.CreateUser(userModel);
            _repository.SaveChanges();

            var userReadDto = _mapper.Map<UserReadDto>(userModel);
            return CreatedAtRoute(nameof(GetUserById), new { Employee_id = userReadDto.Employee_id }, userReadDto);
        }

        // PUT api/users/{Employee_id}
        [HttpPut("{Employee_id}")]
        public ActionResult UpdateUser(int Employee_id, UserUpdateDto userUpdateDto)
        {
            var userModelFromRepo = _repository.GetUserById(Employee_id);
            if (userModelFromRepo == null)
                return NotFound();

            _mapper.Map(userUpdateDto, userModelFromRepo);
            _repository.UpdateUser(userModelFromRepo);
            _repository.SaveChanges();

            return NoContent();
        }

        // PATCH api/users/{Employee_id}
        [HttpPatch("{Employee_id}")]
        public ActionResult PartialUserUpdate(int Employee_id, JsonPatchDocument<UserUpdateDto> patchDocument)
        {
            var userModelFromRepo = _repository.GetUserById(Employee_id);
            if (userModelFromRepo == null)
                return NotFound();

            var userToPatch = _mapper.Map<UserUpdateDto>(userModelFromRepo);
            patchDocument.ApplyTo(userToPatch, ModelState);

            if (!TryValidateModel(userToPatch))
                return ValidationProblem(ModelState);

            _mapper.Map(userToPatch, userModelFromRepo);
            _repository.UpdateUser(userModelFromRepo);
            _repository.SaveChanges();

            return NoContent();
        }

        // DELETE api/users/{Employee_id}
        [HttpDelete("{Employee_id}")]
        public ActionResult DeleteUser(int Employee_id)
        {
            var userModelFromRepo = _repository.GetUserById(Employee_id);
            if (userModelFromRepo == null)
                return NotFound();

            _repository.DeleteUser(userModelFromRepo);
            _repository.SaveChanges();

            return NoContent();
        }
    }
}

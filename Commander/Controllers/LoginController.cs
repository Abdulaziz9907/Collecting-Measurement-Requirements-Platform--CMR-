using AutoMapper;
using Commander.Data;
using Commander.Dtos;
using Commander.Models;
using Microsoft.AspNetCore.Mvc;

namespace Commander.Controllers
{
    [Route("api/login")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly InterfaceRepo _repository;
        private readonly IMapper _mapper;

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
    }
}

using System.Collections.Generic;
using Commander.Data;
using Commander.Models;
using Microsoft.AspNetCore.Mvc;


namespace Commander.Controllers
{

    [Route("api/users")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly InterfaceRepo _repository;

        public UsersController(InterfaceRepo repository)
        {
            _repository = repository;
        }
        //private readonly TestInterfaceRepo _repository = new TestInterfaceRepo();

        //GET api/users
        [HttpGet]
        public ActionResult<IEnumerable<User>> GetAllUsers()
        {
            var userItems = _repository.GetAllUsers();

            return Ok(userItems);
        }

        //GET api/users/{Employee_id}
        [HttpGet("{Employee_id}")]
        public ActionResult<User> GetUserById(int Employee_id)
        {
            var userItems = _repository.GetUserById(Employee_id);
            return Ok(userItems);
        }

    }
}
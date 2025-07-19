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

        //POST api/users
        [HttpPost]
        public ActionResult<User> CreateUser(User user)
        {
            _repository.CreateUser(user);
            _repository.SaveChanges();
            return CreatedAtAction(nameof(GetUserById), new { Employee_id = user.Employee_id }, user);
        }

        //PUT api/users/{Employee_id}
        [HttpPut("{Employee_id}")]
        public ActionResult UpdateUser(int Employee_id, User user)
        {
            if (Employee_id != user.Employee_id)
            {
                return BadRequest();
            }

            var existingUser = _repository.GetUserById(Employee_id);
            if (existingUser == null)
            {
                return NotFound();
            }

            _repository.UpdateUser(user);
            _repository.SaveChanges();
            return NoContent();
        }

        //DELETE api/users/{Employee_id}
        [HttpDelete("{Employee_id}")]
        public ActionResult DeleteUser(int Employee_id)
        {
            var userItem = _repository.GetUserById(Employee_id);
            if (userItem == null)
            {
                return NotFound();
            }

            _repository.DeleteUser(userItem);
            _repository.SaveChanges();
            return NoContent();
        }

    }
}
using System.Collections.Generic;
using Commander.Data;
using Commander.Models;
using Microsoft.AspNetCore.Mvc;

namespace Commander.Controllers
{
    [Route("api/departments")]
    [ApiController]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentRepo _repository;

        public DepartmentsController(IDepartmentRepo repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Department>> GetAllDepartments()
        {
            var items = _repository.GetAllDepartments();
            return Ok(items);
        }

        [HttpGet("{id}")]
        public ActionResult<Department> GetDepartmentById(int id)
        {
            var item = _repository.GetDepartmentById(id);
            if(item == null)
            {
                return NotFound();
            }
            return Ok(item);
        }

        [HttpPost]
        public ActionResult<Department> CreateDepartment(Department department)
        {
            department.Created_at = DateTime.UtcNow;
            _repository.CreateDepartment(department);
            _repository.SaveChanges();
            return CreatedAtAction(nameof(GetDepartmentById), new { id = department.Department_id }, department);
        }

        [HttpPut("{id}")]
        public ActionResult UpdateDepartment(int id, Department department)
        {
            if(id != department.Department_id)
            {
                return BadRequest();
            }

            var existing = _repository.GetDepartmentById(id);
            if(existing == null)
            {
                return NotFound();
            }

            _repository.UpdateDepartment(department);
            _repository.SaveChanges();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult DeleteDepartment(int id)
        {
            var existing = _repository.GetDepartmentById(id);
            if(existing == null)
            {
                return NotFound();
            }

            _repository.DeleteDepartment(existing);
            _repository.SaveChanges();
            return NoContent();
        }
    }
}

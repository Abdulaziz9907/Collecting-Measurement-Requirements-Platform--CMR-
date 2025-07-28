using System.Collections.Generic;
using Commander.Data;
using Commander.Dtos;
using Commander.Models;
using Microsoft.AspNetCore.Mvc;

namespace Commander.Controllers
{
    [Route("api/standards")]
    [ApiController]
    public class StandardsController : ControllerBase
    {
        private readonly IStandardRepo _repository;

        public StandardsController(IStandardRepo repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Standard>> GetAll()
        {
            var items = _repository.GetAllStandards();
            return Ok(items);
        }

        [HttpPost]
        public ActionResult<Standard> CreateStandard(StandardCreateDto dto)
        {
            var standard = new Standard
            {
                Standard_number = dto.Standard_number,
                Standard_name = dto.Standard_name,
                Standard_goal = dto.Standard_goal,
                Standard_requirments = dto.Standard_requirments,
                Assigned_department_id = dto.Assigned_department_id,
                Proof_required = dto.Proof_required
            };

            _repository.CreateStandard(standard);
            _repository.SaveChanges();

            return CreatedAtAction(nameof(GetAll), new { id = standard.Standard_id }, standard);
        }
    }
}

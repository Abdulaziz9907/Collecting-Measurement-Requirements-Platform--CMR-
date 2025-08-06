using System.Collections.Generic;
using System.Linq;
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
        private readonly IAttachmentRepo _attachmentRepo;

        public StandardsController(IStandardRepo repository, IAttachmentRepo attachmentRepo)
        {
            _repository = repository;
            _attachmentRepo = attachmentRepo;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Standard>> GetAll()
        {
            var items = _repository.GetAllStandards().ToList();
            foreach (var s in items)
            {
                ValidateStatus(s);
            }
            _repository.SaveChanges();
            return Ok(items);
        }

        [HttpGet("{id}")]
        public ActionResult<Standard> GetById(int id)
        {
            var item = _repository.GetStandardById(id);
            if (item == null)
            {
                return NotFound();
            }
            ValidateStatus(item);
            _repository.SaveChanges();
            return Ok(item);
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

        [HttpPut("{id}")]
        public ActionResult UpdateStandard(int id, StandardUpdateDto dto)
        {
            if (id <= 0)
                return BadRequest();

            var existing = _repository.GetStandardById(id);
            if (existing == null)
                return NotFound();

            existing.Standard_number = dto.Standard_number;
            existing.Standard_name = dto.Standard_name;
            existing.Standard_goal = dto.Standard_goal;
            existing.Standard_requirments = dto.Standard_requirments;
            existing.Assigned_department_id = dto.Assigned_department_id;
            existing.Proof_required = dto.Proof_required;
            existing.Status = dto.Status;

            _repository.UpdateStandard(existing);
            _repository.SaveChanges();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult DeleteStandard(int id)
        {
            var existing = _repository.GetStandardById(id);
            if (existing == null)
            {
                return NotFound();
            }

            _repository.DeleteStandard(existing);
            _repository.SaveChanges();

            return NoContent();
        }

        [HttpPost("{id}/approve")]
        public ActionResult ApproveStandard(int id)
        {
            var existing = _repository.GetStandardById(id);
            if (existing == null) return NotFound();
            existing.Status = "معتمد";
            existing.Rejection_reason = null;
            _repository.UpdateStandard(existing);
            _repository.SaveChanges();
            return NoContent();
        }

        [HttpPost("{id}/reject")]
        public ActionResult RejectStandard(int id, [FromBody] string reason)
        {
            var existing = _repository.GetStandardById(id);
            if (existing == null) return NotFound();
            existing.Status = "غير معتمد";
            existing.Rejection_reason = reason;
            _repository.UpdateStandard(existing);
            _repository.SaveChanges();
            return NoContent();
        }

        private void ValidateStatus(Standard standard)
        {
            if (standard.Status == "معتمد" || standard.Status == "غير معتمد")
                return;

            var attachments = _attachmentRepo.GetAttachmentsByStandard(standard.Standard_id);
            var requiredProofs = (standard.Proof_required ?? "")
                .Split(',', System.StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim())
                .ToArray();

            string newStatus;
            if (!attachments.Any())
                newStatus = "لم يبدأ";
            else if (requiredProofs.Length > 0 && requiredProofs.All(rp => attachments.Any(a => a.Proof_name == rp)))
                newStatus = "مكتمل";
            else
                newStatus = "تحت العمل";

            if (standard.Status != newStatus)
            {
                standard.Status = newStatus;
                _repository.UpdateStandard(standard);
            }
        }
    }
}

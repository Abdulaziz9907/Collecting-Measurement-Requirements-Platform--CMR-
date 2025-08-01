using System.Collections.Generic;
using System.IO;
using System.Linq;
using Commander.Data;
using Commander.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;

namespace Commander.Controllers
{
    [Route("api/standards/{standardId}/attachments")]
    [ApiController]
    public class AttachmentsController : ControllerBase
    {
        private readonly IAttachmentRepo _repository;
        private readonly IStandardRepo _standardRepo;
        private readonly IWebHostEnvironment _env;

        public AttachmentsController(IAttachmentRepo repository, IStandardRepo standardRepo, IWebHostEnvironment env)
        {
            _repository = repository;
            _standardRepo = standardRepo;
            _env = env;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Attachment>> GetAll(int standardId)
        {
            return Ok(_repository.GetAttachmentsByStandard(standardId));
        }

        [HttpPost]
        public ActionResult<Attachment> Upload(int standardId, [FromForm] IFormFile file, [FromForm] string proofName)
        {
            var standard = _standardRepo.GetStandardById(standardId);
            if (standard == null) return NotFound();
            if (file == null || file.Length == 0) return BadRequest();

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsFolder);
            var fileName = Path.GetRandomFileName() + Path.GetExtension(file.FileName);
            var path = Path.Combine(uploadsFolder, fileName);
            using (var stream = System.IO.File.Create(path))
            {
                file.CopyTo(stream);
            }
            var attachment = new Attachment
            {
                Standard_id = standardId,
                FilePath = Path.Combine("uploads", fileName).Replace("\\", "/"),
                Proof_name = proofName
            };
            _repository.AddAttachment(attachment);
            _repository.SaveChanges();

            var count = _repository.GetAttachmentsByStandard(standardId).Count();
            var required = (standard.Proof_required ?? "").Split(',', System.StringSplitOptions.RemoveEmptyEntries).Length;
            if (count >= required && required > 0)
                standard.Status = "مكتمل";
            else
                standard.Status = "تحت العمل";
            _standardRepo.UpdateStandard(standard);
            _standardRepo.SaveChanges();
            return CreatedAtAction(nameof(GetAll), new { standardId }, attachment);
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(int standardId, int id)
        {
            var attachment = _repository.GetAttachment(id);
            if (attachment == null || attachment.Standard_id != standardId) return NotFound();
            _repository.DeleteAttachment(attachment);
            _repository.SaveChanges();
            return NoContent();
        }
    }
}

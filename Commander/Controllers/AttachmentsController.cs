using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Commander.Data;
using Commander.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Commander.Controllers
{
    [Route("api/standards/{standardId}/attachments")]
    [ApiController]
    public class AttachmentsController : ControllerBase
    {
        private readonly IAttachmentRepo _repository;
        private readonly IStandardRepo _standardRepo;

        public AttachmentsController(IAttachmentRepo repository, IStandardRepo standardRepo)
        {
            _repository = repository;
            _standardRepo = standardRepo;
        }

        private static string[] ParseProofs(string? raw)
        {
            if (string.IsNullOrEmpty(raw))
                return System.Array.Empty<string>();

            raw = raw.Replace('،', ',');
            var list = new System.Collections.Generic.List<string>();
            var sb = new StringBuilder();
            bool escape = false;

            foreach (var ch in raw)
            {
                if (escape)
                {
                    sb.Append(ch);
                    escape = false;
                }
                else if (ch == '\\')
                {
                    escape = true;
                }
                else if (ch == ',')
                {
                    var item = sb.ToString().Trim();
                    if (!string.IsNullOrWhiteSpace(item))
                        list.Add(item);
                    sb.Clear();
                }
                else
                {
                    sb.Append(ch);
                }
            }

            var last = sb.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(last))
                list.Add(last);

            return list.ToArray();
        }

        [HttpGet]
        public ActionResult<IEnumerable<object>> GetAll(int standardId)
        {
            var list = _repository
                .GetAttachmentsByStandard(standardId)
                .Select(a => new
                {
                    a.Attachment_id,
                    a.Standard_id,
                    a.Proof_name,
                    a.FileName,
                    a.Uploaded_date
                });
            return Ok(list);
        }

        [HttpPost]
        public ActionResult Upload(int standardId, [FromForm] IFormFile file, [FromForm] string proofName)
        {
            var standard = _standardRepo.GetStandardById(standardId);
            if (standard == null) return NotFound();
            if (file == null || file.Length == 0) return BadRequest();

            var wasRejected = standard.Status == "غير معتمد";

            using var ms = new MemoryStream();
            file.CopyTo(ms);

            var attachment = new Attachment
            {
                Standard_id = standardId,
                Proof_name = proofName,
                FileName = Path.GetFileName(file.FileName),
                FileData = ms.ToArray()
            };

            _repository.AddAttachment(attachment);
            _repository.SaveChanges();

            var attachments = _repository.GetAttachmentsByStandard(standardId);
            var requiredProofs = ParseProofs(standard.Proof_required);

            bool allProofsHaveFiles = requiredProofs.All(rp =>
                attachments.Any(a => a.Proof_name == rp));

            if (!attachments.Any())
                standard.Status = "لم يبدأ";
            else if (allProofsHaveFiles && requiredProofs.Length > 0)
                standard.Status = "مكتمل";
            else
                standard.Status = "تحت العمل";

            if (wasRejected)
                standard.Rejection_reason = null;
            _standardRepo.UpdateStandard(standard);
            _standardRepo.SaveChanges();
            return CreatedAtAction(nameof(GetAll), new { standardId }, new { attachment.Attachment_id });
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(int standardId, int id)
        {
            var attachment = _repository.GetAttachment(id);
            if (attachment == null || attachment.Standard_id != standardId) return NotFound();
            _repository.DeleteAttachment(attachment);
            _repository.SaveChanges();

            var standard = _standardRepo.GetStandardById(standardId);
            if (standard != null)
            {
                var attachments = _repository.GetAttachmentsByStandard(standardId);
                if (!attachments.Any())
                {
                    standard.Status = "لم يبدأ";
                }
                else
                {
                    var requiredProofs = ParseProofs(standard.Proof_required);

                    bool allProofsHaveFiles = requiredProofs.All(rp =>
                        attachments.Any(a => a.Proof_name == rp));

                    if (allProofsHaveFiles && requiredProofs.Length > 0)
                        standard.Status = "مكتمل";
                    else
                        standard.Status = "تحت العمل";
                }
                _standardRepo.UpdateStandard(standard);
                _standardRepo.SaveChanges();
            }

            return NoContent();
        }

        [HttpGet("{id}")]
        public ActionResult Download(int standardId, int id)
        {
            var attachment = _repository.GetAttachment(id);
            if (attachment == null || attachment.Standard_id != standardId) return NotFound();
            return File(attachment.FileData, "application/octet-stream", attachment.FileName);
        }
    }
}

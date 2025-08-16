using System;
using System.Collections.Generic;
using System.Linq;
using System.Globalization;
using System.Text;
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

        // ---------- Helpers ----------
        private static string[] ParseProofs(string? raw)
        {
            if (string.IsNullOrEmpty(raw))
                return Array.Empty<string>();

            // Treat Arabic commas like English ones and support escaping via "\,"
            raw = raw.Replace('،', ',');

            var list = new List<string>();
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

        private bool IsComplete(Standard standard)
        {
            var attachments = _attachmentRepo.GetAttachmentsByStandard(standard.Standard_id);
            var required = ParseProofs(standard.Proof_required);
            return required.Length > 0 &&
                   required.All(rp => attachments.Any(a =>
                        string.Equals(a.Proof_name, rp, StringComparison.OrdinalIgnoreCase)));
        }

        private string ComputeStatus(Standard standard)
        {
            var attachments = _attachmentRepo.GetAttachmentsByStandard(standard.Standard_id);
            var required = ParseProofs(standard.Proof_required);

            if (!attachments.Any())
                return "لم يبدأ";

            if (required.Length > 0 &&
                required.All(rp => attachments.Any(a =>
                    string.Equals(a.Proof_name, rp, StringComparison.OrdinalIgnoreCase))))
                return "مكتمل";

            return "تحت العمل";
        }

        // ===== Rejection log helpers (no new endpoints/tables; store inside Rejection_reason) =====
        private struct RejectLogEntry
        {
            public DateTime At;
            public string Reason;
        }

        // Format kept inside one text column:
        // [CURRENT] <latest reason>
        // [H]2025-08-13T11:22:33.4567890Z|older reason
        private static (string current, List<RejectLogEntry> history) ParseRejectLog(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
                return ("", new());

            var lines = raw.Replace("\r", "").Split('\n', StringSplitOptions.RemoveEmptyEntries);
            string current = "";
            var hist = new List<RejectLogEntry>();

            foreach (var line in lines)
            {
                if (line.StartsWith("[CURRENT] "))
                {
                    current = line.Substring(10);
                }
                else if (line.StartsWith("[H]"))
                {
                    var idx = line.IndexOf('|');
                    if (idx > 3)
                    {
                        var ts = line.Substring(3, idx - 3);
                        if (DateTime.TryParse(ts, null, DateTimeStyles.RoundtripKind, out var at))
                        {
                            hist.Add(new RejectLogEntry { At = at, Reason = line[(idx + 1)..] });
                        }
                    }
                }
                else
                {
                    // legacy plain string => treat as current
                    if (string.IsNullOrEmpty(current))
                        current = line;
                    else
                        current += "\n" + line;
                }
            }

            return (current, hist);
        }

        private static string BuildRejectLog(string current, IEnumerable<RejectLogEntry> history)
        {
            var sb = new StringBuilder();

            if (!string.IsNullOrWhiteSpace(current))
                sb.AppendLine("[CURRENT] " + current.Trim());

            foreach (var h in history.OrderByDescending(x => x.At))
                sb.Append("[H]")
                  .Append(h.At.ToString("o"))
                  .Append('|')
                  .AppendLine(h.Reason ?? "");

            return sb.ToString().TrimEnd();
        }

        // ---------- Endpoints ----------

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
                Proof_required = dto.Proof_required,
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

            // Keep copies before applying changes
            var oldStatus = existing.Status ?? "";
            var oldProofs = new HashSet<string>(
                ParseProofs(existing.Proof_required),
                StringComparer.OrdinalIgnoreCase);

            // Apply incoming changes
            existing.Standard_number = dto.Standard_number;
            existing.Standard_name = dto.Standard_name;
            existing.Standard_goal = dto.Standard_goal;
            existing.Standard_requirments = dto.Standard_requirments;
            existing.Assigned_department_id = dto.Assigned_department_id;
            existing.Proof_required = dto.Proof_required;

            // Allow client to set Status normally (e.g., non-approved states)
            // but we may override it below for the downgrade rule.
            existing.Status = dto.Status;

            // --- Downgrade rule for "معتمد"
            var newProofs = new HashSet<string>(
                ParseProofs(existing.Proof_required),
                StringComparer.OrdinalIgnoreCase);

            bool addedProof = newProofs.Except(oldProofs).Any();

            if (string.Equals(oldStatus, "معتمد", StringComparison.OrdinalIgnoreCase))
            {
                var stillComplete = IsComplete(existing);
                if (addedProof || !stillComplete)
                {
                    existing.Status = "تحت العمل";
                    // existing.Rejection_reason = null; // keep logs untouched
                }
                else
                {
                    existing.Status = "معتمد";
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(dto.Status))
                {
                    existing.Status = ComputeStatus(existing);
                }
            }

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

            // Optional hardening: only approve when complete
            if (!IsComplete(existing))
            {
                return BadRequest("لا يمكن اعتماد المعيار قبل استكمال جميع مستندات الإثبات المطلوبة.");
            }

            // Move current reject reason to history (if any) and clear current
            var (current, hist) = ParseRejectLog(existing.Rejection_reason);
            if (!string.IsNullOrWhiteSpace(current))
            {
                hist.Add(new RejectLogEntry { At = DateTime.UtcNow, Reason = current });
            }

            existing.Status = "معتمد";
            existing.Rejection_reason = BuildRejectLog("", hist);

            _repository.UpdateStandard(existing);
            _repository.SaveChanges();
            return NoContent();
        }

        [HttpPost("{id}/reject")]
        public ActionResult RejectStandard(int id, [FromBody] string reason)
        {
            var existing = _repository.GetStandardById(id);
            if (existing == null) return NotFound();

            // Append previous CURRENT (if any) to history, then set new CURRENT (do NOT double log)
            var (current, hist) = ParseRejectLog(existing.Rejection_reason);
            if (!string.IsNullOrWhiteSpace(current))
                hist.Add(new RejectLogEntry { At = DateTime.UtcNow, Reason = current });

            // New current reason
            var newCurrent = reason ?? "";

            existing.Status = "غير معتمد";
            existing.Rejection_reason = BuildRejectLog(newCurrent, hist);

            _repository.UpdateStandard(existing);
            _repository.SaveChanges();
            return NoContent();
        }

        // NEW: simple status setter to support frontend fallback calls
        public class StatusChangeDto
        {
            public string Status { get; set; }
            public string Note { get; set; }
        }

        [HttpPost("{id}/status")]
        public ActionResult SetStatus(int id, [FromBody] StatusChangeDto body)
        {
            var existing = _repository.GetStandardById(id);
            if (existing == null) return NotFound();

            var newStatus = (body?.Status ?? "").Trim();

            // Optional hardening again for "معتمد"
            if (string.Equals(newStatus, "معتمد", StringComparison.OrdinalIgnoreCase) && !IsComplete(existing))
            {
                return BadRequest("لا يمكن اعتماد المعيار قبل استكمال جميع مستندات الإثبات المطلوبة.");
            }

            existing.Status = newStatus;
            _repository.UpdateStandard(existing);
            _repository.SaveChanges();

            return NoContent();
        }

        [HttpPost("{id}/reset-review")]
        public ActionResult ResetReview(int id)
        {
            var s = _repository.GetStandardById(id);
            if (s == null) return NotFound();

            // Move CURRENT to history if present, clear current, set "تحت العمل"
            var (current, hist) = ParseRejectLog(s.Rejection_reason);
            if (!string.IsNullOrWhiteSpace(current))
                hist.Add(new RejectLogEntry { At = DateTime.UtcNow, Reason = current });

            s.Status = "تحت العمل";
            s.Rejection_reason = BuildRejectLog("", hist);

            _repository.UpdateStandard(s);
            _repository.SaveChanges();
            return NoContent();
        }

        // Keeps approved/rejected frozen during GETs (your original behavior)
        private void ValidateStatus(Standard standard)
        {
            if (standard.Status == "معتمد" || standard.Status == "غير معتمد")
                return;

            var attachments = _attachmentRepo.GetAttachmentsByStandard(standard.Standard_id);
            var requiredProofs = ParseProofs(standard.Proof_required);

            string newStatus;
            if (!attachments.Any())
                newStatus = "لم يبدأ";
            else if (requiredProofs.Length > 0 && requiredProofs.All(rp =>
                         attachments.Any(a => string.Equals(a.Proof_name, rp, StringComparison.OrdinalIgnoreCase))))
                newStatus = "مكتمل";
            else
                newStatus = "تحت العمل";

            if (!string.Equals(standard.Status, newStatus, StringComparison.Ordinal))
            {
                standard.Status = newStatus;
                _repository.UpdateStandard(standard);
            }
        }
    }
}

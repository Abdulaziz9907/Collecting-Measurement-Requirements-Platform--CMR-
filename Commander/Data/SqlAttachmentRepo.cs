using System;
using System.Collections.Generic;
using System.Linq;
using Commander.Models;
using Microsoft.EntityFrameworkCore;

namespace Commander.Data
{
    public class SqlAttachmentRepo : IAttachmentRepo
    {
        private readonly InterfaceContext _context;

        public SqlAttachmentRepo(InterfaceContext context)
        {
            _context = context;
        }

        public bool SaveChanges()
        {
            return _context.SaveChanges() >= 0;
        }

        public IEnumerable<Attachment> GetAttachmentsByStandard(int standardId)
        {
            return _context.Attachments.Where(a => a.Standard_id == standardId).ToList();
        }

        public Attachment? GetAttachment(int id)
        {
            return _context.Attachments.FirstOrDefault(a => a.Attachment_id == id);
        }

        public void AddAttachment(Attachment attachment)
        {
            if (attachment == null) throw new ArgumentNullException(nameof(attachment));
            _context.Attachments.Add(attachment);
        }

        public void UpdateAttachment(Attachment attachment)
        {
            _context.Entry(attachment).State = EntityState.Modified;
        }

        public void DeleteAttachment(Attachment attachment)
        {
            if (attachment != null) _context.Attachments.Remove(attachment);
        }
    }
}

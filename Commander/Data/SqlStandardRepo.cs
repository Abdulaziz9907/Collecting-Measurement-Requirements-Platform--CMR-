using System;
using System.Collections.Generic;
using System.Linq;
using Commander.Models;
using Microsoft.EntityFrameworkCore;

namespace Commander.Data
{
    public class SqlStandardRepo : IStandardRepo
    {
        private readonly InterfaceContext _context;

        public SqlStandardRepo(InterfaceContext context)
        {
            _context = context;
        }

        public bool SaveChanges()
        {
            return _context.SaveChanges() >= 0;
        }

        public IEnumerable<Standard> GetAllStandards()
        {
            return _context.Standards
                .Include(s => s.Attachments)
                .ToList();
        }

        public Standard? GetStandardById(int id)
        {
            return _context.Standards
                .Include(s => s.Attachments)
                .FirstOrDefault(s => s.Standard_id == id);
        }

        public void CreateStandard(Standard standard)
        {
            if (standard == null)
                throw new ArgumentNullException(nameof(standard));

            _context.Standards.Add(standard);
        }

        public void AddAttachment(Attachment attachment)
        {
            if (attachment == null)
                throw new ArgumentNullException(nameof(attachment));
            _context.Attachments.Add(attachment);
        }
    }
}

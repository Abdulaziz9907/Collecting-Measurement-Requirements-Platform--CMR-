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
                .Include(s => s.Proof_required)
                .ToList();
        }

        public Standard? GetStandardById(int id)
        {
            return _context.Standards
                .Include(s => s.Proof_required)
                .FirstOrDefault(s => s.Standard_id == id);
        }

        public void CreateStandard(Standard standard)
        {
            if (standard == null)
                throw new ArgumentNullException(nameof(standard));

            _context.Standards.Add(standard);
        }

        // No explicit method needed to add proof documents since they are saved
        // with the Standard entity via the navigation property.
    }
}

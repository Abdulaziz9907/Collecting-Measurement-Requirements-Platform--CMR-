using Commander.Models;
using Microsoft.EntityFrameworkCore;

namespace Commander.Data
{
    public class InterfaceContext : DbContext
    {
        public InterfaceContext(DbContextOptions<InterfaceContext> opt) : base(opt)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Standard> Standards { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<PerformanceReport> PerformanceReports { get; set; }


    }
}

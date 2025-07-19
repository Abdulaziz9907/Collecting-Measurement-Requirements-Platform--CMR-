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
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<PerformanceReport> PerformanceReports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Fix for multiple cascade paths in Notifications
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.Employee_id)
                .OnDelete(DeleteBehavior.Restrict);  // Avoid cascade from Users

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Standard)
                .WithMany(s => s.Notifications)
                .HasForeignKey(n => n.Standard_id)
                .OnDelete(DeleteBehavior.Cascade);  // Keep cascade from Standards
        }
    }
}

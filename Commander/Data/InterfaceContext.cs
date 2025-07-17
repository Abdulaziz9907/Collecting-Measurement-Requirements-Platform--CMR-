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

    }
}

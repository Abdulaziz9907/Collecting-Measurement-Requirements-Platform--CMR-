using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commander.Models
{
    public class PerformanceReport
    {
        [Key]
        public int Report_id { get; set; }

        [ForeignKey("Department")]
        public required int Department_id { get; set; }

        public int Total_standards { get; set; }

        public int Completed_standards { get; set; }

        public int Pending_standards { get; set; }

        public DateTime Completed_at { get; set; } = DateTime.UtcNow;

        public Department? Department { get; set; }
    }
}

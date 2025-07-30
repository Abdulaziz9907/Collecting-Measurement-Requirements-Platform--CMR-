using System.ComponentModel.DataAnnotations;

namespace Commander.Models
{
    public class Department
    {
        [Key]
        public int Department_id { get; set; }

        [MaxLength(50)]
        public required string Department_name { get; set; }
        public required int Building_number { get; set; }
        public ICollection<User>? Users { get; set; }
        public ICollection<Standard>? Standards { get; set; }
        public ICollection<PerformanceReport>? PerformanceReports { get; set; }
    }
}

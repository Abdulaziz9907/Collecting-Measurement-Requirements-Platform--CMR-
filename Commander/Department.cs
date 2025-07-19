using System.ComponentModel.DataAnnotations;

namespace Commander.Models
{
    public class Department
    {
        [Key]
        [MaxLength(7)]
        public required int Department_id { get; set; }

        [MaxLength(32)]
        public required string Department_name { get; set; }
    }
}

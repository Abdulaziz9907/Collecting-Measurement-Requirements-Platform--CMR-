using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commander.Models
{


    public class User
    {
        [Key]
        public required int Id { get; set; }

        [MaxLength(7)]
        public required int Employee_id { get; set; }

        [MaxLength(15)]
        public required string Username { get; set; }

        [MaxLength(30)]
        public required string Password { get; set; }

        [MaxLength(16)]
        public required string First_name { get; set; }

        [MaxLength(16)]
        public required string Last_name { get; set; }

        [MaxLength(20)]
        public string? Email { get; set; }

        // Increased to accommodate longer role names like "Management"
        // Further expanded to ensure future roles are accommodated
        // Extended again to avoid truncation errors when saving longer roles
        [MaxLength(50)]
        public required string Role { get; set; }

        [ForeignKey("Department")]
        public int Department_id { get; set; }

        public Department? Department { get; set; }


    }

}
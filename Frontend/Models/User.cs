using System.ComponentModel.DataAnnotations;

namespace Frontend.Models
{
    public class User
    {
        [Key]
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

        [MaxLength(10)]
        public required string Role { get; set; }
    }
}

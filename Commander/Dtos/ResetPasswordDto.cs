using System.ComponentModel.DataAnnotations;

namespace Commander.Dtos
{
    public class ResetPasswordDto
    {
        [Required]
        public string Username { get; set; }

        [Required]
        public string Email { get; set; }

        [Required]
        public string Code { get; set; }

        [Required]
        public string NewPassword { get; set; }
    }
}

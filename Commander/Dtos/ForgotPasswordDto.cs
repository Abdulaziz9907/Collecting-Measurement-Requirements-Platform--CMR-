using System.ComponentModel.DataAnnotations;

namespace Commander.Dtos
{
    public class ForgotPasswordDto
    {
        [Required]
        public string Username { get; set; }

        [Required]
        public string Email { get; set; }
    }
}

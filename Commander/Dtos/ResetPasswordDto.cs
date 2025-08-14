namespace Commander.Dtos
{
    public class ResetPasswordDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Code { get; set; }
        public string NewPassword { get; set; }
    }
}

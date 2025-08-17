namespace Commander.Dtos
{
    public class EmailChangeVerifyDto
    {
        public int UserId { get; set; }
        public string NewEmail { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}

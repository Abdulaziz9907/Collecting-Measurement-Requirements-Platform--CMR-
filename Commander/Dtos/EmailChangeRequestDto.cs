namespace Commander.Dtos
{
    public class EmailChangeRequestDto
    {
        public int UserId { get; set; }
        public string NewEmail { get; set; } = string.Empty;
    }
}

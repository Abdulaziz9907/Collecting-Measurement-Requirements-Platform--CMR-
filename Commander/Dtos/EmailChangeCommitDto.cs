namespace Commander.Dtos
{
    public class EmailChangeCommitDto
    {
        public int UserId { get; set; }
        public string NewEmail { get; set; } = string.Empty;
    }
}

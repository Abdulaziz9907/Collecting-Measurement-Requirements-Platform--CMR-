namespace Commander.Dtos
{
    public class EmailChangeCurrentVerifyDto
    {
        public int UserId { get; set; }
        public string Code { get; set; } = string.Empty;
    }
}

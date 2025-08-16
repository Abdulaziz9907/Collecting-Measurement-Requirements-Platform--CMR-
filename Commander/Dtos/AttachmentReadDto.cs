namespace Commander.Dtos
{
    public class AttachmentReadDto
    {
        public int Attachment_id { get; set; }
        public int Standard_id { get; set; }
        public string Proof_name { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public System.DateTime Uploaded_date { get; set; }
    }
}

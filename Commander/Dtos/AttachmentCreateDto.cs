using Microsoft.AspNetCore.Http;

namespace Commander.Dtos
{
    public class AttachmentCreateDto
    {
        public IFormFile File { get; set; } = null!;
        public string Proof_name { get; set; } = string.Empty;
    }
}

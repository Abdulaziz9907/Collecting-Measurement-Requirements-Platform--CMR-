using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commander.Models
{
    public class Attachment
    {
        [Key]
        public int Attachment_id { get; set; }

        [ForeignKey("Standard")]
        public required int Standard_id { get; set; }

        public DateTime Uploaded_date { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public required string Proof_name { get; set; }

        [MaxLength(255)]
        public required string FilePath { get; set; } // stores the path or URL to the uploaded file

        public Standard? Standard { get; set; }
    }
}

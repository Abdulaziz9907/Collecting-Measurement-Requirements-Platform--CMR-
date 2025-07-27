using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commander.Models
{
    // Stores a single textual proof requirement for a Standard
    public class ProofDocument
    {
        [Key]
        public int ProofDocument_id { get; set; }

        [ForeignKey("Standard")]
        public required int Standard_id { get; set; }

        public DateTime Uploaded_date { get; set; } = DateTime.UtcNow;

        [MaxLength(255)]
        public required string DocumentText { get; set; }

        public Standard? Standard { get; set; }
    }
}

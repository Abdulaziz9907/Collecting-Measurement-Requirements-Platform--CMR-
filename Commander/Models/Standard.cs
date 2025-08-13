using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commander.Models
{
    public class Standard
    {
        [Key]
        public int Standard_id { get; set; }

        [MaxLength(50)]
        public required string Standard_number { get; set; } = string.Empty;

        // Names tend to be longer in practice—200 is a good ceiling
        [MaxLength(200)]
        public required string Standard_name { get; set; } = string.Empty;

        // Make long-text fields NVARCHAR(MAX)
        [Column(TypeName = "nvarchar(max)")]
        public string? Standard_goal { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? Standard_requirments { get; set; }

        [ForeignKey("Department")]
        public required int Assigned_department_id { get; set; }

        // Keep Status short and bounded (optional but cleaner)
        [MaxLength(50)]
        public string Status { get; set; } = "لم يبدأ";

        public DateTime Created_at { get; set; } = DateTime.UtcNow;

        public Department? Department { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? Proof_required { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? Rejection_reason { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commander.Models
{
    public class Standard
    {
        [Key]
        public int Standard_id { get; set; }

        [MaxLength(100)]
        public required string Standard_name { get; set; }

        [MaxLength(255)]
        public string? Standard_description { get; set; }

        public bool Proof_required { get; set; }

        [ForeignKey("Department")]
        public required int Assigned_department_id { get; set; }

        public string Status { get; set; } = "Pending";

        public DateTime Created_at { get; set; } = DateTime.UtcNow;

        public Department? Department { get; set; }
        public ICollection<Attachment>? Attachments { get; set; }
        public ICollection<Notification>? Notifications { get; set; }
    }
}

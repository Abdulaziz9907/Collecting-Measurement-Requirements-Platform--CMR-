using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commander.Models
{
    public class Notification
    {
        [Key]
        public int Notification_id { get; set; }

        [ForeignKey("User")]
        public required int Employee_id { get; set; }

        [ForeignKey("Standard")]
        public required int Standard_id { get; set; }

        public required string Message { get; set; }

        public bool Is_read { get; set; } = false;

        public User? User { get; set; }
        public Standard? Standard { get; set; }
    }
}

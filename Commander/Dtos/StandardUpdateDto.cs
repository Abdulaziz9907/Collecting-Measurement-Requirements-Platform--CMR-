using System.ComponentModel.DataAnnotations;

namespace Commander.Dtos
{
    public class StandardUpdateDto
    {
        public int Standard_number { get; set; }

        [Required]
        public string Standard_name { get; set; } = string.Empty;

        public string? Standard_goal { get; set; }

        public string? Standard_requirments { get; set; }

        [Required]
        public int Assigned_department_id { get; set; }

        public string? Proof_required { get; set; }

        public string Status { get; set; } = "لم يبدأ";
    }
}

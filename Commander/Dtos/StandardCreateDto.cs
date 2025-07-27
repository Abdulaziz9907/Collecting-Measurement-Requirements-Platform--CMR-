using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Commander.Dtos
{
    public class StandardCreateDto
    {
        [Required]
        public string Standard_name { get; set; } = string.Empty;

        public string? Standard_goal { get; set; }

        public string? Standard_requirments { get; set; }

        [Required]
        public int Assigned_department_id { get; set; }

        public List<string>? Attachments { get; set; }
    }
}

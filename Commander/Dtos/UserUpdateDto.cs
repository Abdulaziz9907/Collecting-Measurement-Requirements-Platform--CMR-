using System.ComponentModel.DataAnnotations;

namespace Commander.Dtos
{


    public class UserUpdateDto
    {
        public required int Employee_id { get; set; }

        public required string Username { get; set; }

        public required string Password { get; set; }

        public required string First_name { get; set; }

        public required string Last_name { get; set; }

        public string? Email { get; set; }

        public required string Role { get; set; }

        public required int Department_id { get; set; }



    }

}
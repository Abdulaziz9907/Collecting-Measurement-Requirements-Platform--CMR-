using System.Collections.Generic;
using Commander.Models;

namespace Commander.Data
{
    public class TestInterfaceRepo : InterfaceRepo
    {

        public IEnumerable<User> GetAllUsers()
        {
            var users = new List<User>
            {
                new User{Employee_id=0, Username="admin", First_name="Boil", Last_name="Kettle",Email="ss@gmail.com" ,Role="admin" , Department_id=0},
                new User{Employee_id=1, Username="ggg166", First_name="Bhgf", Last_name="Kettle",Email="nns@gmail.com" ,Role="user" , Department_id=2},
                new User{Employee_id=2, Username="bbb4343", First_name="asda", Last_name="ffa",Email="ttts@gmail.com" ,Role="user" , Department_id=4},
            };

            return users;
        }

        public User GetUserById(int Employee_id)
        {
            return new User { Employee_id = 0, Username = "admin123", First_name = "Boil", Last_name = "Kettle", Email = "ss@gmail.com", Role = "admin", Department_id = 0 };
        }
    }
}
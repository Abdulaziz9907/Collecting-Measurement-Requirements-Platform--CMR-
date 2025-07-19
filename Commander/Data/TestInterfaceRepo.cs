using System.Collections.Generic;
using System.Linq;
using Commander.Models;

namespace Commander.Data
{
    public class TestInterfaceRepo : InterfaceRepo
    {
        private readonly List<User> _users = new List<User>
        {
            new User{Employee_id=0, Username="admin", First_name="Boil", Last_name="Kettle",Email="ss@gmail.com" ,Role="admin" , Department_id=0},
            new User{Employee_id=1, Username="ggg166", First_name="Bhgf", Last_name="Kettle",Email="nns@gmail.com" ,Role="user" , Department_id=2},
            new User{Employee_id=2, Username="bbb4343", First_name="asda", Last_name="ffa",Email="ttts@gmail.com" ,Role="user" , Department_id=4},
        };

        public bool SaveChanges() => true;

        public IEnumerable<User> GetAllUsers()
        {
            return _users;
        }

        public User GetUserById(int Employee_id)
        {
            return _users.FirstOrDefault(p => p.Employee_id == Employee_id);
        }

        public void CreateUser(User user)
        {
            _users.Add(user);
        }

        public void UpdateUser(User user)
        {
            var index = _users.FindIndex(p => p.Employee_id == user.Employee_id);
            if (index >= 0)
            {
                _users[index] = user;
            }
        }

        public void DeleteUser(User user)
        {
            _users.RemoveAll(p => p.Employee_id == user.Employee_id);
        }
    }
}
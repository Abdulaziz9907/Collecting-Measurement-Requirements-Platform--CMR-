using System.Collections.Generic;
using System.Linq;
using Commander.Models;

namespace Commander.Data
{
    public class TestInterfaceRepo : InterfaceRepo
    {
        private readonly List<User> _users = new()
        {
            new User{Employee_id=1, Username="admin", Password="password", First_name="Admin", Last_name="User", Email="admin@example.com", Role="admin", Department_id=0},
            new User{Employee_id=2, Username="user1", Password="userpass", First_name="Normal", Last_name="User", Email="user1@example.com", Role="user", Department_id=1}
        };

        public bool SaveChanges() => true;

        public IEnumerable<User> GetAllUsers() => _users;

        public User GetUserById(int Employee_id) => _users.FirstOrDefault(u => u.Employee_id == Employee_id)!;

        public void CreateUser(User user) => _users.Add(user);

        public void UpdateUser(User user)
        {
            var index = _users.FindIndex(u => u.Employee_id == user.Employee_id);
            if (index >= 0)
            {
                _users[index] = user;
            }
        }

        public void DeleteUser(User user) => _users.RemoveAll(u => u.Employee_id == user.Employee_id);

        public User? AuthenticateUser(string username, string password) =>
            _users.FirstOrDefault(u => u.Username == username && u.Password == password);
    }
}

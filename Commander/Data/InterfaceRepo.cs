using System.Collections.Generic;
using Commander.Models;

namespace Commander.Data
{
    public interface InterfaceRepo
    {
        bool SaveChanges();

        IEnumerable<User> GetAllUsers();
        User GetUserById(int Employee_id);
        void CreateUser(User user);
        void UpdateUser(User user);
        void DeleteUser(User user);

        User? AuthenticateUser(string username, string password);
    }
}

using System.Collections.Generic;
using Commander.Models;

namespace Commander.Data
{
    public interface InterfaceRepo
    {

        IEnumerable<User> GetAllUsers();
        User GetUserById(int Employee_id);

    }
}
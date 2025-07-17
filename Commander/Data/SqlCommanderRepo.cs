using Commander.Models;

namespace Commander.Data
{
    public class SqlCommanderRepo : InterfaceRepo
    {
        private readonly InterfaceContext _context;

        public SqlCommanderRepo(InterfaceContext context)
        {
            _context = context;
        }

        public IEnumerable<User> GetAllUsers()
        {
            return _context.Users.ToList();
        }

        public User GetUserById(int Employee_id)
        {
            return _context.Users.FirstOrDefault(p => p.Employee_id == Employee_id);
        }
    }
}
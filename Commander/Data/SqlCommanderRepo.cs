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

        public void CreateUser(User user)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user));
            }

            _context.Users.Add(user);

        }

        public void DeleteUser(User user)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user));
            }

            _context.Users.Remove(user);


        }

        public IEnumerable<User> GetAllUsers()
        {
            return _context.Users.ToList();
        }

        public User GetUserById(int Employee_id)
        {
            return _context.Users.FirstOrDefault(p => p.Employee_id == Employee_id);
        }

        public bool SaveChanges()
        {
            return _context.SaveChanges() >= 0;
        }

        public void UpdateUser(User user)
        {
            //
        }
    }
}
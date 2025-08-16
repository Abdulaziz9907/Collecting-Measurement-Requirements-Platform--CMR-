using System;
using System.Collections.Generic;
using System.Linq;
using Commander.Models;
using Microsoft.EntityFrameworkCore;

namespace Commander.Data
{
    public class SqlCommanderRepo : InterfaceRepo
    {
        private readonly InterfaceContext _context;

        public SqlCommanderRepo(InterfaceContext context)
        {
            _context = context;
        }

        public bool SaveChanges() => _context.SaveChanges() >= 0;

        public IEnumerable<User> GetAllUsers()
            => _context.Users.AsNoTracking().ToList();

        public User GetUserById(int Employee_id)
            => _context.Users.AsNoTracking().FirstOrDefault(p => p.Employee_id == Employee_id);

        public void CreateUser(User user)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));
            _context.Users.Add(user);
        }

        public void UpdateUser(User user)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));
            _context.Entry(user).State = EntityState.Modified;
        }

        public void DeleteUser(User user)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));
            _context.Users.Remove(user);
        }


        public User? AuthenticateUser(string login, string password)
        {
            if (string.IsNullOrWhiteSpace(login) || password == null)
                return null;

            var p = password; // TODO: store hashed passwords in production
            var trimmed = login.Trim();

            if (int.TryParse(trimmed, out var empId))
            {
                return _context.Users.FirstOrDefault(x =>
                    x.Employee_id == empId &&
                    EF.Functions.Collate(x.Password, "SQL_Latin1_General_CP1_CS_AS") == p);
            }

            var u = trimmed;
            return _context.Users.FirstOrDefault(x =>
                EF.Functions.Collate(x.Username ?? "", "SQL_Latin1_General_CP1_CS_AS") == u &&
                EF.Functions.Collate(x.Password, "SQL_Latin1_General_CP1_CS_AS") == p);
        }

        public User? GetUserByLoginAndEmail(string login, string email)
        {
            if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(email))
                return null;

            var trimmed = login.Trim();
            var e = email.Trim().ToLower();
            var query = _context.Users.AsNoTracking();

            if (int.TryParse(trimmed, out var empId))
            {
                return query.FirstOrDefault(x =>
                    x.Employee_id == empId &&
                    (x.Email ?? "").ToLower() == e);
            }

            var u = trimmed;
            return query.FirstOrDefault(x =>
                EF.Functions.Collate(x.Username ?? "", "SQL_Latin1_General_CP1_CS_AS") == u &&
                (x.Email ?? "").ToLower() == e);
        }


    }
}

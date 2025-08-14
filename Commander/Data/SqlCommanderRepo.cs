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

        // ---------------- EF-translatable, case-insensitive matching ----------------
        // Option A (works regardless of DB collation): compare LOWER() of both sides.
        // Note: calling ToLower() on columns can reduce index usage. If your SQL Server
        // collation is already case-insensitive, prefer Option B (see below).
        public User? AuthenticateUser(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || password == null)
                return null;

            var u = username.Trim().ToLower();
            var p = password; // TODO: store hashed passwords in production

            return _context.Users.FirstOrDefault(x =>
                (x.Username ?? "").ToLower() == u &&
                x.Password == p);
        }

        public User? GetUserByUsernameAndEmail(string username, string email)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(email))
                return null;

            var u = username.Trim().ToLower();
            var e = email.Trim().ToLower();

            return _context.Users.AsNoTracking().FirstOrDefault(x =>
                (x.Username ?? "").ToLower() == u &&
                (x.Email ?? "").ToLower() == e);
        }

        /*
        // ---------------- Alternatives ----------------
        // Option B (better performance if DB collation is case-insensitive):
        // return _context.Users.AsNoTracking()
        //     .FirstOrDefault(x => x.Username == username && x.Email == email);

        // Option C (force a specific CI collation on SQL Server):
        // using Microsoft.EntityFrameworkCore;
        // return _context.Users.AsNoTracking()
        //     .FirstOrDefault(x =>
        //         EF.Functions.Collate(x.Username, "SQL_Latin1_General_CP1_CI_AS") == username &&
        //         EF.Functions.Collate(x.Email,    "SQL_Latin1_General_CP1_CI_AS") == email);
        */
    }
}

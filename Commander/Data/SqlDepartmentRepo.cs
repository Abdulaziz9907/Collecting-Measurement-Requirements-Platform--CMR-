using System;
using System.Collections.Generic;
using System.Linq;
using Commander.Models;
using Microsoft.EntityFrameworkCore;

namespace Commander.Data
{
    public class SqlDepartmentRepo : IDepartmentRepo
    {
        private readonly InterfaceContext _context;

        public SqlDepartmentRepo(InterfaceContext context)
        {
            _context = context;
        }

        public bool SaveChanges()
        {
            return _context.SaveChanges() >= 0;
        }

        public IEnumerable<Department> GetAllDepartments()
        {
            return _context.Departments.ToList();
        }

        public Department GetDepartmentById(int id)
        {
            return _context.Departments.FirstOrDefault(d => d.Department_id == id);
        }

        public void CreateDepartment(Department department)
        {
            if(department == null)
            {
                throw new ArgumentNullException(nameof(department));
            }
            _context.Departments.Add(department);
        }

        public void UpdateDepartment(Department department)
        {
            // The department retrieved from the context is already being tracked.
            // Using Update ensures the entity is marked as modified without
            // attempting to attach a duplicate instance which can cause
            // tracking conflicts when a detached copy is provided.
            _context.Departments.Update(department);
        }

        public void DeleteDepartment(Department department)
        {
            if(department != null)
            {
                _context.Departments.Remove(department);
            }
        }
    }
}

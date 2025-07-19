using System.Collections.Generic;
using Commander.Models;

namespace Commander.Data
{
    public interface IDepartmentRepo
    {
        bool SaveChanges();
        IEnumerable<Department> GetAllDepartments();
        Department GetDepartmentById(int id);
        void CreateDepartment(Department department);
        void UpdateDepartment(Department department);
        void DeleteDepartment(Department department);
    }
}

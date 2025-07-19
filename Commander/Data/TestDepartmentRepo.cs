using System.Collections.Generic;
using System.Linq;
using Commander.Models;

namespace Commander.Data
{
    public class TestDepartmentRepo : IDepartmentRepo
    {
        private readonly List<Department> _departments = new()
        {
            new Department{Department_id=0, Department_name="Engineering", Building_number=101},
            new Department{Department_id=1, Department_name="Quality", Building_number=102},
            new Department{Department_id=2, Department_name="Operations", Building_number=103}
        };

        public bool SaveChanges() => true;

        public IEnumerable<Department> GetAllDepartments() => _departments;

        public Department GetDepartmentById(int id) => _departments.FirstOrDefault(d => d.Department_id == id)!;

        public void CreateDepartment(Department department) => _departments.Add(department);

        public void UpdateDepartment(Department department)
        {
            var index = _departments.FindIndex(d => d.Department_id == department.Department_id);
            if (index >= 0)
            {
                _departments[index] = department;
            }
        }

        public void DeleteDepartment(Department department) => _departments.RemoveAll(d => d.Department_id == department.Department_id);
    }
}

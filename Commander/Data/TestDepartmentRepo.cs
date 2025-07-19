using System;
using System.Collections.Generic;
using System.Linq;
using Commander.Models;

namespace Commander.Data
{
    public class TestDepartmentRepo : IDepartmentRepo
    {
        private readonly List<Department> _departments = new List<Department>
        {
            new Department{Department_id=0, Department_name="Engineering"},
            new Department{Department_id=1, Department_name="Quality"},
            new Department{Department_id=2, Department_name="Operations"}
        };

        public bool SaveChanges() => true;

        public IEnumerable<Department> GetAllDepartments()
        {
            return _departments;
        }

        public Department GetDepartmentById(int id)
        {
            return _departments.FirstOrDefault(d => d.Department_id == id);
        }

        public void CreateDepartment(Department department)
        {
            _departments.Add(department);
        }

        public void UpdateDepartment(Department department)
        {
            var index = _departments.FindIndex(d => d.Department_id == department.Department_id);
            if(index >= 0)
            {
                _departments[index] = department;
            }
        }

        public void DeleteDepartment(Department department)
        {
            _departments.RemoveAll(d => d.Department_id == department.Department_id);
        }
    }
}

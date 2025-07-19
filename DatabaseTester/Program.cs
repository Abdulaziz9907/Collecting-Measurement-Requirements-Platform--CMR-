using System;
using Commander.Data;
using Commander.Models;

namespace DatabaseTester
{
    internal class Program
    {
        static void Main(string[] args)
        {
            InterfaceRepo userRepo = new TestInterfaceRepo();
            IDepartmentRepo deptRepo = new TestDepartmentRepo();

            Console.WriteLine("Initial users:");
            DisplayUsers(userRepo);

            Console.WriteLine("\nAdding a new user...");
            var newUser = new User{Employee_id=3, Username="newuser", First_name="New", Last_name="User", Email="new@example.com", Role="user", Department_id=1};
            userRepo.CreateUser(newUser);
            DisplayUsers(userRepo);

            Console.WriteLine("\nUpdating user 1...");
            var updateUser = userRepo.GetUserById(1);
            if(updateUser != null)
            {
                updateUser.First_name = "Updated";
                userRepo.UpdateUser(updateUser);
            }
            DisplayUsers(userRepo);

            Console.WriteLine("\nDeleting user 0...");
            var deleteUser = userRepo.GetUserById(0);
            if(deleteUser != null)
            {
                userRepo.DeleteUser(deleteUser);
            }
            DisplayUsers(userRepo);

            Console.WriteLine("\nInitial departments:");
            DisplayDepartments(deptRepo);

            Console.WriteLine("\nAdding a new department...");
            var newDept = new Department{Department_id=3, Department_name="Finance"};
            deptRepo.CreateDepartment(newDept);
            DisplayDepartments(deptRepo);

            Console.WriteLine("\nUpdating department 1...");
            var updateDept = deptRepo.GetDepartmentById(1);
            if(updateDept != null)
            {
                updateDept.Department_name = "Quality Assurance";
                deptRepo.UpdateDepartment(updateDept);
            }
            DisplayDepartments(deptRepo);

            Console.WriteLine("\nDeleting department 0...");
            var deleteDept = deptRepo.GetDepartmentById(0);
            if(deleteDept != null)
            {
                deptRepo.DeleteDepartment(deleteDept);
            }
            DisplayDepartments(deptRepo);
        }

        static void DisplayUsers(InterfaceRepo repo)
        {
            foreach(var u in repo.GetAllUsers())
            {
                Console.WriteLine($"{u.Employee_id}: {u.Username}");
            }
        }

        static void DisplayDepartments(IDepartmentRepo repo)
        {
            foreach(var d in repo.GetAllDepartments())
            {
                Console.WriteLine($"{d.Department_id}: {d.Department_name}");
            }
        }
    }
}

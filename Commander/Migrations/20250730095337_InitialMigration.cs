using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Commander.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Department_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Department_name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Building_number = table.Column<int>(type: "int", nullable: false),
                    Created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Department_id);
                });

            migrationBuilder.CreateTable(
                name: "PerformanceReports",
                columns: table => new
                {
                    Report_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Department_id = table.Column<int>(type: "int", nullable: false),
                    Total_standards = table.Column<int>(type: "int", nullable: false),
                    Completed_standards = table.Column<int>(type: "int", nullable: false),
                    Pending_standards = table.Column<int>(type: "int", nullable: false),
                    Completed_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerformanceReports", x => x.Report_id);
                    table.ForeignKey(
                        name: "FK_PerformanceReports_Departments_Department_id",
                        column: x => x.Department_id,
                        principalTable: "Departments",
                        principalColumn: "Department_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Standards",
                columns: table => new
                {
                    Standard_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Standard_number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Standard_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Standard_goal = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Standard_requirments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Assigned_department_id = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Proof_required = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Standards", x => x.Standard_id);
                    table.ForeignKey(
                        name: "FK_Standards_Departments_Assigned_department_id",
                        column: x => x.Assigned_department_id,
                        principalTable: "Departments",
                        principalColumn: "Department_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Employee_id = table.Column<int>(type: "int", maxLength: 7, nullable: false),
                    Username = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Password = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    First_name = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Last_name = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Role = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Department_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Departments_Department_id",
                        column: x => x.Department_id,
                        principalTable: "Departments",
                        principalColumn: "Department_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Attachments",
                columns: table => new
                {
                    Attachment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Standard_id = table.Column<int>(type: "int", nullable: false),
                    Uploaded_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attachments", x => x.Attachment_id);
                    table.ForeignKey(
                        name: "FK_Attachments_Standards_Standard_id",
                        column: x => x.Standard_id,
                        principalTable: "Standards",
                        principalColumn: "Standard_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_Standard_id",
                table: "Attachments",
                column: "Standard_id");

            migrationBuilder.CreateIndex(
                name: "IX_PerformanceReports_Department_id",
                table: "PerformanceReports",
                column: "Department_id");

            migrationBuilder.CreateIndex(
                name: "IX_Standards_Assigned_department_id",
                table: "Standards",
                column: "Assigned_department_id");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Department_id",
                table: "Users",
                column: "Department_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Attachments");

            migrationBuilder.DropTable(
                name: "PerformanceReports");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Standards");

            migrationBuilder.DropTable(
                name: "Departments");
        }
    }
}

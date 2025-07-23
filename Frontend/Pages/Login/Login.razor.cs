using Microsoft.AspNetCore.Components;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Frontend.Pages.Login
{
    public partial class Login : ComponentBase
    {
        [Inject]
        public Frontend.Data.InterfaceContext DbContext { get; set; } = default!;

        protected string username = string.Empty;
        protected string password = string.Empty;
        protected string? message;

        protected async Task HandleLogin()
        {
            var user = await DbContext.Users
                .FirstOrDefaultAsync(u => u.Username == username && u.Password == password);

            message = user != null ? "تم تسجيل الدخول بنجاح" : "بيانات الدخول غير صحيحة";
        }
    }
}
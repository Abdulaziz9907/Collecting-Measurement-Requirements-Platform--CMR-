using System.Threading.Tasks;

namespace Commander.Services
{
    public interface IEmailService
    {
        Task SendAsync(string toEmail, string subject, string textPart, string htmlPart);
    }
}

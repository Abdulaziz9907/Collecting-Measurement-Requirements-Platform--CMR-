using System.Threading.Tasks;

namespace Commander.Services
{
    public interface IEmailService
    {
        Task SendAsync(string toEmail, string subject, string textPart, string htmlPart);
        Task SendTemplateAsync(string toEmail, string toName, long templateId, object variables);
    }
}

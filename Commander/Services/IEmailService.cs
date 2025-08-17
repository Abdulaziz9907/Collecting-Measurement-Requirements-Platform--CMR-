public interface IEmailService
{
    Task SendAsync(string toEmail, string subject, string textPart, string htmlPart);
    Task SendTemplateAsync(string toEmail, string toName, long templateId, object variables);
    Task SendPasswordResetAsync(string toEmail, string toName, string code, string username, string resetUrl);
    Task SendVerificationCodeAsync(string toEmail, string toName, string code, string subject);
}

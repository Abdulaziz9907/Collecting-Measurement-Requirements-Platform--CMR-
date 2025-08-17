using System;
using System.Threading.Tasks;
using Mailjet.Client;
using Mailjet.Client.Resources;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace Commander.Services
{
    public class MailjetEmailService : IEmailService
    {
        private readonly MailjetClient _client;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly string _replyToEmail;
        private readonly string _replyToName;
        private readonly string _brand;
        private readonly ILogger<MailjetEmailService>? _logger;

        public MailjetEmailService(IConfiguration config, ILogger<MailjetEmailService>? logger = null)
        {
            _logger = logger;

            var apiKey =
                Environment.GetEnvironmentVariable("MJ_APIKEY_PUBLIC")
                ?? config["MJ_APIKEY_PUBLIC"]
                ?? config["Mailjet:ApiKeyPublic"];

            var apiSecret =
                Environment.GetEnvironmentVariable("MJ_APIKEY_PRIVATE")
                ?? config["MJ_APIKEY_PRIVATE"]
                ?? config["Mailjet:ApiKeyPrivate"];

            _fromEmail =
                Environment.GetEnvironmentVariable("MAILJET_SENDER_EMAIL")
                ?? config["MAILJET_SENDER_EMAIL"]
                ?? config["Mailjet:SenderEmail"]
                ?? string.Empty;

            // Default sender/brand → منصة التحول الرقمي
            _fromName =
                Environment.GetEnvironmentVariable("MAILJET_SENDER_NAME")
                ?? config["MAILJET_SENDER_NAME"]
                ?? config["Mailjet:SenderName"]
                ?? "منصة التحول الرقمي";

            _replyToEmail =
                Environment.GetEnvironmentVariable("REPLY_TO_EMAIL")
                ?? config["REPLY_TO_EMAIL"]
                ?? _fromEmail;

            _replyToName =
                Environment.GetEnvironmentVariable("REPLY_TO_NAME")
                ?? config["REPLY_TO_NAME"]
                ?? _fromName;

            _brand =
                Environment.GetEnvironmentVariable("BRAND_NAME")
                ?? config["BRAND_NAME"]
                ?? "منصة التحول الرقمي";

            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
                throw new InvalidOperationException("Mailjet API keys missing. Set MJ_APIKEY_PUBLIC & MJ_APIKEY_PRIVATE.");

            if (string.IsNullOrWhiteSpace(_fromEmail))
                throw new InvalidOperationException("Sender email missing. Set SENDER_EMAIL (must be a verified Mailjet sender).");

            _client = new MailjetClient(apiKey, apiSecret);
        }

        public async Task SendAsync(string toEmail, string subject, string textPart, string htmlPart)
        {
            var request = new MailjetRequest
            {
                Resource = SendV31.Resource
            }
            .Property("Messages", new JArray {
                new JObject {
                    ["From"] = new JObject { ["Email"] = _fromEmail, ["Name"] = _fromName },
                    ["To"]   = new JArray   { new JObject { ["Email"] = toEmail, ["Name"] = toEmail } },
                    ["Subject"]  = subject ?? string.Empty,
                    ["TextPart"] = textPart ?? string.Empty,
                    ["HTMLPart"] = htmlPart ?? string.Empty,
                    ["ReplyTo"]  = new JObject { ["Email"] = _replyToEmail, ["Name"] = _replyToName },
                    ["CustomID"] = "general"
                }
            });

            var response = await _client.PostAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger?.LogError("Mailjet send failed ({Status}): {Body}", response.StatusCode, response.Content);
                throw new InvalidOperationException($"Mailjet send failed ({response.StatusCode}): {response.Content}");
            }
        }

        public async Task SendTemplateAsync(string toEmail, string toName, long templateId, object variables)
        {
            var request = new MailjetRequest
            {
                Resource = SendV31.Resource
            }
            .Property("Messages", new JArray {
                new JObject {
                    ["From"] = new JObject { ["Email"] = _fromEmail, ["Name"] = _fromName },
                    ["To"]   = new JArray   { new JObject { ["Email"] = toEmail, ["Name"] = toName ?? toEmail } },
                    ["TemplateID"] = templateId,
                    ["TemplateLanguage"] = true,
                    ["Variables"] = JObject.FromObject(variables ?? new { }),
                    ["ReplyTo"]  = new JObject { ["Email"] = _replyToEmail, ["Name"] = _replyToName },
                    ["CustomID"] = "template"
                }
            });

            var response = await _client.PostAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger?.LogError("Mailjet template send failed ({Status}): {Body}", response.StatusCode, response.Content);
                throw new InvalidOperationException($"Mailjet template send failed ({response.StatusCode}): {response.Content}");
            }
        }

        // --------- Transactional: Password Reset (5 min validity) ---------
        public async Task SendPasswordResetAsync(string toEmail, string toName, string code, string username, string resetUrl)
        {
            var subject = $"{_brand} – رمز إعادة تعيين كلمة المرور";

            var text = $@"
{_brand} - رمز إعادة التعيين

مرحباً {toName ?? username},

رمزك: {code}

هذا الرمز صالح لمدة 5 دقائق. إذا لم تطلب إعادة تعيين، فتجاهل هذه الرسالة.

لإعادة التعيين يدوياً، افتح: {resetUrl}
";

            var html = BuildResetHtml(_brand, code, toName ?? username, resetUrl);

            var request = new MailjetRequest
            {
                Resource = SendV31.Resource
            }
            .Property("Messages", new JArray {
                new JObject {
                    ["From"] = new JObject { ["Email"] = _fromEmail, ["Name"] = _fromName },
                    ["To"]   = new JArray   { new JObject { ["Email"] = toEmail, ["Name"] = toName ?? toEmail } },
                    ["Subject"]  = subject,
                    ["TextPart"] = text,
                    ["HTMLPart"] = html,
                    ["ReplyTo"]  = new JObject { ["Email"] = _replyToEmail, ["Name"] = _replyToName },
                    ["CustomID"] = "password_reset",
                    ["Headers"]  = new JObject { ["X-Entity-Ref-ID"] = Guid.NewGuid().ToString() }
                }
            });

            var response = await _client.PostAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger?.LogError("Mailjet send failed ({Status}): {Body}", response.StatusCode, response.Content);
                throw new InvalidOperationException($"Mailjet send failed ({response.StatusCode}): {response.Content}");
            }
        }

        public async Task SendVerificationCodeAsync(string toEmail, string toName, string code, string subject)
        {
            var text = $"{_brand} - {subject}\n\nرمزك: {code}\n\nهذا الرمز صالح لمدة 5 دقائق.";
            var html = $"<p>مرحباً {toName ?? toEmail},</p><p>رمزك: <strong>{code}</strong></p><p>هذا الرمز صالح لمدة 5 دقائق.</p>";

            var request = new MailjetRequest
            {
                Resource = SendV31.Resource
            }
            .Property("Messages", new JArray {
                new JObject {
                    ["From"] = new JObject { ["Email"] = _fromEmail, ["Name"] = _fromName },
                    ["To"]   = new JArray   { new JObject { ["Email"] = toEmail, ["Name"] = toName ?? toEmail } },
                    ["Subject"]  = subject ?? string.Empty,
                    ["TextPart"] = text,
                    ["HTMLPart"] = html,
                    ["ReplyTo"]  = new JObject { ["Email"] = _replyToEmail, ["Name"] = _replyToName },
                    ["CustomID"] = "verification_code"
                }
            });

            var response = await _client.PostAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger?.LogError("Mailjet send failed ({Status}): {Body}", response.StatusCode, response.Content);
                throw new InvalidOperationException($"Mailjet send failed ({response.StatusCode}): {response.Content}");
            }
        }

        private static string BuildResetHtml(string brand, string code, string username, string resetUrl)
        {
            return $@"
<!doctype html>
<html lang=""ar"" dir=""rtl"">
  <head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
    <title>{brand}</title>
    <style>
      body {{ margin:0; padding:0; background:#f6f7fb; font-family:Tahoma, Arial, 'Helvetica Neue', Helvetica, sans-serif; color:#1f2328; }}
      .container {{ width:100%; max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.06); }}
      .header {{ padding:20px 24px; background:#0d6efd; color:#fff; font-weight:700; font-size:18px; }}
      .content {{ padding:24px; }}
      .greeting {{ margin:0 0 12px; font-size:16px; }}
      .lead {{ margin:0 0 16px; line-height:1.7; }}
      .codebox {{ margin:18px 0; padding:16px; text-align:center; font-size:28px; font-weight:700; letter-spacing:6px; border:1px dashed #c7d1e0; border-radius:10px; background:#f4f8ff; }}
      .btn {{ display:inline-block; padding:12px 18px; background:#0d6efd; color:#fff; text-decoration:none; border-radius:10px; font-weight:700; }}
      .muted {{ color:#6b7280; font-size:12px; margin-top:16px; }}
      .footer {{ text-align:center; color:#6b7280; font-size:12px; padding:20px; }}
      .preheader {{ display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; }}
    </style>
  </head>
  <body>
    <div class=""preheader"">رمز إعادة تعيين كلمة المرور: {code} – صالح 5 دقائق.</div>
    <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"" style=""padding:20px 12px;"">
      <tr>
        <td align=""center"">
          <div class=""container"">
            <div class=""header"">{brand}</div>
            <div class=""content"">
              <p class=""greeting"">،مرحباً {username}</p>
              <p class=""lead"">وردنا طلب لإعادة تعيين كلمة المرور لحسابك في <strong>{brand}</strong>. الرجاء استخدام الرمز أدناه:</p>

              <div class=""codebox"">{code}</div>

              <p class=""muted"">ملاحظة: الرمز صالح لمدة 5 دقائق. إذا لم تطلب هذه العملية، يمكنك تجاهل هذه الرسالة ولن يتم تغيير أي شيء.</p>
            </div>
          </div>
          <div class=""footer"">
            © {DateTime.UtcNow:yyyy} {brand}. جميع الحقوق محفوظة.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>";
        }
    }
}

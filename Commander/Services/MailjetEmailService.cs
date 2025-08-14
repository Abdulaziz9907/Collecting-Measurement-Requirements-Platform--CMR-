using System;
using System.Threading.Tasks;
using Mailjet.Client;
using Mailjet.Client.Resources;
using Newtonsoft.Json.Linq;

namespace Commander.Services
{
    public class MailjetEmailService : IEmailService
    {
        private readonly MailjetClient _client;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public MailjetEmailService()
        {
            var apiKey = Environment.GetEnvironmentVariable("MJ_APIKEY_PUBLIC");
            var apiSecret = Environment.GetEnvironmentVariable("MJ_APIKEY_PRIVATE");
            _fromEmail = Environment.GetEnvironmentVariable("SENDER_EMAIL") ?? "no-reply@yourdomain.com";
            _fromName = Environment.GetEnvironmentVariable("SENDER_NAME") ?? "CMR Platform";

            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
                throw new InvalidOperationException("Mailjet API keys missing. Set MJ_APIKEY_PUBLIC & MJ_APIKEY_PRIVATE.");

            if (string.IsNullOrWhiteSpace(_fromEmail))
                throw new InvalidOperationException("Sender email missing. Set SENDER_EMAIL.");

            _client = new MailjetClient(apiKey, apiSecret); // no Version property in recent Mailjet.Api
        }

        public async Task SendAsync(string toEmail, string subject, string textPart, string htmlPart)
        {
            var request = new MailjetRequest { Resource = Send.Resource }
            .Property(Send.Messages, new JArray {
                new JObject {
                    ["From"] = new JObject { ["Email"] = _fromEmail, ["Name"] = _fromName },
                    ["To"]   = new JArray   { new JObject { ["Email"] = toEmail, ["Name"] = toEmail } },
                    ["Subject"]  = subject ?? string.Empty,
                    ["TextPart"] = textPart ?? string.Empty,
                    ["HTMLPart"] = htmlPart ?? string.Empty
                }
            });

            var response = await _client.PostAsync(request);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException($"Mailjet send failed ({response.StatusCode}): {response.Content}");
        }

        public async Task SendTemplateAsync(string toEmail, string toName, long templateId, object variables)
        {
            var request = new MailjetRequest { Resource = Send.Resource }
            .Property(Send.Messages, new JArray {
                new JObject {
                    ["From"] = new JObject { ["Email"] = _fromEmail, ["Name"] = _fromName },
                    ["To"]   = new JArray   { new JObject { ["Email"] = toEmail, ["Name"] = toName } },
                    ["TemplateID"] = templateId,
                    ["TemplateLanguage"] = true,
                    ["Variables"] = JObject.FromObject(variables ?? new { })
                }
            });

            var response = await _client.PostAsync(request);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException($"Mailjet template send failed ({response.StatusCode}): {response.Content}");
        }
    }
}

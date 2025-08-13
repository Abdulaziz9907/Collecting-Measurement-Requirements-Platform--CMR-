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
        private readonly string _senderEmail;

        public MailjetEmailService()
        {
            var apiKey = Environment.GetEnvironmentVariable("MJ_APIKEY_PUBLIC");
            var apiSecret = Environment.GetEnvironmentVariable("MJ_APIKEY_PRIVATE");
            _senderEmail = Environment.GetEnvironmentVariable("SENDER_EMAIL") ?? string.Empty;

            _client = new MailjetClient(apiKey, apiSecret)
            {
                Version = ApiVersion.V3_1,
            };
        }

        public async Task SendAsync(string toEmail, string subject, string textPart, string htmlPart)
        {
            var request = new MailjetRequest
            {
                Resource = Send.Resource,
            }
            .Property(Send.Messages, new JArray {
                new JObject {
                    {"From", new JObject {
                        {"Email", _senderEmail},
                        {"Name", "CMR Platform"}
                    }},
                    {"To", new JArray {
                        new JObject {
                            {"Email", toEmail},
                            {"Name", toEmail}
                        }
                    }},
                    {"Subject", subject},
                    {"TextPart", textPart},
                    {"HTMLPart", htmlPart}
                }
            });

            await _client.PostAsync(request);
        }
    }
}

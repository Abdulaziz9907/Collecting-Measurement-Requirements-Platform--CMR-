using System.Collections.Generic;
using Commander.Models;

namespace Commander.Data
{
    public interface IAttachmentRepo
    {
        bool SaveChanges();
        IEnumerable<Attachment> GetAttachmentsByStandard(int standardId);
        Attachment? GetAttachment(int id);
        void AddAttachment(Attachment attachment);
        void UpdateAttachment(Attachment attachment);
        void DeleteAttachment(Attachment attachment);
    }
}

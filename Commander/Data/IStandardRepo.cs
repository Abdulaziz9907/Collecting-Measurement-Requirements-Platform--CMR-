using System.Collections.Generic;
using Commander.Models;

namespace Commander.Data
{
    public interface IStandardRepo
    {
        bool SaveChanges();

        IEnumerable<Standard> GetAllStandards();
        Standard? GetStandardById(int id);
        void CreateStandard(Standard standard);
    }
}

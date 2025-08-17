// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using Commander.Data;

// namespace Commander.Controllers
// {
//     [ApiController]
//     [Route("api/diag")]
//     public class DiagController : ControllerBase
//     {
//         private readonly InterfaceContext _ctx;
//         public DiagController(InterfaceContext ctx) => _ctx = ctx;

//         [HttpGet("dbinfo")]
//         public ActionResult<string> DbInfo()
//         {
//             using var c = _ctx.Database.GetDbConnection();
//             c.Open(); // throws clearly if it can't connect
//             return Ok($"{c.DataSource} | {c.Database}");
//         }
//     }
// }

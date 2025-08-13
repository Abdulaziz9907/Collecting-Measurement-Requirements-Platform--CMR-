using System;
using AutoMapper;
using Commander.Data;
using Commander.Models;
using Commander.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json.Serialization;

namespace Commander
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
            => Configuration = configuration;

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            // 1) EF Core → SQL Server
            services.AddDbContext<InterfaceContext>(opt =>
                opt.UseSqlServer(Configuration.GetConnectionString("DBConnection")));

            // 2) Controllers + Newtonsoft JSON (camel‑case)
            services.AddControllers()
                    .AddNewtonsoftJson(opts =>
                    {
                        opts.SerializerSettings.ContractResolver =
                            new CamelCasePropertyNamesContractResolver();
                        opts.SerializerSettings.ReferenceLoopHandling =
                            Newtonsoft.Json.ReferenceLoopHandling.Ignore;
                    });

            // 3) AutoMapper + Repos
            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
            services.AddScoped<InterfaceRepo, SqlCommanderRepo>();
            services.AddScoped<IDepartmentRepo, SqlDepartmentRepo>();
            services.AddScoped<IStandardRepo, SqlStandardRepo>();
            services.AddScoped<IAttachmentRepo, SqlAttachmentRepo>();
            services.AddTransient<IEmailService, MailjetEmailService>();

            // 4) CORS policy
            services.AddCors(opts =>
            {
                opts.AddPolicy("AllowAll", builder =>
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader());
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, InterfaceContext context)
        {
            // Apply any pending migrations automatically on startup
            context.Database.Migrate();
            // Developer exceptions
            if (env.IsDevelopment())
                app.UseDeveloperExceptionPage();

            app.UseHttpsRedirection();

            // 1) Serve your SPA from wwwroot (index.html, JS, CSS, etc.)
            app.UseDefaultFiles();   // looks for wwwroot/index.html, default.htm, etc.
            app.UseStaticFiles();    // serves any other assets under wwwroot/

            // 2) Routing
            app.UseRouting();

            // 3) CORS (must come after Routing, before Endpoints)
            app.UseCors("AllowAll");

            // 4) (Optional) AuthN/AuthZ
            app.UseAuthorization();

            // 5) API endpoints
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}

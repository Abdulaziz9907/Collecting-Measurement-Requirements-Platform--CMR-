using System;
using AutoMapper;
using Commander.Data;
using Commander.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace Commander
{
    public class Startup
    {
        public Startup(IConfiguration configuration) => Configuration = configuration;
        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            // 1) EF Core → SQL Server
            services.AddDbContext<InterfaceContext>(opt =>
                opt.UseSqlServer(Configuration.GetConnectionString("DBConnection")));

            // 2) Controllers + Newtonsoft JSON (camel-case)
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

            // Mailjet email service (Transient or Singleton both OK; Transient matches your setup)
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

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, InterfaceContext context, ILogger<Startup> logger)
        {
            // Apply any pending migrations automatically on startup
            try
            {
                context.Database.Migrate();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while applying database migrations.");
            }

            if (env.IsDevelopment())
                app.UseDeveloperExceptionPage();

            app.UseHttpsRedirection();

            // Serve SPA/static assets
            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseRouting();
            app.UseCors("AllowAll");
            app.UseAuthorization();

            app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
        }
    }
}

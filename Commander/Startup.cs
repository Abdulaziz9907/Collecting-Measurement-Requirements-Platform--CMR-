using System;
using System.IO;
using AutoMapper;
using Commander.Data;
using Commander.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Serialization;

namespace Commander
{
    public class Startup
    {
        public Startup(IConfiguration configuration) => Configuration = configuration;
        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            // Resolve connection string from available sources.
            string conn =
                Configuration["ConnectionStrings:DBConnection"] ??
                Configuration.GetConnectionString("DBConnection") ??
                Environment.GetEnvironmentVariable("SQLAZURECONNSTR_DBConnection") ??
                Environment.GetEnvironmentVariable("SQLCONNSTR_DBConnection") ??
                Environment.GetEnvironmentVariable("CUSTOMCONNSTR_DBConnection") ??
                Environment.GetEnvironmentVariable("DBConnection") ??
                Configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrWhiteSpace(conn))
            {
                using var sp = services.BuildServiceProvider();
                var logger = sp.GetService<ILogger<Startup>>();
                logger?.LogWarning("No database connection string could be resolved.");
            }

            services.AddDbContextPool<InterfaceContext>(opt =>
                opt.UseSqlServer(conn, sql => sql.EnableRetryOnFailure()));

            services.AddControllers()
                    .AddNewtonsoftJson(opts =>
                    {
                        opts.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                        opts.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
                    });

            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

            services.AddScoped<InterfaceRepo, SqlCommanderRepo>();
            services.AddScoped<IDepartmentRepo, SqlDepartmentRepo>();
            services.AddScoped<IStandardRepo, SqlStandardRepo>();
            services.AddScoped<IAttachmentRepo, SqlAttachmentRepo>();
            services.AddTransient<IEmailService, MailjetEmailService>();

            services.AddCors(opts =>
            {
                opts.AddPolicy("AllowAll", b => b
                    .AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader());
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // Schema handled externally; no EF migrations run here.

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();

            // Serve static files from wwwroot.
            app.UseStaticFiles();

            // Serve React build from wwwroot/build at root if present.
            var buildPath = Path.Combine(env.WebRootPath ?? string.Empty, "build");
            var buildExists = Directory.Exists(buildPath);

            if (buildExists)
            {
                var buildProvider = new PhysicalFileProvider(buildPath);

                app.UseDefaultFiles(new DefaultFilesOptions
                {
                    FileProvider = buildProvider,
                    RequestPath = string.Empty
                });

                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = buildProvider,
                    RequestPath = string.Empty
                });
            }

            app.UseRouting();
            app.UseCors("AllowAll");
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                // API routes
                endpoints.MapControllers();

                if (buildExists)
                {
                    endpoints.MapFallbackToFile("build/index.html");
                }
                else
                {
                    endpoints.MapFallbackToFile("index.html");
                }
            });
        }
    }
}

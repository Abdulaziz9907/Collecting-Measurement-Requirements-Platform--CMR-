using System;
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
using System.IO;

namespace Commander
{
    public class Startup
    {
        public Startup(IConfiguration configuration) => Configuration = configuration;
        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            // Bullet-proof resolver:
            // 1) App Settings key "ConnectionStrings:DBConnection" (recommended to add in App Service)
            // 2) Standard GetConnectionString("DBConnection") (App Service "Connection strings" blade)
            // 3) App Service env-var prefixes (Windows plans)
            // 4) Plain env var "DBConnection" (if someone added it under App Settings)
            // 5) Local dev fallback "DefaultConnection"
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
                // Optional: log if nothing resolved (remove later if noisy)
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
                opts.AddPolicy("AllowAll", b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, InterfaceContext context)
        {
            // Apply pending migrations on startup (okay for your setup)
            context.Database.Migrate();

            if (env.IsDevelopment()) app.UseDeveloperExceptionPage();

            app.UseHttpsRedirection();

            // Serve SPA/static assets built by React
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(env.WebRootPath, "build")),
                RequestPath = string.Empty
            });

            app.UseRouting();
            app.UseCors("AllowAll");
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapFallbackToFile("build/index.html");
            });
        }
    }
}

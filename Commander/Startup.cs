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
            // Resolve connection string from multiple possible sources (App Settings, Connection Strings blade, env vars).
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

            // --------- CORS for React dev on :3000 ----------
            services.AddCors(options =>
            {
                options.AddPolicy("ReactDev", builder =>
                    builder
                        .WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                // .AllowCredentials() // enable only if you're using cookies-based auth
                );
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, InterfaceContext context)
        {
            // Apply pending EF migrations on startup (okay for your setup).
            context.Database.Migrate();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                // IMPORTANT: do NOT force HTTPS in Development (preflight OPTIONS cannot follow redirects)
                // So we intentionally skip app.UseHttpsRedirection() here.
            }
            else
            {
                app.UseHttpsRedirection();
            }

            // Serve static files from wwwroot
            app.UseStaticFiles();

            // Serve the React build from wwwroot/build at the root URL ("/")
            var buildPath = Path.Combine(env.WebRootPath ?? string.Empty, "build");
            var buildExists = Directory.Exists(buildPath);
            if (buildExists)
            {
                var buildProvider = new PhysicalFileProvider(buildPath);
                app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = buildProvider });
                app.UseStaticFiles(new StaticFileOptions { FileProvider = buildProvider });
            }

            app.UseRouting();

            // CORS must be after UseRouting and before endpoints
            app.UseCors("ReactDev");

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();

                // SPA fallback to React index.html inside wwwroot/build
                if (buildExists)
                {
                    // filePath is relative to the WebRoot (wwwroot), so include "build/"
                    endpoints.MapFallbackToFile("build/index.html");
                }
            });
        }
    }
}

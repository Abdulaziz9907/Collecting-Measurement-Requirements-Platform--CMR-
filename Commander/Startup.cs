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
            // --------- DB Connection ----------
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
            // Apply pending EF Core migrations on startup (optional: wrap in try/catch)
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

            // Serve any static files you may have in wwwroot (uploads/images)
            app.UseStaticFiles();

            // If you also keep a built React app in wwwroot/build, you can serve it too (optional)
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

                // SPA fallback to React index.html inside wwwroot/build (if it exists).
                if (buildExists)
                {
                    // Path is relative to WebRoot (wwwroot)
                    endpoints.MapFallbackToFile("build/index.html");
                }
                else
                {
                    // Fallback to any index at wwwroot if build not present (optional).
                    endpoints.MapFallbackToFile("index.html");
                }
            });
        }
    }
}

using System.Globalization;
using Kbec.Api.Data;
using Kbec.Api.Models;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);

const string AdminSessionIdKey = "AdminUserId";
const string AdminSessionUsernameKey = "AdminUsername";
const string AdminSessionDisplayNameKey = "AdminDisplayName";

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();

        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true);
            return;
        }

        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? [];

        policy.WithOrigins(allowedOrigins);
    });
});

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.Cookie.Name = ".Kbec.Admin.Session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.None
        : CookieSecurePolicy.Always;
    options.IdleTimeout = TimeSpan.FromHours(4);
});

builder.Services.AddSingleton<RegistrationRepository>();
builder.Services.AddSingleton<AdminRepository>();
builder.Services.AddSingleton<PasswordHasher>();

var app = builder.Build();

app.UseCors("Frontend");
app.UseSession();

await SeedDefaultAdminAsync(app);

app.MapGet("/", () => Results.Ok(new
{
    name = "KBEC Registration API",
    status = "running"
}));

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    checkedAtUtc = DateTime.UtcNow
}));

app.MapPost(
    "/api/registrations",
    async (
        RegistrationRequest request,
        RegistrationRepository repository,
        HttpContext httpContext,
        ILogger<Program> logger,
        CancellationToken cancellationToken) =>
    {
        var validationErrors = request.Validate();

        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        try
        {
            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            var id = await repository.CreateAsync(request, ipAddress, cancellationToken);

            return Results.Created($"/api/registrations/{id}", new RegistrationResponse(
                id,
                "Registration submitted successfully."));
        }
        catch (MySqlException exception)
        {
            logger.LogError(exception, "MySQL failed while saving a registration.");

            return Results.Problem(
                title: "Database unavailable",
                detail: "The registration could not be saved right now.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    });

app.MapPost(
    "/api/admin/login",
    async (
        AdminLoginRequest request,
        AdminRepository repository,
        PasswordHasher passwordHasher,
        HttpContext httpContext,
        ILogger<Program> logger,
        CancellationToken cancellationToken) =>
    {
        var validationErrors = request.Validate();

        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        AdminUser? admin;

        try
        {
            await repository.EnsureDefaultAdminAsync(cancellationToken);
            admin = await repository.GetActiveByUsernameAsync(
                request.Username,
                cancellationToken);
        }
        catch (MySqlException exception)
        {
            logger.LogError(exception, "MySQL failed while loading an admin user.");

            return Results.Problem(
                title: "Admin database unavailable",
                detail: "Run the latest schema.sql file and try again.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        if (admin is null || !passwordHasher.Verify(request.Password, admin.PasswordHash))
        {
            return Results.Unauthorized();
        }

        httpContext.Session.SetString(
            AdminSessionIdKey,
            admin.Id.ToString(CultureInfo.InvariantCulture));
        httpContext.Session.SetString(AdminSessionUsernameKey, admin.Username);
        httpContext.Session.SetString(AdminSessionDisplayNameKey, admin.DisplayName);

        await repository.TouchLastLoginAsync(admin.Id, cancellationToken);

        return Results.Ok(new AdminSessionResponse(
            admin.Id,
            admin.Username,
            admin.DisplayName));
    });

app.MapGet("/api/admin/me", (HttpContext httpContext) =>
{
    return TryGetAdminSession(httpContext, out var admin)
        ? Results.Ok(admin)
        : Results.Unauthorized();
});

app.MapPost("/api/admin/logout", (HttpContext httpContext) =>
{
    httpContext.Session.Clear();
    return Results.NoContent();
});

app.MapGet(
    "/api/admin/registrations",
    async (
        RegistrationRepository repository,
        HttpContext httpContext,
        ILogger<Program> logger,
        CancellationToken cancellationToken) =>
    {
        if (!TryGetAdminSession(httpContext, out _))
        {
            return Results.Unauthorized();
        }

        try
        {
            var dashboard = await repository.GetDashboardAsync(cancellationToken);
            return Results.Ok(dashboard);
        }
        catch (MySqlException exception)
        {
            logger.LogError(exception, "MySQL failed while loading registrations.");

            return Results.Problem(
                title: "Registration database unavailable",
                detail: "Run the latest schema.sql file and try again.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    });

app.Run();

bool TryGetAdminSession(
    HttpContext httpContext,
    out AdminSessionResponse? admin)
{
    admin = null;

    var idValue = httpContext.Session.GetString(AdminSessionIdKey);
    var username = httpContext.Session.GetString(AdminSessionUsernameKey);
    var displayName = httpContext.Session.GetString(AdminSessionDisplayNameKey);

    if (!long.TryParse(idValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id)
        || string.IsNullOrWhiteSpace(username)
        || string.IsNullOrWhiteSpace(displayName))
    {
        return false;
    }

    admin = new AdminSessionResponse(id, username, displayName);
    return true;
}

async Task SeedDefaultAdminAsync(WebApplication app)
{
    await using var scope = app.Services.CreateAsyncScope();
    var repository = scope.ServiceProvider.GetRequiredService<AdminRepository>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        await repository.EnsureDefaultAdminAsync(app.Lifetime.ApplicationStopping);
    }
    catch (MySqlException exception)
    {
        logger.LogWarning(
            exception,
            "Default admin could not be seeded. Run backend/database/schema.sql first.");
    }
}

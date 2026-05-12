using Kbec.Api.Data;
using Kbec.Api.Models;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod();

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

builder.Services.AddSingleton<RegistrationRepository>();

var app = builder.Build();

app.UseCors("Frontend");

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

app.Run();

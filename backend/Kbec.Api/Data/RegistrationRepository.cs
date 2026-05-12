using Kbec.Api.Models;
using MySqlConnector;

namespace Kbec.Api.Data;

public sealed class RegistrationRepository(IConfiguration configuration)
{
    private readonly string connectionString =
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Missing DefaultConnection string.");

    public async Task<long> CreateAsync(
        RegistrationRequest request,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO registrations
            (
                full_name,
                roll,
                email,
                phone,
                department,
                academic_session,
                current_level,
                preferred_wing,
                motivation,
                availability,
                agreement_accepted,
                ip_address
            )
            VALUES
            (
                @fullName,
                @roll,
                @email,
                @phone,
                @department,
                @academicSession,
                @currentLevel,
                @preferredWing,
                @motivation,
                @availability,
                @agreementAccepted,
                @ipAddress
            );

            SELECT LAST_INSERT_ID();
            """;

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@fullName", request.FullName.Trim());
        command.Parameters.AddWithValue("@roll", request.Roll.Trim());
        command.Parameters.AddWithValue("@email", request.Email.Trim().ToLowerInvariant());
        command.Parameters.AddWithValue("@phone", request.Phone.Trim());
        command.Parameters.AddWithValue("@department", request.Department.Trim());
        command.Parameters.AddWithValue("@academicSession", request.Session.Trim());
        command.Parameters.AddWithValue("@currentLevel", request.Level.Trim());
        command.Parameters.AddWithValue("@preferredWing", request.Wing.Trim());
        command.Parameters.AddWithValue("@motivation", request.Motivation.Trim());
        command.Parameters.AddWithValue("@availability", request.Availability.Trim());
        command.Parameters.AddWithValue("@agreementAccepted", request.Agreement);
        command.Parameters.AddWithValue("@ipAddress", ipAddress);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt64(result);
    }
}

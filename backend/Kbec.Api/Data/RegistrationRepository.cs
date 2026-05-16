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

    public async Task<AdminDashboardResponse> GetDashboardAsync(
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                id,
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
                ip_address,
                submitted_at_utc
            FROM registrations
            ORDER BY submitted_at_utc DESC, id DESC;
            """;

        var registrations = new List<AdminRegistrationResponse>();

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var idOrdinal = reader.GetOrdinal("id");
        var fullNameOrdinal = reader.GetOrdinal("full_name");
        var rollOrdinal = reader.GetOrdinal("roll");
        var emailOrdinal = reader.GetOrdinal("email");
        var phoneOrdinal = reader.GetOrdinal("phone");
        var departmentOrdinal = reader.GetOrdinal("department");
        var academicSessionOrdinal = reader.GetOrdinal("academic_session");
        var currentLevelOrdinal = reader.GetOrdinal("current_level");
        var preferredWingOrdinal = reader.GetOrdinal("preferred_wing");
        var motivationOrdinal = reader.GetOrdinal("motivation");
        var availabilityOrdinal = reader.GetOrdinal("availability");
        var agreementAcceptedOrdinal = reader.GetOrdinal("agreement_accepted");
        var ipAddressOrdinal = reader.GetOrdinal("ip_address");
        var submittedAtOrdinal = reader.GetOrdinal("submitted_at_utc");

        while (await reader.ReadAsync(cancellationToken))
        {
            var submittedAtUtc = DateTime.SpecifyKind(
                reader.GetDateTime(submittedAtOrdinal),
                DateTimeKind.Utc);

            registrations.Add(new AdminRegistrationResponse(
                reader.GetInt64(idOrdinal),
                reader.GetString(fullNameOrdinal),
                reader.GetString(rollOrdinal),
                reader.GetString(emailOrdinal),
                reader.GetString(phoneOrdinal),
                reader.GetString(departmentOrdinal),
                reader.GetString(academicSessionOrdinal),
                reader.GetString(currentLevelOrdinal),
                reader.GetString(preferredWingOrdinal),
                reader.GetString(motivationOrdinal),
                reader.GetString(availabilityOrdinal),
                reader.GetBoolean(agreementAcceptedOrdinal),
                reader.IsDBNull(ipAddressOrdinal) ? null : reader.GetString(ipAddressOrdinal),
                submittedAtUtc));
        }

        var todayUtc = DateTime.UtcNow.Date;
        var weekStartUtc = DateTime.UtcNow.AddDays(-7);

        return new AdminDashboardResponse(
            registrations.Count,
            registrations.Count(registration => registration.SubmittedAtUtc >= todayUtc),
            registrations.Count(registration => registration.SubmittedAtUtc >= weekStartUtc),
            registrations);
    }
}

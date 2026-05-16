using Kbec.Api.Models;
using MySqlConnector;

namespace Kbec.Api.Data;

public sealed class AdminRepository(
    IConfiguration configuration,
    PasswordHasher passwordHasher)
{
    private readonly string connectionString =
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Missing DefaultConnection string.");

    public async Task EnsureDefaultAdminAsync(CancellationToken cancellationToken)
    {
        var seed = configuration.GetSection("AdminSeed");
        var username = seed["Username"];
        var password = seed["Password"];
        var displayName = seed["DisplayName"] ?? "KBEC Admin";

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        const string existsSql = """
            SELECT COUNT(*)
            FROM admin_users
            WHERE username = @username;
            """;

        const string insertSql = """
            INSERT INTO admin_users
            (
                username,
                display_name,
                password_hash
            )
            VALUES
            (
                @username,
                @displayName,
                @passwordHash
            );
            """;

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using (var existsCommand = new MySqlCommand(existsSql, connection))
        {
            existsCommand.Parameters.AddWithValue("@username", username.Trim());
            var result = await existsCommand.ExecuteScalarAsync(cancellationToken);
            var existingUsers = Convert.ToInt32(result);

            if (existingUsers > 0)
            {
                return;
            }
        }

        await using var insertCommand = new MySqlCommand(insertSql, connection);
        insertCommand.Parameters.AddWithValue("@username", username.Trim());
        insertCommand.Parameters.AddWithValue("@displayName", displayName.Trim());
        insertCommand.Parameters.AddWithValue("@passwordHash", passwordHasher.Hash(password));
        await insertCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<AdminUser?> GetActiveByUsernameAsync(
        string username,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                id,
                username,
                display_name,
                password_hash
            FROM admin_users
            WHERE username = @username
              AND is_active = TRUE
            LIMIT 1;
            """;

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@username", username.Trim());

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new AdminUser(
            reader.GetInt64(reader.GetOrdinal("id")),
            reader.GetString(reader.GetOrdinal("username")),
            reader.GetString(reader.GetOrdinal("display_name")),
            reader.GetString(reader.GetOrdinal("password_hash")));
    }

    public async Task TouchLastLoginAsync(long adminId, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE admin_users
            SET last_login_at_utc = UTC_TIMESTAMP()
            WHERE id = @id;
            """;

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", adminId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}

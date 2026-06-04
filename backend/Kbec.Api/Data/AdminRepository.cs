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

    public async Task<AdminUserResponse?> CreateAsync(
        AdminCreateUserRequest request,
        CancellationToken cancellationToken)
    {
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

            SELECT LAST_INSERT_ID();
            """;

        var username = request.Username.Trim();

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using (var existsCommand = new MySqlCommand(existsSql, connection))
        {
            existsCommand.Parameters.AddWithValue("@username", username);
            var result = await existsCommand.ExecuteScalarAsync(cancellationToken);

            if (Convert.ToInt32(result) > 0)
            {
                return null;
            }
        }

        await using var insertCommand = new MySqlCommand(insertSql, connection);
        insertCommand.Parameters.AddWithValue("@username", username);
        insertCommand.Parameters.AddWithValue("@displayName", request.DisplayName.Trim());
        insertCommand.Parameters.AddWithValue("@passwordHash", passwordHasher.Hash(request.Password));

        var id = Convert.ToInt64(await insertCommand.ExecuteScalarAsync(cancellationToken));
        return new AdminUserResponse(id, username, request.DisplayName.Trim());
    }

    public async Task<IReadOnlyList<AdminUserSummaryResponse>> ListAsync(
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                id,
                username,
                display_name,
                is_active,
                created_at_utc,
                last_login_at_utc
            FROM admin_users
            ORDER BY created_at_utc DESC, id DESC;
            """;

        var admins = new List<AdminUserSummaryResponse>();

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            var lastLoginOrdinal = reader.GetOrdinal("last_login_at_utc");

            admins.Add(new AdminUserSummaryResponse(
                reader.GetInt64(reader.GetOrdinal("id")),
                reader.GetString(reader.GetOrdinal("username")),
                reader.GetString(reader.GetOrdinal("display_name")),
                reader.GetBoolean(reader.GetOrdinal("is_active")),
                reader.GetDateTime(reader.GetOrdinal("created_at_utc")),
                reader.IsDBNull(lastLoginOrdinal)
                    ? null
                    : reader.GetDateTime(lastLoginOrdinal)));
        }

        return admins;
    }

    public async Task<bool> ChangePasswordAsync(
        long adminId,
        AdminChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        const string selectSql = """
            SELECT password_hash
            FROM admin_users
            WHERE id = @id
              AND is_active = TRUE
            LIMIT 1;
            """;

        const string updateSql = """
            UPDATE admin_users
            SET password_hash = @passwordHash
            WHERE id = @id
              AND is_active = TRUE;
            """;

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        string? currentHash;

        await using (var selectCommand = new MySqlCommand(selectSql, connection))
        {
            selectCommand.Parameters.AddWithValue("@id", adminId);
            currentHash = Convert.ToString(await selectCommand.ExecuteScalarAsync(cancellationToken));
        }

        if (string.IsNullOrWhiteSpace(currentHash)
            || !passwordHasher.Verify(request.CurrentPassword, currentHash))
        {
            return false;
        }

        await using var updateCommand = new MySqlCommand(updateSql, connection);
        updateCommand.Parameters.AddWithValue("@id", adminId);
        updateCommand.Parameters.AddWithValue("@passwordHash", passwordHasher.Hash(request.NewPassword));
        await updateCommand.ExecuteNonQueryAsync(cancellationToken);

        return true;
    }
}

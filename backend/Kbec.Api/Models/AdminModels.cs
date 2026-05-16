namespace Kbec.Api.Models;

public sealed record AdminLoginRequest(string Username, string Password)
{
    public Dictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(Username))
        {
            errors[nameof(Username)] = ["Username is required."];
        }

        if (string.IsNullOrWhiteSpace(Password))
        {
            errors[nameof(Password)] = ["Password is required."];
        }

        return errors;
    }
}

public sealed record AdminSessionResponse(
    long Id,
    string Username,
    string DisplayName);

public sealed record AdminUser(
    long Id,
    string Username,
    string DisplayName,
    string PasswordHash);

public sealed record AdminDashboardResponse(
    int TotalRegistrations,
    int TodayRegistrations,
    int WeekRegistrations,
    IReadOnlyList<AdminRegistrationResponse> Registrations);

public sealed record AdminRegistrationResponse(
    long Id,
    string FullName,
    string Roll,
    string Email,
    string Phone,
    string Department,
    string AcademicSession,
    string CurrentLevel,
    string PreferredWing,
    string Motivation,
    string Availability,
    bool AgreementAccepted,
    string? IpAddress,
    DateTime SubmittedAtUtc);

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

public sealed record AdminCreateUserRequest(
    string Username,
    string DisplayName,
    string Password)
{
    public Dictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        AddRequired(errors, nameof(Username), Username, 80);
        AddRequired(errors, nameof(DisplayName), DisplayName, 120);
        AddRequired(errors, nameof(Password), Password, 120);

        if (!string.IsNullOrWhiteSpace(Password) && Password.Trim().Length < 8)
        {
            errors[nameof(Password)] = ["Password must be at least 8 characters."];
        }

        return errors;
    }

    private static void AddRequired(
        Dictionary<string, string[]> errors,
        string field,
        string? value,
        int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors[field] = [$"{field} is required."];
            return;
        }

        if (value.Trim().Length > maxLength)
        {
            errors[field] = [$"{field} must be {maxLength} characters or less."];
        }
    }
}

public sealed record AdminChangePasswordRequest(
    string CurrentPassword,
    string NewPassword)
{
    public Dictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(CurrentPassword))
        {
            errors[nameof(CurrentPassword)] = ["Current password is required."];
        }

        if (string.IsNullOrWhiteSpace(NewPassword))
        {
            errors[nameof(NewPassword)] = ["New password is required."];
        }
        else if (NewPassword.Trim().Length < 8)
        {
            errors[nameof(NewPassword)] = ["New password must be at least 8 characters."];
        }

        return errors;
    }
}

public sealed record AdminUser(
    long Id,
    string Username,
    string DisplayName,
    string PasswordHash);

public sealed record AdminUserResponse(
    long Id,
    string Username,
    string DisplayName);

public sealed record AdminUserSummaryResponse(
    long Id,
    string Username,
    string DisplayName,
    bool IsActive,
    DateTime CreatedAtUtc,
    DateTime? LastLoginAtUtc);

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

public sealed record AdminRegistrationUpdateRequest(
    string FullName,
    string Roll,
    string Email,
    string Phone,
    string Department,
    string AcademicSession,
    string CurrentLevel,
    string PreferredWing,
    string Motivation,
    string Availability)
{
    private static readonly HashSet<string> Departments = new(StringComparer.OrdinalIgnoreCase)
    {
        "Architecture",
        "Biomedical Engineering",
        "Building Engineering and Construction Management",
        "Chemical Engineering",
        "Civil Engineering",
        "Computer Science and Engineering",
        "Electrical and Electronic Engineering",
        "Electronics and Communication Engineering",
        "Energy Science and Engineering",
        "Industrial Engineering and Management",
        "Leather Engineering",
        "Materials Science and Engineering",
        "Mechanical Engineering",
        "Mechatronics Engineering",
        "Textile Engineering",
        "Urban and Regional Planning"
    };

    private static readonly HashSet<string> Levels = new(StringComparer.OrdinalIgnoreCase)
    {
        "Level 1",
        "Level 2",
        "Level 3",
        "Level 4",
        "Postgraduate"
    };

    private static readonly HashSet<string> Wings = new(StringComparer.OrdinalIgnoreCase)
    {
        "Business Case and Competitions",
        "Event Operations",
        "Marketing and Sponsorship",
        "Content and Creative",
        "Finance and Documentation",
        "Tech and Web"
    };

    private static readonly HashSet<string> AvailabilityOptions = new(StringComparer.OrdinalIgnoreCase)
    {
        "weekly",
        "events",
        "flexible"
    };

    public Dictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        AddRequired(errors, nameof(FullName), FullName, 120);
        AddRequired(errors, nameof(Roll), Roll, 40);
        AddRequired(errors, nameof(Email), Email, 160);
        AddRequired(errors, nameof(Phone), Phone, 40);
        AddRequired(errors, nameof(Department), Department, 120);
        AddRequired(errors, nameof(AcademicSession), AcademicSession, 30);
        AddRequired(errors, nameof(CurrentLevel), CurrentLevel, 40);
        AddRequired(errors, nameof(PreferredWing), PreferredWing, 120);
        AddRequired(errors, nameof(Motivation), Motivation, 420);
        AddRequired(errors, nameof(Availability), Availability, 40);

        AddAllowed(errors, nameof(Department), Department, Departments);
        AddAllowed(errors, nameof(CurrentLevel), CurrentLevel, Levels);
        AddAllowed(errors, nameof(PreferredWing), PreferredWing, Wings);
        AddAllowed(errors, nameof(Availability), Availability, AvailabilityOptions);

        if (!string.IsNullOrWhiteSpace(Email)
            && !System.Text.RegularExpressions.Regex.IsMatch(
                Email.Trim(),
                @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
                System.Text.RegularExpressions.RegexOptions.CultureInvariant))
        {
            errors[nameof(Email)] = ["Enter a valid email address."];
        }

        return errors;
    }

    private static void AddRequired(
        Dictionary<string, string[]> errors,
        string field,
        string? value,
        int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors[field] = [$"{field} is required."];
            return;
        }

        if (value.Trim().Length > maxLength)
        {
            errors[field] = [$"{field} must be {maxLength} characters or less."];
        }
    }

    private static void AddAllowed(
        Dictionary<string, string[]> errors,
        string field,
        string? value,
        HashSet<string> allowedValues)
    {
        if (string.IsNullOrWhiteSpace(value) || errors.ContainsKey(field))
        {
            return;
        }

        if (!allowedValues.Contains(value.Trim()))
        {
            errors[field] = [$"{field} has an invalid option."];
        }
    }
}

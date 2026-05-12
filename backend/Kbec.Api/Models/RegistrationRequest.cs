using System.Text.RegularExpressions;

namespace Kbec.Api.Models;

public sealed record RegistrationRequest(
    string FullName,
    string Roll,
    string Email,
    string Phone,
    string Department,
    string Session,
    string Level,
    string Wing,
    string Motivation,
    string Availability,
    bool Agreement)
{
    private static readonly Regex EmailPattern = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public Dictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        AddRequired(errors, nameof(FullName), FullName, 120);
        AddRequired(errors, nameof(Roll), Roll, 40);
        AddRequired(errors, nameof(Email), Email, 160);
        AddRequired(errors, nameof(Phone), Phone, 40);
        AddRequired(errors, nameof(Department), Department, 120);
        AddRequired(errors, nameof(Session), Session, 30);
        AddRequired(errors, nameof(Level), Level, 40);
        AddRequired(errors, nameof(Wing), Wing, 120);
        AddRequired(errors, nameof(Motivation), Motivation, 420);
        AddRequired(errors, nameof(Availability), Availability, 40);

        if (!string.IsNullOrWhiteSpace(Email) && !EmailPattern.IsMatch(Email.Trim()))
        {
            errors[nameof(Email)] = ["Enter a valid email address."];
        }

        if (!Agreement)
        {
            errors[nameof(Agreement)] = ["Agreement must be accepted."];
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

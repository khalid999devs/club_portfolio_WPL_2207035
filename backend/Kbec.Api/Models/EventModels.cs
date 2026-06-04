using System.Globalization;

namespace Kbec.Api.Models;

public sealed record AdminEventRequest(
    string Name,
    string Description,
    string? Tagline,
    string? EventDate,
    string? Venue,
    string? RegistrationDeadline,
    string? ImageUrl,
    string? ExternalLink,
    bool IsUpcoming,
    bool IsPublished,
    int DisplayOrder,
    IReadOnlyList<EventSpeakerRequest>? Speakers,
    IReadOnlyList<EventTimelineItemRequest>? Timeline)
{
    public Dictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(Name))
        {
            errors[nameof(Name)] = ["Event name is required."];
        }
        else if (Name.Trim().Length > 180)
        {
            errors[nameof(Name)] = ["Event name must be 180 characters or less."];
        }

        if (string.IsNullOrWhiteSpace(Description))
        {
            errors[nameof(Description)] = ["Description is required."];
        }

        if (!IsValidDate(EventDate))
        {
            errors[nameof(EventDate)] = ["Event date must use yyyy-mm-dd format."];
        }

        if (!IsValidDate(RegistrationDeadline))
        {
            errors[nameof(RegistrationDeadline)] = ["Registration deadline must use yyyy-mm-dd format."];
        }

        var speakers = Speakers ?? [];

        if (speakers.Count > 20)
        {
            errors[nameof(Speakers)] = ["Keep speaker list within 20 people."];
        }

        for (var index = 0; index < speakers.Count; index++)
        {
            if (string.IsNullOrWhiteSpace(speakers[index].Name))
            {
                errors[$"{nameof(Speakers)}[{index}].{nameof(EventSpeakerRequest.Name)}"] = ["Speaker name is required."];
            }
        }

        var timeline = Timeline ?? [];

        if (timeline.Count > 20)
        {
            errors[nameof(Timeline)] = ["Keep timeline list within 20 items."];
        }

        for (var index = 0; index < timeline.Count; index++)
        {
            if (string.IsNullOrWhiteSpace(timeline[index].Label))
            {
                errors[$"{nameof(Timeline)}[{index}].{nameof(EventTimelineItemRequest.Label)}"] = ["Timeline label is required."];
            }

            if (!IsValidDate(timeline[index].TimelineDate))
            {
                errors[$"{nameof(Timeline)}[{index}].{nameof(EventTimelineItemRequest.TimelineDate)}"] = ["Timeline date must use yyyy-mm-dd format."];
            }
        }

        return errors;
    }

    private static bool IsValidDate(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            || DateOnly.TryParseExact(
                value.Trim(),
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out _);
    }
}

public sealed record EventSpeakerRequest(
    string Name,
    string? Title,
    string? Organization,
    string? ImageUrl,
    int DisplayOrder);

public sealed record EventTimelineItemRequest(
    string Label,
    string? Detail,
    string? TimelineDate,
    int DisplayOrder);

public sealed record AdminEventsResponse(
    int TotalEvents,
    int UpcomingEvents,
    int PublishedEvents,
    IReadOnlyList<EventResponse> Events);

public sealed record EventResponse(
    long Id,
    string Name,
    string Slug,
    string SlugId,
    string? Tagline,
    string Description,
    string About,
    string? Date,
    string? Venue,
    string? RegistrationDeadline,
    string? Image,
    string? ImageUrl,
    string? ExternalLink,
    bool IsUpcoming,
    bool IsPublished,
    int Order,
    int DisplayOrder,
    IReadOnlyList<EventSpeakerResponse> Speakers,
    IReadOnlyList<EventTimelineItemResponse> Timeline,
    DateTime CreatedAtUtc);

public sealed record EventSpeakerResponse(
    long Id,
    string Name,
    string? Title,
    string? Organization,
    string? ImageUrl,
    int DisplayOrder);

public sealed record EventTimelineItemResponse(
    long Id,
    string Label,
    string? Detail,
    string? TimelineDate,
    int DisplayOrder);

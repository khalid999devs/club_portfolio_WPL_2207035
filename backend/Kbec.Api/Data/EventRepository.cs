using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Kbec.Api.Models;
using MySqlConnector;

namespace Kbec.Api.Data;

public sealed partial class EventRepository(IConfiguration configuration)
{
    private readonly string connectionString =
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Missing DefaultConnection string.");

    public async Task<IReadOnlyList<EventResponse>> GetEventsAsync(
        bool publishedOnly,
        CancellationToken cancellationToken)
    {
        const string eventsSql = """
            SELECT
                id,
                name,
                slug,
                tagline,
                description,
                event_date,
                venue,
                registration_deadline,
                image_url,
                external_link,
                is_upcoming,
                is_published,
                display_order,
                created_at_utc
            FROM events
            WHERE @publishedOnly = FALSE
               OR is_published = TRUE
            ORDER BY
                is_upcoming DESC,
                display_order ASC,
                event_date DESC,
                id DESC;
            """;

        const string speakersSql = """
            SELECT
                speaker.id,
                speaker.event_id,
                speaker.name,
                speaker.title,
                speaker.organization,
                speaker.image_url,
                speaker.display_order
            FROM event_speakers speaker
            INNER JOIN events event ON event.id = speaker.event_id
            WHERE @publishedOnly = FALSE
               OR event.is_published = TRUE
            ORDER BY speaker.event_id, speaker.display_order, speaker.id;
            """;

        const string timelineSql = """
            SELECT
                item.id,
                item.event_id,
                item.label,
                item.detail,
                item.timeline_date,
                item.display_order
            FROM event_timeline_items item
            INNER JOIN events event ON event.id = item.event_id
            WHERE @publishedOnly = FALSE
               OR event.is_published = TRUE
            ORDER BY item.event_id, item.display_order, item.id;
            """;

        var eventRows = new List<EventRow>();
        var speakers = new Dictionary<long, List<EventSpeakerResponse>>();
        var timeline = new Dictionary<long, List<EventTimelineItemResponse>>();

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using (var command = new MySqlCommand(eventsSql, connection))
        {
            command.Parameters.AddWithValue("@publishedOnly", publishedOnly);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
            {
                var id = reader.GetInt64(reader.GetOrdinal("id"));
                eventRows.Add(new EventRow(
                    id,
                    reader.GetString(reader.GetOrdinal("name")),
                    reader.GetString(reader.GetOrdinal("slug")),
                    GetNullableString(reader, "tagline"),
                    reader.GetString(reader.GetOrdinal("description")),
                    GetNullableDate(reader, "event_date"),
                    GetNullableString(reader, "venue"),
                    GetNullableDate(reader, "registration_deadline"),
                    GetNullableString(reader, "image_url"),
                    GetNullableString(reader, "external_link"),
                    reader.GetBoolean(reader.GetOrdinal("is_upcoming")),
                    reader.GetBoolean(reader.GetOrdinal("is_published")),
                    reader.GetInt32(reader.GetOrdinal("display_order")),
                    DateTime.SpecifyKind(
                        reader.GetDateTime(reader.GetOrdinal("created_at_utc")),
                        DateTimeKind.Utc)));

                speakers[id] = [];
                timeline[id] = [];
            }
        }

        if (eventRows.Count == 0)
        {
            return [];
        }

        await using (var command = new MySqlCommand(speakersSql, connection))
        {
            command.Parameters.AddWithValue("@publishedOnly", publishedOnly);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
            {
                var eventId = reader.GetInt64(reader.GetOrdinal("event_id"));

                if (!speakers.TryGetValue(eventId, out var eventSpeakers))
                {
                    continue;
                }

                eventSpeakers.Add(new EventSpeakerResponse(
                    reader.GetInt64(reader.GetOrdinal("id")),
                    reader.GetString(reader.GetOrdinal("name")),
                    GetNullableString(reader, "title"),
                    GetNullableString(reader, "organization"),
                    GetNullableString(reader, "image_url"),
                    reader.GetInt32(reader.GetOrdinal("display_order"))));
            }
        }

        await using (var command = new MySqlCommand(timelineSql, connection))
        {
            command.Parameters.AddWithValue("@publishedOnly", publishedOnly);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
            {
                var eventId = reader.GetInt64(reader.GetOrdinal("event_id"));

                if (!timeline.TryGetValue(eventId, out var eventTimeline))
                {
                    continue;
                }

                eventTimeline.Add(new EventTimelineItemResponse(
                    reader.GetInt64(reader.GetOrdinal("id")),
                    reader.GetString(reader.GetOrdinal("label")),
                    GetNullableString(reader, "detail"),
                    FormatDate(GetNullableDate(reader, "timeline_date")),
                    reader.GetInt32(reader.GetOrdinal("display_order"))));
            }
        }

        return eventRows
            .Select(row => ToResponse(row, speakers[row.Id], timeline[row.Id]))
            .ToList();
    }

    public async Task<AdminEventsResponse> GetAdminEventsAsync(
        CancellationToken cancellationToken)
    {
        var events = await GetEventsAsync(false, cancellationToken);

        return new AdminEventsResponse(
            events.Count,
            events.Count(static item => item.IsUpcoming),
            events.Count(static item => item.IsPublished),
            events);
    }

    public async Task<EventResponse> CreateAsync(
        AdminEventRequest request,
        long adminId,
        CancellationToken cancellationToken)
    {
        const string eventSql = """
            INSERT INTO events
            (
                name,
                slug,
                tagline,
                description,
                event_date,
                venue,
                registration_deadline,
                image_url,
                external_link,
                is_upcoming,
                is_published,
                display_order,
                created_by_admin_id
            )
            VALUES
            (
                @name,
                @slug,
                @tagline,
                @description,
                @eventDate,
                @venue,
                @registrationDeadline,
                @imageUrl,
                @externalLink,
                @isUpcoming,
                @isPublished,
                @displayOrder,
                @createdByAdminId
            );

            SELECT LAST_INSERT_ID();
            """;

        const string speakerSql = """
            INSERT INTO event_speakers
            (
                event_id,
                name,
                title,
                organization,
                image_url,
                display_order
            )
            VALUES
            (
                @eventId,
                @name,
                @title,
                @organization,
                @imageUrl,
                @displayOrder
            );
            """;

        const string timelineSql = """
            INSERT INTO event_timeline_items
            (
                event_id,
                label,
                detail,
                timeline_date,
                display_order
            )
            VALUES
            (
                @eventId,
                @label,
                @detail,
                @timelineDate,
                @displayOrder
            );
            """;

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        var slug = await CreateUniqueSlugAsync(
            connection,
            transaction,
            request.Name,
            cancellationToken);

        long eventId;

        await using (var command = new MySqlCommand(eventSql, connection, transaction))
        {
            command.Parameters.AddWithValue("@name", request.Name.Trim());
            command.Parameters.AddWithValue("@slug", slug);
            command.Parameters.AddWithValue("@tagline", ToDbValue(request.Tagline));
            command.Parameters.AddWithValue("@description", request.Description.Trim());
            command.Parameters.AddWithValue("@eventDate", ToDateDbValue(request.EventDate));
            command.Parameters.AddWithValue("@venue", ToDbValue(request.Venue));
            command.Parameters.AddWithValue("@registrationDeadline", ToDateDbValue(request.RegistrationDeadline));
            command.Parameters.AddWithValue("@imageUrl", ToDbValue(request.ImageUrl));
            command.Parameters.AddWithValue("@externalLink", ToDbValue(request.ExternalLink));
            command.Parameters.AddWithValue("@isUpcoming", request.IsUpcoming);
            command.Parameters.AddWithValue("@isPublished", request.IsPublished);
            command.Parameters.AddWithValue("@displayOrder", request.DisplayOrder);
            command.Parameters.AddWithValue("@createdByAdminId", adminId);

            var result = await command.ExecuteScalarAsync(cancellationToken);
            eventId = Convert.ToInt64(result, CultureInfo.InvariantCulture);
        }

        foreach (var speaker in request.Speakers ?? [])
        {
            await using var command = new MySqlCommand(speakerSql, connection, transaction);
            command.Parameters.AddWithValue("@eventId", eventId);
            command.Parameters.AddWithValue("@name", speaker.Name.Trim());
            command.Parameters.AddWithValue("@title", ToDbValue(speaker.Title));
            command.Parameters.AddWithValue("@organization", ToDbValue(speaker.Organization));
            command.Parameters.AddWithValue("@imageUrl", ToDbValue(speaker.ImageUrl));
            command.Parameters.AddWithValue("@displayOrder", speaker.DisplayOrder);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        foreach (var item in request.Timeline ?? [])
        {
            await using var command = new MySqlCommand(timelineSql, connection, transaction);
            command.Parameters.AddWithValue("@eventId", eventId);
            command.Parameters.AddWithValue("@label", item.Label.Trim());
            command.Parameters.AddWithValue("@detail", ToDbValue(item.Detail));
            command.Parameters.AddWithValue("@timelineDate", ToDateDbValue(item.TimelineDate));
            command.Parameters.AddWithValue("@displayOrder", item.DisplayOrder);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);

        var events = await GetEventsAsync(false, cancellationToken);
        return events.First(item => item.Id == eventId);
    }

    private async Task<string> CreateUniqueSlugAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        string name,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT slug
            FROM events
            WHERE slug = @baseSlug
               OR slug LIKE CONCAT(@baseSlug, '-%');
            """;

        var baseSlug = Slugify(name);
        var existingSlugs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        await using var command = new MySqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@baseSlug", baseSlug);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            existingSlugs.Add(reader.GetString(reader.GetOrdinal("slug")));
        }

        if (!existingSlugs.Contains(baseSlug))
        {
            return baseSlug;
        }

        for (var index = 2; index < 500; index++)
        {
            var candidate = $"{baseSlug}-{index}";

            if (!existingSlugs.Contains(candidate))
            {
                return candidate;
            }
        }

        return $"{baseSlug}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
    }

    private static EventResponse ToResponse(
        EventRow row,
        IReadOnlyList<EventSpeakerResponse> speakers,
        IReadOnlyList<EventTimelineItemResponse> timeline)
    {
        return new EventResponse(
            row.Id,
            row.Name,
            row.Slug,
            row.Slug,
            row.Tagline,
            row.Description,
            row.Description,
            FormatDate(row.EventDate),
            row.Venue,
            FormatDate(row.RegistrationDeadline),
            row.ImageUrl,
            row.ImageUrl,
            row.ExternalLink,
            row.IsUpcoming,
            row.IsPublished,
            row.DisplayOrder,
            row.DisplayOrder,
            speakers,
            timeline,
            row.CreatedAtUtc);
    }

    private static string Slugify(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            if (char.IsLetterOrDigit(character))
            {
                builder.Append(character);
            }
            else if (character is ' ' or '-' or '_' or ':' or '.' or '/')
            {
                builder.Append('-');
            }
        }

        var slug = DuplicateHyphenRegex().Replace(builder.ToString(), "-").Trim('-');
        return string.IsNullOrWhiteSpace(slug) ? "event" : slug;
    }

    private static object ToDbValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();
    }

    private static object ToDateDbValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return DBNull.Value;
        }

        return DateOnly.ParseExact(
            value.Trim(),
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture)
            .ToDateTime(TimeOnly.MinValue);
    }

    private static string? GetNullableString(MySqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    private static DateOnly? GetNullableDate(MySqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);

        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        return DateOnly.FromDateTime(reader.GetDateTime(ordinal));
    }

    private static string? FormatDate(DateOnly? value)
    {
        return value?.ToString("MMMM d, yyyy", CultureInfo.InvariantCulture);
    }

    [GeneratedRegex("-+")]
    private static partial Regex DuplicateHyphenRegex();

    private sealed record EventRow(
        long Id,
        string Name,
        string Slug,
        string? Tagline,
        string Description,
        DateOnly? EventDate,
        string? Venue,
        DateOnly? RegistrationDeadline,
        string? ImageUrl,
        string? ExternalLink,
        bool IsUpcoming,
        bool IsPublished,
        int DisplayOrder,
        DateTime CreatedAtUtc);
}

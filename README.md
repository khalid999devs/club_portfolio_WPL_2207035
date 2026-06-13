# KBEC Clone

KBEC Clone is a student-built clone of the KUET Business and Entrepreneurship Club website. The project started as a static landing page and gradually grew into a fuller club website with a video hero, about section, events, sponsors, club partners, alumni/executive pages, registration flow, and a small admin system.

The frontend is intentionally simple: plain HTML, CSS, and JavaScript. The backend is a lightweight ASP.NET Core Minimal API that stores registration data, admin users, and event posts in MySQL.

## Project Structure

```text
.
|-- index.html                  # Main landing page
|-- register.html               # Club registration form
|-- admin-login.html            # Admin login page
|-- admin-dashboard.html        # Admin dashboard, registrations, events, settings
|-- events.html                 # Public event library page
|-- alumni.html                 # Alumni page
|-- executive-panel.html        # Executive panel page
|-- assets/                     # Local images/media used by the frontend
|-- styles/                     # Page and shared CSS files
|-- js/                         # Frontend JavaScript
`-- backend/
    |-- Kbec.Api/               # ASP.NET Core backend API
    |-- database/schema.sql     # MySQL database and table setup
    `-- README.md               # Backend-specific notes
```

## What Is Included

- Landing page based on the official KBEC visual direction.
- Responsive navigation, footer, hero video, about section, events, sponsors, and partners.
- Public pages for events, alumni, and executive panel.
- Registration form connected to the ASP.NET backend.
- Admin login with session cookie authentication.
- Admin dashboard for viewing, editing, filtering, and exporting registration data.
- Admin event posting flow backed by relational MySQL tables.
- Settings area for changing the admin password and creating new admin users.

## Requirements

- A simple static server for the frontend, such as VS Code Live Server or `python3 -m http.server`.
- .NET SDK matching the backend target framework.
- MAMP or another local MySQL server.
- MySQL database created from `backend/database/schema.sql`.

The backend currently targets:

```text
net10.0
```

## Database Setup

Start MySQL from MAMP first. The default local setup assumes:

```text
Host: 127.0.0.1
Port: 8889
Database: kbec_site
User: root
Password: root
```

Open phpMyAdmin or any MySQL client and run:

```sql
-- backend/database/schema.sql
```

That script creates the main tables, including:

- `registrations`
- `admin_users`
- `events`
- `event_speakers`
- `event_timeline_items`

## Backend Config

Development settings live here:

```text
backend/Kbec.Api/appsettings.Development.json
```

Important values:

```json
"DefaultConnection": "Server=127.0.0.1;Port=8889;Database=kbec_site;User=root;Password=root;"
```

If MAMP uses another MySQL port, update the `Port` value.

The backend seeds a default admin account when the `admin_users` table exists:

```text
Username: admin
Password: KbecAdmin@2026
```

For real deployment, this seed password should be changed.

## Run Locally

Start the backend from the project root:

```bash
dotnet run --project backend/Kbec.Api
```

The API should run at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

Run the frontend with Live Server, or from the project root:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500/index.html
```

Useful local pages:

```text
http://localhost:5500/register.html
http://localhost:5500/admin-login.html
http://localhost:5500/admin-dashboard.html
http://localhost:5500/events.html
http://localhost:5500/alumni.html
http://localhost:5500/executive-panel.html
```

## Frontend API Base URL

The JavaScript files automatically call the backend at:

```text
http://<current-host>:5000
```

For a custom API URL, define this before the page scripts:

```html
<script>
  window.KBEC_API_BASE_URL = 'http://localhost:5000';
</script>
```

## Development Notes

The frontend has no build step, so most UI changes can be checked by refreshing the browser. Backend changes need a backend restart before new routes or models are available. If an admin page says an endpoint was not found, the most common fix is to stop and rerun the ASP.NET API.

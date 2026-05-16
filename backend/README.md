# KBEC ASP.NET Backend

Small ASP.NET Core Minimal API for the KBEC registration form.

## What It Does

- Exposes `POST /api/registrations`.
- Validates the registration payload from `register.html`.
- Saves valid submissions into a MySQL table named `registrations`.
- Provides admin login, logout, session check, and protected registration list APIs.
- Stores admin sessions in an HTTP-only ASP.NET session cookie.
- Uses `MySqlConnector` and direct SQL to keep the backend lightweight.

## Run MySQL With MAMP

1. Open MAMP.
2. Start **Servers**.
3. Open **MAMP > Preferences > Ports** and confirm the MySQL port.
   MAMP commonly uses `8889`.
4. Open phpMyAdmin from MAMP, or visit:

   ```text
   http://localhost:8888/phpMyAdmin/
   ```

5. In phpMyAdmin, open the **SQL** tab and run:

   ```sql
   -- From backend/database/schema.sql
   CREATE DATABASE IF NOT EXISTS kbec_site
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;

   USE kbec_site;

   CREATE TABLE IF NOT EXISTS registrations (
     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
     full_name VARCHAR(120) NOT NULL,
     roll VARCHAR(40) NOT NULL,
     email VARCHAR(160) NOT NULL,
     phone VARCHAR(40) NOT NULL,
     department VARCHAR(120) NOT NULL,
     academic_session VARCHAR(30) NOT NULL,
     current_level VARCHAR(40) NOT NULL,
     preferred_wing VARCHAR(120) NOT NULL,
     motivation TEXT NOT NULL,
     availability VARCHAR(40) NOT NULL,
     agreement_accepted BOOLEAN NOT NULL DEFAULT FALSE,
     ip_address VARCHAR(45) NULL,
     submitted_at_utc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (id),
     INDEX idx_registrations_roll (roll),
     INDEX idx_registrations_email (email),
     INDEX idx_registrations_submitted_at_utc (submitted_at_utc)
   ) ENGINE=InnoDB;

   CREATE TABLE IF NOT EXISTS admin_users (
     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
     username VARCHAR(80) NOT NULL,
     display_name VARCHAR(120) NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     is_active BOOLEAN NOT NULL DEFAULT TRUE,
     created_at_utc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     last_login_at_utc TIMESTAMP NULL,
     PRIMARY KEY (id),
     UNIQUE KEY uq_admin_users_username (username),
     INDEX idx_admin_users_is_active (is_active)
   ) ENGINE=InnoDB;
   ```

The backend seeds one default admin account when it starts and the `admin_users`
table already exists:

```text
Username: admin
Password: KbecAdmin@2026
```

## Connection String

The default local connection string is already set in
`Kbec.Api/appsettings.Development.json`:

```json
"DefaultConnection": "Server=127.0.0.1;Port=8889;Database=kbec_site;User=root;Password=root;"
```

If your MAMP MySQL port is different, update the `Port` value.

## Run The API

From the project root:

```bash
dotnet run --project backend/Kbec.Api
```

The API runs on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

## Run The Frontend

From the project root:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500/register.html
```

Admin pages:

```text
http://localhost:5500/admin-login.html
http://localhost:5500/admin-dashboard.html
```

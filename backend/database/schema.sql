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

CREATE TABLE IF NOT EXISTS events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  tagline VARCHAR(220) NULL,
  description TEXT NOT NULL,
  event_date DATE NULL,
  venue VARCHAR(180) NULL,
  registration_deadline DATE NULL,
  image_url VARCHAR(500) NULL,
  external_link VARCHAR(500) NULL,
  is_upcoming BOOLEAN NOT NULL DEFAULT TRUE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_by_admin_id BIGINT UNSIGNED NULL,
  created_at_utc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at_utc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_events_slug (slug),
  INDEX idx_events_event_date (event_date),
  INDEX idx_events_is_published (is_published),
  INDEX idx_events_is_upcoming (is_upcoming),
  CONSTRAINT fk_events_created_by_admin
    FOREIGN KEY (created_by_admin_id)
    REFERENCES admin_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_speakers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(140) NOT NULL,
  title VARCHAR(160) NULL,
  organization VARCHAR(160) NULL,
  image_url VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_event_speakers_event_id (event_id),
  CONSTRAINT fk_event_speakers_event
    FOREIGN KEY (event_id)
    REFERENCES events (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_timeline_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(140) NOT NULL,
  detail VARCHAR(260) NULL,
  timeline_date DATE NULL,
  display_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_event_timeline_items_event_id (event_id),
  CONSTRAINT fk_event_timeline_items_event
    FOREIGN KEY (event_id)
    REFERENCES events (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

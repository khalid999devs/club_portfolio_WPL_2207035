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

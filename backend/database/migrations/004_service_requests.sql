-- Migration 004: service requests from the public website form (/service-request).
-- Guests can submit without an account, so contact details are stored on the request itself.
-- Ticket numbers (SR-YYYY-NNNNN) share the "service_ticket" sequence in ecom_sequences with support_requests,
-- so the two tables never issue the same number.

CREATE TABLE service_requests (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_number         VARCHAR(20)     NOT NULL COMMENT 'e.g. SR-2026-00042',
  name                  VARCHAR(100)    NOT NULL,
  mobile                CHAR(10)        NOT NULL,
  email                 VARCHAR(254)    NOT NULL,
  product_model         VARCHAR(100)    NOT NULL,
  serial_number         VARCHAR(20)     NOT NULL,
  issue_type            VARCHAR(100)    NOT NULL,
  description           TEXT            NOT NULL,
  preferred_visit_date  DATE            NULL,
  pincode               CHAR(6)         NOT NULL,
  photo_storage_key     VARCHAR(512)    NULL COMMENT 'Path under backend/uploads — never a public URL',
  photo_file_name       VARCHAR(255)    NULL,
  photo_mime_type       VARCHAR(100)    NULL,
  photo_size_bytes      INT UNSIGNED    NULL,
  status                ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_service_requests_ticket (ticket_number),
  KEY idx_service_requests_status_created (status, created_at),
  KEY idx_service_requests_mobile (mobile),
  KEY idx_service_requests_serial (serial_number),
  CONSTRAINT chk_service_requests_mobile CHECK (mobile REGEXP '^[6-9][0-9]{9}$'),
  CONSTRAINT chk_service_requests_pincode CHECK (pincode REGEXP '^[1-9][0-9]{5}$'),
  CONSTRAINT chk_service_requests_photo_mime CHECK (photo_mime_type IS NULL OR photo_mime_type IN ('image/jpeg', 'image/png'))
) ENGINE = InnoDB;

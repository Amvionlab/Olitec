-- Migration 005: warranty registrations from the public website form (/warranties/register).
-- Customers register without an account and type the product model, so contact details and the model are stored
-- on the registration itself (the account-based `warranties` table needs a customer and a catalogue product).
-- Registration numbers (WR-YYYY-NNNNNN) share the "warranty" sequence in ecom_sequences with `warranties`,
-- so the two tables never issue the same number.

CREATE TABLE warranty_registrations (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  registration_number   VARCHAR(20)     NOT NULL COMMENT 'e.g. WR-2026-000042',
  customer_name         VARCHAR(100)    NOT NULL,
  email                 VARCHAR(254)    NOT NULL,
  mobile                CHAR(10)        NOT NULL,
  installation_address  VARCHAR(500)    NOT NULL,
  product_model         VARCHAR(100)    NOT NULL,
  serial_number         VARCHAR(30)     NOT NULL COMMENT 'Stored upper-case',
  purchase_date         DATE            NOT NULL,
  installation_date     DATE            NOT NULL,
  dealer_name           VARCHAR(150)    NOT NULL,
  dealer_contact        VARCHAR(15)     NULL COMMENT 'Digits only',
  status                ENUM('pending', 'active', 'expired', 'rejected') NOT NULL DEFAULT 'pending',
  admin_remark          VARCHAR(500)    NULL,
  reviewed_by           BIGINT UNSIGNED NULL,
  reviewed_at           DATETIME        NULL,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_warranty_registrations_number (registration_number),
  -- A physical unit can only be registered once.
  UNIQUE KEY uq_warranty_registrations_serial (serial_number),
  KEY idx_warranty_registrations_status_created (status, created_at),
  KEY idx_warranty_registrations_mobile (mobile),
  KEY idx_warranty_registrations_email (email),
  CONSTRAINT fk_warranty_registrations_reviewer FOREIGN KEY (reviewed_by) REFERENCES admins (id) ON DELETE SET NULL,
  CONSTRAINT chk_warranty_registrations_mobile CHECK (mobile REGEXP '^[6-9][0-9]{9}$'),
  CONSTRAINT chk_warranty_registrations_dealer_contact CHECK (dealer_contact IS NULL OR dealer_contact REGEXP '^[0-9]{8,15}$'),
  CONSTRAINT chk_warranty_registrations_dates CHECK (installation_date >= purchase_date)
) ENGINE = InnoDB;

-- Uploaded files live under backend/uploads; only metadata is stored here.
CREATE TABLE warranty_registration_documents (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  registration_id     BIGINT UNSIGNED NOT NULL,
  document_type       ENUM('invoice', 'installation') NOT NULL,
  storage_key         VARCHAR(512)    NOT NULL COMMENT 'Path under backend/uploads — never a public URL',
  original_file_name  VARCHAR(255)    NOT NULL,
  mime_type           VARCHAR(100)    NOT NULL,
  size_bytes          INT UNSIGNED    NOT NULL,
  checksum_sha256     CHAR(64)        NOT NULL,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_warranty_registration_documents_key (storage_key),
  UNIQUE KEY uq_warranty_registration_documents_type (registration_id, document_type),
  CONSTRAINT fk_warranty_registration_documents_registration FOREIGN KEY (registration_id) REFERENCES warranty_registrations (id) ON DELETE CASCADE,
  CONSTRAINT chk_warranty_registration_documents_mime CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  CONSTRAINT chk_warranty_registration_documents_size CHECK (size_bytes BETWEEN 1 AND 5242880)
) ENGINE = InnoDB;

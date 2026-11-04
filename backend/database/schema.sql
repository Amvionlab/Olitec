-- =====================================================================
-- Warranty platform — MySQL schema PROPOSAL (Phase 1)
-- Target: MySQL 8.0.16+ (CHECK constraints enforced), InnoDB, utf8mb4.
-- Not yet used by the backend; Phase 2 will add migrations based on this file.
--
-- Conventions
--   * BIGINT UNSIGNED surrogate keys; human-facing references (warranty_number,
--     ticket_number) are separate UNIQUE columns so internal ids are never exposed.
--   * Passwords are stored ONLY as password hashes (argon2id or bcrypt), never plain text.
--   * All timestamps are stored in UTC.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS warranty_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE warranty_db;

-- ---------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------
CREATE TABLE customers (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name               VARCHAR(100)    NOT NULL,
  email              VARCHAR(254)    NOT NULL,
  mobile             CHAR(10)        NOT NULL COMMENT '10-digit Indian mobile number, digits only',
  password_hash      VARCHAR(255)    NOT NULL COMMENT 'argon2id/bcrypt hash — never plain text',
  address_line       VARCHAR(255)    NULL,
  city               VARCHAR(100)    NULL,
  state              VARCHAR(100)    NULL,
  pincode            CHAR(6)         NULL,
  status             ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  email_verified_at  DATETIME        NULL,
  last_login_at      DATETIME        NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customers_email (email),
  UNIQUE KEY uq_customers_mobile (mobile),
  KEY idx_customers_name (name),
  KEY idx_customers_status_created (status, created_at),
  CONSTRAINT chk_customers_mobile CHECK (mobile REGEXP '^[6-9][0-9]{9}$'),
  CONSTRAINT chk_customers_pincode CHECK (pincode IS NULL OR pincode REGEXP '^[0-9]{6}$')
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------
CREATE TABLE admins (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(100)    NOT NULL,
  email          VARCHAR(254)    NOT NULL,
  password_hash  VARCHAR(255)    NOT NULL COMMENT 'argon2id/bcrypt hash — never plain text',
  role           ENUM('super_admin', 'warranty_reviewer') NOT NULL DEFAULT 'warranty_reviewer',
  is_active      BOOLEAN         NOT NULL DEFAULT TRUE,
  last_login_at  DATETIME        NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- products (catalogue)
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id               BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(120)      NOT NULL,
  name             VARCHAR(150)      NOT NULL,
  model_number     VARCHAR(50)       NOT NULL,
  category         VARCHAR(50)       NOT NULL,
  short_description VARCHAR(255)     NULL,
  description      TEXT              NULL,
  warranty_months  SMALLINT UNSIGNED NOT NULL,
  price_inr        DECIMAL(10, 2)    NULL,
  image_url        VARCHAR(512)      NULL,
  is_active        BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  UNIQUE KEY uq_products_model (model_number),
  KEY idx_products_category_active (category, is_active),
  CONSTRAINT chk_products_warranty CHECK (warranty_months BETWEEN 1 AND 240),
  CONSTRAINT chk_products_price CHECK (price_inr IS NULL OR price_inr >= 0)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- warranties (one row per registered product unit)
-- ---------------------------------------------------------------------
CREATE TABLE warranties (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  warranty_number  VARCHAR(20)     NOT NULL COMMENT 'e.g. WR-2026-007731',
  customer_id      BIGINT UNSIGNED NOT NULL,
  product_id       BIGINT UNSIGNED NOT NULL,
  serial_number    VARCHAR(20)     NOT NULL,
  purchase_date    DATE            NOT NULL,
  invoice_number   VARCHAR(60)     NOT NULL,
  dealer_name      VARCHAR(150)    NOT NULL,
  start_date       DATE            NULL COMMENT 'Set on approval',
  end_date         DATE            NULL COMMENT 'Set on approval',
  status           ENUM('pending', 'active', 'expired', 'rejected') NOT NULL DEFAULT 'pending',
  admin_remark     VARCHAR(500)    NULL,
  reviewed_by      BIGINT UNSIGNED NULL,
  reviewed_at      DATETIME        NULL,
  submitted_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_warranties_number (warranty_number),
  -- A physical unit can only be registered once.
  UNIQUE KEY uq_warranties_product_serial (product_id, serial_number),
  KEY idx_warranties_customer_status (customer_id, status),
  KEY idx_warranties_status_submitted (status, submitted_at),
  KEY idx_warranties_end_date (status, end_date) COMMENT 'Nightly expiry job and "expiring soon" queries',
  KEY idx_warranties_serial (serial_number),
  KEY idx_warranties_invoice (invoice_number),
  KEY idx_warranties_reviewed_by (reviewed_by),
  CONSTRAINT fk_warranties_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
  CONSTRAINT fk_warranties_product  FOREIGN KEY (product_id)  REFERENCES products (id)  ON DELETE RESTRICT,
  CONSTRAINT fk_warranties_reviewer FOREIGN KEY (reviewed_by) REFERENCES admins (id)    ON DELETE SET NULL,
  CONSTRAINT chk_warranties_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT chk_warranties_active_dates CHECK (status NOT IN ('active', 'expired') OR (start_date IS NOT NULL AND end_date IS NOT NULL))
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- warranty_documents (invoice copies and other uploads)
-- Files live in object storage; only metadata is stored here.
-- ---------------------------------------------------------------------
CREATE TABLE warranty_documents (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  warranty_id        BIGINT UNSIGNED NOT NULL,
  document_type      ENUM('invoice', 'product_photo', 'other') NOT NULL DEFAULT 'invoice',
  storage_key        VARCHAR(512)    NOT NULL COMMENT 'Object storage key — never a public URL',
  original_file_name VARCHAR(255)    NOT NULL,
  mime_type          VARCHAR(100)    NOT NULL,
  size_bytes         INT UNSIGNED    NOT NULL,
  checksum_sha256    CHAR(64)        NOT NULL,
  uploaded_by_customer_id BIGINT UNSIGNED NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_warranty_documents_storage_key (storage_key),
  KEY idx_warranty_documents_warranty (warranty_id, document_type),
  CONSTRAINT fk_warranty_documents_warranty FOREIGN KEY (warranty_id) REFERENCES warranties (id) ON DELETE CASCADE,
  CONSTRAINT fk_warranty_documents_customer FOREIGN KEY (uploaded_by_customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT chk_warranty_documents_mime CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  CONSTRAINT chk_warranty_documents_size CHECK (size_bytes BETWEEN 1 AND 5242880)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- support_requests
-- ---------------------------------------------------------------------
CREATE TABLE support_requests (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_number     VARCHAR(20)     NOT NULL COMMENT 'e.g. SR-2026-01344',
  customer_id       BIGINT UNSIGNED NULL COMMENT 'NULL for guest contact-form submissions',
  warranty_id       BIGINT UNSIGNED NULL,
  category          ENUM('installation', 'repair', 'warranty_claim', 'general_enquiry') NOT NULL,
  subject           VARCHAR(120)    NOT NULL,
  message           TEXT            NOT NULL,
  contact_name      VARCHAR(100)    NOT NULL,
  contact_email     VARCHAR(254)    NOT NULL,
  contact_mobile    CHAR(10)        NOT NULL,
  status            ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  assigned_admin_id BIGINT UNSIGNED NULL,
  resolved_at       DATETIME        NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_requests_ticket (ticket_number),
  KEY idx_support_requests_customer_created (customer_id, created_at),
  KEY idx_support_requests_status_created (status, created_at),
  KEY idx_support_requests_warranty (warranty_id),
  KEY idx_support_requests_assigned (assigned_admin_id, status),
  CONSTRAINT fk_support_requests_customer FOREIGN KEY (customer_id)       REFERENCES customers (id)  ON DELETE SET NULL,
  CONSTRAINT fk_support_requests_warranty FOREIGN KEY (warranty_id)       REFERENCES warranties (id) ON DELETE SET NULL,
  CONSTRAINT fk_support_requests_admin    FOREIGN KEY (assigned_admin_id) REFERENCES admins (id)     ON DELETE SET NULL
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- RECOMMENDED ADDITION: warranty_status_history
-- Append-only audit trail behind the admin panel's "Audit history" section.
-- ---------------------------------------------------------------------
CREATE TABLE warranty_status_history (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  warranty_id  BIGINT UNSIGNED NOT NULL,
  from_status  ENUM('pending', 'active', 'expired', 'rejected') NULL,
  to_status    ENUM('pending', 'active', 'expired', 'rejected') NOT NULL,
  action       VARCHAR(50)     NOT NULL COMMENT 'submitted | approved | rejected | status_changed | auto_expired',
  remark       VARCHAR(500)    NULL,
  admin_id     BIGINT UNSIGNED NULL COMMENT 'NULL when performed by the customer or the system',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_warranty_history_warranty (warranty_id, created_at),
  CONSTRAINT fk_warranty_history_warranty FOREIGN KEY (warranty_id) REFERENCES warranties (id) ON DELETE CASCADE,
  CONSTRAINT fk_warranty_history_admin    FOREIGN KEY (admin_id)    REFERENCES admins (id)     ON DELETE SET NULL
) ENGINE = InnoDB;

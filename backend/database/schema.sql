-- =====================================================================
-- Olitec Clean Energy & Warranty Platform Schema
-- =====================================================================

CREATE DATABASE IF NOT EXISTS warranty_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE warranty_db;

-- 1. Users table (Customer signups and Admin accounts)
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(191) NOT NULL,
  mobile        VARCHAR(20)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  status        ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  address       VARCHAR(255) NULL,
  city          VARCHAR(100) NULL,
  state         VARCHAR(100) NULL,
  pincode       VARCHAR(10)  NULL,
  last_login_at DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_mobile (mobile),
  KEY idx_users_role_status (role, status)
) ENGINE = InnoDB;

-- 2. Products table (Product Master managed by Admin, used in Warranty)
CREATE TABLE IF NOT EXISTS products (
  id                INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug              VARCHAR(150)   NOT NULL,
  name              VARCHAR(150)   NOT NULL,
  model_number      VARCHAR(100)   NOT NULL,
  category          VARCHAR(100)   NOT NULL,
  short_description VARCHAR(255)   NULL,
  description       TEXT           NULL,
  warranty_months   SMALLINT UNSIGNED NOT NULL DEFAULT 12,
  price_inr         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  image_url         VARCHAR(512)   NULL,
  is_active         BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  UNIQUE KEY uq_products_model (model_number),
  KEY idx_products_category (category, is_active)
) ENGINE = InnoDB;

-- 3. Warranties table (Customer warranty registrations)
CREATE TABLE IF NOT EXISTS warranties (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  warranty_number      VARCHAR(50)  NOT NULL,
  user_id              INT UNSIGNED NULL,
  customer_name        VARCHAR(150) NOT NULL,
  email                VARCHAR(191) NOT NULL,
  mobile               VARCHAR(20)  NOT NULL,
  installation_address TEXT         NOT NULL,
  product_id           INT UNSIGNED NULL,
  product_model        VARCHAR(100) NOT NULL,
  serial_number        VARCHAR(100) NOT NULL,
  purchase_date        DATE         NOT NULL,
  installation_date    DATE         NULL,
  dealer_name          VARCHAR(150) NOT NULL,
  dealer_contact       VARCHAR(50)  NULL,
  invoice_file         VARCHAR(500) NULL,
  installation_file    VARCHAR(500) NULL,
  status               ENUM('pending', 'active', 'expired', 'rejected') NOT NULL DEFAULT 'pending',
  start_date           DATE         NULL,
  end_date             DATE         NULL,
  admin_remark         TEXT         NULL,
  reviewed_by          INT UNSIGNED NULL,
  reviewed_at          DATETIME     NULL,
  submitted_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_warranties_number (warranty_number),
  KEY idx_warranties_user (user_id),
  KEY idx_warranties_product (product_id),
  KEY idx_warranties_serial_mobile (serial_number, mobile),
  KEY idx_warranties_status (status),
  CONSTRAINT fk_warranties_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_warranties_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL,
  CONSTRAINT fk_warranties_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- 4. Support requests / Service tickets
CREATE TABLE IF NOT EXISTS support_requests (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_number  VARCHAR(50)  NOT NULL,
  user_id        INT UNSIGNED NULL,
  category       VARCHAR(50)  NOT NULL,
  subject        VARCHAR(150) NOT NULL,
  message        TEXT         NOT NULL,
  contact_name   VARCHAR(150) NOT NULL,
  contact_email  VARCHAR(191) NOT NULL,
  contact_mobile VARCHAR(20)  NOT NULL,
  status         ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_ticket (ticket_number),
  KEY idx_support_user (user_id),
  KEY idx_support_status (status)
) ENGINE = InnoDB;

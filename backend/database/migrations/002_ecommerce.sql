-- =====================================================================
-- Migration 002: e-commerce module tables (MySQL 8.0.16+, InnoDB, utf8mb4).
--
-- Conventions (same as 001)
--   * Every e-commerce table is prefixed ecom_ so it stays separate from warranty tables.
--   * Customers and admins are REUSED from 001 (customers, admins); nothing here alters them
--     except migration 003, which only widens admins.role.
--   * Money is DECIMAL(12,2) in INR. Selling prices are GST-inclusive (MRP convention in India).
--   * Order items snapshot product name/SKU/price so later catalogue edits never change old orders.
--   * All timestamps are UTC.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------
CREATE TABLE ecom_categories (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id        BIGINT UNSIGNED NULL,
  name             VARCHAR(100)    NOT NULL,
  slug             VARCHAR(120)    NOT NULL,
  description      VARCHAR(1000)   NULL,
  image_url        VARCHAR(512)    NULL,
  display_order    INT             NOT NULL DEFAULT 0,
  is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
  seo_title        VARCHAR(160)    NULL,
  seo_description  VARCHAR(320)    NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_categories_slug (slug),
  KEY idx_ecom_categories_parent_order (parent_id, display_order),
  CONSTRAINT fk_ecom_categories_parent FOREIGN KEY (parent_id) REFERENCES ecom_categories (id) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE ecom_brands (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)    NOT NULL,
  slug        VARCHAR(120)    NOT NULL,
  is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_brands_name (name),
  UNIQUE KEY uq_ecom_brands_slug (slug)
) ENGINE = InnoDB;

CREATE TABLE ecom_products (
  id                   BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  sku                  VARCHAR(64)      NOT NULL,
  slug                 VARCHAR(160)     NOT NULL,
  name                 VARCHAR(200)     NOT NULL,
  category_id          BIGINT UNSIGNED  NOT NULL,
  brand_id             BIGINT UNSIGNED  NULL,
  variant_of_id        BIGINT UNSIGNED  NULL COMMENT 'Variants are full products grouped under a parent product',
  attributes           JSON             NULL COMMENT 'Variant attributes, e.g. {"Capacity":"5 kW"}',
  short_description    VARCHAR(500)     NULL,
  description          TEXT             NULL,
  features             JSON             NULL COMMENT 'Array of strings',
  specifications       JSON             NULL COMMENT 'Array of {label, value}',
  mrp                  DECIMAL(12, 2)   NOT NULL,
  selling_price        DECIMAL(12, 2)   NOT NULL,
  tax_rate             DECIMAL(5, 2)    NOT NULL DEFAULT 18.00 COMMENT 'GST %, included in selling_price',
  hsn_code             VARCHAR(16)      NULL,
  warranty_info        VARCHAR(500)     NULL,
  delivery_info        VARCHAR(500)     NULL,
  stock_qty            INT              NOT NULL DEFAULT 0 COMMENT 'Physical units on hand',
  reserved_qty         INT              NOT NULL DEFAULT 0 COMMENT 'Held by unpaid checkouts',
  low_stock_threshold  INT              NOT NULL DEFAULT 5,
  max_order_qty        INT              NOT NULL DEFAULT 10,
  is_featured          BOOLEAN          NOT NULL DEFAULT FALSE,
  is_best_seller       BOOLEAN          NOT NULL DEFAULT FALSE,
  is_new_arrival       BOOLEAN          NOT NULL DEFAULT FALSE,
  is_on_offer          BOOLEAN          NOT NULL DEFAULT FALSE,
  status               ENUM('draft', 'active', 'inactive', 'archived') NOT NULL DEFAULT 'draft',
  seo_title            VARCHAR(160)     NULL,
  seo_description      VARCHAR(320)     NULL,
  sold_count           INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT 'Popularity sort',
  rating_avg           DECIMAL(3, 2)    NOT NULL DEFAULT 0,
  rating_count         INT UNSIGNED     NOT NULL DEFAULT 0,
  created_at           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_products_sku (sku),
  UNIQUE KEY uq_ecom_products_slug (slug),
  KEY idx_ecom_products_category_status (category_id, status),
  KEY idx_ecom_products_brand (brand_id),
  KEY idx_ecom_products_variant_of (variant_of_id),
  KEY idx_ecom_products_status_price (status, selling_price),
  KEY idx_ecom_products_status_created (status, created_at),
  FULLTEXT KEY ft_ecom_products_search (name, sku, short_description),
  CONSTRAINT fk_ecom_products_category FOREIGN KEY (category_id) REFERENCES ecom_categories (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ecom_products_brand FOREIGN KEY (brand_id) REFERENCES ecom_brands (id) ON DELETE SET NULL,
  CONSTRAINT fk_ecom_products_variant_of FOREIGN KEY (variant_of_id) REFERENCES ecom_products (id) ON DELETE SET NULL,
  CONSTRAINT chk_ecom_products_price CHECK (mrp > 0 AND selling_price > 0 AND selling_price <= mrp),
  CONSTRAINT chk_ecom_products_tax CHECK (tax_rate BETWEEN 0 AND 40),
  CONSTRAINT chk_ecom_products_stock CHECK (stock_qty >= 0 AND reserved_qty >= 0 AND reserved_qty <= stock_qty),
  CONSTRAINT chk_ecom_products_limits CHECK (low_stock_threshold >= 0 AND max_order_qty BETWEEN 1 AND 10000)
) ENGINE = InnoDB;

CREATE TABLE ecom_product_images (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id  BIGINT UNSIGNED NOT NULL,
  url         VARCHAR(512)    NOT NULL,
  alt_text    VARCHAR(200)    NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ecom_product_images_product (product_id, sort_order),
  CONSTRAINT fk_ecom_product_images_product FOREIGN KEY (product_id) REFERENCES ecom_products (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Inventory movements (append-only ledger; ecom_products.stock_qty is the running balance)
-- ---------------------------------------------------------------------
CREATE TABLE ecom_inventory_movements (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id      BIGINT UNSIGNED NOT NULL,
  movement_type   ENUM('stock_in', 'stock_out', 'adjustment', 'reservation', 'release', 'sale', 'return') NOT NULL,
  quantity        INT             NOT NULL COMMENT 'Signed change to stock (reservation/release change reserved_qty)',
  stock_after     INT             NOT NULL,
  reserved_after  INT             NOT NULL,
  reference_type  VARCHAR(30)     NULL COMMENT 'order | manual | reconciliation',
  reference_id    VARCHAR(40)     NULL,
  note            VARCHAR(500)    NULL,
  admin_id        BIGINT UNSIGNED NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ecom_inv_mov_product_created (product_id, created_at),
  KEY idx_ecom_inv_mov_type_created (movement_type, created_at),
  KEY idx_ecom_inv_mov_reference (reference_type, reference_id),
  CONSTRAINT fk_ecom_inv_mov_product FOREIGN KEY (product_id) REFERENCES ecom_products (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ecom_inv_mov_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Customer data (customers table itself comes from 001)
-- ---------------------------------------------------------------------
CREATE TABLE ecom_addresses (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id          BIGINT UNSIGNED NOT NULL,
  label                VARCHAR(40)     NULL,
  full_name            VARCHAR(100)    NOT NULL,
  phone                CHAR(10)        NOT NULL,
  line1                VARCHAR(200)    NOT NULL,
  line2                VARCHAR(200)    NULL,
  city                 VARCHAR(100)    NOT NULL,
  state                VARCHAR(100)    NOT NULL,
  pincode              CHAR(6)         NOT NULL,
  is_default_shipping  BOOLEAN         NOT NULL DEFAULT FALSE,
  is_default_billing   BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ecom_addresses_customer (customer_id),
  CONSTRAINT fk_ecom_addresses_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT chk_ecom_addresses_phone CHECK (phone REGEXP '^[6-9][0-9]{9}$'),
  CONSTRAINT chk_ecom_addresses_pincode CHECK (pincode REGEXP '^[1-9][0-9]{5}$')
) ENGINE = InnoDB;

CREATE TABLE ecom_carts (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token_hash   CHAR(64)        NULL COMMENT 'SHA-256 of the guest cart cookie; NULL once owned by a customer',
  customer_id  BIGINT UNSIGNED NULL,
  coupon_code  VARCHAR(40)     NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_carts_token (token_hash),
  UNIQUE KEY uq_ecom_carts_customer (customer_id),
  CONSTRAINT fk_ecom_carts_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT chk_ecom_carts_owner CHECK (token_hash IS NOT NULL OR customer_id IS NOT NULL)
) ENGINE = InnoDB;

CREATE TABLE ecom_cart_items (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id     BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  quantity    INT             NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_cart_items_product (cart_id, product_id),
  CONSTRAINT fk_ecom_cart_items_cart FOREIGN KEY (cart_id) REFERENCES ecom_carts (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_cart_items_product FOREIGN KEY (product_id) REFERENCES ecom_products (id) ON DELETE CASCADE,
  CONSTRAINT chk_ecom_cart_items_qty CHECK (quantity BETWEEN 1 AND 10000)
) ENGINE = InnoDB;

CREATE TABLE ecom_wishlist_items (
  customer_id  BIGINT UNSIGNED NOT NULL,
  product_id   BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, product_id),
  CONSTRAINT fk_ecom_wishlist_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_wishlist_product FOREIGN KEY (product_id) REFERENCES ecom_products (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------
CREATE TABLE ecom_coupons (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code                VARCHAR(40)     NOT NULL COMMENT 'Stored upper-case',
  description         VARCHAR(255)    NULL,
  discount_type       ENUM('percentage', 'fixed') NOT NULL,
  discount_value      DECIMAL(12, 2)  NOT NULL,
  min_order_value     DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  max_discount        DECIMAL(12, 2)  NULL,
  starts_at           DATETIME        NULL,
  ends_at             DATETIME        NULL,
  usage_limit         INT UNSIGNED    NULL COMMENT 'NULL = unlimited',
  per_customer_limit  INT UNSIGNED    NULL COMMENT 'NULL = unlimited',
  used_count          INT UNSIGNED    NOT NULL DEFAULT 0,
  new_customers_only  BOOLEAN         NOT NULL DEFAULT FALSE,
  applies_to          ENUM('all', 'products', 'categories') NOT NULL DEFAULT 'all',
  applicable_ids      JSON            NULL COMMENT 'Product or category ids when applies_to is not all',
  is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_coupons_code (code),
  CONSTRAINT chk_ecom_coupons_value CHECK (discount_value > 0 AND (discount_type = 'fixed' OR discount_value <= 100)),
  CONSTRAINT chk_ecom_coupons_dates CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
CREATE TABLE ecom_orders (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number            VARCHAR(24)     NOT NULL COMMENT 'e.g. OL-2026-000123',
  customer_id             BIGINT UNSIGNED NULL COMMENT 'NULL for guest checkout',
  idempotency_key         VARCHAR(64)     NOT NULL COMMENT 'Client-generated per checkout attempt; blocks duplicate orders',
  access_token_hash       CHAR(64)        NOT NULL COMMENT 'SHA-256 of the token that lets a guest view/pay this order',
  contact_name            VARCHAR(100)    NOT NULL,
  contact_email           VARCHAR(254)    NOT NULL,
  contact_phone           CHAR(10)        NOT NULL,
  shipping_address        JSON            NOT NULL,
  billing_address         JSON            NOT NULL,
  billing_gstin           VARCHAR(15)     NULL,
  subtotal                DECIMAL(12, 2)  NOT NULL COMMENT 'Sum of GST-inclusive line totals',
  discount_total          DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  shipping_total          DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  tax_total               DECIMAL(12, 2)  NOT NULL DEFAULT 0 COMMENT 'GST included in the grand total',
  grand_total             DECIMAL(12, 2)  NOT NULL,
  coupon_id               BIGINT UNSIGNED NULL,
  coupon_code             VARCHAR(40)     NULL,
  payment_method          ENUM('online', 'cod') NOT NULL,
  payment_status          ENUM('pending', 'paid', 'failed', 'cod_pending', 'refund_pending', 'partially_refunded', 'refunded') NOT NULL DEFAULT 'pending',
  status                  ENUM('pending_payment', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered',
                               'cancelled', 'return_requested', 'returned', 'refunded') NOT NULL DEFAULT 'pending_payment',
  stock_state             ENUM('reserved', 'committed', 'released', 'restocked') NOT NULL DEFAULT 'reserved',
  reservation_expires_at  DATETIME        NULL,
  courier_name            VARCHAR(100)    NULL,
  tracking_number         VARCHAR(100)    NULL,
  tracking_url            VARCHAR(512)    NULL,
  assigned_admin_id       BIGINT UNSIGNED NULL,
  customer_note           VARCHAR(500)    NULL,
  placed_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at            DATETIME        NULL,
  shipped_at              DATETIME        NULL,
  delivered_at            DATETIME        NULL,
  cancelled_at            DATETIME        NULL,
  created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_orders_number (order_number),
  UNIQUE KEY uq_ecom_orders_idempotency (idempotency_key),
  KEY idx_ecom_orders_customer_placed (customer_id, placed_at),
  KEY idx_ecom_orders_status_placed (status, placed_at),
  KEY idx_ecom_orders_payment_status (payment_status, placed_at),
  KEY idx_ecom_orders_reservation (stock_state, reservation_expires_at),
  KEY idx_ecom_orders_email (contact_email),
  KEY idx_ecom_orders_assigned (assigned_admin_id),
  CONSTRAINT fk_ecom_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_ecom_orders_coupon FOREIGN KEY (coupon_id) REFERENCES ecom_coupons (id) ON DELETE SET NULL,
  CONSTRAINT fk_ecom_orders_assigned FOREIGN KEY (assigned_admin_id) REFERENCES admins (id) ON DELETE SET NULL,
  CONSTRAINT chk_ecom_orders_totals CHECK (subtotal >= 0 AND discount_total >= 0 AND shipping_total >= 0 AND tax_total >= 0 AND grand_total >= 0)
) ENGINE = InnoDB;

CREATE TABLE ecom_order_items (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id       BIGINT UNSIGNED NOT NULL,
  product_id     BIGINT UNSIGNED NULL COMMENT 'Kept for reporting; snapshot columns are the source of truth',
  sku            VARCHAR(64)     NOT NULL,
  product_name   VARCHAR(200)    NOT NULL,
  image_url      VARCHAR(512)    NULL,
  attributes     JSON            NULL,
  mrp            DECIMAL(12, 2)  NOT NULL,
  unit_price     DECIMAL(12, 2)  NOT NULL,
  tax_rate       DECIMAL(5, 2)   NOT NULL,
  hsn_code       VARCHAR(16)     NULL,
  quantity       INT             NOT NULL,
  line_total     DECIMAL(12, 2)  NOT NULL,
  category_id    BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_ecom_order_items_order (order_id),
  KEY idx_ecom_order_items_product (product_id),
  CONSTRAINT fk_ecom_order_items_order FOREIGN KEY (order_id) REFERENCES ecom_orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_order_items_product FOREIGN KEY (product_id) REFERENCES ecom_products (id) ON DELETE SET NULL,
  CONSTRAINT chk_ecom_order_items_qty CHECK (quantity > 0)
) ENGINE = InnoDB;

CREATE TABLE ecom_order_status_history (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     BIGINT UNSIGNED NOT NULL,
  from_status  VARCHAR(30)     NULL,
  to_status    VARCHAR(30)     NOT NULL,
  note         VARCHAR(500)    NULL,
  actor_type   ENUM('customer', 'admin', 'system') NOT NULL,
  actor_id     BIGINT UNSIGNED NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ecom_order_history_order (order_id, created_at),
  CONSTRAINT fk_ecom_order_history_order FOREIGN KEY (order_id) REFERENCES ecom_orders (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE ecom_order_notes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    BIGINT UNSIGNED NOT NULL,
  admin_id    BIGINT UNSIGNED NULL,
  note        VARCHAR(1000)   NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ecom_order_notes_order (order_id, created_at),
  CONSTRAINT fk_ecom_order_notes_order FOREIGN KEY (order_id) REFERENCES ecom_orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_order_notes_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE ecom_order_requests (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id      BIGINT UNSIGNED NOT NULL,
  request_type  ENUM('cancellation', 'return') NOT NULL,
  reason        VARCHAR(1000)   NOT NULL,
  status        ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  admin_remark  VARCHAR(500)    NULL,
  decided_by    BIGINT UNSIGNED NULL,
  decided_at    DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ecom_order_requests_order (order_id),
  KEY idx_ecom_order_requests_status (status, created_at),
  CONSTRAINT fk_ecom_order_requests_order FOREIGN KEY (order_id) REFERENCES ecom_orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_order_requests_admin FOREIGN KEY (decided_by) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE ecom_coupon_usages (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  coupon_id    BIGINT UNSIGNED NOT NULL,
  order_id     BIGINT UNSIGNED NOT NULL,
  customer_id  BIGINT UNSIGNED NULL,
  email        VARCHAR(254)    NOT NULL,
  discount     DECIMAL(12, 2)  NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_coupon_usages_order (order_id),
  KEY idx_ecom_coupon_usages_coupon_customer (coupon_id, customer_id),
  KEY idx_ecom_coupon_usages_coupon_email (coupon_id, email),
  CONSTRAINT fk_ecom_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES ecom_coupons (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_coupon_usages_order FOREIGN KEY (order_id) REFERENCES ecom_orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_coupon_usages_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Payments and refunds
-- ---------------------------------------------------------------------
CREATE TABLE ecom_payments (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id             BIGINT UNSIGNED NOT NULL,
  provider             VARCHAR(20)     NOT NULL COMMENT 'razorpay | mock (development only)',
  provider_order_id    VARCHAR(64)     NOT NULL,
  provider_payment_id  VARCHAR(64)     NULL,
  amount               DECIMAL(12, 2)  NOT NULL,
  currency             CHAR(3)         NOT NULL DEFAULT 'INR',
  status               ENUM('created', 'captured', 'failed') NOT NULL DEFAULT 'created',
  method               VARCHAR(30)     NULL COMMENT 'upi | card | netbanking | wallet, as reported by the gateway',
  error_code           VARCHAR(100)    NULL,
  error_description    VARCHAR(500)    NULL,
  created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_payments_provider_order (provider, provider_order_id),
  UNIQUE KEY uq_ecom_payments_provider_payment (provider, provider_payment_id),
  KEY idx_ecom_payments_order (order_id),
  KEY idx_ecom_payments_status_created (status, created_at),
  CONSTRAINT fk_ecom_payments_order FOREIGN KEY (order_id) REFERENCES ecom_orders (id) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE ecom_payment_events (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider           VARCHAR(20)     NOT NULL,
  provider_event_id  VARCHAR(100)    NOT NULL,
  event_type         VARCHAR(60)     NOT NULL,
  payload            JSON            NOT NULL,
  processed_at       DATETIME        NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_payment_events (provider, provider_event_id)
) ENGINE = InnoDB;

CREATE TABLE ecom_refunds (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  refund_number       VARCHAR(24)     NOT NULL,
  order_id            BIGINT UNSIGNED NOT NULL,
  payment_id          BIGINT UNSIGNED NULL,
  amount              DECIMAL(12, 2)  NOT NULL,
  reason              VARCHAR(500)    NOT NULL,
  status              ENUM('pending', 'processing', 'processed', 'failed', 'rejected') NOT NULL DEFAULT 'pending',
  provider_refund_id  VARCHAR(64)     NULL,
  failure_reason      VARCHAR(500)    NULL,
  requested_by        ENUM('customer', 'admin', 'system') NOT NULL,
  approved_by         BIGINT UNSIGNED NULL,
  processed_at        DATETIME        NULL,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_refunds_number (refund_number),
  UNIQUE KEY uq_ecom_refunds_provider (provider_refund_id),
  KEY idx_ecom_refunds_order (order_id),
  KEY idx_ecom_refunds_status_created (status, created_at),
  CONSTRAINT fk_ecom_refunds_order FOREIGN KEY (order_id) REFERENCES ecom_orders (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ecom_refunds_payment FOREIGN KEY (payment_id) REFERENCES ecom_payments (id) ON DELETE SET NULL,
  CONSTRAINT fk_ecom_refunds_admin FOREIGN KEY (approved_by) REFERENCES admins (id) ON DELETE SET NULL,
  CONSTRAINT chk_ecom_refunds_amount CHECK (amount > 0)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------
CREATE TABLE ecom_reviews (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  product_id   BIGINT UNSIGNED  NOT NULL,
  customer_id  BIGINT UNSIGNED  NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,
  title        VARCHAR(120)     NULL,
  body         VARCHAR(2000)    NULL,
  status       ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_reviews_product_customer (product_id, customer_id),
  KEY idx_ecom_reviews_product_status (product_id, status),
  CONSTRAINT fk_ecom_reviews_product FOREIGN KEY (product_id) REFERENCES ecom_products (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT chk_ecom_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Bulk purchase enquiries and quotations
-- ---------------------------------------------------------------------
CREATE TABLE ecom_bulk_enquiries (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  enquiry_number     VARCHAR(24)     NOT NULL,
  customer_id        BIGINT UNSIGNED NULL,
  contact_name       VARCHAR(100)    NOT NULL,
  company_name       VARCHAR(150)    NULL,
  email              VARCHAR(254)    NOT NULL,
  phone              CHAR(10)        NOT NULL,
  products           JSON            NOT NULL COMMENT 'Array of {productId?, name, quantity}',
  delivery_location  VARCHAR(200)    NOT NULL,
  gstin              VARCHAR(15)     NULL,
  requirements       VARCHAR(2000)   NULL,
  status             ENUM('new', 'contacted', 'quotation_sent', 'negotiation', 'converted', 'closed') NOT NULL DEFAULT 'new',
  assigned_admin_id  BIGINT UNSIGNED NULL,
  converted_order_id BIGINT UNSIGNED NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_bulk_enquiries_number (enquiry_number),
  KEY idx_ecom_bulk_enquiries_status_created (status, created_at),
  KEY idx_ecom_bulk_enquiries_assigned (assigned_admin_id),
  CONSTRAINT fk_ecom_bulk_enquiries_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_ecom_bulk_enquiries_admin FOREIGN KEY (assigned_admin_id) REFERENCES admins (id) ON DELETE SET NULL,
  CONSTRAINT fk_ecom_bulk_enquiries_order FOREIGN KEY (converted_order_id) REFERENCES ecom_orders (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE ecom_enquiry_notes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  enquiry_id  BIGINT UNSIGNED NOT NULL,
  admin_id    BIGINT UNSIGNED NULL,
  note        VARCHAR(1000)   NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ecom_enquiry_notes_enquiry (enquiry_id, created_at),
  CONSTRAINT fk_ecom_enquiry_notes_enquiry FOREIGN KEY (enquiry_id) REFERENCES ecom_bulk_enquiries (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_enquiry_notes_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE ecom_quotations (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quotation_number  VARCHAR(24)     NOT NULL,
  enquiry_id        BIGINT UNSIGNED NOT NULL,
  items             JSON            NOT NULL COMMENT 'Array of {productId?, name, sku?, quantity, unitPrice, taxRate}',
  subtotal          DECIMAL(12, 2)  NOT NULL,
  tax_total         DECIMAL(12, 2)  NOT NULL,
  shipping_total    DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  grand_total       DECIMAL(12, 2)  NOT NULL,
  valid_until       DATE            NOT NULL,
  terms             VARCHAR(2000)   NULL,
  status            ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') NOT NULL DEFAULT 'draft',
  created_by        BIGINT UNSIGNED NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_quotations_number (quotation_number),
  KEY idx_ecom_quotations_enquiry (enquiry_id),
  CONSTRAINT fk_ecom_quotations_enquiry FOREIGN KEY (enquiry_id) REFERENCES ecom_bulk_enquiries (id) ON DELETE CASCADE,
  CONSTRAINT fk_ecom_quotations_admin FOREIGN KEY (created_by) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Customer support (separate from warranty support_requests)
-- ---------------------------------------------------------------------
CREATE TABLE ecom_support_tickets (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_number      VARCHAR(24)     NOT NULL,
  customer_id        BIGINT UNSIGNED NULL,
  order_id           BIGINT UNSIGNED NULL,
  contact_name       VARCHAR(100)    NOT NULL,
  contact_email      VARCHAR(254)    NOT NULL,
  contact_phone      CHAR(10)        NULL,
  subject            VARCHAR(150)    NOT NULL,
  message            VARCHAR(4000)   NOT NULL,
  status             ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  admin_response     VARCHAR(4000)   NULL,
  assigned_admin_id  BIGINT UNSIGNED NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_support_tickets_number (ticket_number),
  KEY idx_ecom_support_tickets_customer (customer_id, created_at),
  KEY idx_ecom_support_tickets_status (status, created_at),
  CONSTRAINT fk_ecom_support_tickets_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_ecom_support_tickets_order FOREIGN KEY (order_id) REFERENCES ecom_orders (id) ON DELETE SET NULL,
  CONSTRAINT fk_ecom_support_tickets_admin FOREIGN KEY (assigned_admin_id) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Website content (CMS) and settings
-- ---------------------------------------------------------------------
CREATE TABLE ecom_content_blocks (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  block_type     ENUM('banner', 'promo', 'testimonial', 'faq', 'trust_badge') NOT NULL,
  title          VARCHAR(200)    NOT NULL,
  subtitle       VARCHAR(300)    NULL,
  body           TEXT            NULL,
  image_url      VARCHAR(512)    NULL,
  link_url       VARCHAR(512)    NULL,
  link_label     VARCHAR(60)     NULL,
  author_name    VARCHAR(100)    NULL COMMENT 'Testimonials only',
  display_order  INT             NOT NULL DEFAULT 0,
  is_active      BOOLEAN         NOT NULL DEFAULT FALSE COMMENT 'New blocks start unpublished (testimonials need approval)',
  starts_at      DATETIME        NULL,
  ends_at        DATETIME        NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ecom_content_blocks_type (block_type, is_active, display_order)
) ENGINE = InnoDB;

CREATE TABLE ecom_pages (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(120)    NOT NULL,
  title            VARCHAR(200)    NOT NULL,
  body             MEDIUMTEXT      NOT NULL COMMENT 'Plain text with blank-line paragraphs; rendered as text, never as HTML',
  seo_title        VARCHAR(160)    NULL,
  seo_description  VARCHAR(320)    NULL,
  is_published     BOOLEAN         NOT NULL DEFAULT FALSE,
  updated_by       BIGINT UNSIGNED NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_pages_slug (slug),
  CONSTRAINT fk_ecom_pages_admin FOREIGN KEY (updated_by) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE ecom_settings (
  setting_key    VARCHAR(60)  NOT NULL,
  setting_value  JSON         NOT NULL,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Authentication (shared customers/admins identities, e-commerce sessions)
-- ---------------------------------------------------------------------
CREATE TABLE ecom_sessions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token_hash    CHAR(64)        NOT NULL COMMENT 'SHA-256 of the cookie token; the token itself is never stored',
  subject_type  ENUM('customer', 'admin') NOT NULL,
  subject_id    BIGINT UNSIGNED NOT NULL,
  ip_address    VARCHAR(45)     NULL,
  user_agent    VARCHAR(255)    NULL,
  expires_at    DATETIME        NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_sessions_token (token_hash),
  KEY idx_ecom_sessions_subject (subject_type, subject_id),
  KEY idx_ecom_sessions_expires (expires_at)
) ENGINE = InnoDB;

CREATE TABLE ecom_password_resets (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token_hash    CHAR(64)        NOT NULL,
  subject_type  ENUM('customer', 'admin') NOT NULL,
  subject_id    BIGINT UNSIGNED NOT NULL,
  expires_at    DATETIME        NOT NULL,
  used_at       DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ecom_password_resets_token (token_hash),
  KEY idx_ecom_password_resets_subject (subject_type, subject_id)
) ENGINE = InnoDB;

-- E-commerce staff roles. Kept apart from admins.role so warranty and shop permissions stay independent:
-- an admin can be a warranty reviewer and an order manager at the same time.
-- admins.role = 'super_admin' always has full e-commerce access.
CREATE TABLE ecom_admin_roles (
  admin_id    BIGINT UNSIGNED NOT NULL,
  role        ENUM('shop_admin', 'product_manager', 'order_manager', 'inventory_manager', 'customer_support') NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (admin_id),
  CONSTRAINT fk_ecom_admin_roles_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE ecom_audit_logs (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id     BIGINT UNSIGNED NULL,
  action       VARCHAR(60)     NOT NULL COMMENT 'e.g. product.update, order.status, refund.process',
  entity_type  VARCHAR(40)     NOT NULL,
  entity_id    VARCHAR(40)     NULL,
  details      JSON            NULL,
  ip_address   VARCHAR(45)     NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ecom_audit_logs_created (created_at),
  KEY idx_ecom_audit_logs_entity (entity_type, entity_id),
  KEY idx_ecom_audit_logs_admin (admin_id, created_at),
  CONSTRAINT fk_ecom_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- Document/sequence counters for human-facing numbers (OL-2026-000001, RF-…, BQ-…, QT-…, TK-…).
CREATE TABLE ecom_sequences (
  name        VARCHAR(30)  NOT NULL,
  year        SMALLINT     NOT NULL,
  next_value  INT UNSIGNED NOT NULL,
  PRIMARY KEY (name, year)
) ENGINE = InnoDB;

-- =====================================================================
-- Migration 003: e-commerce staff accounts and default settings.
-- =====================================================================

-- Shop-only staff need an admins row (shared identity) without any warranty-panel role.
-- 'none' is additive: existing 'super_admin' / 'warranty_reviewer' rows are unchanged.
-- The warranty panel must treat 'none' as "no warranty access" when its real auth is built.
ALTER TABLE admins
  MODIFY role ENUM('super_admin', 'warranty_reviewer', 'none') NOT NULL DEFAULT 'warranty_reviewer';

-- Store settings. Values marked CONFIRM are placeholders that the business must review in
-- Admin → E-Commerce → Settings before launch; they are configuration, not policy text.
INSERT INTO ecom_settings (setting_key, setting_value) VALUES
  ('store',     JSON_OBJECT('name', 'OLITEC Shop', 'supportEmail', '', 'supportPhone', '', 'gstin', '', 'legalName', '', 'address', '')),
  ('shipping',  JSON_OBJECT('flatFee', 0, 'freeShippingThreshold', 0, 'serviceablePincodePrefixes', JSON_ARRAY(), 'estimatedDays', '')),
  ('checkout',  JSON_OBJECT('guestCheckout', true, 'codEnabled', false, 'codMaxOrderValue', 0, 'reservationMinutes', 30)),
  ('returns',   JSON_OBJECT('returnWindowDays', 0, 'cancellableStatuses', JSON_ARRAY('pending_payment', 'confirmed', 'processing'))),
  ('social',    JSON_OBJECT('facebook', '', 'instagram', '', 'linkedin', '', 'youtube', ''));

-- Policy and information pages start UNPUBLISHED with no commitments. The business supplies the text.
INSERT INTO ecom_pages (slug, title, body, is_published) VALUES
  ('about-us', 'About Us', 'Content to be provided by the business.', FALSE),
  ('shipping-policy', 'Shipping and Delivery Policy', 'Content to be provided by the business.', FALSE),
  ('return-policy', 'Return and Refund Policy', 'Content to be provided by the business.', FALSE),
  ('cancellation-policy', 'Cancellation Policy', 'Content to be provided by the business.', FALSE),
  ('privacy-policy', 'Privacy Policy', 'Content to be provided by the business.', FALSE),
  ('terms-and-conditions', 'Terms and Conditions', 'Content to be provided by the business.', FALSE),
  ('warranty-information', 'Warranty Information', 'Content to be provided by the business.', FALSE);

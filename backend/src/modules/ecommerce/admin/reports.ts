/**
 * Report definitions. Each report is one parameterised SQL query over a date range, returned as paginated JSON for
 * the admin table or as a CSV export (Excel opens CSV directly). Permissions are checked per report.
 */
import type { EcomPermission } from "../shared/permissions.js";

export interface ReportDefinition {
  title: string;
  permission: EcomPermission;
  /** SQL with exactly two placeholders for the from/to bounds, in that order. No user input is interpolated. */
  sql: string;
  /** Columns: [result column, header label]. */
  columns: [string, string][];
  /** Reports over current state ignore the date range. */
  dated: boolean;
}

export const REPORTS: Record<string, ReportDefinition> = {
  sales: {
    title: "Sales by day",
    permission: "reports.view",
    dated: true,
    sql: `SELECT DATE(o.placed_at) AS day, COUNT(*) AS orders, SUM(o.subtotal) AS gross, SUM(o.discount_total) AS discounts, SUM(o.shipping_total) AS shipping,
                 SUM(o.tax_total) AS gst, SUM(o.grand_total) AS net
            FROM ecom_orders o
           WHERE o.payment_status IN ('paid', 'partially_refunded', 'refund_pending', 'refunded') AND o.placed_at BETWEEN ? AND ?
           GROUP BY day ORDER BY day DESC`,
    columns: [["day", "Date"], ["orders", "Orders"], ["gross", "Gross (incl. GST)"], ["discounts", "Discounts"], ["shipping", "Shipping"], ["gst", "GST included"], ["net", "Net sales"]],
  },
  orders: {
    title: "Orders",
    permission: "orders.view",
    dated: true,
    sql: `SELECT o.order_number, o.placed_at, o.contact_name, o.contact_email, o.contact_phone, o.status, o.payment_method, o.payment_status,
                 (SELECT SUM(quantity) FROM ecom_order_items WHERE order_id = o.id) AS items, o.subtotal, o.discount_total, o.coupon_code, o.shipping_total, o.tax_total, o.grand_total,
                 JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.city')) AS city, JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.pincode')) AS pincode, o.tracking_number
            FROM ecom_orders o WHERE o.placed_at BETWEEN ? AND ? ORDER BY o.placed_at DESC`,
    columns: [
      ["order_number", "Order"], ["placed_at", "Placed at (UTC)"], ["contact_name", "Customer"], ["contact_email", "Email"], ["contact_phone", "Phone"], ["status", "Status"],
      ["payment_method", "Payment method"], ["payment_status", "Payment status"], ["items", "Items"], ["subtotal", "Subtotal"], ["discount_total", "Discount"], ["coupon_code", "Coupon"],
      ["shipping_total", "Shipping"], ["tax_total", "GST"], ["grand_total", "Total"], ["city", "City"], ["pincode", "Pincode"], ["tracking_number", "Tracking"],
    ],
  },
  products: {
    title: "Product sales",
    permission: "reports.view",
    dated: true,
    sql: `SELECT i.sku, i.product_name, COALESCE(c.name, '') AS category, SUM(i.quantity) AS units, SUM(i.line_total) AS revenue, COUNT(DISTINCT i.order_id) AS orders
            FROM ecom_order_items i JOIN ecom_orders o ON o.id = i.order_id LEFT JOIN ecom_categories c ON c.id = i.category_id
           WHERE o.payment_status IN ('paid', 'partially_refunded', 'refund_pending') AND o.status <> 'cancelled' AND o.placed_at BETWEEN ? AND ?
           GROUP BY i.sku, i.product_name, c.name ORDER BY units DESC`,
    columns: [["sku", "SKU"], ["product_name", "Product"], ["category", "Category"], ["units", "Units sold"], ["revenue", "Revenue"], ["orders", "Orders"]],
  },
  categories: {
    title: "Sales by category",
    permission: "reports.view",
    dated: true,
    sql: `SELECT COALESCE(c.name, 'Uncategorised') AS category, SUM(i.quantity) AS units, SUM(i.line_total) AS revenue, COUNT(DISTINCT i.order_id) AS orders
            FROM ecom_order_items i JOIN ecom_orders o ON o.id = i.order_id LEFT JOIN ecom_categories c ON c.id = i.category_id
           WHERE o.payment_status IN ('paid', 'partially_refunded', 'refund_pending') AND o.status <> 'cancelled' AND o.placed_at BETWEEN ? AND ?
           GROUP BY c.id, c.name ORDER BY revenue DESC`,
    columns: [["category", "Category"], ["units", "Units sold"], ["revenue", "Revenue"], ["orders", "Orders"]],
  },
  inventory: {
    title: "Inventory",
    permission: "inventory.view",
    dated: false,
    sql: `SELECT p.sku, p.name, c.name AS category, p.status, p.stock_qty, p.reserved_qty, (p.stock_qty - p.reserved_qty) AS available, p.low_stock_threshold,
                 p.selling_price, ROUND(p.stock_qty * p.selling_price, 2) AS stock_value
            FROM ecom_products p JOIN ecom_categories c ON c.id = p.category_id WHERE p.status <> 'archived' AND ? IS NOT NULL AND ? IS NOT NULL ORDER BY p.name`,
    columns: [["sku", "SKU"], ["name", "Product"], ["category", "Category"], ["status", "Status"], ["stock_qty", "On hand"], ["reserved_qty", "Reserved"], ["available", "Available"], ["low_stock_threshold", "Low-stock threshold"], ["selling_price", "Selling price"], ["stock_value", "Stock value (selling price)"]],
  },
  "low-stock": {
    title: "Low and out of stock",
    permission: "inventory.view",
    dated: false,
    sql: `SELECT p.sku, p.name, c.name AS category, p.stock_qty, p.reserved_qty, (p.stock_qty - p.reserved_qty) AS available, p.low_stock_threshold,
                 IF(p.stock_qty - p.reserved_qty <= 0, 'Out of stock', 'Low stock') AS state
            FROM ecom_products p JOIN ecom_categories c ON c.id = p.category_id
           WHERE p.status = 'active' AND p.stock_qty - p.reserved_qty <= p.low_stock_threshold AND ? IS NOT NULL AND ? IS NOT NULL ORDER BY available, p.name`,
    columns: [["sku", "SKU"], ["name", "Product"], ["category", "Category"], ["stock_qty", "On hand"], ["reserved_qty", "Reserved"], ["available", "Available"], ["low_stock_threshold", "Threshold"], ["state", "State"]],
  },
  customers: {
    title: "Customers",
    permission: "customers.view",
    dated: true,
    sql: `SELECT c.id, c.name, c.email, c.mobile, c.status, c.created_at, COUNT(o.id) AS orders,
                 COALESCE(SUM(CASE WHEN o.payment_status IN ('paid', 'partially_refunded') THEN o.grand_total END), 0) AS spent, MAX(o.placed_at) AS last_order
            FROM customers c LEFT JOIN ecom_orders o ON o.customer_id = c.id
           WHERE c.created_at BETWEEN ? AND ? GROUP BY c.id ORDER BY c.created_at DESC`,
    columns: [["id", "Customer ID"], ["name", "Name"], ["email", "Email"], ["mobile", "Mobile"], ["status", "Status"], ["created_at", "Registered (UTC)"], ["orders", "Orders"], ["spent", "Total spent"], ["last_order", "Last order"]],
  },
  payments: {
    title: "Payments",
    permission: "payments.view",
    dated: true,
    sql: `SELECT p.created_at, o.order_number, p.provider, p.provider_order_id, p.provider_payment_id, p.method, p.amount, p.status, p.error_code, p.error_description
            FROM ecom_payments p JOIN ecom_orders o ON o.id = p.order_id WHERE p.created_at BETWEEN ? AND ? ORDER BY p.id DESC`,
    columns: [["created_at", "Date (UTC)"], ["order_number", "Order"], ["provider", "Gateway"], ["provider_order_id", "Gateway order"], ["provider_payment_id", "Gateway payment"], ["method", "Method"], ["amount", "Amount"], ["status", "Status"], ["error_code", "Error code"], ["error_description", "Error"]],
  },
  "failed-payments": {
    title: "Failed payments",
    permission: "payments.view",
    dated: true,
    sql: `SELECT p.created_at, o.order_number, o.contact_name, o.contact_email, p.provider_payment_id, p.amount, p.error_code, p.error_description, o.status AS order_status
            FROM ecom_payments p JOIN ecom_orders o ON o.id = p.order_id WHERE p.status = 'failed' AND p.created_at BETWEEN ? AND ? ORDER BY p.id DESC`,
    columns: [["created_at", "Date (UTC)"], ["order_number", "Order"], ["contact_name", "Customer"], ["contact_email", "Email"], ["provider_payment_id", "Gateway payment"], ["amount", "Amount"], ["error_code", "Error code"], ["error_description", "Reason"], ["order_status", "Order status"]],
  },
  reconciliation: {
    title: "Gateway reconciliation",
    permission: "payments.view",
    dated: true,
    // Orders whose payment state and order state disagree — the list to check against the gateway dashboard.
    sql: `SELECT o.order_number, o.placed_at, o.status, o.payment_status, o.grand_total,
                 COALESCE(SUM(CASE WHEN p.status = 'captured' THEN p.amount END), 0) AS captured,
                 COALESCE((SELECT SUM(r.amount) FROM ecom_refunds r WHERE r.order_id = o.id AND r.status = 'processed'), 0) AS refunded,
                 GROUP_CONCAT(p.provider_payment_id) AS gateway_payments
            FROM ecom_orders o LEFT JOIN ecom_payments p ON p.order_id = o.id
           WHERE o.payment_method = 'online' AND o.placed_at BETWEEN ? AND ?
           GROUP BY o.id
          HAVING (captured > 0 AND o.payment_status IN ('pending', 'failed')) OR (captured = 0 AND o.payment_status IN ('paid', 'partially_refunded'))
              OR captured > o.grand_total OR (captured - refunded) < 0
           ORDER BY o.placed_at DESC`,
    columns: [["order_number", "Order"], ["placed_at", "Placed at (UTC)"], ["status", "Order status"], ["payment_status", "Payment status"], ["grand_total", "Order total"], ["captured", "Captured"], ["refunded", "Refunded"], ["gateway_payments", "Gateway payment ids"]],
  },
  refunds: {
    title: "Refunds",
    permission: "payments.view",
    dated: true,
    sql: `SELECT r.refund_number, r.created_at, o.order_number, r.amount, r.status, r.reason, r.requested_by, r.provider_refund_id, r.processed_at, a.name AS approved_by
            FROM ecom_refunds r JOIN ecom_orders o ON o.id = r.order_id LEFT JOIN admins a ON a.id = r.approved_by WHERE r.created_at BETWEEN ? AND ? ORDER BY r.id DESC`,
    columns: [["refund_number", "Refund"], ["created_at", "Requested (UTC)"], ["order_number", "Order"], ["amount", "Amount"], ["status", "Status"], ["reason", "Reason"], ["requested_by", "Requested by"], ["provider_refund_id", "Reference"], ["processed_at", "Processed (UTC)"], ["approved_by", "Approved by"]],
  },
  coupons: {
    title: "Coupon usage",
    permission: "reports.view",
    dated: true,
    sql: `SELECT c.code, c.discount_type, c.discount_value, COUNT(u.id) AS uses, COALESCE(SUM(u.discount), 0) AS discount_given, COALESCE(SUM(o.grand_total), 0) AS order_value
            FROM ecom_coupons c LEFT JOIN ecom_coupon_usages u ON u.coupon_id = c.id AND u.created_at BETWEEN ? AND ? LEFT JOIN ecom_orders o ON o.id = u.order_id
           GROUP BY c.id ORDER BY uses DESC`,
    columns: [["code", "Code"], ["discount_type", "Type"], ["discount_value", "Value"], ["uses", "Uses"], ["discount_given", "Discount given"], ["order_value", "Order value"]],
  },
  enquiries: {
    title: "Bulk enquiries",
    permission: "enquiries.manage",
    dated: true,
    sql: `SELECT e.enquiry_number, e.created_at, e.contact_name, e.company_name, e.email, e.phone, e.delivery_location, e.status, a.name AS assigned_to,
                 (SELECT COUNT(*) FROM ecom_quotations q WHERE q.enquiry_id = e.id) AS quotations
            FROM ecom_bulk_enquiries e LEFT JOIN admins a ON a.id = e.assigned_admin_id WHERE e.created_at BETWEEN ? AND ? ORDER BY e.id DESC`,
    columns: [["enquiry_number", "Enquiry"], ["created_at", "Received (UTC)"], ["contact_name", "Contact"], ["company_name", "Company"], ["email", "Email"], ["phone", "Phone"], ["delivery_location", "Delivery location"], ["status", "Status"], ["assigned_to", "Assigned to"], ["quotations", "Quotations"]],
  },
};

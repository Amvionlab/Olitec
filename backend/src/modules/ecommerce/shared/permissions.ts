/**
 * E-commerce role → permission map. Enforced on every admin route (see requireAdmin in auth.ts);
 * the admin UI reads the same list from /admin/auth/me only to hide actions the user cannot perform.
 */
export const ECOM_PERMISSIONS = [
  "dashboard.view",
  "products.view",
  "products.manage",
  "categories.manage",
  "inventory.view",
  "inventory.manage",
  "orders.view",
  "orders.manage",
  "customers.view",
  "customers.manage",
  "payments.view",
  "refunds.manage",
  "coupons.manage",
  "content.manage",
  "enquiries.manage",
  "support.manage",
  "reports.view",
  "users.manage",
  "audit.view",
  "settings.manage",
] as const;

export type EcomPermission = (typeof ECOM_PERMISSIONS)[number];
export const ECOM_ROLES = ["super_admin", "shop_admin", "product_manager", "order_manager", "inventory_manager", "customer_support"] as const;
export type EcomRole = (typeof ECOM_ROLES)[number];

export const ROLE_LABELS: Record<EcomRole, string> = {
  super_admin: "Super Admin",
  shop_admin: "Shop Admin",
  product_manager: "Product Manager",
  order_manager: "Order Manager",
  inventory_manager: "Inventory Manager",
  customer_support: "Customer Support",
};

const all = [...ECOM_PERMISSIONS];

export const ROLE_PERMISSIONS: Record<EcomRole, readonly EcomPermission[]> = {
  super_admin: all,
  shop_admin: all.filter((permission) => permission !== "users.manage"),
  product_manager: ["dashboard.view", "products.view", "products.manage", "categories.manage", "inventory.view", "content.manage", "reports.view"],
  order_manager: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "orders.manage",
    "customers.view",
    "payments.view",
    "refunds.manage",
    "enquiries.manage",
    "support.manage",
    "reports.view",
  ],
  inventory_manager: ["dashboard.view", "products.view", "inventory.view", "inventory.manage", "reports.view"],
  customer_support: ["dashboard.view", "products.view", "orders.view", "customers.view", "payments.view", "enquiries.manage", "support.manage"],
};

export function hasPermission(role: EcomRole, permission: EcomPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

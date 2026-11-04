/**
 * DEVELOPMENT SEED for the e-commerce module — sample data for local testing only.
 * Refuses to run when NODE_ENV=production. Safe to re-run: existing rows (matched by slug/SKU/email) are skipped.
 *
 * Creates:
 *   - a Super Admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (if both are set)
 *   - illustrative categories, brands and products labelled "Sample" (no real prices, specs or images)
 *   - one unpublished sample banner and FAQ, and a TEST10 coupon
 * Replace all of it with the real catalogue through the admin panel before launch.
 */
import "../config/env.js";
import { hashPassword } from "../modules/ecommerce/shared/auth.js";
import { closePool, execute, queryOne } from "./pool.js";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed sample data in production.");
  process.exit(1);
}

const categories: { slug: string; name: string; parent?: string; order: number }[] = [
  { slug: "solar-panels", name: "Solar Panels", order: 1 },
  { slug: "mono-perc-panels", name: "Mono PERC Panels", parent: "solar-panels", order: 1 },
  { slug: "bifacial-panels", name: "Bifacial Panels", parent: "solar-panels", order: 2 },
  { slug: "solar-inverters", name: "Solar Inverters", order: 2 },
  { slug: "hybrid-inverters", name: "Hybrid Inverters", parent: "solar-inverters", order: 1 },
  { slug: "batteries", name: "Batteries", order: 3 },
  { slug: "solar-kits", name: "Solar Kits", order: 4 },
  { slug: "cables-protection", name: "Cables & Protection", order: 5 },
  { slug: "solar-accessories", name: "Solar Accessories", order: 6 },
];

const brands = ["Sample Brand A", "Sample Brand B"];

const products = [
  { sku: "SMP-PNL-540", name: "Sample Mono PERC Solar Panel 540 W", category: "mono-perc-panels", brand: 0, mrp: 18000, price: 15500, stock: 40, featured: true, best: true,
    specs: [["Power", "540 W"], ["Cell type", "Mono PERC"], ["Efficiency", "21%"]] },
  { sku: "SMP-PNL-550B", name: "Sample Bifacial Solar Panel 550 W", category: "bifacial-panels", brand: 1, mrp: 21000, price: 18900, stock: 25, featured: true, isNew: true,
    specs: [["Power", "550 W"], ["Cell type", "Bifacial"], ["Efficiency", "21.5%"]] },
  { sku: "SMP-INV-5K", name: "Sample Hybrid Inverter 5 kW", category: "hybrid-inverters", brand: 0, mrp: 65000, price: 58000, stock: 8, best: true, offer: true,
    specs: [["Capacity", "5 kW"], ["Phase", "Single"], ["MPPT", "2"]] },
  { sku: "SMP-INV-3K", name: "Sample Hybrid Inverter 3 kW", category: "hybrid-inverters", brand: 1, mrp: 42000, price: 39500, stock: 3,
    specs: [["Capacity", "3 kW"], ["Phase", "Single"], ["MPPT", "1"]] },
  { sku: "SMP-BAT-5K", name: "Sample Lithium Battery 5 kWh", category: "batteries", brand: 0, mrp: 120000, price: 109000, stock: 5, isNew: true,
    specs: [["Capacity", "5 kWh"], ["Chemistry", "LiFePO4"]] },
  { sku: "SMP-KIT-3K", name: "Sample 3 kW On-Grid Solar Kit", category: "solar-kits", brand: 0, mrp: 175000, price: 159000, stock: 4, featured: true, offer: true,
    specs: [["Capacity", "3 kW"], ["Type", "On-grid"]] },
  { sku: "SMP-CBL-4MM", name: "Sample DC Solar Cable 4 sq mm (100 m)", category: "cables-protection", brand: 1, mrp: 6500, price: 5200, stock: 60,
    specs: [["Size", "4 sq mm"], ["Length", "100 m"]] },
  { sku: "SMP-ACC-MC4", name: "Sample MC4 Connector Pair (pack of 10)", category: "solar-accessories", brand: 1, mrp: 1500, price: 999, stock: 0,
    specs: [["Type", "MC4"], ["Pack", "10 pairs"]] },
];

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
    const existing = await queryOne("SELECT id FROM admins WHERE email = ?", [email]);
    if (existing) console.log(`  admin ${email} exists`);
    else {
      await execute("INSERT INTO admins (name, email, password_hash, role) VALUES ('Super Admin', ?, ?, 'super_admin')", [email, await hashPassword(password)]);
      console.log(`→ created Super Admin ${email}`);
    }
  } else {
    console.log("  SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set — no admin created");
  }

  for (const category of categories) {
    if (await queryOne("SELECT id FROM ecom_categories WHERE slug = ?", [category.slug])) continue;
    const parent = category.parent ? await queryOne<{ id: number }>("SELECT id FROM ecom_categories WHERE slug = ?", [category.parent]) : undefined;
    await execute("INSERT INTO ecom_categories (parent_id, name, slug, display_order) VALUES (?, ?, ?, ?)", [parent?.id ?? null, category.name, category.slug, category.order]);
  }
  for (const name of brands) {
    await execute("INSERT IGNORE INTO ecom_brands (name, slug) VALUES (?, ?)", [name, name.toLowerCase().replace(/\s+/g, "-")]);
  }

  for (const product of products) {
    if (await queryOne("SELECT id FROM ecom_products WHERE sku = ?", [product.sku])) continue;
    const category = (await queryOne<{ id: number }>("SELECT id FROM ecom_categories WHERE slug = ?", [product.category]))!;
    const brand = await queryOne<{ id: number }>("SELECT id FROM ecom_brands WHERE name = ?", [brands[product.brand]]);
    const result = await execute(
      `INSERT INTO ecom_products (sku, slug, name, category_id, brand_id, short_description, description, specifications, features, mrp, selling_price, stock_qty,
         low_stock_threshold, is_featured, is_best_seller, is_new_arrival, is_on_offer, status, warranty_info)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5, ?, ?, ?, ?, 'active', ?)`,
      [
        product.sku, product.sku.toLowerCase(), product.name, category.id, brand?.id ?? null,
        "Sample product for development. Replace with real catalogue data.",
        "This is sample data created by the development seed script. It is not a real product listing.",
        JSON.stringify(product.specs.map(([label, value]) => ({ label, value }))),
        JSON.stringify(["Sample feature one", "Sample feature two"]),
        product.mrp, product.price, product.stock,
        Boolean(product.featured), Boolean(product.best), Boolean(product.isNew), Boolean(product.offer),
        "Sample — enter the manufacturer's warranty terms.",
      ],
    );
    if (product.stock > 0) {
      await execute(
        "INSERT INTO ecom_inventory_movements (product_id, movement_type, quantity, stock_after, reserved_after, reference_type, note) VALUES (?, 'stock_in', ?, ?, 0, 'manual', 'Development seed')",
        [result.insertId, product.stock, product.stock],
      );
    }
  }

  if (!(await queryOne("SELECT id FROM ecom_content_blocks WHERE title = 'Sample banner'"))) {
    await execute(
      "INSERT INTO ecom_content_blocks (block_type, title, subtitle, link_url, link_label, display_order, is_active) VALUES ('banner', 'Sample banner', 'Edit or replace this banner in Admin → E-Commerce → Content.', '/products', 'Shop now', 1, TRUE)",
    );
    await execute(
      "INSERT INTO ecom_content_blocks (block_type, title, body, display_order, is_active) VALUES ('faq', 'Sample question?', 'Sample answer — replace with an approved FAQ.', 1, TRUE)",
    );
  }
  await execute(
    `INSERT IGNORE INTO ecom_coupons (code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, per_customer_limit)
     VALUES ('TEST10', 'Development test coupon: 10% off (max ₹2,000)', 'percentage', 10, 1000, 2000, 100, 2)`,
  );
  console.log("Development seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closePool());

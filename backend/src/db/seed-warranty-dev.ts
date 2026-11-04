/**
 * DEVELOPMENT SEED for the warranty platform. Refuses to run when NODE_ENV=production. Safe to re-run (INSERT IGNORE).
 *
 * Copies the sample products and customers from repositories/mock/data.ts into MySQL, keeping their numeric ids
 * (prd_101 → products.id 101, cus_2041 → customers.id 2041). The website's product list and the development
 * login (middleware/auth.ts signs everyone in as cus_2041) depend on those ids until real login and a real
 * catalogue replace them. Seeded customers get an unusable password hash, so nobody can sign in as them.
 */
import "../config/env.js";
import { customers, products } from "../repositories/mock/data.js";
import { closePool, execute } from "./pool.js";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed sample data in production.");
  process.exit(1);
}

const numericId = (id: string) => Number(id.split("_")[1]);

async function main() {
  for (const product of products) {
    const result = await execute(
      `INSERT IGNORE INTO products (id, slug, name, model_number, category, short_description, warranty_months, price_inr)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [numericId(product.id), product.slug, product.name, product.model, product.category, product.description, product.warrantyMonths, product.priceInr],
    );
    if (result.affectedRows) console.log(`→ product ${product.id} ${product.model}`);
  }
  for (const customer of customers) {
    const result = await execute(
      `INSERT IGNORE INTO customers (id, name, email, mobile, password_hash, city, state, status)
       VALUES (?, ?, ?, ?, '!seeded-no-login', ?, ?, ?)`,
      [numericId(customer.id), customer.name, customer.email, customer.mobile, customer.city, customer.state, customer.status.toLowerCase()],
    );
    if (result.affectedRows) console.log(`→ customer ${customer.id} ${customer.email}`);
  }
  console.log("Warranty development seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closePool());

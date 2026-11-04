import type { FastifyRequest } from "fastify";
import { execute, query, queryOne } from "../../../db/pool.js";
import { BusinessRuleError, NotFoundError } from "../../../utils/errors.js";
import { audit } from "../shared/audit.js";
import { pageWindow, type PageQuery } from "../shared/http.js";

/** Reviews are accepted only from customers with a delivered order for the product, and shown after moderation. */
export const reviewService = {
  async listApproved(slug: string, page: PageQuery) {
    const product = await queryOne<{ id: number }>("SELECT id FROM ecom_products WHERE slug = ? AND status = 'active'", [slug]);
    if (!product) throw new NotFoundError("Product");
    const window = pageWindow(page);
    const [rows, count, distribution] = await Promise.all([
      query<{ id: number; rating: number; title: string | null; body: string | null; name: string; created_at: Date }>(
        `SELECT r.id, r.rating, r.title, r.body, c.name, r.created_at FROM ecom_reviews r JOIN customers c ON c.id = r.customer_id
          WHERE r.product_id = ? AND r.status = 'approved' ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
        [product.id, window.limit, window.offset],
      ),
      queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM ecom_reviews WHERE product_id = ? AND status = 'approved'", [product.id]),
      query<{ rating: number; count: number }>("SELECT rating, COUNT(*) AS count FROM ecom_reviews WHERE product_id = ? AND status = 'approved' GROUP BY rating", [product.id]),
    ]);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        rating: row.rating,
        title: row.title,
        body: row.body,
        // First name and initial only — reviewer privacy.
        author: row.name.split(" ").map((part, index) => (index === 0 ? part : `${part[0]}.`)).join(" "),
        createdAt: row.created_at,
      })),
      distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: Number(distribution.find((row) => row.rating === rating)?.count ?? 0) })),
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  async submit(customerId: number, slug: string, input: { rating: number; title?: string; body?: string }) {
    const product = await queryOne<{ id: number }>("SELECT id FROM ecom_products WHERE slug = ? AND status = 'active'", [slug]);
    if (!product) throw new NotFoundError("Product");
    const purchased = await queryOne(
      `SELECT 1 FROM ecom_orders o JOIN ecom_order_items i ON i.order_id = o.id
        WHERE o.customer_id = ? AND i.product_id = ? AND o.status IN ('delivered', 'return_requested', 'returned') LIMIT 1`,
      [customerId, product.id],
    );
    if (!purchased) throw new BusinessRuleError("You can review a product after it has been delivered to you.");
    await execute(
      `INSERT INTO ecom_reviews (product_id, customer_id, rating, title, body, status) VALUES (?, ?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), title = VALUES(title), body = VALUES(body), status = 'pending'`,
      [product.id, customerId, input.rating, input.title ?? null, input.body ?? null],
    );
    await refreshRating(Number(product.id));
    return { status: "pending" as const };
  },

  async adminList(status: string | undefined, page: PageQuery) {
    const window = pageWindow(page);
    const where = status ? "WHERE r.status = ?" : "";
    const params = status ? [status] : [];
    const [rows, count] = await Promise.all([
      query(
        `SELECT r.id, r.rating, r.title, r.body, r.status, r.created_at, c.name AS customer_name, p.name AS product_name, p.slug AS product_slug
           FROM ecom_reviews r JOIN customers c ON c.id = r.customer_id JOIN ecom_products p ON p.id = r.product_id
           ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
        [...params, window.limit, window.offset],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_reviews r ${where}`, params),
    ]);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        rating: row.rating,
        title: row.title,
        body: row.body,
        status: row.status,
        createdAt: row.created_at,
        customerName: row.customer_name,
        product: { name: row.product_name, slug: row.product_slug },
      })),
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  async moderate(request: FastifyRequest, id: number, status: "approved" | "rejected") {
    const review = await queryOne<{ product_id: number }>("SELECT product_id FROM ecom_reviews WHERE id = ?", [id]);
    if (!review) throw new NotFoundError("Review");
    await execute("UPDATE ecom_reviews SET status = ? WHERE id = ?", [status, id]);
    await refreshRating(Number(review.product_id));
    await audit(request, `review.${status}`, "review", id);
  },
};

async function refreshRating(productId: number) {
  await execute(
    `UPDATE ecom_products p
        SET rating_avg = COALESCE((SELECT AVG(rating) FROM ecom_reviews WHERE product_id = p.id AND status = 'approved'), 0),
            rating_count = (SELECT COUNT(*) FROM ecom_reviews WHERE product_id = p.id AND status = 'approved')
      WHERE p.id = ?`,
    [productId],
  );
}

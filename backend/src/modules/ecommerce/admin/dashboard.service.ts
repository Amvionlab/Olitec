/** Dashboard figures — every number is an aggregate over live tables, nothing is precomputed or mocked. */
import { query, queryOne } from "../../../db/pool.js";
import { dateBounds, type DateRangeQuery } from "../shared/schemas.js";

/** Orders that count as revenue: paid (or COD delivered) and not fully refunded. */
const REVENUE_ORDER = "o.payment_status IN ('paid', 'partially_refunded', 'refund_pending') AND o.status NOT IN ('cancelled')";

export const dashboardService = {
  async summary(range: DateRangeQuery & { granularity?: "day" | "week" | "month" | "year" }) {
    const { from, to } = dateBounds(range);
    const bucket = { day: "%Y-%m-%d", week: "%x-W%v", month: "%Y-%m", year: "%Y" }[range.granularity ?? "day"];

    const [totals, statusCounts, catalogue, customers, refunds, pendingPayments, series, topProducts, byCategory, newVsReturning] = await Promise.all([
      queryOne<{ revenue: number; orders: number; refunded: number }>(
        `SELECT COALESCE(SUM(CASE WHEN ${REVENUE_ORDER} THEN o.grand_total END), 0) AS revenue,
                COUNT(*) AS orders,
                COALESCE((SELECT SUM(r.amount) FROM ecom_refunds r WHERE r.status = 'processed' AND r.processed_at BETWEEN ? AND ?), 0) AS refunded
           FROM ecom_orders o WHERE o.placed_at BETWEEN ? AND ?`,
        [from, to, from, to],
      ),
      query<{ status: string; count: number }>("SELECT status, COUNT(*) AS count FROM ecom_orders o WHERE o.placed_at BETWEEN ? AND ? GROUP BY status", [from, to]),
      queryOne<{ products: number; low: number; out_count: number }>(
        `SELECT COUNT(*) AS products,
                SUM(stock_qty - reserved_qty > 0 AND stock_qty - reserved_qty <= low_stock_threshold) AS low,
                SUM(stock_qty - reserved_qty <= 0) AS out_count
           FROM ecom_products WHERE status = 'active'`,
      ),
      queryOne<{ total: number; new_in_range: number }>("SELECT COUNT(*) AS total, SUM(created_at BETWEEN ? AND ?) AS new_in_range FROM customers", [from, to]),
      queryOne<{ open_requests: number; pending_refunds: number }>(
        `SELECT (SELECT COUNT(*) FROM ecom_order_requests WHERE status = 'pending') AS open_requests,
                (SELECT COUNT(*) FROM ecom_refunds WHERE status IN ('pending', 'processing', 'failed')) AS pending_refunds`,
      ),
      queryOne<{ count: number; amount: number }>(
        "SELECT COUNT(*) AS count, COALESCE(SUM(grand_total), 0) AS amount FROM ecom_orders WHERE status = 'pending_payment' OR (payment_status = 'cod_pending' AND status NOT IN ('cancelled'))",
      ),
      query<{ bucket: string; revenue: number; orders: number }>(
        `SELECT DATE_FORMAT(o.placed_at, ?) AS bucket, COALESCE(SUM(CASE WHEN ${REVENUE_ORDER} THEN o.grand_total END), 0) AS revenue, COUNT(*) AS orders
           FROM ecom_orders o WHERE o.placed_at BETWEEN ? AND ? GROUP BY bucket ORDER BY bucket`,
        [bucket, from, to],
      ),
      query<{ product_id: number; name: string; sku: string; units: number; revenue: number }>(
        `SELECT i.product_id, i.product_name AS name, i.sku, SUM(i.quantity) AS units, SUM(i.line_total) AS revenue
           FROM ecom_order_items i JOIN ecom_orders o ON o.id = i.order_id
          WHERE ${REVENUE_ORDER} AND o.placed_at BETWEEN ? AND ? GROUP BY i.product_id, i.product_name, i.sku ORDER BY units DESC LIMIT 10`,
        [from, to],
      ),
      query<{ name: string; revenue: number; units: number }>(
        `SELECT COALESCE(c.name, 'Uncategorised') AS name, SUM(i.line_total) AS revenue, SUM(i.quantity) AS units
           FROM ecom_order_items i JOIN ecom_orders o ON o.id = i.order_id LEFT JOIN ecom_categories c ON c.id = i.category_id
          WHERE ${REVENUE_ORDER} AND o.placed_at BETWEEN ? AND ? GROUP BY c.id, c.name ORDER BY revenue DESC LIMIT 10`,
        [from, to],
      ),
      // A buyer is "returning" when they had a paid order before this one; guests are identified by email.
      queryOne<{ new_buyers: number; returning_buyers: number }>(
        `SELECT SUM(first_order >= ?) AS new_buyers, SUM(first_order < ?) AS returning_buyers FROM (
           SELECT buyer, MIN(first_any) AS first_order FROM (
             SELECT COALESCE(CONCAT('c', o.customer_id), CONCAT('g', o.contact_email)) AS buyer, MIN(o.placed_at) AS first_any
               FROM ecom_orders o WHERE ${REVENUE_ORDER} GROUP BY buyer
           ) firsts WHERE buyer IN (
             SELECT COALESCE(CONCAT('c', o.customer_id), CONCAT('g', o.contact_email)) FROM ecom_orders o WHERE ${REVENUE_ORDER} AND o.placed_at BETWEEN ? AND ?
           ) GROUP BY buyer
         ) buyers`,
        [from, from, from, to],
      ),
    ]);

    const count = (status: string) => Number(statusCounts.find((row) => row.status === status)?.count ?? 0);
    const pendingStatuses = ["confirmed", "processing", "packed", "shipped", "out_for_delivery"];

    return {
      range: { from: from.slice(0, 10), to: to.slice(0, 10), granularity: range.granularity ?? "day" },
      metrics: {
        totalRevenue: Number(totals?.revenue ?? 0),
        refundedAmount: Number(totals?.refunded ?? 0),
        totalOrders: Number(totals?.orders ?? 0),
        pendingOrders: pendingStatuses.reduce((sum, status) => sum + count(status), 0),
        completedOrders: count("delivered"),
        totalCustomers: Number(customers?.total ?? 0),
        newCustomers: Number(customers?.new_in_range ?? 0),
        totalProducts: Number(catalogue?.products ?? 0),
        lowStockProducts: Number(catalogue?.low ?? 0),
        outOfStockProducts: Number(catalogue?.out_count ?? 0),
        pendingPayments: Number(pendingPayments?.count ?? 0),
        pendingPaymentsAmount: Number(pendingPayments?.amount ?? 0),
        openReturnAndCancellationRequests: Number(refunds?.open_requests ?? 0),
        pendingRefunds: Number(refunds?.pending_refunds ?? 0),
      },
      salesSeries: series.map((row) => ({ bucket: row.bucket, revenue: Number(row.revenue), orders: Number(row.orders) })),
      ordersByStatus: statusCounts.map((row) => ({ status: row.status, count: Number(row.count) })),
      topProducts: topProducts.map((row) => ({ productId: row.product_id ? Number(row.product_id) : null, name: row.name, sku: row.sku, units: Number(row.units), revenue: Number(row.revenue) })),
      salesByCategory: byCategory.map((row) => ({ name: row.name, revenue: Number(row.revenue), units: Number(row.units) })),
      customersMix: { newBuyers: Number(newVsReturning?.new_buyers ?? 0), returningBuyers: Number(newVsReturning?.returning_buyers ?? 0) },
    };
  },
};

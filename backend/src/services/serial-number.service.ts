
import {
  query,
  queryOne,
  execute,
  withTransaction,
} from "../db/pool.js";
export interface SerialNumberFilters {
  search?: string;
  model?: string;
  productionMonth?: string;
}

export const serialNumberService = {
  // Get all generated serial number records
  async list(filters: SerialNumberFilters = {}) {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;

      conditions.push(`(
        sn.serial_number LIKE ?
        OR p.name LIKE ?
        OR p.model_number LIKE ?
        OR sb.batch_number LIKE ?
        OR sn.qr_code LIKE ?
        OR u.name LIKE ?
      )`);

      params.push(
        search,
        search,
        search,
        search,
        search,
        search
      );
    }
    
    if (filters.model?.trim()) {
      conditions.push("p.model_number = ?");
      params.push(filters.model.trim());
    }

    if (filters.productionMonth?.trim()) {
      conditions.push("sb.production_month = ?");
      params.push(filters.productionMonth.trim());
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const rows = await query<Record<string, any>>(
      `
      SELECT
        sn.id,
        sn.serial_number AS serialNumber,
        p.name AS productName,
        p.model_number AS modelNumber,
        sb.batch_number AS batchNumber,
        sb.production_month AS productionMonth,
        sn.qr_code AS qrCode,
        sn.created_at AS createdAt,
        COALESCE(u.name, 'Unknown') AS createdBy

      FROM serial_numbers sn

      LEFT JOIN products p
        ON sn.product_id = p.id

      LEFT JOIN serial_number_batches sb
        ON sn.batch_id = sb.id

      LEFT JOIN users u
        ON sn.created_by = u.id

      ${where}

      ORDER BY sn.created_at DESC
      `,
      params
    );

    return rows;
  },

  // Dashboard statistics
  async getStats() {
    const stats = await queryOne<Record<string, any>>(
      `
      SELECT
        COUNT(*) AS totalSerialNumbers,
        COUNT(DISTINCT product_id) AS totalProducts
      FROM serial_numbers
      `
    );

    const batches = await queryOne<Record<string, any>>(
      `
      SELECT COUNT(*) AS generatedBatches
      FROM serial_number_batches
      `
    );

    return {
      totalSerialNumbers: Number(stats?.totalSerialNumbers ?? 0),
      totalProducts: Number(stats?.totalProducts ?? 0),
      generatedBatches: Number(batches?.generatedBatches ?? 0),
    };
  },

  async create(input: {
    productId: number;
    serialNumber: string;
    batchNumber: string;
    productionMonth: string;
    qrCode?: string;
    createdBy?: number | null;
  }) {
    return withTransaction(async (connection) => {
      // 1. Validate product
      const product = await queryOne<{ id: number }>(
        `SELECT id FROM products WHERE id = ?`,
        [input.productId],
        connection
      );

      if (!product) {
        throw new Error("Selected product does not exist.");
      }

      // 2. Check duplicate serial number
      const existing = await queryOne<{ id: number }>(
        `SELECT id FROM serial_numbers WHERE serial_number = ?`,
        [input.serialNumber],
        connection
      );

      if (existing) {
        throw new Error("This serial number already exists.");
      }

      // 3. Find or create batch
      const batch = await queryOne<{
        id: number;
        product_id: number;
        production_month: string;
      }>(
        `SELECT id, product_id, production_month
         FROM serial_number_batches
         WHERE batch_number = ?
         FOR UPDATE`,
        [input.batchNumber],
        connection
      );

      let batchId: number;

      if (batch) {
        if (
          Number(batch.product_id) !== input.productId ||
          String(batch.production_month).slice(0, 7) !== input.productionMonth
        ) {
          throw new Error(
            "Batch number already exists with different product or production month."
          );
        }

        batchId = Number(batch.id);
      } else {
        const batchResult = await execute(
          `INSERT INTO serial_number_batches
            (batch_number, product_id, production_month, quantity, created_by)
           VALUES (?, ?, ?, 0, ?)`,
          [
            input.batchNumber,
            input.productId,
            input.productionMonth,
            input.createdBy ?? null,
          ],
          connection
        );

        batchId = Number(batchResult.insertId);
      }

      // 4. Insert serial number
      const result = await execute(
        `INSERT INTO serial_numbers
          (batch_id, product_id, serial_number, qr_code, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [
          batchId,
          input.productId,
          input.serialNumber,
          input.qrCode || null,
          input.createdBy ?? null,
        ],
        connection
      );

      // 5. Update batch quantity
      await execute(
        `UPDATE serial_number_batches
         SET quantity = quantity + 1
         WHERE id = ?`,
        [batchId],
        connection
      );

      return {
        id: Number(result.insertId),
        batchId,
        serialNumber: input.serialNumber,
        productId: input.productId,
        batchNumber: input.batchNumber,
        productionMonth: input.productionMonth,
        qrCode: input.qrCode ?? null,
      };
    });
  },
};

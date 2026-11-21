
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
        COALESCE(p.capacity, '-') AS capacity,
        COALESCE(p.price_inr, 0) AS mrp,
        COALESCE(p.warranty_months, 12) AS warrantyMonths,
        COALESCE(w.purchase_date, sn.purchase_date, DATE(sn.created_at)) AS purchaseDate,
        w.warranty_number AS warrantyNumber,
        COALESCE(w.status, 'active') AS warrantyStatus,
        sb.batch_number AS batchNumber,
        sb.production_month AS productionMonth,
        COALESCE(sn.qr_code, '') AS qrCode,
        sn.created_at AS createdAt,
        COALESCE(u.name, 'Unknown') AS createdBy

      FROM serial_numbers sn

      LEFT JOIN products p
        ON sn.product_id = p.id

      LEFT JOIN (
        SELECT serial_number, MAX(purchase_date) AS purchase_date, MAX(status) AS status, MAX(warranty_number) AS warranty_number
        FROM warranties
        GROUP BY serial_number
      ) w ON UPPER(w.serial_number) = UPPER(sn.serial_number)

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

  async bulkImport(
    items: Array<{
      productId?: number;
      productModel?: string;
      serialNumber: string;
      batchNumber: string;
      productionMonth: string;
      qrCode?: string;
    }>,
    createdBy?: number | null
  ) {
    if (!items || items.length === 0) {
      return { total: 0, importedCount: 0, skippedCount: 0, imported: [], skipped: [] };
    }

    // 1. Load all products for fast in-memory matching
    const allProducts = await query<{ id: number; name: string; model_number: string }>(
      "SELECT id, name, model_number FROM products"
    );
    const productById = new Map<number, { id: number; name: string; model_number: string }>();
    const productByModel = new Map<string, { id: number; name: string; model_number: string }>();
    for (const p of allProducts) {
      productById.set(Number(p.id), p);
      if (p.model_number) {
        productByModel.set(p.model_number.trim().toLowerCase(), p);
      }
    }

    // 2. Fetch existing serial numbers to avoid duplicate collisions
    const existingRows = await query<{ serial_number: string }>(
      "SELECT serial_number FROM serial_numbers"
    );
    const existingSerials = new Set<string>(
      existingRows.map((r) => r.serial_number.trim().toLowerCase())
    );

    const imported: Array<{
      id: number;
      serialNumber: string;
      modelNumber: string;
      batchNumber: string;
    }> = [];
    const skipped: Array<{
      row: number;
      serialNumber: string;
      reason: string;
    }> = [];

    const seenInBatch = new Set<string>();

    return withTransaction(async (connection) => {
      // Cache batches by batch_number
      const existingBatches = await query<{
        id: number;
        batch_number: string;
        product_id: number;
        production_month: string;
        quantity: number;
      }>(
        "SELECT id, batch_number, product_id, production_month, quantity FROM serial_number_batches FOR UPDATE",
        [],
        connection
      );
      const batchMap = new Map<
        string,
        { id: number; product_id: number; production_month: string; quantity: number }
      >();
      for (const b of existingBatches) {
        batchMap.set(b.batch_number.trim().toLowerCase(), {
          id: Number(b.id),
          product_id: Number(b.product_id),
          production_month: String(b.production_month).slice(0, 7),
          quantity: Number(b.quantity || 0),
        });
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rowNum = i + 1;
        const rawSerial = (item.serialNumber || "").trim();
        const rawBatch = (item.batchNumber || "").trim();
        const rawMonth = (item.productionMonth || "").trim();
        const rawQr = (item.qrCode || "").trim();

        if (!rawSerial) {
          skipped.push({ row: rowNum, serialNumber: "", reason: "Missing serial number" });
          continue;
        }

        const serialLower = rawSerial.toLowerCase();
        if (existingSerials.has(serialLower) || seenInBatch.has(serialLower)) {
          skipped.push({
            row: rowNum,
            serialNumber: rawSerial,
            reason: "Duplicate serial number already exists",
          });
          continue;
        }

        if (!rawBatch) {
          skipped.push({ row: rowNum, serialNumber: rawSerial, reason: "Missing batch number" });
          continue;
        }

        if (!rawMonth) {
          skipped.push({
            row: rowNum,
            serialNumber: rawSerial,
            reason: "Missing production month (YYYY-MM)",
          });
          continue;
        }

        // Resolve product
        let matchedProduct: { id: number; name: string; model_number: string } | undefined;
        if (item.productId && productById.has(Number(item.productId))) {
          matchedProduct = productById.get(Number(item.productId));
        } else if (item.productModel) {
          const modelKey = item.productModel.trim().toLowerCase();
          matchedProduct = productByModel.get(modelKey);
          if (!matchedProduct) {
            for (const [key, p] of productByModel.entries()) {
              if (key.includes(modelKey) || modelKey.includes(key)) {
                matchedProduct = p;
                break;
              }
            }
          }
        }

        if (!matchedProduct) {
          skipped.push({
            row: rowNum,
            serialNumber: rawSerial,
            reason: `Product model "${item.productModel || item.productId || "Unknown"}" not found in Product Master`,
          });
          continue;
        }

        const productId = matchedProduct.id;
        const batchKey = rawBatch.toLowerCase();
        let batchId: number;

        if (batchMap.has(batchKey)) {
          const b = batchMap.get(batchKey)!;
          batchId = b.id;
          b.quantity += 1;
          await execute(
            "UPDATE serial_number_batches SET quantity = quantity + 1 WHERE id = ?",
            [batchId],
            connection
          );
        } else {
          const batchRes = await execute(
            `INSERT INTO serial_number_batches (batch_number, product_id, production_month, quantity, created_by)
             VALUES (?, ?, ?, 1, ?)`,
            [rawBatch, productId, rawMonth, createdBy ?? null],
            connection
          );
          batchId = Number(batchRes.insertId);
          batchMap.set(batchKey, {
            id: batchId,
            product_id: productId,
            production_month: rawMonth,
            quantity: 1,
          });
        }

        // Insert serial number
        const insertRes = await execute(
          `INSERT INTO serial_numbers (batch_id, product_id, serial_number, qr_code, created_by)
           VALUES (?, ?, ?, ?, ?)`,
          [batchId, productId, rawSerial, rawQr || null, createdBy ?? null],
          connection
        );

        seenInBatch.add(serialLower);
        existingSerials.add(serialLower);

        imported.push({
          id: Number(insertRes.insertId),
          serialNumber: rawSerial,
          modelNumber: matchedProduct.model_number,
          batchNumber: rawBatch,
        });
      }

      return {
        total: items.length,
        importedCount: imported.length,
        skippedCount: skipped.length,
        imported,
        skipped,
      };
    });
  },
};

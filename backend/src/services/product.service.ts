import { execute, query, queryOne } from "../db/pool.js";
import { repositories } from "../repositories/index.js";
import type { ListProductsQuery } from "../schemas/product.schema.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import { paginate } from "../utils/pagination.js";

export interface CreateProductInput {
  name: string;
  modelNumber: string;
  category: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  warrantyMonths?: number;
  priceInr?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  modelNumber?: string;
  category?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  warrantyMonths?: number;
  priceInr?: number;
  imageUrl?: string;
  isActive?: boolean;
}

function rowId(id: string | number): number {
  if (typeof id === "number") return id;
  const value = Number(id.replace(/^[a-z]+_/, ""));
  return Number.isSafeInteger(value) ? value : 0;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const productService = {
  async list(queryInput: ListProductsQuery) {
    const products = await repositories.products.findAll({ category: queryInput.category, q: queryInput.q });
    return paginate(products, queryInput);
  },

  async getBySlug(slug: string) {
    const product = await repositories.products.findBySlug(slug);
    if (!product) throw new NotFoundError("Product");
    return product;
  },

  async getById(id: string | number) {
    const numericId = rowId(id);
    const row = await queryOne<Record<string, any>>("SELECT * FROM products WHERE id = ?", [numericId]);
    if (!row) throw new NotFoundError("Product");
    return {
      id: `prd_${row.id}`,
      slug: row.slug,
      name: row.name,
      model: row.model_number,
      category: row.category,
      shortDescription: row.short_description ?? "",
      description: row.description ?? "",
      warrantyMonths: row.warranty_months,
      priceInr: Number(row.price_inr ?? 0),
      imageUrl: row.image_url,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
    };
  },

  async listAllForAdmin(filter: { q?: string; category?: string }) {
const conditions: string[] = ["is_active = TRUE"];
    const params: unknown[] = [];

    if (filter.category) {
      conditions.push("category = ?");
      params.push(filter.category);
    }
    if (filter.q?.trim()) {
      const q = `%${filter.q.trim()}%`;
      conditions.push("(name LIKE ? OR model_number LIKE ? OR slug LIKE ?)");
      params.push(q, q, q);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await query<Record<string, any>>(
      `SELECT * FROM products ${where} ORDER BY is_active DESC, name ASC`,
      params,
    );

    return rows.map((row) => ({
      id: `prd_${row.id}`,
      numericId: row.id,
      slug: row.slug,
      name: row.name,
      model: row.model_number,
      category: row.category,
      shortDescription: row.short_description ?? "",
      description: row.description ?? "",
      warrantyMonths: row.warranty_months,
      priceInr: Number(row.price_inr ?? 0),
      imageUrl: row.image_url,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
    }));
  },

  async create(input: CreateProductInput) {
    const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name + "-" + input.modelNumber);
    const modelNumber = input.modelNumber.trim();
    const name = input.name.trim();

    // Check slug or model uniqueness
    const existing = await queryOne<Record<string, any>>(
      "SELECT id FROM products WHERE slug = ? OR model_number = ?",
      [slug, modelNumber],
    );
    if (existing) {
      throw new ConflictError("A product with this model number or slug already exists.");
    }

    const result = await execute(
      `INSERT INTO products (
         slug, name, model_number, category, short_description,
         description, warranty_months, price_inr, image_url, is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        name,
        modelNumber,
        input.category.trim(),
        input.shortDescription?.trim() || null,
        input.description?.trim() || null,
        input.warrantyMonths ?? 12,
        input.priceInr ?? 0,
        input.imageUrl?.trim() || null,
        input.isActive ?? true,
      ],
    );

    return productService.getById(result.insertId);
  },

  async update(id: string | number, input: UpdateProductInput) {
    const numericId = rowId(id);
    const existing = await queryOne<Record<string, any>>("SELECT * FROM products WHERE id = ?", [numericId]);
    if (!existing) throw new NotFoundError("Product");

    const slug = input.slug !== undefined ? slugify(input.slug) : existing.slug;
    const name = input.name !== undefined ? input.name.trim() : existing.name;
    const modelNumber = input.modelNumber !== undefined ? input.modelNumber.trim() : existing.model_number;
    const category = input.category !== undefined ? input.category.trim() : existing.category;
    const shortDesc = input.shortDescription !== undefined ? input.shortDescription.trim() : existing.short_description;
    const desc = input.description !== undefined ? input.description.trim() : existing.description;
    const warrantyMonths = input.warrantyMonths !== undefined ? input.warrantyMonths : existing.warranty_months;
    const priceInr = input.priceInr !== undefined ? input.priceInr : existing.price_inr;
    const imageUrl = input.imageUrl !== undefined ? input.imageUrl.trim() : existing.image_url;
    const isActive = input.isActive !== undefined ? input.isActive : existing.is_active;

    await execute(
      `UPDATE products SET
         slug = ?, name = ?, model_number = ?, category = ?,
         short_description = ?, description = ?, warranty_months = ?,
         price_inr = ?, image_url = ?, is_active = ?
       WHERE id = ?`,
      [slug, name, modelNumber, category, shortDesc, desc, warrantyMonths, priceInr, imageUrl, isActive, numericId],
    );

    return productService.getById(numericId);
  },

  async delete(id: string | number) {
    const numericId = rowId(id);
    // Soft delete product so foreign keys in warranties remain intact
    const result = await execute("UPDATE products SET is_active = FALSE WHERE id = ?", [numericId]);
    if (result.affectedRows === 0) throw new NotFoundError("Product");
    return { success: true, message: "Product deactivated successfully" };
  },
};

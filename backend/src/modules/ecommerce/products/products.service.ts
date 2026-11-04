import type { FastifyRequest } from "fastify";
import { execute, query, queryOne, withTransaction, type Queryable } from "../../../db/pool.js";
import { BusinessRuleError, ConflictError, NotFoundError } from "../../../utils/errors.js";
import { audit } from "../shared/audit.js";
import { json, pageWindow, slugify } from "../shared/http.js";
import { categoryService } from "../categories/categories.service.js";
import type { AdminListProductsQuery, ListProductsQuery, ProductInput } from "./products.schema.js";

/** Columns and joins shared by every product read. `available` = on hand minus held by unpaid checkouts. */
const PRODUCT_SELECT = `
  SELECT p.*, (p.stock_qty - p.reserved_qty) AS available,
         c.name AS category_name, c.slug AS category_slug,
         b.name AS brand_name, b.slug AS brand_slug,
         (SELECT url FROM ecom_product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS primary_image
    FROM ecom_products p
    JOIN ecom_categories c ON c.id = p.category_id
    LEFT JOIN ecom_brands b ON b.id = p.brand_id`;

export interface ProductRow {
  id: number;
  sku: string;
  slug: string;
  name: string;
  category_id: number;
  brand_id: number | null;
  variant_of_id: number | null;
  attributes: unknown;
  short_description: string | null;
  description: string | null;
  features: unknown;
  specifications: unknown;
  mrp: number;
  selling_price: number;
  tax_rate: number;
  hsn_code: string | null;
  warranty_info: string | null;
  delivery_info: string | null;
  stock_qty: number;
  reserved_qty: number;
  available: number;
  low_stock_threshold: number;
  max_order_qty: number;
  is_featured: number;
  is_best_seller: number;
  is_new_arrival: number;
  is_on_offer: number;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  sold_count: number;
  rating_avg: number;
  rating_count: number;
  category_name: string;
  category_slug: string;
  brand_name: string | null;
  brand_slug: string | null;
  primary_image: string | null;
  created_at: Date;
  updated_at: Date;
}

export function stockStatus(row: Pick<ProductRow, "available" | "low_stock_threshold">) {
  const available = Number(row.available);
  if (available <= 0) return "out_of_stock" as const;
  if (available <= row.low_stock_threshold) return "low_stock" as const;
  return "in_stock" as const;
}

export function toSummary(row: ProductRow) {
  const mrp = Number(row.mrp);
  const price = Number(row.selling_price);
  return {
    id: Number(row.id),
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    shortDescription: row.short_description,
    image: row.primary_image,
    mrp,
    sellingPrice: price,
    discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
    category: { id: Number(row.category_id), name: row.category_name, slug: row.category_slug },
    brand: row.brand_id ? { id: Number(row.brand_id), name: row.brand_name, slug: row.brand_slug } : null,
    stockStatus: stockStatus(row),
    // Exact stock is not exposed publicly beyond what the quantity selector needs.
    maxPurchasable: Math.max(0, Math.min(Number(row.available), row.max_order_qty)),
    rating: { average: Number(row.rating_avg), count: Number(row.rating_count) },
    flags: {
      featured: Boolean(row.is_featured),
      bestSeller: Boolean(row.is_best_seller),
      newArrival: Boolean(row.is_new_arrival),
      onOffer: Boolean(row.is_on_offer),
    },
  };
}

function toAdmin(row: ProductRow, images: { id: number; url: string; alt_text: string | null }[]) {
  return {
    ...toSummary(row),
    variantOfId: row.variant_of_id ? Number(row.variant_of_id) : null,
    attributes: json<Record<string, string>>(row.attributes, {}),
    description: row.description,
    features: json<string[]>(row.features, []),
    specifications: json<{ label: string; value: string }[]>(row.specifications, []),
    taxRate: Number(row.tax_rate),
    hsnCode: row.hsn_code,
    warrantyInfo: row.warranty_info,
    deliveryInfo: row.delivery_info,
    stockQty: row.stock_qty,
    reservedQty: row.reserved_qty,
    available: Number(row.available),
    lowStockThreshold: row.low_stock_threshold,
    maxOrderQty: row.max_order_qty,
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    soldCount: row.sold_count,
    images: images.map((image) => ({ id: Number(image.id), url: image.url, alt: image.alt_text })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const likeEscape = (value: string) => `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

const PUBLIC_SORT: Record<string, string> = {
  price_asc: "p.selling_price ASC, p.id",
  price_desc: "p.selling_price DESC, p.id",
  newest: "p.created_at DESC, p.id DESC",
  popularity: "p.sold_count DESC, p.id",
  rating: "p.rating_avg DESC, p.rating_count DESC, p.id",
};

/** WHERE clause for public catalogue queries (only active products in active categories). */
async function publicFilters(filters: ListProductsQuery) {
  const where = ["p.status = 'active'", "c.is_active = TRUE"];
  const params: unknown[] = [];

  if (filters.ids) {
    const ids = filters.ids.split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0).slice(0, 30);
    where.push(ids.length ? `p.id IN (${ids.map(() => "?").join(",")})` : "FALSE");
    params.push(...ids);
  } else if (!filters.q) {
    // Variants are listed under their parent product; search still finds them by SKU or name.
    where.push("p.variant_of_id IS NULL");
  }
  if (filters.q) {
    where.push("(p.name LIKE ? OR p.sku LIKE ? OR p.short_description LIKE ? OR b.name LIKE ?)");
    const like = likeEscape(filters.q.trim());
    params.push(like, like, like, like);
  }
  if (filters.category) {
    const ids = await categoryService.descendantIdsBySlug(filters.category);
    if (!ids) throw new NotFoundError("Category");
    where.push(`p.category_id IN (${ids.map(() => "?").join(",")})`);
    params.push(...ids);
  }
  if (filters.brand) {
    const slugs = filters.brand.split(",").map((slug) => slug.trim()).filter(Boolean).slice(0, 20);
    if (slugs.length) {
      where.push(`b.slug IN (${slugs.map(() => "?").join(",")})`);
      params.push(...slugs);
    }
  }
  if (filters.minPrice !== undefined) {
    where.push("p.selling_price >= ?");
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    where.push("p.selling_price <= ?");
    params.push(filters.maxPrice);
  }
  if (filters.inStock) where.push("p.stock_qty - p.reserved_qty > 0");
  if (filters.flag) where.push(`p.is_${filters.flag} = TRUE`);
  for (const pair of filters.spec ?? []) {
    const index = pair.indexOf(":");
    if (index <= 0) continue;
    where.push("JSON_CONTAINS(p.specifications, JSON_OBJECT('label', ?, 'value', ?))");
    params.push(pair.slice(0, index), pair.slice(index + 1));
  }
  return { where: where.join(" AND "), params };
}

async function imagesFor(productId: number, db?: Queryable) {
  return query<{ id: number; url: string; alt_text: string | null }>(
    "SELECT id, url, alt_text FROM ecom_product_images WHERE product_id = ? ORDER BY sort_order, id",
    [productId],
    db,
  );
}

function rethrowDuplicate(error: unknown): never {
  if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
    const message = String((error as Error).message);
    throw new ConflictError(message.includes("sku") ? "A product with this SKU already exists." : "A product with this URL slug already exists.");
  }
  throw error;
}

export const productService = {
  async list(filters: ListProductsQuery) {
    const { where, params } = await publicFilters(filters);
    const window = pageWindow(filters);
    const sort =
      filters.sort && filters.sort !== "relevance"
        ? PUBLIC_SORT[filters.sort]
        : filters.q
          ? "(p.name LIKE ?) DESC, (p.sku = ?) DESC, p.sold_count DESC, p.id"
          : "p.is_featured DESC, p.sold_count DESC, p.id";
    const sortParams = (!filters.sort || filters.sort === "relevance") && filters.q ? [`${filters.q.trim()}%`, filters.q.trim()] : [];

    const [rows, countRow] = await Promise.all([
      query<ProductRow>(`${PRODUCT_SELECT} WHERE ${where} ORDER BY ${sort} LIMIT ? OFFSET ?`, [...params, ...sortParams, window.limit, window.offset]),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_products p JOIN ecom_categories c ON c.id = p.category_id LEFT JOIN ecom_brands b ON b.id = p.brand_id WHERE ${where}`, params),
    ]);
    return { items: rows.map(toSummary), meta: window.meta(Number(countRow?.total ?? 0)) };
  },

  /** Filter options for the listing sidebar, computed from the products matching the current category/search. */
  async facets(filters: Pick<ListProductsQuery, "q" | "category">) {
    const { where, params } = await publicFilters({ q: filters.q, category: filters.category });
    const base = `FROM ecom_products p JOIN ecom_categories c ON c.id = p.category_id LEFT JOIN ecom_brands b ON b.id = p.brand_id WHERE ${where}`;
    const [brands, price, specRows] = await Promise.all([
      query<{ slug: string; name: string; count: number }>(`SELECT b.slug, b.name, COUNT(*) AS count ${base} AND b.id IS NOT NULL GROUP BY b.id ORDER BY b.name`, params),
      queryOne<{ min: number | null; max: number | null }>(`SELECT MIN(p.selling_price) AS min, MAX(p.selling_price) AS max ${base}`, params),
      query<{ specifications: unknown }>(`SELECT p.specifications ${base} LIMIT 500`, params),
    ]);

    // Only specs that vary across products and have a manageable number of values are useful as filters.
    const specs = new Map<string, Map<string, number>>();
    for (const row of specRows) {
      for (const { label, value } of json<{ label: string; value: string }[]>(row.specifications, [])) {
        const values = specs.get(label) ?? new Map<string, number>();
        values.set(value, (values.get(value) ?? 0) + 1);
        specs.set(label, values);
      }
    }
    const specFacets = [...specs.entries()]
      .filter(([, values]) => values.size > 1 && values.size <= 12)
      .slice(0, 6)
      .map(([label, values]) => ({ label, values: [...values.entries()].map(([value, count]) => ({ value, count })) }));

    return {
      brands: brands.map((brand) => ({ ...brand, count: Number(brand.count) })),
      price: { min: Number(price?.min ?? 0), max: Number(price?.max ?? 0) },
      specifications: specFacets,
    };
  },

  async suggest(q: string) {
    const like = likeEscape(q.trim());
    const [products, categories] = await Promise.all([
      query<ProductRow>(
        `${PRODUCT_SELECT} WHERE p.status = 'active' AND c.is_active = TRUE AND (p.name LIKE ? OR p.sku LIKE ?) ORDER BY (p.name LIKE ?) DESC, p.sold_count DESC LIMIT 6`,
        [like, like, `${q.trim()}%`],
      ),
      query<{ name: string; slug: string }>("SELECT name, slug FROM ecom_categories WHERE is_active = TRUE AND name LIKE ? ORDER BY display_order LIMIT 3", [like]),
    ]);
    return {
      products: products.map((row) => {
        const summary = toSummary(row);
        return { slug: summary.slug, name: summary.name, sku: summary.sku, image: summary.image, sellingPrice: summary.sellingPrice };
      }),
      categories,
    };
  },

  async getBySlug(slug: string) {
    const row = await queryOne<ProductRow>(`${PRODUCT_SELECT} WHERE p.slug = ? AND p.status = 'active' AND c.is_active = TRUE`, [slug]);
    if (!row) throw new NotFoundError("Product");
    const rootId = row.variant_of_id ? Number(row.variant_of_id) : Number(row.id);

    const [images, variants, related, breadcrumbs] = await Promise.all([
      imagesFor(Number(row.id)),
      query<ProductRow>(`${PRODUCT_SELECT} WHERE (p.id = ? OR p.variant_of_id = ?) AND p.status = 'active' ORDER BY p.selling_price, p.id`, [rootId, rootId]),
      query<ProductRow>(
        `${PRODUCT_SELECT} WHERE p.category_id = ? AND p.id <> ? AND p.status = 'active' AND p.variant_of_id IS NULL AND c.is_active = TRUE ORDER BY p.sold_count DESC, p.id LIMIT 8`,
        [row.category_id, rootId],
      ),
      categoryService.breadcrumbs(Number(row.category_id)),
    ]);

    return {
      ...toSummary(row),
      description: row.description,
      features: json<string[]>(row.features, []),
      specifications: json<{ label: string; value: string }[]>(row.specifications, []),
      attributes: json<Record<string, string>>(row.attributes, {}),
      images: images.map((image) => ({ url: image.url, alt: image.alt_text ?? row.name })),
      taxRate: Number(row.tax_rate),
      warrantyInfo: row.warranty_info,
      deliveryInfo: row.delivery_info,
      maxOrderQty: row.max_order_qty,
      seo: { title: row.seo_title ?? row.name, description: row.seo_description ?? row.short_description ?? "" },
      breadcrumbs,
      variants:
        variants.length > 1
          ? variants.map((variant) => ({
              slug: variant.slug,
              name: variant.name,
              attributes: json<Record<string, string>>(variant.attributes, {}),
              sellingPrice: Number(variant.selling_price),
              stockStatus: stockStatus(variant),
              current: Number(variant.id) === Number(row.id),
            }))
          : [],
      related: related.map(toSummary),
      updatedAt: row.updated_at,
    };
  },

  async sitemapEntries() {
    return query<{ slug: string; updated_at: Date }>(
      "SELECT p.slug, p.updated_at FROM ecom_products p JOIN ecom_categories c ON c.id = p.category_id WHERE p.status = 'active' AND c.is_active = TRUE",
    );
  },

  // ------------------------------------------------------------------ admin

  async adminList(filters: AdminListProductsQuery) {
    const where = ["TRUE"];
    const params: unknown[] = [];
    if (filters.q) {
      const like = likeEscape(filters.q.trim());
      where.push("(p.name LIKE ? OR p.sku LIKE ?)");
      params.push(like, like);
    }
    if (filters.status) {
      where.push("p.status = ?");
      params.push(filters.status);
    } else {
      where.push("p.status <> 'archived'");
    }
    if (filters.categoryId) {
      where.push("p.category_id = ?");
      params.push(filters.categoryId);
    }
    if (filters.stock === "out") where.push("p.stock_qty - p.reserved_qty <= 0");
    if (filters.stock === "low") where.push("p.stock_qty - p.reserved_qty > 0 AND p.stock_qty - p.reserved_qty <= p.low_stock_threshold");
    if (filters.stock === "in") where.push("p.stock_qty - p.reserved_qty > p.low_stock_threshold");

    const sort = {
      newest: "p.created_at DESC, p.id DESC",
      name: "p.name ASC",
      price_asc: "p.selling_price ASC",
      price_desc: "p.selling_price DESC",
      stock_asc: "available ASC, p.id",
    }[filters.sort ?? "newest"];
    const window = pageWindow(filters);
    const [rows, countRow] = await Promise.all([
      query<ProductRow>(`${PRODUCT_SELECT} WHERE ${where.join(" AND ")} ORDER BY ${sort} LIMIT ? OFFSET ?`, [...params, window.limit, window.offset]),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_products p WHERE ${where.join(" AND ")}`, params),
    ]);
    return {
      items: rows.map((row) => ({ ...toSummary(row), status: row.status, stockQty: row.stock_qty, reservedQty: row.reserved_qty, available: Number(row.available), lowStockThreshold: row.low_stock_threshold })),
      meta: window.meta(Number(countRow?.total ?? 0)),
    };
  },

  async adminGet(id: number, db?: Queryable) {
    const row = await queryOne<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = ?`, [id], db);
    if (!row) throw new NotFoundError("Product");
    return toAdmin(row, await imagesFor(id, db));
  },

  async create(request: FastifyRequest, input: ProductInput) {
    validatePricing(input.mrp, input.sellingPrice);
    await assertReferences(input);
    const slug = input.slug ?? slugify(`${input.name}-${input.sku}`);
    try {
      return await withTransaction(async (db) => {
        const result = await execute(
          `INSERT INTO ecom_products (sku, slug, name, category_id, brand_id, variant_of_id, attributes, short_description, description, features, specifications,
             mrp, selling_price, tax_rate, hsn_code, warranty_info, delivery_info, stock_qty, low_stock_threshold, max_order_qty,
             is_featured, is_best_seller, is_new_arrival, is_on_offer, status, seo_title, seo_description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            input.sku.toUpperCase(), slug, input.name, input.categoryId, input.brandId ?? null, input.variantOfId ?? null,
            JSON.stringify(input.attributes ?? {}), input.shortDescription ?? null, input.description ?? null,
            JSON.stringify(input.features ?? []), JSON.stringify(input.specifications ?? []),
            input.mrp, input.sellingPrice, input.taxRate ?? 18, input.hsnCode ?? null, input.warrantyInfo ?? null, input.deliveryInfo ?? null,
            input.initialStock ?? 0, input.lowStockThreshold ?? 5, input.maxOrderQty ?? 10,
            input.isFeatured ?? false, input.isBestSeller ?? false, input.isNewArrival ?? false, input.isOnOffer ?? false,
            input.status ?? "draft", input.seoTitle ?? null, input.seoDescription ?? null,
          ],
          db,
        );
        const id = result.insertId;
        await replaceImages(id, input.images ?? [], db);
        if (input.initialStock) {
          await execute(
            `INSERT INTO ecom_inventory_movements (product_id, movement_type, quantity, stock_after, reserved_after, reference_type, note, admin_id)
             VALUES (?, 'stock_in', ?, ?, 0, 'manual', 'Opening stock', ?)`,
            [id, input.initialStock, input.initialStock, request.ecomAdmin?.id ?? null],
            db,
          );
        }
        await audit(request, "product.create", "product", id, { sku: input.sku, name: input.name }, db);
        return this.adminGet(id, db);
      });
    } catch (error) {
      rethrowDuplicate(error);
    }
  },

  async update(request: FastifyRequest, id: number, input: Partial<ProductInput>) {
    const current = await this.adminGet(id);
    validatePricing(input.mrp ?? current.mrp, input.sellingPrice ?? current.sellingPrice);
    if (input.variantOfId === id) throw new BusinessRuleError("A product cannot be a variant of itself.");
    await assertReferences(input);

    const columns: Record<string, unknown> = {
      sku: input.sku?.toUpperCase(),
      slug: input.slug,
      name: input.name,
      category_id: input.categoryId,
      brand_id: input.brandId,
      variant_of_id: input.variantOfId,
      attributes: input.attributes && JSON.stringify(input.attributes),
      short_description: input.shortDescription,
      description: input.description,
      features: input.features && JSON.stringify(input.features),
      specifications: input.specifications && JSON.stringify(input.specifications),
      mrp: input.mrp,
      selling_price: input.sellingPrice,
      tax_rate: input.taxRate,
      hsn_code: input.hsnCode,
      warranty_info: input.warrantyInfo,
      delivery_info: input.deliveryInfo,
      low_stock_threshold: input.lowStockThreshold,
      max_order_qty: input.maxOrderQty,
      is_featured: input.isFeatured,
      is_best_seller: input.isBestSeller,
      is_new_arrival: input.isNewArrival,
      is_on_offer: input.isOnOffer,
      status: input.status,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
    };
    const entries = Object.entries(columns).filter(([, value]) => value !== undefined);
    try {
      return await withTransaction(async (db) => {
        if (entries.length) {
          await execute(`UPDATE ecom_products SET ${entries.map(([column]) => `${column} = ?`).join(", ")} WHERE id = ?`, [...entries.map(([, value]) => value), id], db);
        }
        if (input.images) await replaceImages(id, input.images, db);
        const changed = Object.keys(input).filter((key) => key !== "description");
        await audit(request, "product.update", "product", id, {
          fields: changed,
          ...(input.sellingPrice !== undefined && input.sellingPrice !== current.sellingPrice ? { priceFrom: current.sellingPrice, priceTo: input.sellingPrice } : {}),
          ...(input.status && input.status !== current.status ? { statusFrom: current.status, statusTo: input.status } : {}),
        }, db);
        return this.adminGet(id, db);
      });
    } catch (error) {
      rethrowDuplicate(error);
    }
  },

  /**
   * Deletes a product only when nothing references it (no orders, no stock movements beyond opening stock).
   * Otherwise the product must be archived so order history and reports stay intact.
   */
  async remove(request: FastifyRequest, id: number) {
    const product = await this.adminGet(id);
    const usage = await queryOne<{ orders: number; variants: number }>(
      `SELECT (SELECT COUNT(*) FROM ecom_order_items WHERE product_id = ?) AS orders,
              (SELECT COUNT(*) FROM ecom_products WHERE variant_of_id = ?) AS variants`,
      [id, id],
    );
    if (Number(usage?.orders) > 0) throw new BusinessRuleError("This product has orders. Archive it instead of deleting it.");
    if (Number(usage?.variants) > 0) throw new BusinessRuleError("Remove or reassign this product's variants first.");
    await withTransaction(async (db) => {
      await execute("DELETE FROM ecom_inventory_movements WHERE product_id = ?", [id], db);
      await execute("DELETE FROM ecom_products WHERE id = ?", [id], db);
      await audit(request, "product.delete", "product", id, { sku: product.sku, name: product.name }, db);
    });
  },

  async listBrands(includeInactive = false) {
    const rows = await query<{ id: number; name: string; slug: string; is_active: number; products: number }>(
      `SELECT b.id, b.name, b.slug, b.is_active, (SELECT COUNT(*) FROM ecom_products p WHERE p.brand_id = b.id) AS products
         FROM ecom_brands b ${includeInactive ? "" : "WHERE b.is_active = TRUE"} ORDER BY b.name`,
    );
    return rows.map((row) => ({ id: Number(row.id), name: row.name, slug: row.slug, isActive: Boolean(row.is_active), productCount: Number(row.products) }));
  },

  async saveBrand(request: FastifyRequest, id: number | null, input: { name: string; slug?: string; isActive?: boolean }) {
    const slug = input.slug ?? slugify(input.name);
    try {
      if (id) {
        const result = await execute("UPDATE ecom_brands SET name = ?, slug = ?, is_active = COALESCE(?, is_active) WHERE id = ?", [input.name, slug, input.isActive ?? null, id]);
        if (!result.affectedRows) throw new NotFoundError("Brand");
      } else {
        id = (await execute("INSERT INTO ecom_brands (name, slug, is_active) VALUES (?, ?, ?)", [input.name, slug, input.isActive ?? true])).insertId;
      }
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new ConflictError("A brand with this name or slug already exists.");
      throw error;
    }
    await audit(request, "brand.save", "brand", id, { name: input.name });
    return (await this.listBrands(true)).find((brand) => brand.id === id);
  },
};

function validatePricing(mrp: number, sellingPrice: number) {
  if (sellingPrice > mrp) throw new BusinessRuleError("Selling price cannot be higher than the MRP.");
}

async function assertReferences(input: Partial<ProductInput>) {
  if (input.categoryId && !(await queryOne("SELECT id FROM ecom_categories WHERE id = ?", [input.categoryId]))) throw new BusinessRuleError("The selected category does not exist.");
  if (input.brandId && !(await queryOne("SELECT id FROM ecom_brands WHERE id = ?", [input.brandId]))) throw new BusinessRuleError("The selected brand does not exist.");
  if (input.variantOfId) {
    const parent = await queryOne<{ variant_of_id: number | null }>("SELECT variant_of_id FROM ecom_products WHERE id = ?", [input.variantOfId]);
    if (!parent) throw new BusinessRuleError("The parent product does not exist.");
    if (parent.variant_of_id) throw new BusinessRuleError("Choose the main product as parent, not another variant.");
  }
}

async function replaceImages(productId: number, images: { url: string; alt?: string }[], db: Queryable) {
  await execute("DELETE FROM ecom_product_images WHERE product_id = ?", [productId], db);
  for (const [index, image] of images.entries()) {
    await execute("INSERT INTO ecom_product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?)", [productId, image.url, image.alt ?? null, index], db);
  }
}

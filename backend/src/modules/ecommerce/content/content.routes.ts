/**
 * Website content managed from the admin panel and read live by the storefront (no redeploy needed):
 * homepage blocks (banners, promos, testimonials, FAQs, trust badges), information/policy pages and store settings.
 * Also image uploads for products, categories and banners.
 */
import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyPluginAsync } from "fastify";
import { execute, query, queryOne } from "../../../db/pool.js";
import { BusinessRuleError, NotFoundError } from "../../../utils/errors.js";
import { categoryService } from "../categories/categories.service.js";
import { productService } from "../products/products.service.js";
import { audit } from "../shared/audit.js";
import { requireAdmin } from "../shared/auth.js";
import { ecomConfig } from "../shared/config.js";
import { dbOk } from "../shared/http.js";
import { rateLimit } from "../shared/rate-limit.js";
import { dateTimeOrNull, numericIdParams, slugSchema, urlOrEmpty, type NumericIdParams } from "../shared/schemas.js";
import { getSettings, updateSettings, type StoreSettings } from "../shared/settings.js";

const BLOCK_TYPES = ["banner", "promo", "testimonial", "faq", "trust_badge"] as const;
type BlockType = (typeof BLOCK_TYPES)[number];

interface BlockInput {
  blockType: BlockType;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  authorName?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

const nullableText = (max: number) => ({ anyOf: [{ type: "string", maxLength: max }, { type: "null" }] }) as const;
const blockProperties = {
  blockType: { type: "string", enum: BLOCK_TYPES },
  title: { type: "string", minLength: 1, maxLength: 200 },
  subtitle: nullableText(300),
  body: nullableText(5000),
  imageUrl: { anyOf: [urlOrEmpty, { type: "null" }] },
  linkUrl: { anyOf: [urlOrEmpty, { type: "null" }] },
  linkLabel: nullableText(60),
  authorName: nullableText(100),
  displayOrder: { type: "integer", minimum: -10000, maximum: 10000 },
  isActive: { type: "boolean" },
  startsAt: dateTimeOrNull,
  endsAt: dateTimeOrNull,
} as const;

function toBlock(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    blockType: row.block_type as BlockType,
    title: row.title,
    subtitle: row.subtitle,
    body: row.body,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    linkLabel: row.link_label,
    authorName: row.author_name,
    displayOrder: row.display_order,
    isActive: Boolean(row.is_active),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    updatedAt: row.updated_at,
  };
}

const toSqlDate = (value: string | null | undefined) => (value ? new Date(value).toISOString().slice(0, 19).replace("T", " ") : value);

/** Only non-sensitive settings are public. */
function publicSettings(settings: StoreSettings) {
  return {
    store: { name: settings.store.name, supportEmail: settings.store.supportEmail, supportPhone: settings.store.supportPhone, address: settings.store.address },
    shipping: { flatFee: settings.shipping.flatFee, freeShippingThreshold: settings.shipping.freeShippingThreshold, estimatedDays: settings.shipping.estimatedDays },
    checkout: { guestCheckout: settings.checkout.guestCheckout, codEnabled: settings.checkout.codEnabled },
    returns: { returnWindowDays: settings.returns.returnWindowDays },
    social: settings.social,
  };
}

// ---------------------------------------------------------------- image uploads

const IMAGE_TYPES: Record<string, { ext: string; magic: (buffer: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", magic: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
};
const MEDIA_NAME = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

/** Public: /api/ecommerce/content, /api/ecommerce/pages, /api/ecommerce/media */
export const contentRoutes: FastifyPluginAsync = async (app) => {
  // Public catalogue/content responses may be cached briefly by browsers and CDNs.
  app.addHook("onSend", async (request, reply) => {
    if (request.method === "GET" && reply.statusCode === 200 && !reply.getHeader("cache-control")) reply.header("cache-control", "public, max-age=60, stale-while-revalidate=300");
  });

  app.get("/content/home", async () => {
    const [blocks, categories, featured, bestSellers, newArrivals, offers, settings] = await Promise.all([
      query(
        `SELECT * FROM ecom_content_blocks WHERE is_active = TRUE AND (starts_at IS NULL OR starts_at <= UTC_TIMESTAMP()) AND (ends_at IS NULL OR ends_at > UTC_TIMESTAMP())
          ORDER BY block_type, display_order, id`,
      ),
      categoryService.tree(),
      productService.list({ flag: "featured", pageSize: 8 }),
      productService.list({ flag: "best_seller", pageSize: 8, sort: "popularity" }),
      productService.list({ flag: "new_arrival", pageSize: 8, sort: "newest" }),
      productService.list({ flag: "on_offer", pageSize: 8 }),
      getSettings(),
    ]);
    const byType = (type: BlockType) => blocks.filter((block) => block.block_type === type).map(toBlock);
    return dbOk({
      banners: byType("banner"),
      promos: byType("promo"),
      testimonials: byType("testimonial"),
      faqs: byType("faq"),
      trustBadges: byType("trust_badge"),
      categories,
      featured: featured.items,
      bestSellers: bestSellers.items,
      newArrivals: newArrivals.items,
      offers: offers.items,
      settings: publicSettings(settings),
    });
  });

  app.get("/content/settings", async () => dbOk(publicSettings(await getSettings())));

  app.get("/content/faqs", async () =>
    dbOk((await query("SELECT * FROM ecom_content_blocks WHERE block_type = 'faq' AND is_active = TRUE ORDER BY display_order, id")).map(toBlock)),
  );

  app.get("/pages", async () =>
    dbOk(await query<{ slug: string; title: string }>("SELECT slug, title FROM ecom_pages WHERE is_published = TRUE ORDER BY title")),
  );

  app.get<{ Params: { slug: string } }>("/pages/:slug", { schema: { params: { type: "object", required: ["slug"], properties: { slug: slugSchema } } } }, async (request) => {
    const page = await queryOne("SELECT slug, title, body, seo_title, seo_description, updated_at FROM ecom_pages WHERE slug = ? AND is_published = TRUE", [request.params.slug]);
    if (!page) throw new NotFoundError("Page");
    return dbOk({ slug: page.slug, title: page.title, body: page.body, seoTitle: page.seo_title, seoDescription: page.seo_description, updatedAt: page.updated_at });
  });

  app.get<{ Params: { name: string } }>("/media/:name", async (request, reply) => {
    const { name } = request.params;
    if (!MEDIA_NAME.test(name)) throw new NotFoundError("File");
    const file = path.join(ecomConfig.mediaDir, name);
    try {
      await stat(file);
    } catch {
      throw new NotFoundError("File");
    }
    const ext = name.split(".").pop()!;
    const type = Object.entries(IMAGE_TYPES).find(([, value]) => value.ext === ext)![0];
    return reply
      .type(type)
      .header("cache-control", "public, max-age=31536000, immutable")
      .header("x-content-type-options", "nosniff")
      .header("content-security-policy", "default-src 'none'")
      .send(createReadStream(file));
  });
};

/** Admin: /api/ecommerce/admin/content, /admin/pages, /admin/settings, /admin/uploads */
export const adminContentRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { type?: BlockType } }>(
    "/content",
    { preValidation: requireAdmin("content.manage"), schema: { querystring: { type: "object", additionalProperties: false, properties: { type: { type: "string", enum: BLOCK_TYPES } } } } },
    async (request) => {
      const rows = request.query.type
        ? await query("SELECT * FROM ecom_content_blocks WHERE block_type = ? ORDER BY display_order, id", [request.query.type])
        : await query("SELECT * FROM ecom_content_blocks ORDER BY block_type, display_order, id");
      return dbOk(rows.map(toBlock));
    },
  );

  app.post<{ Body: BlockInput }>(
    "/content",
    { preValidation: requireAdmin("content.manage"), schema: { body: { type: "object", additionalProperties: false, required: ["blockType", "title"], properties: blockProperties } } },
    async (request, reply) => {
      const b = request.body;
      const result = await execute(
        `INSERT INTO ecom_content_blocks (block_type, title, subtitle, body, image_url, link_url, link_label, author_name, display_order, is_active, starts_at, ends_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.blockType, b.title, b.subtitle ?? null, b.body ?? null, b.imageUrl || null, b.linkUrl || null, b.linkLabel ?? null, b.authorName ?? null, b.displayOrder ?? 0, b.isActive ?? false, toSqlDate(b.startsAt) ?? null, toSqlDate(b.endsAt) ?? null],
      );
      await audit(request, "content.create", "content_block", result.insertId, { type: b.blockType, title: b.title });
      reply.status(201);
      return dbOk(toBlock((await queryOne("SELECT * FROM ecom_content_blocks WHERE id = ?", [result.insertId]))!), { persisted: true });
    },
  );

  app.patch<{ Params: NumericIdParams; Body: Partial<BlockInput> }>(
    "/content/:id",
    { preValidation: requireAdmin("content.manage"), schema: { ...numericIdParams, body: { type: "object", additionalProperties: false, minProperties: 1, properties: blockProperties } } },
    async (request) => {
      const b = request.body;
      const columns: Record<string, unknown> = {
        block_type: b.blockType,
        title: b.title,
        subtitle: b.subtitle,
        body: b.body,
        image_url: b.imageUrl === "" ? null : b.imageUrl,
        link_url: b.linkUrl === "" ? null : b.linkUrl,
        link_label: b.linkLabel,
        author_name: b.authorName,
        display_order: b.displayOrder,
        is_active: b.isActive,
        starts_at: toSqlDate(b.startsAt),
        ends_at: toSqlDate(b.endsAt),
      };
      const entries = Object.entries(columns).filter(([, value]) => value !== undefined);
      const result = await execute(`UPDATE ecom_content_blocks SET ${entries.map(([column]) => `${column} = ?`).join(", ")} WHERE id = ?`, [...entries.map(([, value]) => value), request.params.id]);
      if (!result.affectedRows) throw new NotFoundError("Content block");
      await audit(request, "content.update", "content_block", request.params.id, { fields: Object.keys(b) });
      return dbOk(toBlock((await queryOne("SELECT * FROM ecom_content_blocks WHERE id = ?", [request.params.id]))!), { persisted: true });
    },
  );

  app.delete<{ Params: NumericIdParams }>("/content/:id", { preValidation: requireAdmin("content.manage"), schema: numericIdParams }, async (request) => {
    const result = await execute("DELETE FROM ecom_content_blocks WHERE id = ?", [request.params.id]);
    if (!result.affectedRows) throw new NotFoundError("Content block");
    await audit(request, "content.delete", "content_block", request.params.id);
    return dbOk({ deleted: true }, { persisted: true });
  });

  app.get("/pages", { preValidation: requireAdmin("content.manage") }, async () => {
    const rows = await query("SELECT p.*, a.name AS updated_by_name FROM ecom_pages p LEFT JOIN admins a ON a.id = p.updated_by ORDER BY p.title");
    return dbOk(
      rows.map((row) => ({
        id: Number(row.id),
        slug: row.slug,
        title: row.title,
        body: row.body,
        seoTitle: row.seo_title,
        seoDescription: row.seo_description,
        isPublished: Boolean(row.is_published),
        updatedBy: row.updated_by_name,
        updatedAt: row.updated_at,
      })),
    );
  });

  const pageProperties = {
    slug: slugSchema,
    title: { type: "string", minLength: 2, maxLength: 200 },
    body: { type: "string", minLength: 1, maxLength: 100_000 },
    seoTitle: nullableText(160),
    seoDescription: nullableText(320),
    isPublished: { type: "boolean" },
  } as const;
  const { slug: _slug, ...pageUpdateProperties } = pageProperties;

  app.post<{ Body: { slug: string; title: string; body: string; seoTitle?: string | null; seoDescription?: string | null; isPublished?: boolean } }>(
    "/pages",
    { preValidation: requireAdmin("content.manage"), schema: { body: { type: "object", additionalProperties: false, required: ["slug", "title", "body"], properties: pageProperties } } },
    async (request, reply) => {
      const p = request.body;
      try {
        const result = await execute(
          "INSERT INTO ecom_pages (slug, title, body, seo_title, seo_description, is_published, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [p.slug, p.title, p.body, p.seoTitle ?? null, p.seoDescription ?? null, p.isPublished ?? false, request.ecomAdmin!.id],
        );
        await audit(request, "page.create", "page", result.insertId, { slug: p.slug });
      } catch (error) {
        if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new BusinessRuleError("A page with this slug already exists.");
        throw error;
      }
      reply.status(201);
      return dbOk({ slug: p.slug }, { persisted: true });
    },
  );

  app.patch<{ Params: NumericIdParams; Body: { title?: string; body?: string; seoTitle?: string | null; seoDescription?: string | null; isPublished?: boolean } }>(
    "/pages/:id",
    {
      preValidation: requireAdmin("content.manage"),
      schema: { ...numericIdParams, body: { type: "object", additionalProperties: false, minProperties: 1, properties: pageUpdateProperties } },
    },
    async (request) => {
      const p = request.body;
      const result = await execute(
        `UPDATE ecom_pages SET title = COALESCE(?, title), body = COALESCE(?, body), seo_title = IF(?, ?, seo_title), seo_description = IF(?, ?, seo_description),
                is_published = COALESCE(?, is_published), updated_by = ? WHERE id = ?`,
        [p.title ?? null, p.body ?? null, p.seoTitle !== undefined, p.seoTitle ?? null, p.seoDescription !== undefined, p.seoDescription ?? null, p.isPublished ?? null, request.ecomAdmin!.id, request.params.id],
      );
      if (!result.affectedRows) throw new NotFoundError("Page");
      await audit(request, "page.update", "page", request.params.id, { fields: Object.keys(p) });
      return dbOk({ id: request.params.id }, { persisted: true });
    },
  );

  app.get("/settings", { preValidation: requireAdmin("settings.manage") }, async () => dbOk(await getSettings()));

  app.patch<{ Params: { key: keyof StoreSettings }; Body: Record<string, unknown> }>(
    "/settings/:key",
    {
      preValidation: requireAdmin("settings.manage"),
      schema: {
        params: { type: "object", required: ["key"], properties: { key: { type: "string", enum: ["store", "shipping", "checkout", "returns", "social"] } } },
        body: settingsBodySchema,
      },
    },
    async (request) => {
      const allowed = settingsShapes[request.params.key];
      const patch = Object.fromEntries(Object.entries(request.body).filter(([key]) => key in allowed));
      for (const [key, value] of Object.entries(patch)) {
        if (typeof value !== allowed[key]) throw new BusinessRuleError(`Setting ${key} must be a ${allowed[key]}.`);
      }
      const updated = await updateSettings(request.params.key, patch);
      await audit(request, "settings.update", "settings", request.params.key, patch);
      return dbOk(updated, { persisted: true });
    },
  );

  app.post<{ Body: { fileName: string; contentType: string; dataBase64: string } }>(
    "/uploads",
    {
      preValidation: [rateLimit("upload", 60, 600_000), requireAdmin()],
      // 5 MB image ≈ 6.7 MB base64 — this route alone allows a larger JSON body.
      bodyLimit: 7 * 1024 * 1024,
      schema: {
        body: {
          type: "object",
          required: ["fileName", "contentType", "dataBase64"],
          additionalProperties: false,
          properties: {
            fileName: { type: "string", minLength: 1, maxLength: 200 },
            contentType: { type: "string", enum: Object.keys(IMAGE_TYPES) },
            dataBase64: { type: "string", minLength: 10, maxLength: 7 * 1024 * 1024 },
          },
        },
      },
    },
    async (request, reply) => {
      const admin = request.ecomAdmin!;
      if (!["products.manage", "categories.manage", "content.manage"].some((permission) => admin.permissions.includes(permission as never))) {
        throw new BusinessRuleError("You do not have permission to upload images.");
      }
      const type = IMAGE_TYPES[request.body.contentType];
      const buffer = Buffer.from(request.body.dataBase64, "base64");
      if (buffer.length === 0 || buffer.length > ecomConfig.maxUploadBytes) throw new BusinessRuleError("Images must be smaller than 5 MB.");
      // Trust the file's bytes, not the declared type or file name.
      if (!type.magic(buffer)) throw new BusinessRuleError("The file is not a valid JPEG, PNG or WebP image.");
      const name = `${randomBytes(16).toString("hex")}.${type.ext}`;
      await mkdir(ecomConfig.mediaDir, { recursive: true });
      await writeFile(path.join(ecomConfig.mediaDir, name), buffer, { flag: "wx" });
      await audit(request, "media.upload", "media", name, { originalName: request.body.fileName.slice(0, 100), bytes: buffer.length });
      reply.status(201);
      return dbOk({ url: `${ecomConfig.mediaBaseUrl}/${name}`, bytes: buffer.length }, { persisted: true });
    },
  );
};

const settingsShapes: Record<keyof StoreSettings, Record<string, "string" | "number" | "boolean" | "object">> = {
  store: { name: "string", supportEmail: "string", supportPhone: "string", gstin: "string", legalName: "string", address: "string" },
  shipping: { flatFee: "number", freeShippingThreshold: "number", serviceablePincodePrefixes: "object", estimatedDays: "string" },
  checkout: { guestCheckout: "boolean", codEnabled: "boolean", codMaxOrderValue: "number", reservationMinutes: "number" },
  returns: { returnWindowDays: "number", cancellableStatuses: "object" },
  social: { facebook: "string", instagram: "string", linkedin: "string", youtube: "string" },
};

const settingsBodySchema = {
  type: "object",
  minProperties: 1,
  maxProperties: 10,
  properties: {
    flatFee: { type: "number", minimum: 0, maximum: 100000 },
    freeShippingThreshold: { type: "number", minimum: 0, maximum: 100_000_000 },
    serviceablePincodePrefixes: { type: "array", maxItems: 500, items: { type: "string", pattern: "^[1-9][0-9]{0,5}$" } },
    estimatedDays: { type: "string", maxLength: 100 },
    guestCheckout: { type: "boolean" },
    codEnabled: { type: "boolean" },
    codMaxOrderValue: { type: "number", minimum: 0 },
    reservationMinutes: { type: "integer", minimum: 5, maximum: 1440 },
    returnWindowDays: { type: "integer", minimum: 0, maximum: 365 },
    cancellableStatuses: { type: "array", items: { type: "string", enum: ["pending_payment", "confirmed", "processing", "packed"] } },
    name: { type: "string", maxLength: 150 },
    supportEmail: { anyOf: [{ type: "string", format: "email" }, { type: "string", maxLength: 0 }] },
    supportPhone: { type: "string", maxLength: 30 },
    gstin: { anyOf: [{ type: "string", pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$" }, { type: "string", maxLength: 0 }] },
    legalName: { type: "string", maxLength: 200 },
    address: { type: "string", maxLength: 500 },
    facebook: { anyOf: [{ type: "string", pattern: "^https://" }, { type: "string", maxLength: 0 }] },
    instagram: { anyOf: [{ type: "string", pattern: "^https://" }, { type: "string", maxLength: 0 }] },
    linkedin: { anyOf: [{ type: "string", pattern: "^https://" }, { type: "string", maxLength: 0 }] },
    youtube: { anyOf: [{ type: "string", pattern: "^https://" }, { type: "string", maxLength: 0 }] },
  },
} as const;

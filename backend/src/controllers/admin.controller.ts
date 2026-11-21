import type { FastifyRequest, FastifyReply } from "fastify";
import type { IdParams } from "../schemas/common.schema.js";
import type { ListCustomersQuery, ListWarrantiesQuery, RemarkBody, UpdateWarrantyStatusBody } from "../schemas/admin.schema.js";
import { adminService } from "../services/admin.service.js";
import { productService, type CreateProductInput, type UpdateProductInput } from "../services/product.service.js";
import { ok, fail } from "../utils/api-response.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { serialNumberService } from "../services/serial-number.service.js";
async function parseProductForm(request: FastifyRequest) {
  const fields: Record<string, string> = {};
  let imageUrl: string | undefined;

  const uploadDir = path.resolve(process.cwd(), "uploads", "products");

  await mkdir(uploadDir, { recursive: true });

  const allowedTypes: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  for await (const part of request.parts()) {
    if (part.type === "file") {
      if (part.fieldname !== "image") {
        part.file.resume();
        continue;
      }

      const extension = allowedTypes[part.mimetype];

      if (!extension) {
        throw new Error("Only JPG, PNG and WEBP images are allowed.");
      }

      const buffer = await part.toBuffer();
      const filename = `${randomUUID()}${extension}`;

      await writeFile(
        path.join(uploadDir, filename),
        buffer
      );

      imageUrl = `/uploads/products/${filename}`;
    } else {
      fields[part.fieldname] = String(part.value);
    }
  }

  return { fields, imageUrl };
}
export const adminController = {
  async dashboard() {
    return ok(await adminService.getDashboard());
  },

  async analytics() {
    return ok(await adminService.getAnalytics());
  },
    // Serial Number Audit
  async listSerialNumbers(
    request: FastifyRequest<{
      Querystring: {
        search?: string;
        model?: string;
        productionMonth?: string;
      };
    }>
  ) {
    const serialNumbers = await serialNumberService.list(
      request.query
    );

    return ok(serialNumbers);
  },
async createSerialNumber(
  request: FastifyRequest<{
    Body: {
      productId: number;
      serialNumber: string;
      batchNumber: string;
      productionMonth: string;
      qrCode?: string;
    };
  }>
) {
  const result = await serialNumberService.create({
    productId: Number(request.body.productId),
    serialNumber: request.body.serialNumber.trim(),
    batchNumber: request.body.batchNumber.trim(),
    productionMonth: request.body.productionMonth,
    qrCode: request.body.qrCode?.trim() || undefined,
    createdBy: request.principal?.id
      ? Number(request.principal.id)
      : null,
  });

  return ok(result);
},
async bulkImportSerialNumbers(
  request: FastifyRequest<{
    Body: {
      items: Array<{
        productId?: number;
        productModel?: string;
        serialNumber: string;
        batchNumber: string;
        productionMonth: string;
        qrCode?: string;
      }>;
    };
  }>,
  reply: FastifyReply
) {
  const items = request.body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return reply.status(400).send(fail("INVALID_INPUT", "Please provide a valid array of items to import."));
  }

  const result = await serialNumberService.bulkImport(
    items,
    request.principal?.id ? Number(request.principal.id) : null
  );

  return ok(result);
},
  async serialNumberStats() {
    const stats = await serialNumberService.getStats();

    return ok(stats);
  },
  async listUsers(
    request: FastifyRequest<{
      Querystring: { q?: string; role?: string; status?: string; page?: number; limit?: number };
    }>,
  ) {
    const { items, meta } = await adminService.listUsers(request.query);
    return ok(items, meta);
  },

  async updateUserStatus(
    request: FastifyRequest<{ Params: IdParams; Body: { status: "active" | "inactive" } }>,
  ) {
    const result = await adminService.updateUserStatus(request.params.id, request.body.status);
    return ok(result);
  },

  async listCustomers(request: FastifyRequest<{ Querystring: ListCustomersQuery }>) {
    const customers = await adminService.listCustomers(request.query);
    return ok(customers);
  },

  async getCustomer(request: FastifyRequest<{ Params: IdParams }>) {
    return ok(await adminService.getCustomer(request.params.id));
  },

  async listWarranties(request: FastifyRequest<{ Querystring: ListWarrantiesQuery }>) {
    const { items, meta } = await adminService.listWarranties(request.query);
    return ok(items, meta);
  },

  async getWarranty(request: FastifyRequest<{ Params: IdParams }>) {
    return ok(await adminService.getWarranty(request.params.id));
  },

  async approveWarranty(request: FastifyRequest<{ Params: IdParams; Body: RemarkBody }>) {
    const remark = request.body?.remark?.trim() || undefined;
    const adminId = request.principal?.id || 1;
    return ok(await adminService.approveWarranty(request.params.id, adminId, remark));
  },

  async rejectWarranty(request: FastifyRequest<{ Params: IdParams; Body: Required<RemarkBody> }>) {
    const adminId = request.principal?.id || 1;
    return ok(await adminService.rejectWarranty(request.params.id, adminId, request.body.remark?.trim() || "Rejected"));
  },

  async updateWarrantyStatus(request: FastifyRequest<{ Params: IdParams; Body: UpdateWarrantyStatusBody }>) {
    const { status, remark } = request.body;
    const adminId = request.principal?.id || 1;
    return ok(await adminService.updateWarrantyStatus(request.params.id, adminId, status, remark?.trim()));
  },

  // Product Master routes under /api/admin/products
  async listProducts(request: FastifyRequest<{ Querystring: { q?: string; category?: string } }>) {
    const products = await productService.listAllForAdmin(request.query);
    return ok(products);
  },

  async getProduct(request: FastifyRequest<{ Params: IdParams }>) {
    return ok(await productService.getById(request.params.id));
  },

 async createProduct(request: FastifyRequest) {
  const { fields, imageUrl } = await parseProductForm(request);

  const product: CreateProductInput = {
    name: fields.name || "",
    modelNumber: fields.modelNumber || "",
    category: fields.category || "",
    warrantyMonths: Number(fields.warrantyMonths || 12),
    priceInr: Number(fields.priceInr || 0),
    shortDescription: fields.shortDescription || "",
    description: fields.description || "",
    isActive: fields.isActive !== "false",
    imageUrl,
  };

  return ok(await productService.create(product));
},

async updateProduct(request: FastifyRequest<{ Params: IdParams }>) {
  const fields: Record<string, string> = {};
  let imageUrl: string | undefined;

  for await (const part of request.parts()) {
    if (part.type === "file") {
      if (part.fieldname === "image" && part.filename) {
        const allowedTypes: Record<string, string> = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
          "image/gif": ".gif",
        };

        const extension = allowedTypes[part.mimetype];

        if (!extension) {
          throw new Error("Unsupported image format.");
        }

        const uploadDir = path.join(process.cwd(), "uploads", "products");

        await mkdir(uploadDir, { recursive: true });

        const filename = `${randomUUID()}${extension}`;
        const buffer = await part.toBuffer();

        await writeFile(path.join(uploadDir, filename), buffer);

        imageUrl = `/uploads/products/${filename}`;
      } else {
        await part.toBuffer();
      }
    } else {
      fields[part.fieldname] = String(part.value);
    }
  }

  const updateInput: UpdateProductInput = {
    ...(fields.name !== undefined && { name: fields.name }),
    ...(fields.modelNumber !== undefined && { modelNumber: fields.modelNumber }),
    ...(fields.category !== undefined && { category: fields.category }),
    ...(fields.warrantyMonths !== undefined && {
      warrantyMonths: Number(fields.warrantyMonths),
    }),
    ...(fields.priceInr !== undefined && {
      priceInr: Number(fields.priceInr),
    }),
    ...(fields.shortDescription !== undefined && {
      shortDescription: fields.shortDescription,
    }),
    ...(fields.description !== undefined && {
      description: fields.description,
    }),
    ...(fields.isActive !== undefined && {
      isActive: fields.isActive === "true",
    }),
    ...(imageUrl && { imageUrl }),
  };

   return ok(
    await productService.update(request.params.id, updateInput)
  );
},

// Delete Product
async deleteProduct(
  request: FastifyRequest<{ Params: IdParams }>
) {
  return ok(
    await productService.delete(request.params.id)
  );
},

};

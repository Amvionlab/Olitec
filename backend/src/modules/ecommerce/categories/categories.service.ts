import type { FastifyRequest } from "fastify";
import { execute, query, queryOne } from "../../../db/pool.js";
import { BusinessRuleError, ConflictError, NotFoundError } from "../../../utils/errors.js";
import { audit } from "../shared/audit.js";
import { slugify } from "../shared/http.js";

interface CategoryRow {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: number;
  seo_title: string | null;
  seo_description: string | null;
  product_count: number;
}

export interface CategoryInput {
  parentId?: number | null;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CategoryNode {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
  children: CategoryNode[];
}

// The category tree is small and read on almost every page, so it is cached per process and cleared on writes.
let cache: { rows: CategoryRow[]; at: number } | undefined;

async function allRows(): Promise<CategoryRow[]> {
  if (cache && Date.now() - cache.at < 30_000) return cache.rows;
  const rows = await query<CategoryRow>(
    `SELECT c.*, (SELECT COUNT(*) FROM ecom_products p WHERE p.category_id = c.id AND p.status = 'active' AND p.variant_of_id IS NULL) AS product_count
       FROM ecom_categories c ORDER BY c.display_order, c.name`,
  );
  cache = { rows, at: Date.now() };
  return rows;
}

function toNode(row: CategoryRow): CategoryNode {
  return {
    id: Number(row.id),
    parentId: row.parent_id ? Number(row.parent_id) : null,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    displayOrder: row.display_order,
    isActive: Boolean(row.is_active),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    productCount: Number(row.product_count),
    children: [],
  };
}

function buildTree(rows: CategoryRow[], activeOnly: boolean): CategoryNode[] {
  const nodes = new Map(rows.filter((row) => !activeOnly || row.is_active).map((row) => [Number(row.id), toNode(row)]));
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else if (!node.parentId) roots.push(node);
    // Children of an inactive parent are hidden from the public tree.
  }
  // Public counts include products in subcategories.
  const total = (node: CategoryNode): number => {
    node.productCount += node.children.reduce((sum, child) => sum + total(child), 0);
    return node.productCount;
  };
  roots.forEach(total);
  return roots;
}

function descendants(rows: CategoryRow[], rootId: number): number[] {
  const ids = [rootId];
  for (let index = 0; index < ids.length; index += 1) {
    for (const row of rows) if (Number(row.parent_id) === ids[index] && row.is_active) ids.push(Number(row.id));
  }
  return ids;
}

export const categoryService = {
  clearCache() {
    cache = undefined;
  },

  async tree(activeOnly = true) {
    return buildTree(await allRows(), activeOnly);
  },

  async getBySlug(slug: string) {
    const rows = await allRows();
    const row = rows.find((candidate) => candidate.slug === slug && candidate.is_active);
    if (!row) throw new NotFoundError("Category");
    const node = buildTree(rows, true);
    const find = (list: CategoryNode[]): CategoryNode | undefined => {
      for (const item of list) {
        if (item.id === Number(row.id)) return item;
        const match = find(item.children);
        if (match) return match;
      }
      return undefined;
    };
    return { ...(find(node) ?? toNode(row)), breadcrumbs: await this.breadcrumbs(Number(row.id)) };
  },

  /** Ids of an active category and all its active descendants; undefined when the slug is unknown. */
  async descendantIdsBySlug(slug: string): Promise<number[] | undefined> {
    const rows = await allRows();
    const row = rows.find((candidate) => candidate.slug === slug && candidate.is_active);
    return row ? descendants(rows, Number(row.id)) : undefined;
  },

  async breadcrumbs(categoryId: number) {
    const rows = await allRows();
    const trail: { name: string; slug: string }[] = [];
    let current = rows.find((row) => Number(row.id) === categoryId);
    for (let guard = 0; current && guard < 10; guard += 1) {
      trail.unshift({ name: current.name, slug: current.slug });
      const parentId = current.parent_id;
      current = parentId ? rows.find((row) => Number(row.id) === Number(parentId)) : undefined;
    }
    return trail;
  },

  async adminList() {
    return (await allRows()).map(toNode);
  },

  async create(request: FastifyRequest, input: CategoryInput) {
    await assertParent(null, input.parentId);
    try {
      const result = await execute(
        `INSERT INTO ecom_categories (parent_id, name, slug, description, image_url, display_order, is_active, seo_title, seo_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.parentId ?? null, input.name, input.slug ?? slugify(input.name), input.description ?? null, input.imageUrl || null,
          input.displayOrder ?? 0, input.isActive ?? true, input.seoTitle ?? null, input.seoDescription ?? null,
        ],
      );
      this.clearCache();
      await audit(request, "category.create", "category", result.insertId, { name: input.name });
      return (await this.adminList()).find((category) => category.id === result.insertId);
    } catch (error) {
      rethrowDuplicate(error);
    }
  },

  async update(request: FastifyRequest, id: number, input: Partial<CategoryInput>) {
    if (!(await queryOne("SELECT id FROM ecom_categories WHERE id = ?", [id]))) throw new NotFoundError("Category");
    if (input.parentId !== undefined) await assertParent(id, input.parentId);
    const columns: Record<string, unknown> = {
      parent_id: input.parentId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      image_url: input.imageUrl === "" ? null : input.imageUrl,
      display_order: input.displayOrder,
      is_active: input.isActive,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
    };
    const entries = Object.entries(columns).filter(([, value]) => value !== undefined);
    try {
      if (entries.length) {
        await execute(`UPDATE ecom_categories SET ${entries.map(([column]) => `${column} = ?`).join(", ")} WHERE id = ?`, [...entries.map(([, value]) => value), id]);
      }
    } catch (error) {
      rethrowDuplicate(error);
    }
    this.clearCache();
    await audit(request, "category.update", "category", id, { fields: Object.keys(input) });
    return (await this.adminList()).find((category) => category.id === id);
  },

  /** Saves a new display order for sibling categories in one go (drag-to-reorder in the admin). */
  async reorder(request: FastifyRequest, order: { id: number; displayOrder: number }[]) {
    for (const item of order) await execute("UPDATE ecom_categories SET display_order = ? WHERE id = ?", [item.displayOrder, item.id]);
    this.clearCache();
    await audit(request, "category.reorder", "category", null, { count: order.length });
    return this.adminList();
  },

  async remove(request: FastifyRequest, id: number) {
    const usage = await queryOne<{ products: number; children: number }>(
      `SELECT (SELECT COUNT(*) FROM ecom_products WHERE category_id = ?) AS products,
              (SELECT COUNT(*) FROM ecom_categories WHERE parent_id = ?) AS children`,
      [id, id],
    );
    if (Number(usage?.products) > 0) throw new BusinessRuleError("This category has products. Move them or deactivate the category instead.");
    if (Number(usage?.children) > 0) throw new BusinessRuleError("This category has subcategories. Delete or move them first.");
    const result = await execute("DELETE FROM ecom_categories WHERE id = ?", [id]);
    if (!result.affectedRows) throw new NotFoundError("Category");
    this.clearCache();
    await audit(request, "category.delete", "category", id);
  },
};

async function assertParent(id: number | null, parentId: number | null | undefined) {
  if (!parentId) return;
  const rows = await allRows();
  if (!rows.some((row) => Number(row.id) === parentId)) throw new BusinessRuleError("The parent category does not exist.");
  if (id !== null && descendantsAll(rows, id).includes(parentId)) throw new BusinessRuleError("A category cannot be moved inside itself or its subcategories.");
}

function descendantsAll(rows: CategoryRow[], rootId: number): number[] {
  const ids = [rootId];
  for (let index = 0; index < ids.length; index += 1) {
    for (const row of rows) if (Number(row.parent_id) === ids[index]) ids.push(Number(row.id));
  }
  return ids;
}

function rethrowDuplicate(error: unknown): never {
  if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new ConflictError("A category with this slug already exists.");
  throw error;
}

import type { ResponseMeta } from "./api-response.js";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export function paginate<T>(items: T[], query: PaginationQuery): { items: T[]; meta: Pick<ResponseMeta, "page" | "pageSize" | "total" | "pageCount"> } {
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(query.page ?? 1, pageCount);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    meta: { page, pageSize, total: items.length, pageCount },
  };
}

import type { Paginated } from "@/lib/types";

export const PAGE_SIZE = 10;

export function paginate<T>(items: T[], requestedPage = 1, pageSize = PAGE_SIZE): Paginated<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, Math.floor(requestedPage) || 1), pageCount);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
    pageCount,
  };
}

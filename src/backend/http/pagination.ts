export interface PaginationParams {
  limit: number;
  offset: number;
  page: number;
  pageSize: number;
}

/**
 * Pagination helper – parses `page` and `pageSize` (or `page_size`) query parameters.
 * Enforces valid positive page and pageSize between 1 and 100.
 */
export function parsePagination(query: Record<string, string | string[] | undefined>): PaginationParams {
  const pageRaw = query.page;
  const pageSizeRaw = query.pageSize ?? query.page_size;

  const pageNum = Number(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw);
  const pageSizeNum = Number(Array.isArray(pageSizeRaw) ? pageSizeRaw[0] : pageSizeRaw);

  const page = Number.isFinite(pageNum) && pageNum >= 1 ? Math.floor(pageNum) : 1;
  const rawPageSize = Number.isFinite(pageSizeNum) && pageSizeNum >= 1 ? Math.floor(pageSizeNum) : 20;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);

  const limit = pageSize;
  const offset = (page - 1) * limit;

  return { limit, offset, page, pageSize };
}

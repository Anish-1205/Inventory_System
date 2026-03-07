export interface PaginationParams {
  page: number;
  limit: number;
}

export function parsePagination(query: { page?: unknown; limit?: unknown }): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
}

export function paginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

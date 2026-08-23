import type { IPaginationParams, IPaginatedResult } from '@domain/types';

export function buildPaginatedResult<T>(
  data: T[],
  count: number | null,
  params?: IPaginationParams,
): IPaginatedResult<T> {
  const perPage = params?.perPage ?? 50;
  const page = params?.page ?? 1;
  const total = count ?? data.length;
  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

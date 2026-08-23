import { describe, it, expect } from 'vitest';
import { buildPaginatedResult } from '@infra/adapters/pagination.helper';

describe('buildPaginatedResult', () => {
  it('returns correct structure with explicit params', () => {
    const data = ['a', 'b', 'c'];
    const result = buildPaginatedResult(data, 10, { page: 1, perPage: 3 });

    expect(result.data).toEqual(['a', 'b', 'c']);
    expect(result.total).toBe(10);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(3);
    expect(result.totalPages).toBe(4); // ceil(10/3)
  });

  it('uses data.length as total when count is null', () => {
    const data = [1, 2, 3];
    const result = buildPaginatedResult(data, null, { page: 1, perPage: 10 });

    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(1);
  });

  it('defaults to page=1 and perPage=50 when params are undefined', () => {
    const data = ['x'];
    const result = buildPaginatedResult(data, 1, undefined);

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(50);
  });

  it('computes totalPages as ceil(total / perPage)', () => {
    const result = buildPaginatedResult([], 101, { page: 1, perPage: 50 });
    expect(result.totalPages).toBe(3); // ceil(101/50)
  });

  it('returns totalPages=0 for empty dataset with count=0', () => {
    const result = buildPaginatedResult([], 0, { page: 1, perPage: 10 });
    expect(result.totalPages).toBe(0); // ceil(0/10)
  });

  it('returns totalPages=1 when total equals perPage exactly', () => {
    const data = [1, 2, 3, 4, 5];
    const result = buildPaginatedResult(data, 5, { page: 1, perPage: 5 });
    expect(result.totalPages).toBe(1);
  });

  it('preserves provided page number', () => {
    const result = buildPaginatedResult([], 100, { page: 5, perPage: 10 });
    expect(result.page).toBe(5);
  });

  it('works with empty data array', () => {
    const result = buildPaginatedResult([], null, undefined);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});

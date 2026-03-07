import { describe, it, expect } from 'vitest';
import { parsePagination, paginationOffset } from '../../lib/pagination.js';

describe('parsePagination', () => {
  it('returns defaults when no query params are provided', () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('parses valid page and limit values', () => {
    const result = parsePagination({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('clamps page to a minimum of 1', () => {
    expect(parsePagination({ page: '0' }).page).toBe(1);
    expect(parsePagination({ page: '-5' }).page).toBe(1);
  });

  it('clamps limit to a minimum of 1 for negative values', () => {
    // Negative numbers are parsed by Number() and then clamped by Math.max(1, ...)
    expect(parsePagination({ limit: '-10' }).limit).toBe(1);
    expect(parsePagination({ limit: '-1' }).limit).toBe(1);
  });

  it('falls back to default limit of 20 when limit is 0 (falsy)', () => {
    // Number('0') === 0 is falsy, so "|| 20" default applies
    expect(parsePagination({ limit: '0' }).limit).toBe(20);
  });

  it('clamps limit to a maximum of 100', () => {
    expect(parsePagination({ limit: '200' }).limit).toBe(100);
    expect(parsePagination({ limit: '101' }).limit).toBe(100);
  });

  it('falls back to defaults for non-numeric strings', () => {
    const result = parsePagination({ page: 'abc', limit: 'xyz' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('falls back to defaults for undefined values', () => {
    const result = parsePagination({ page: undefined, limit: undefined });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('handles numeric values directly', () => {
    const result = parsePagination({ page: 5, limit: 10 });
    expect(result.page).toBe(5);
    expect(result.limit).toBe(10);
  });
});

describe('paginationOffset', () => {
  it('returns 0 for the first page', () => {
    expect(paginationOffset(1, 20)).toBe(0);
  });

  it('calculates the correct offset for page 2', () => {
    expect(paginationOffset(2, 20)).toBe(20);
  });

  it('calculates the correct offset for page 3 with limit 10', () => {
    expect(paginationOffset(3, 10)).toBe(20);
  });

  it('calculates offset for large page numbers', () => {
    expect(paginationOffset(10, 50)).toBe(450);
  });

  it('calculates offset for limit of 1', () => {
    expect(paginationOffset(5, 1)).toBe(4);
  });
});

/**
 * useDeleteCentro.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockDeactivate = vi.fn();

vi.mock('@infra/adapters/SupabaseCentroAdapter', () => ({
  SupabaseCentroAdapter: class {
    deactivate(...args: unknown[]) {
      return mockDeactivate(...args);
    }
    findAll() {
      return Promise.resolve({ data: [], total: 0, page: 1, perPage: 50, totalPages: 1 });
    }
    findById() {
      return Promise.resolve(null);
    }
    findActivos() {
      return Promise.resolve([]);
    }
    create() {
      return Promise.resolve(null);
    }
    update() {
      return Promise.resolve(null);
    }
  },
}));

import { useDeleteCentro } from './useDeleteCentro';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useDeleteCentro — mutation function', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls adapter.deactivate with the centro id', async () => {
    mockDeactivate.mockResolvedValue(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteCentro(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(42);
    });

    expect(mockDeactivate).toHaveBeenCalledWith(42);
  });

  it('exposes isError when deactivate throws', async () => {
    mockDeactivate.mockRejectedValue(new Error('deactivate failed'));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteCentro(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useDeleteCentro — cache invalidation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalidates ["centros-page", "centros"] on success', async () => {
    mockDeactivate.mockResolvedValue(undefined);
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(['centros-page', 'centros'], []);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteCentro(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['centros-page', 'centros'] }),
      );
    });
  });
});

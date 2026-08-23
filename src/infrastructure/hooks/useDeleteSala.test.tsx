/**
 * useDeleteSala.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockDeactivate = vi.fn();

vi.mock('@infra/adapters/SupabaseSalaAdapter', () => ({
  SupabaseSalaAdapter: class {
    deactivate(...args: unknown[]) {
      return mockDeactivate(...args);
    }
    findById() {
      return Promise.resolve(null);
    }
    findByCentro() {
      return Promise.resolve([]);
    }
    findActivasByCentro() {
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

import { useDeleteSala } from './useDeleteSala';

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

describe('useDeleteSala — mutation function', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls adapter.deactivate with the sala id', async () => {
    mockDeactivate.mockResolvedValue(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteSala(5), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(20);
    });

    expect(mockDeactivate).toHaveBeenCalledWith(20);
  });

  it('exposes isError when deactivate throws', async () => {
    mockDeactivate.mockRejectedValue(new Error('deactivate sala failed'));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteSala(5), { wrapper: Wrapper });

    act(() => {
      result.current.mutate(20);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useDeleteSala — cache invalidation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalidates ["centro-detail", centroId, "salas"] on success', async () => {
    mockDeactivate.mockResolvedValue(undefined);
    const centroId = 5;
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(['centro-detail', centroId, 'salas'], []);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteSala(centroId), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(20);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['centro-detail', centroId, 'salas'] }),
      );
    });
  });

  it('uses the centroId argument provided to the hook', async () => {
    mockDeactivate.mockResolvedValue(undefined);
    const centroId = 77;
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteSala(centroId), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(20);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['centro-detail', 77, 'salas'] }),
      );
    });
  });
});

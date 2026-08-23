/**
 * useUpdateSala.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ISala } from '@domain/models';

const mockUpdate = vi.fn();

vi.mock('@infra/adapters/SupabaseSalaAdapter', () => ({
  SupabaseSalaAdapter: class {
    update(...args: unknown[]) {
      return mockUpdate(...args);
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
    deactivate() {
      return Promise.resolve(undefined);
    }
  },
}));

import { useUpdateSala } from './useUpdateSala';

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

const MOCK_SALA: ISala = {
  id: 10,
  centroId: 5,
  nombre: 'Updated Room',
  capacidad: 3,
  activa: true,
  descripcion: null,
};

describe('useUpdateSala — mutation function', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls adapter.update with id and dto', async () => {
    mockUpdate.mockResolvedValue(MOCK_SALA);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateSala(5), { wrapper: Wrapper });

    const dto = { nombre: 'Updated Room', capacidad: 3 };

    await act(async () => {
      await result.current.mutateAsync({ id: 10, dto });
    });

    expect(mockUpdate).toHaveBeenCalledWith(10, dto);
  });

  it('exposes isError when adapter throws', async () => {
    mockUpdate.mockRejectedValue(new Error('update sala failed'));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateSala(5), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ id: 10, dto: { nombre: 'Room' } });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useUpdateSala — cache invalidation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalidates ["centro-detail", centroId, "salas"] on success', async () => {
    mockUpdate.mockResolvedValue(MOCK_SALA);
    const centroId = 5;
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(['centro-detail', centroId, 'salas'], []);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateSala(centroId), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 10, dto: { nombre: 'Updated' } });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['centro-detail', centroId, 'salas'] }),
      );
    });
  });
});

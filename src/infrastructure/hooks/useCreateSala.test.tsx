/**
 * useCreateSala.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ISala } from '@domain/models';

const mockCreate = vi.fn();

vi.mock('@infra/adapters/SupabaseSalaAdapter', () => ({
  SupabaseSalaAdapter: class {
    create(...args: unknown[]) {
      return mockCreate(...args);
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
    update() {
      return Promise.resolve(null);
    }
    deactivate() {
      return Promise.resolve(undefined);
    }
  },
}));

import { useCreateSala } from './useCreateSala';

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
  nombre: 'Lotus Room',
  capacidad: 2,
  activa: true,
  descripcion: null,
};

describe('useCreateSala — mutation function', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls adapter.create with the provided DTO', async () => {
    mockCreate.mockResolvedValue(MOCK_SALA);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateSala(5), { wrapper: Wrapper });

    const dto = { centroId: 5, nombre: 'Lotus Room', capacidad: 2 };

    await act(async () => {
      await result.current.mutateAsync(dto);
    });

    expect(mockCreate).toHaveBeenCalledWith(dto);
  });

  it('exposes isError when adapter throws', async () => {
    mockCreate.mockRejectedValue(new Error('create sala failed'));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateSala(5), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ centroId: 5, nombre: 'Room', capacidad: 1 });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateSala — cache invalidation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalidates ["centro-detail", centroId, "salas"] on success', async () => {
    mockCreate.mockResolvedValue(MOCK_SALA);
    const centroId = 5;
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(['centro-detail', centroId, 'salas'], []);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSala(centroId), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ centroId, nombre: 'Room', capacidad: 1 });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['centro-detail', centroId, 'salas'] }),
      );
    });
  });

  it('uses the centroId argument provided to the hook for invalidation', async () => {
    mockCreate.mockResolvedValue(MOCK_SALA);
    const centroId = 99;
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSala(centroId), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ centroId, nombre: 'Room', capacidad: 1 });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['centro-detail', 99, 'salas'] }),
      );
    });
  });
});

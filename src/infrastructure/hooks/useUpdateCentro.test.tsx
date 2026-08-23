/**
 * useUpdateCentro.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ICentro } from '@domain/models';

const mockUpdate = vi.fn();

vi.mock('@infra/adapters/SupabaseCentroAdapter', () => ({
  SupabaseCentroAdapter: class {
    update(...args: unknown[]) {
      return mockUpdate(...args);
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
    deactivate() {
      return Promise.resolve(undefined);
    }
  },
}));

import { useUpdateCentro } from './useUpdateCentro';

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

const MOCK_CENTRO: ICentro = {
  id: 1,
  nombre: 'Updated Centro',
  direccion: 'Calle 2',
  ciudad: 'Madrid',
  codigoPostal: '28001',
  telefono: null,
  email: null,
  activo: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('useUpdateCentro — mutation function', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls adapter.update with the provided id and dto', async () => {
    mockUpdate.mockResolvedValue(MOCK_CENTRO);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCentro(), { wrapper: Wrapper });

    const dto = { nombre: 'Updated Centro', ciudad: 'Madrid' };

    await act(async () => {
      await result.current.mutateAsync({ id: 1, dto });
    });

    expect(mockUpdate).toHaveBeenCalledWith(1, dto);
  });

  it('exposes isError when adapter throws', async () => {
    mockUpdate.mockRejectedValue(new Error('update failed'));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCentro(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ id: 1, dto: { nombre: 'Test', ciudad: 'Madrid' } });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useUpdateCentro — cache invalidation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalidates ["centros-page", "centros"] on success', async () => {
    mockUpdate.mockResolvedValue(MOCK_CENTRO);
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(['centros-page', 'centros'], []);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCentro(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 1, dto: { nombre: 'Updated', ciudad: 'Madrid' } });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['centros-page', 'centros'] }),
      );
    });
  });
});

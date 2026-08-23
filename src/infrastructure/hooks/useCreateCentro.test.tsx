/**
 * useCreateCentro.test.ts
 *
 * Verifies that useCreateCentro calls the adapter and invalidates the correct
 * query key on success.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ICentro } from '@domain/models';

// ── Adapter mock ──────────────────────────────────────────────────────────────

const mockCreate = vi.fn();

vi.mock('@infra/adapters/SupabaseCentroAdapter', () => ({
  SupabaseCentroAdapter: class {
    create(...args: unknown[]) {
      return mockCreate(...args);
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
    update() {
      return Promise.resolve(null);
    }
    deactivate() {
      return Promise.resolve(undefined);
    }
  },
}));

import { useCreateCentro } from './useCreateCentro';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  nombre: 'New Centro',
  direccion: 'Calle 1',
  ciudad: 'Madrid',
  codigoPostal: '28001',
  telefono: null,
  email: null,
  activo: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useCreateCentro — mutation function', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls adapter.create with the provided DTO', async () => {
    mockCreate.mockResolvedValue(MOCK_CENTRO);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCentro(), { wrapper: Wrapper });

    const dto = {
      nombre: 'New Centro',
      direccion: 'Calle 1',
      ciudad: 'Madrid',
      codigoPostal: '28001',
    };

    await act(async () => {
      await result.current.mutateAsync(dto);
    });

    expect(mockCreate).toHaveBeenCalledWith(dto);
  });

  it('returns the created centro from the adapter', async () => {
    mockCreate.mockResolvedValue(MOCK_CENTRO);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCentro(), { wrapper: Wrapper });

    let created: ICentro | undefined;
    await act(async () => {
      created = await result.current.mutateAsync({
        nombre: 'New Centro',
        direccion: '',
        ciudad: 'Madrid',
        codigoPostal: '',
      });
    });

    expect(created?.id).toBe(1);
    expect(created?.nombre).toBe('New Centro');
  });

  it('exposes isError when adapter throws', async () => {
    mockCreate.mockRejectedValue(new Error('DB insert failed'));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCentro(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({
        nombre: 'Centro',
        direccion: '',
        ciudad: 'Madrid',
        codigoPostal: '',
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateCentro — cache invalidation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalidates the ["centros-page", "centros"] query key on success', async () => {
    mockCreate.mockResolvedValue(MOCK_CENTRO);
    const { queryClient, Wrapper } = createWrapper();

    // Plant a real query so we can observe invalidation
    queryClient.setQueryData(['centros-page', 'centros'], []);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCentro(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        nombre: 'Centro',
        direccion: '',
        ciudad: 'Madrid',
        codigoPostal: '',
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['centros-page', 'centros'] }),
      );
    });
  });
});

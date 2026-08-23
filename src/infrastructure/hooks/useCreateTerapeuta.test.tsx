/**
 * useCreateTerapeuta.test.tsx
 *
 * The create-terapeuta mutation orchestrates 4 steps across 3 adapters:
 *   1. resolve the selected role id (rolAdapter.findAll)
 *   2. create the usuario (usuarioAdapter.create)
 *   3. assign the role (rolAdapter.assignRolToUsuario)
 *   4. assign each centro (usuarioCentroAdapter.assign) — the principal centro
 *      is assigned with esPrincipal=true DIRECTLY (no separate setPrincipal call,
 *      avoiding the E19 partial-failure point).
 *
 * Spec mapping:
 *   - §7 / E19: principal threaded via assign(usuarioId, centroId, esPrincipal).
 *   - Recovered cache rule: the mutation hook OWNS invalidateQueries(['terapeutas']).
 *   - Partial-write granular errors (role / centro) are surfaced, not swallowed.
 *
 * Mock strategy: all three Supabase adapters class-mocked. We assert the hook's
 * orchestration + cache ownership, not Supabase.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ── Adapter mocks (must precede hook import) ─────────────────────────────────

const mockFindAll = vi.fn();
const mockCreate = vi.fn();
const mockFindByEmail = vi.fn();
const mockAssignRol = vi.fn();
const mockAssignCentro = vi.fn();
const mockSetPrincipal = vi.fn();

vi.mock('@infra/adapters/SupabaseUsuarioAdapter', () => ({
  SupabaseUsuarioAdapter: class {
    // UsuarioService.create calls findByEmail before create — must be stubbed.
    findByEmail = (...a: unknown[]): unknown => mockFindByEmail(...a);
    create = (...a: unknown[]): unknown => mockCreate(...a);
  },
}));

vi.mock('@infra/adapters/SupabaseRolAdapter', () => ({
  SupabaseRolAdapter: class {
    findAll = (...a: unknown[]): unknown => mockFindAll(...a);
    assignRolToUsuario = (...a: unknown[]): unknown => mockAssignRol(...a);
  },
}));

vi.mock('@infra/adapters/SupabaseUsuarioCentroAdapter', () => ({
  SupabaseUsuarioCentroAdapter: class {
    assign = (...a: unknown[]): unknown => mockAssignCentro(...a);
    setPrincipal = (...a: unknown[]): unknown => mockSetPrincipal(...a);
  },
}));

import { useCreateTerapeuta } from './useCreateTerapeuta';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ROLES = [
  { id: 1, nombre: 'masajista' },
  { id: 2, nombre: 'recepcionista' },
];

const CREATED_USUARIO = { id: 99, nombre: 'Ana' };

const BASE_INPUT = {
  nombre: 'Ana',
  apellidos: 'Pérez',
  email: 'ana@suksai.com',
  telefono: '+34 600 000 000',
  centroIds: [10, 20],
  principalCentroId: 20,
  rolNombre: 'masajista',
} as const;

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

beforeEach(() => {
  vi.clearAllMocks();
  mockFindAll.mockResolvedValue(ROLES);
  // UsuarioService.create calls findByEmail first — return null = no duplicate.
  mockFindByEmail.mockResolvedValue(null);
  mockCreate.mockResolvedValue(CREATED_USUARIO);
  mockAssignRol.mockResolvedValue(undefined);
  mockAssignCentro.mockResolvedValue(undefined);
  mockSetPrincipal.mockResolvedValue(undefined);
});

// ── Happy path orchestration ──────────────────────────────────────────────────

describe('useCreateTerapeuta — orchestration', () => {
  it('creates the usuario with nombre/apellidos/email/telefono', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(BASE_INPUT);
    });

    expect(mockCreate).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@suksai.com',
      telefono: '+34 600 000 000',
    });
  });

  it('resolves the role id and assigns it to the new usuario', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(BASE_INPUT);
    });

    // masajista → id 1; assigned to usuario 99
    expect(mockAssignRol).toHaveBeenCalledWith(99, 1);
  });

  it('defaults apellidos to empty string when omitted', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    const { apellidos: _drop, ...noApellidos } = BASE_INPUT;
    await act(async () => {
      await result.current.mutateAsync(noApellidos);
    });

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ apellidos: '' }));
  });
});

// ── Principal threading (E19) ──────────────────────────────────────────────────

describe('useCreateTerapeuta — principal via assign flag', () => {
  it('assigns the principal centro with esPrincipal=true and the others with false', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(BASE_INPUT); // principal = 20
    });

    expect(mockAssignCentro).toHaveBeenCalledWith(99, 10, false);
    expect(mockAssignCentro).toHaveBeenCalledWith(99, 20, true);
  });

  it('never calls setPrincipal (principal is set inline via assign)', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(BASE_INPUT);
    });

    expect(mockSetPrincipal).not.toHaveBeenCalled();
  });

  it('assigns all centros with esPrincipal=false when principalCentroId is null', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ...BASE_INPUT, principalCentroId: null });
    });

    expect(mockAssignCentro).toHaveBeenCalledWith(99, 10, false);
    expect(mockAssignCentro).toHaveBeenCalledWith(99, 20, false);
  });

  it('makes no centro assignments when centroIds is empty', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ...BASE_INPUT, centroIds: [], principalCentroId: null });
    });

    expect(mockAssignCentro).not.toHaveBeenCalled();
  });
});

// ── Failure paths ──────────────────────────────────────────────────────────────

describe('useCreateTerapeuta — failure paths', () => {
  it('throws when the selected role does not exist in the DB', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({ ...BASE_INPUT, rolNombre: 'ghost-role' }),
    ).rejects.toThrow(/no existe/i);

    // Usuario must not be created if the role can't be resolved.
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('surfaces a granular error when role assignment fails after usuario creation', async () => {
    mockAssignRol.mockRejectedValue(new Error('rls denied'));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync(BASE_INPUT)).rejects.toThrow(
      /no se pudo asignar el rol/i,
    );
  });

  it('aggregates centro-assignment errors instead of silently succeeding (E19)', async () => {
    mockAssignCentro.mockImplementation((_u: number, centroId: number) =>
      centroId === 20 ? Promise.reject(new Error('boom')) : Promise.resolve(undefined),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync(BASE_INPUT)).rejects.toThrow(/errores en centros/i);
  });

  it('exposes isError when the mutation rejects', async () => {
    mockCreate.mockRejectedValue(new Error('email in use'));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate(BASE_INPUT);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ── Cache ownership ─────────────────────────────────────────────────────────────

describe('useCreateTerapeuta — cache ownership', () => {
  it('invalidates ["terapeutas"] on success', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(BASE_INPUT);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['terapeutas'] }),
      );
    });
  });

  it('does NOT invalidate when the mutation fails', async () => {
    mockCreate.mockRejectedValue(new Error('fail'));
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateTerapeuta(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(BASE_INPUT).catch(() => undefined);
    });

    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['terapeutas'] }),
    );
  });
});

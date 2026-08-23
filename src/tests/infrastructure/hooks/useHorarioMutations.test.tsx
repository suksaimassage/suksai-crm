/**
 * useHorarioMutations.test.tsx
 *
 * Tests the three horario WRITE hooks (create / update / delete). Each hook
 * OWNS its cache invalidation (project rule: mutation hooks own invalidation;
 * page/component handlers must NOT refetch). We assert:
 *   - the correct adapter method is called with the mapped arguments
 *   - on success BOTH ['centro-horarios'] and ['terapeutas'] are invalidated
 *   - delete routes through deactivate (soft-delete — never a hard DELETE)
 *   - the error state surfaces when the adapter rejects (no invalidation)
 *
 * The ADAPTER is mocked — never Supabase, never the domain.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const create = vi.fn();
const update = vi.fn();
const deactivate = vi.fn();

vi.mock('@infra/adapters/SupabaseHorarioAdapter', () => ({
  // Real class so each hook's `new SupabaseHorarioAdapter()` is a valid construction;
  // prototype methods delegate to the shared spies (called through closure to avoid
  // the class-field TDZ collision with the same-named outer consts).
  SupabaseHorarioAdapter: class {
    create(...args: unknown[]): unknown {
      return create(...args);
    }
    update(...args: unknown[]): unknown {
      return update(...args);
    }
    deactivate(...args: unknown[]): unknown {
      return deactivate(...args);
    }
  },
}));

import { useCreateHorario } from '@infra/hooks/useCreateHorario';
import { useUpdateHorario } from '@infra/hooks/useUpdateHorario';
import { useDeleteHorario } from '@infra/hooks/useDeleteHorario';
import type { ICreateHorarioDTO, IHorarioTrabajo } from '@domain/models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHorario(overrides: Partial<IHorarioTrabajo> = {}): IHorarioTrabajo {
  return {
    id: 1,
    usuarioId: 1,
    centroId: 10,
    tipo: 'especifico',
    diaSemana: null,
    fecha: new Date(2026, 4, 14),
    horaInicio: '09:00',
    horaFin: '17:00',
    activo: true,
    ...overrides,
  };
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, invalidateSpy, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── useCreateHorario ────────────────────────────────────────────────────────

describe('useCreateHorario', () => {
  const dto: ICreateHorarioDTO = {
    usuarioId: 1,
    centroId: 10,
    tipo: 'especifico',
    fecha: new Date(2026, 4, 14),
    horaInicio: '10:00',
    horaFin: '12:00',
  };

  it('calls adapter.create with the DTO and resolves the created horario', async () => {
    create.mockResolvedValue(makeHorario());
    const { result } = renderHook(() => useCreateHorario(), { wrapper: setup().wrapper });

    act(() => {
      result.current.mutate(dto);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(create).toHaveBeenCalledWith(dto);
  });

  it('invalidates BOTH centro-horarios and terapeutas on success (cache ownership)', async () => {
    create.mockResolvedValue(makeHorario());
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useCreateHorario(), { wrapper });

    act(() => {
      result.current.mutate(dto);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['centro-horarios'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['terapeutas'] });
  });

  it('surfaces the error state and does NOT invalidate on adapter failure', async () => {
    create.mockRejectedValue(new Error('insert failed'));
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useCreateHorario(), { wrapper });

    act(() => {
      result.current.mutate(dto);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ── useUpdateHorario ────────────────────────────────────────────────────────

describe('useUpdateHorario', () => {
  it('calls adapter.update with id + patch and resolves', async () => {
    update.mockResolvedValue(makeHorario({ horaFin: '18:00' }));
    const { result } = renderHook(() => useUpdateHorario(), { wrapper: setup().wrapper });

    const input = {
      id: 42,
      data: { horaInicio: '10:00', horaFin: '18:00' },
    };
    act(() => {
      result.current.mutate(input);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(update).toHaveBeenCalledWith(42, { horaInicio: '10:00', horaFin: '18:00' });
  });

  it('invalidates BOTH centro-horarios and terapeutas on success', async () => {
    update.mockResolvedValue(makeHorario());
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useUpdateHorario(), { wrapper });

    act(() => {
      result.current.mutate({ id: 1, data: { horaFin: '18:00' } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['centro-horarios'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['terapeutas'] });
  });

  it('surfaces the error state on adapter failure', async () => {
    update.mockRejectedValue(new Error('update failed'));
    const { result } = renderHook(() => useUpdateHorario(), { wrapper: setup().wrapper });

    act(() => {
      result.current.mutate({ id: 1, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ── useDeleteHorario ────────────────────────────────────────────────────────

describe('useDeleteHorario', () => {
  it('routes deletion through adapter.deactivate (soft-delete, never hard DELETE)', async () => {
    deactivate.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteHorario(), { wrapper: setup().wrapper });

    act(() => {
      result.current.mutate(7);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(deactivate).toHaveBeenCalledWith(7);
  });

  it('invalidates BOTH centro-horarios and terapeutas on success', async () => {
    deactivate.mockResolvedValue(undefined);
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useDeleteHorario(), { wrapper });

    act(() => {
      result.current.mutate(7);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['centro-horarios'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['terapeutas'] });
  });

  it('surfaces the error state on adapter failure', async () => {
    deactivate.mockRejectedValue(new Error('deactivate failed'));
    const { result } = renderHook(() => useDeleteHorario(), { wrapper: setup().wrapper });

    act(() => {
      result.current.mutate(7);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

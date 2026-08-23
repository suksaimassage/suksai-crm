/**
 * useSalaDeletion.test.tsx
 *
 * Unit tests for the shared sala-delete orchestration hook. This is the DRY
 * artifact consumed by BOTH SalaModal and the CentrosPage sala-card menu
 * (DetailPanel). It composes:
 *   - useActiveCitasBySala.check  → the active-citas guard
 *   - useDeleteSala(centroId)     → the soft-delete mutation
 * and exposes a small state machine: requestDelete → (block guard | confirm)
 * → confirmDelete.
 *
 * Mock strategy: both dependency hooks are mocked at the module boundary. The
 * real orchestration logic runs unmodified. `isDeleting` is driven by a
 * mutable `mockIsPending` flag so we can assert the loading passthrough.
 *
 * Coverage intent: 100% of branches — count>0 (block), count===0 (confirm),
 * check throws (fail-open-to-confirm), confirmDelete with no pending id,
 * confirmDelete success, confirmDelete mutation rejection, and every close/reset.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TSalaId } from '@domain/types';

// ── Dependency mocks ──────────────────────────────────────────────────────────

const mockDeleteMutateAsync = vi.fn<(id: TSalaId) => Promise<void>>();
const mockCheck = vi.fn<(salaId: TSalaId) => Promise<number>>();
let mockIsPending = false;

vi.mock('@infra/hooks/useDeleteSala', () => ({
  useDeleteSala: () => ({
    mutateAsync: mockDeleteMutateAsync,
    get isPending() {
      return mockIsPending;
    },
  }),
}));

vi.mock('@infra/hooks/useActiveCitasBySala', () => ({
  useActiveCitasBySala: () => ({ check: mockCheck }),
}));

// ── Import after mocks ──────────────────────────────────────────────────────────

import { useSalaDeletion } from '@infra/hooks/useSalaDeletion';

const CENTRO_ID = 1;
const SALA_ID = 10 as TSalaId;

beforeEach(() => {
  vi.clearAllMocks();
  mockIsPending = false;
});

// ── Initial state ───────────────────────────────────────────────────────────────

describe('useSalaDeletion — initial state', () => {
  it('starts with all dialogs closed and not checking/deleting', () => {
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    expect(result.current.guardOpen).toBe(false);
    expect(result.current.confirmOpen).toBe(false);
    expect(result.current.isChecking).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.guardCount).toBe(0);
  });
});

// ── requestDelete — guard branching ──────────────────────────────────────────────

describe('useSalaDeletion — requestDelete', () => {
  it('opens the block guard with the count when active citas exist', async () => {
    mockCheck.mockResolvedValue(3);
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });

    expect(mockCheck).toHaveBeenCalledWith(SALA_ID);
    expect(result.current.guardOpen).toBe(true);
    expect(result.current.guardCount).toBe(3);
    expect(result.current.confirmOpen).toBe(false);
  });

  it('opens the confirmation dialog when there are zero active citas', async () => {
    mockCheck.mockResolvedValue(0);
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });

    expect(result.current.confirmOpen).toBe(true);
    expect(result.current.guardOpen).toBe(false);
  });

  it('fails open to the confirmation dialog when the guard check throws (Edge Case 2)', async () => {
    mockCheck.mockRejectedValue(new Error('network/RLS failure'));
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });

    // A transient count failure must NOT silently block deletion.
    expect(result.current.confirmOpen).toBe(true);
    expect(result.current.guardOpen).toBe(false);
  });

  it('clears isChecking after the guard check resolves', async () => {
    mockCheck.mockResolvedValue(0);
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });

    expect(result.current.isChecking).toBe(false);
  });
});

// ── confirmDelete ─────────────────────────────────────────────────────────────────

describe('useSalaDeletion — confirmDelete', () => {
  it('returns false and does not call the mutation when no sala is pending', async () => {
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.confirmDelete();
    });

    expect(outcome).toBe(false);
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('deletes the pending sala, returns true, and closes the confirm dialog on success', async () => {
    mockCheck.mockResolvedValue(0);
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.confirmDelete();
    });

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith(SALA_ID);
    expect(outcome).toBe(true);
    expect(result.current.confirmOpen).toBe(false);
  });

  it('returns false and keeps the confirm dialog open when the mutation rejects', async () => {
    mockCheck.mockResolvedValue(0);
    mockDeleteMutateAsync.mockRejectedValue(new Error('delete failed'));
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.confirmDelete();
    });

    expect(outcome).toBe(false);
    // Dialog stays open so the user can retry; caller surfaces the error toast.
    expect(result.current.confirmOpen).toBe(true);
  });

  it('does not re-delete when called a second time after a successful delete (id cleared)', async () => {
    mockCheck.mockResolvedValue(0);
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });
    await act(async () => {
      await result.current.confirmDelete();
    });
    // Second confirm without a new request → pendingSalaId is null again.
    let secondOutcome: boolean | undefined;
    await act(async () => {
      secondOutcome = await result.current.confirmDelete();
    });

    expect(secondOutcome).toBe(false);
    expect(mockDeleteMutateAsync).toHaveBeenCalledTimes(1);
  });
});

// ── isDeleting passthrough ────────────────────────────────────────────────────────

describe('useSalaDeletion — isDeleting', () => {
  it('reflects the delete mutation isPending flag', () => {
    mockIsPending = true;
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));
    expect(result.current.isDeleting).toBe(true);
  });
});

// ── close / cancel / reset ──────────────────────────────────────────────────────

describe('useSalaDeletion — closeGuard', () => {
  it('closes the block guard and clears the count', async () => {
    mockCheck.mockResolvedValue(5);
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });
    expect(result.current.guardOpen).toBe(true);

    act(() => {
      result.current.closeGuard();
    });

    expect(result.current.guardOpen).toBe(false);
    expect(result.current.guardCount).toBe(0);
  });

  it('after closeGuard a subsequent confirmDelete is a no-op (pending id cleared)', async () => {
    mockCheck.mockResolvedValue(5);
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });
    act(() => {
      result.current.closeGuard();
    });

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.confirmDelete();
    });
    expect(outcome).toBe(false);
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });
});

describe('useSalaDeletion — cancelConfirm', () => {
  it('closes the confirmation dialog and clears the pending sala', async () => {
    mockCheck.mockResolvedValue(0);
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });
    expect(result.current.confirmOpen).toBe(true);

    act(() => {
      result.current.cancelConfirm();
    });

    expect(result.current.confirmOpen).toBe(false);

    // pending id cleared → confirmDelete becomes a no-op
    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.confirmDelete();
    });
    expect(outcome).toBe(false);
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });
});

describe('useSalaDeletion — reset', () => {
  it('clears guard, confirm, count and pending state in one call', async () => {
    mockCheck.mockResolvedValue(2);
    const { result } = renderHook(() => useSalaDeletion(CENTRO_ID));

    await act(async () => {
      await result.current.requestDelete(SALA_ID);
    });
    expect(result.current.guardOpen).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.guardOpen).toBe(false);
    expect(result.current.confirmOpen).toBe(false);
    expect(result.current.guardCount).toBe(0);

    // pending id cleared by reset
    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.confirmDelete();
    });
    expect(outcome).toBe(false);
  });
});

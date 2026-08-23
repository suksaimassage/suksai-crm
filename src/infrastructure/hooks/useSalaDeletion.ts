import { useState } from 'react';
import { useDeleteSala } from '@infra/hooks/useDeleteSala';
import { useActiveCitasBySala } from '@infra/hooks/useActiveCitasBySala';
import type { TSalaId, TCentroId } from '@domain/types';

// ── Types ───────────────────────────────────────────────────────────────────

export interface IUseSalaDeletionResult {
  /** True while the active-citas guard check is in flight. */
  readonly isChecking: boolean;
  /** True when the block-guard dialog should be shown (active citas exist). */
  readonly guardOpen: boolean;
  /** Number of active citas found by the guard check (for the block dialog). */
  readonly guardCount: number;
  /** True when the destructive confirmation dialog should be shown. */
  readonly confirmOpen: boolean;
  /** True while the delete mutation is in flight. */
  readonly isDeleting: boolean;
  /**
   * Runs the active-citas guard for a sala. If citas exist, opens the block
   * dialog; otherwise opens the confirmation dialog. A failed check fails open
   * to the confirmation dialog (the delete is still RLS-protected server-side).
   */
  readonly requestDelete: (salaId: TSalaId) => Promise<void>;
  /**
   * Executes the delete for the previously requested sala. Resolves to true on
   * success so callers can run side effects (toast, close modal); false on
   * error or when no sala is pending.
   */
  readonly confirmDelete: () => Promise<boolean>;
  /** Closes the block-guard dialog. */
  readonly closeGuard: () => void;
  /** Closes the confirmation dialog without deleting. */
  readonly cancelConfirm: () => void;
  /** Resets all deletion state (call on host close). */
  readonly reset: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Encapsulates the sala delete flow shared by SalaModal and the sala-card
 * context menu: active-citas guard check, block dialog, destructive
 * confirmation dialog, and the delete mutation.
 *
 * Cache invalidation is owned by `useDeleteSala` — this hook never refetches.
 */
export function useSalaDeletion(centroId: TCentroId): IUseSalaDeletionResult {
  const [pendingSalaId, setPendingSalaId] = useState<TSalaId | null>(null);
  const [guardOpen, setGuardOpen] = useState(false);
  const [guardCount, setGuardCount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const deleteMutation = useDeleteSala(centroId);
  const { check } = useActiveCitasBySala();

  const requestDelete = async (salaId: TSalaId): Promise<void> => {
    setPendingSalaId(salaId);
    setIsChecking(true);
    try {
      const count = await check(salaId);
      if (count > 0) {
        setGuardCount(count);
        setGuardOpen(true);
      } else {
        setConfirmOpen(true);
      }
    } catch {
      // Fail open to confirmation — the delete remains RLS-protected.
      setConfirmOpen(true);
    } finally {
      setIsChecking(false);
    }
  };

  const confirmDelete = async (): Promise<boolean> => {
    if (pendingSalaId === null) return false;
    try {
      await deleteMutation.mutateAsync(pendingSalaId);
      setConfirmOpen(false);
      setPendingSalaId(null);
      return true;
    } catch {
      // Keep the confirmation dialog open so the user can retry; the caller
      // surfaces the error toast.
      return false;
    }
  };

  const closeGuard = (): void => {
    setGuardOpen(false);
    setGuardCount(0);
    setPendingSalaId(null);
  };

  const cancelConfirm = (): void => {
    setConfirmOpen(false);
    setPendingSalaId(null);
  };

  const reset = (): void => {
    setGuardOpen(false);
    setGuardCount(0);
    setConfirmOpen(false);
    setPendingSalaId(null);
  };

  return {
    isChecking,
    guardOpen,
    guardCount,
    confirmOpen,
    isDeleting: deleteMutation.isPending,
    requestDelete,
    confirmDelete,
    closeGuard,
    cancelConfirm,
    reset,
  };
}

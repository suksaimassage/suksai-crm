/**
 * useCreateCliente.ts — React Query mutation for creating a new client.
 *
 * On success invalidates the ['clientes'] query family — prefix matching covers
 * both ['clientes', 'list', ...] rows AND ['clientes', 'kpi'] in one call.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClienteAdapter } from '@infra/adapters/SupabaseClienteAdapter';
import type { ICreateClienteDTO } from '@domain/models';

// ── Adapter singleton ─────────────────────────────────────────────────────────

const adapter = new SupabaseClienteAdapter();

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCreateCliente() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICreateClienteDTO) => adapter.create(dto),
    onSuccess: () => {
      // ['clientes'] prefix invalidates both list rows and kpi simultaneously
      void qc.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

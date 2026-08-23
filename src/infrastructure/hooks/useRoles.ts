import { useQuery } from '@tanstack/react-query';
import { SupabaseRolAdapter } from '@infra/adapters/SupabaseRolAdapter';
import type { IRol } from '@domain/models';

const adapter = new SupabaseRolAdapter();

export const useRoles = (): ReturnType<typeof useQuery<readonly IRol[]>> => {
  return useQuery<readonly IRol[]>({
    queryKey: ['roles', 'assignable'],
    queryFn: () => adapter.findAssignables(),
    staleTime: 10 * 60 * 1000, // 10 min — roles rarely change
  });
};

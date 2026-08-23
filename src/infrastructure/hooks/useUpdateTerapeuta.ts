import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseUsuarioAdapter } from '@infra/adapters/SupabaseUsuarioAdapter';
import { SupabaseUsuarioCentroAdapter } from '@infra/adapters/SupabaseUsuarioCentroAdapter';
import { SupabaseRolAdapter } from '@infra/adapters/SupabaseRolAdapter';
import type { IUpdateUsuarioDTO } from '@domain/models';
import type { TUserId, TCentroId } from '@domain/types';

const usuarioAdapter = new SupabaseUsuarioAdapter();
const usuarioCentroAdapter = new SupabaseUsuarioCentroAdapter();
const rolAdapter = new SupabaseRolAdapter();

interface IUpdateTerapeutaInput {
  readonly id: TUserId;
  readonly dto: IUpdateUsuarioDTO;
  readonly centroIds: readonly TCentroId[];
  readonly previousCentroIds: readonly TCentroId[];
  readonly principalCentroId?: TCentroId | null;
  readonly rolNombre?: string;
}

export function useUpdateTerapeuta() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
      centroIds,
      previousCentroIds,
      principalCentroId,
      rolNombre,
    }: IUpdateTerapeutaInput) => {
      const usuario = await usuarioAdapter.update(id, dto);

      const toAdd = centroIds.filter((cid) => !previousCentroIds.includes(cid));
      const toRemove = previousCentroIds.filter((cid) => !centroIds.includes(cid));

      await Promise.all([
        ...toAdd.map((centroId) => usuarioCentroAdapter.assign(id, centroId)),
        ...toRemove.map((centroId) => usuarioCentroAdapter.unassign(id, centroId)),
      ]);

      if (principalCentroId !== null && principalCentroId !== undefined) {
        await usuarioCentroAdapter.setPrincipal(id, principalCentroId);
      }

      if (rolNombre !== undefined) {
        const allRoles = await rolAdapter.findAssignables();
        const newRol = allRoles.find((r) => r.nombre === rolNombre);
        if (newRol === undefined) throw new Error(`Rol '${rolNombre}' no encontrado`);
        await rolAdapter.updateNonSuperadminRolForUsuario(id, newRol.id);
      }

      return usuario;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['terapeutas'] });
    },
  });
}

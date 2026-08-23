import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseServicioAdapter } from '@infra/adapters/SupabaseServicioAdapter';
import type { IUpdateServicioDTO } from '@domain/models';
import type { TServicioId, TCentroId } from '@domain/types';

const adapter = new SupabaseServicioAdapter();

interface IUpdateServicioInput {
  readonly id: TServicioId;
  readonly dto: IUpdateServicioDTO;
  readonly centroIds: readonly TCentroId[];
  readonly previousCentroIds: readonly TCentroId[];
}

export function useUpdateServicio() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto, centroIds, previousCentroIds }: IUpdateServicioInput) => {
      const servicio = await adapter.update(id, dto);

      // Diff: add new, remove removed
      const toAdd = centroIds.filter((cid) => !previousCentroIds.includes(cid));
      const toRemove = previousCentroIds.filter((cid) => !centroIds.includes(cid));

      await Promise.all([
        ...toAdd.map((centroId) =>
          adapter.assignToCentro({
            servicioId: id,
            centroId,
            precioPersonalizado: null,
            activo: true,
          }),
        ),
        ...toRemove.map((centroId) => adapter.removeFromCentro(id, centroId)),
      ]);

      return servicio;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['servicios'] });
    },
  });
}

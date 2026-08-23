import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseServicioAdapter } from '@infra/adapters/SupabaseServicioAdapter';
import type { ICreateServicioDTO } from '@domain/models';
import type { TCentroId } from '@domain/types';

const adapter = new SupabaseServicioAdapter();

interface ICreateServicioInput {
  readonly dto: ICreateServicioDTO;
  readonly centroIds: readonly TCentroId[];
}

export function useCreateServicio() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ dto, centroIds }: ICreateServicioInput) => {
      const servicio = await adapter.create(dto);
      // Assign to each selected centro
      await Promise.all(
        centroIds.map((centroId) =>
          adapter.assignToCentro({
            servicioId: servicio.id,
            centroId,
            precioPersonalizado: null,
            activo: true,
          }),
        ),
      );
      return servicio;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['servicios'] });
    },
  });
}

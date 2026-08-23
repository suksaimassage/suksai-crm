/**
 * useTerapeutas.ts
 *
 * Orchestrating hook for the Terapeutas page.
 * Fetches all data for therapists at a centro in parallel, then assembles
 * ITerapeutaAggregate objects client-side by calling domain services.
 *
 * Query key: ['terapeutas', centroId]
 * Stale time: 60s — therapist status can change every few minutes
 */

import { useQuery } from '@tanstack/react-query';
import { SupabaseTerapeutasAdapter } from '@infra/adapters/SupabaseTerapeutasAdapter';
import type { IHorarioRaw } from '@infra/adapters/SupabaseTerapeutasAdapter';
import { deriveEstado } from '@domain/services/TerapeutaStatusService';
import {
  computeSesionesEstaSemana,
  computeTotalHorasSemana,
  computeIngresosSemana,
  deriveEspecialidades,
  computeServicioMasRealizado,
} from '@domain/services/TerapeutaStatsService';
import type { TCentroId, TUserId, TTerapeutaEstado } from '@domain/types';
import type { IUsuario, IAusencia, ICita } from '@domain/models';

// ── ISO week helpers ──────────────────────────────────────────────────────────

function getISOWeekBounds(date: Date): { from: Date; to: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const isoDay = day === 0 ? 7 : day;
  const monday = new Date(d);
  monday.setDate(d.getDate() - (isoDay - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { from: monday, to: sunday };
}

// ── Application-layer aggregate shape ─────────────────────────────────────────

export interface ITerapeutaAggregate {
  readonly usuarioId: TUserId;
  readonly nombre: string;
  readonly apellidos: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly activo: boolean;
  readonly createdAt: Date;
  readonly estadoActual: TTerapeutaEstado;
  readonly salaActual: string | null;
  readonly proximaCita: Date | null;
  readonly proximaCitaSala: string | null;
  readonly horariosSemanales: readonly IHorarioRaw[];
  readonly totalHorasSemana: number;
  readonly sesionesEstaSemana: number;
  readonly ingresosSemana: number;
  readonly valoracionMedia: null;
  readonly especialidades: readonly string[];
  readonly roles: readonly string[];
  readonly servicioMasRealizado: string | null;
}

// ── Adapter singleton ─────────────────────────────────────────────────────────

const adapter = new SupabaseTerapeutasAdapter();

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface IUseTerapeutasResult {
  readonly data: readonly ITerapeutaAggregate[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => unknown;
}

export const useTerapeutas = (centroId: TCentroId | null): IUseTerapeutasResult => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['terapeutas', centroId],
    queryFn: async (): Promise<readonly ITerapeutaAggregate[]> => {
      if (centroId === null) return [];

      const now = new Date();
      const { from: weekStart, to: weekEnd } = getISOWeekBounds(now);

      const terapeutasRaw = await adapter.fetchTerapeutasByCentro(centroId);
      if (terapeutasRaw.length === 0) return [];

      const ids: TUserId[] = terapeutasRaw.map((t) => t.id);

      const [citasSemana, horarios, ausencias, citasActuales] = await Promise.all([
        adapter.fetchWeekCitasForUsuarios(ids, weekStart, weekEnd),
        adapter.fetchHorariosForUsuarios(ids),
        adapter.fetchAusenciasForUsuarios(ids, weekStart, weekEnd),
        adapter.fetchCurrentCitasForCentro(centroId, now),
      ]);

      const citasForStats = citasSemana.map((c) => ({
        usuarioId: c.usuario_id,
        estado: c.estado,
        fechaInicio: c.fecha_inicio,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- PostgREST returns numeric(10,2) as string at runtime despite TS typing it as number
        precio: c.servicios?.precio != null ? Number(c.servicios.precio) : null,
      }));

      const servicioNombres = citasSemana
        .filter(
          (c) => c.servicios !== null && (c.estado === 'completada' || c.estado === 'en_curso'),
        )
        .map((c) => ({
          usuarioId: c.usuario_id,
          nombre: c.servicios?.nombre ?? '',
        }));

      return terapeutasRaw.map((t): ITerapeutaAggregate => {
        const usuario: IUsuario = {
          id: t.id,
          nombre: t.nombre,
          apellidos: t.apellidos,
          email: t.email,
          telefono: t.telefono ?? null,
          activo: t.is_active,
          createdAt: new Date(t.created_at),
          updatedAt: new Date(t.created_at),
        };

        const userAusencias: IAusencia[] = ausencias
          .filter((a) => a.usuario_id === t.id)
          .map((a) => ({
            id: a.id,
            usuarioId: t.id,
            tipo: 'vacaciones' as const,
            fechaInicio: new Date(a.fecha_inicio),
            fechaFin: new Date(a.fecha_fin),
            motivo: null,
            aprobada: a.estado === 'aprobada',
            aprobadaPor: null,
            createdAt: new Date(a.fecha_inicio),
          }));

        const userCurrentCitas: ICita[] = citasActuales
          .filter((c) => c.usuario_id === t.id)
          .map((c) => ({
            id: c.id,
            clienteId: 0,
            usuarioId: t.id,
            centroId: centroId,
            salaId: c.sala_id ?? 0,
            servicioId: 0,
            fechaHoraInicio: new Date(c.fecha_inicio ?? now),
            fechaHoraFin: new Date(c.fecha_fin ?? now),
            estado: (c.estado ?? 'pendiente') as ICita['estado'],
            precioFinal: 0,
            notas: null,
            createdAt: now,
            updatedAt: now,
          }));

        const userHorarios = horarios.filter((h) => h.usuario_id === t.id);
        const userHorariosForService = userHorarios.map((h) => ({
          id: h.id,
          usuarioId: h.usuario_id ?? 0,
          centroId: 0,
          tipo: h.tipo as 'recurrente' | 'especifico',
          diaSemana: h.dia_semana as (1 | 2 | 3 | 4 | 5 | 6 | 7) | null,
          fecha: h.fecha !== null ? new Date(h.fecha) : null,
          horaInicio: h.hora_inicio,
          horaFin: h.hora_fin,
          activo: true,
        }));

        const estadoActual = deriveEstado({
          usuario,
          ausencias: userAusencias,
          citasActuales: userCurrentCitas,
          horarios: userHorariosForService,
          now,
        });

        const currentEnSalaCita = citasActuales.find((c) => c.usuario_id === t.id);
        const salaActual = currentEnSalaCita?.salas?.nombre ?? null;

        const futureWeekCitas = citasSemana
          .filter(
            (c) =>
              c.usuario_id === t.id &&
              (c.estado === 'pendiente' || c.estado === 'confirmada') &&
              c.fecha_inicio !== null &&
              new Date(c.fecha_inicio) > now,
          )
          .slice()
          .sort((a, b) => {
            const aTime = new Date(a.fecha_inicio ?? '').getTime();
            const bTime = new Date(b.fecha_inicio ?? '').getTime();
            return aTime - bTime;
          });

        const firstFutureRaw = futureWeekCitas.at(0);
        const proximaCita =
          firstFutureRaw !== undefined && firstFutureRaw.fecha_inicio !== null
            ? new Date(firstFutureRaw.fecha_inicio)
            : null;
        const proximaCitaSala = firstFutureRaw?.salas?.nombre ?? null;

        const sesionesEstaSemana = computeSesionesEstaSemana(
          t.id,
          citasForStats,
          weekStart,
          weekEnd,
        );

        const totalHorasSemana = computeTotalHorasSemana(t.id, userHorariosForService);

        const ingresosSemana = computeIngresosSemana(t.id, citasForStats, weekStart, weekEnd);

        const especialidades = deriveEspecialidades(t.id, servicioNombres);
        const servicioMasRealizado = computeServicioMasRealizado(t.id, servicioNombres);

        return {
          usuarioId: t.id,
          nombre: t.nombre,
          apellidos: t.apellidos,
          email: t.email,
          telefono: t.telefono ?? null,
          activo: t.is_active,
          createdAt: new Date(t.created_at),
          estadoActual,
          salaActual,
          proximaCita,
          proximaCitaSala,
          horariosSemanales: userHorarios,
          totalHorasSemana,
          sesionesEstaSemana,
          ingresosSemana,
          valoracionMedia: null,
          especialidades,
          roles: t.roles,
          servicioMasRealizado,
        };
      });
    },
    enabled: centroId !== null,
    staleTime: 60_000,
  });

  return {
    data: data ?? [],
    isLoading,
    isError,
    refetch,
  };
};

/**
 * Clientes.types.ts — View-model types for the ClientesPage feature.
 *
 * All types live here so that fixtures, hooks, components and the page
 * can import from a single module without circular dependencies.
 */

import type { TClienteId, TCitaId, TEstadoCita } from '@domain/types';
import type { ICliente } from '@domain/models';

// ── Segmento ───────────────────────────────────────────────────────────────────

export type TClienteSegmento = 'vip' | 'activo' | 'nuevo' | 'en_riesgo' | 'inactivo';

/** Annual spend threshold above which a client is classified as VIP (in cents). */
export const VIP_THRESHOLD_CENTS = 100_000; // 1 000 €/year

// ── Table row ─────────────────────────────────────────────────────────────────

export interface IClienteTableRow {
  readonly clienteId: TClienteId;
  readonly nombreCompleto: string;
  readonly telefono: string;
  readonly email: string | null;
  readonly segmento: TClienteSegmento;
  readonly activo: boolean;
  readonly ultimaVisita: Date | null;
  readonly ritualFavorito: string | null;
  readonly duracionRitual: number | null;
  /** Average visits per month over the last 180 days (6-month rolling window). */
  readonly frecuenciaVisitas: number;
  /** Total spend in the current calendar year (cents). */
  readonly gastoAnual: number;
  readonly totalVisitasAnio: number;
  readonly createdAt: Date;
}

// ── Enriched appointment ──────────────────────────────────────────────────────

export interface ICitaEnriquecida {
  readonly citaId: TCitaId;
  readonly fechaHoraInicio: Date;
  readonly fechaHoraFin: Date;
  readonly estado: TEstadoCita;
  readonly servicioNombre: string;
  readonly duracionMinutos: number;
  readonly salaNombre: string;
  readonly terapeutaNombre: string;
  readonly valoracion: number | null;
}

// ── Client detail panel ───────────────────────────────────────────────────────

export interface IClienteDetalle {
  readonly cliente: ICliente;
  readonly segmento: TClienteSegmento;
  readonly plan: string | null;
  readonly puntos: number;
  readonly gastoAnio: number;
  readonly totalVisitasAnio: number;
  readonly proximaCita: ICitaEnriquecida | null;
  readonly citasRecientes: readonly ICitaEnriquecida[];
  readonly notaEstudio: string | null;
  readonly notaAutor: string | null;
  readonly notaFecha: Date | null;
}

// ── KPI data ──────────────────────────────────────────────────────────────────

export interface IClientesKPIData {
  readonly totalClientes: number;
  readonly nuevos30Dias: number;
  /** 0–100 */
  readonly recurrenciaPct: number;
  /** Average annual spend per client in cents. */
  readonly gastoMedioCliente: number;
}

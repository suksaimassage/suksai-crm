/**
 * domain/types/index.ts — Shared domain types and enums
 *
 * SRP: defines the ubiquitous language of the massage center domain.
 *      No framework. No database. No UI.
 */

// ── Primitive aliases — communicates intent at call sites ──────────────────
export type TUserId = number;
export type TRolId = number;
export type TCentroId = number;
export type TSalaId = number;
export type TServicioId = number;
export type TClienteId = number;
export type TCitaId = number;
export type TAusenciaId = number;
export type THorarioId = number;
export type TTipoServicioId = number;
export type TPagoId = number;
export type TBonoId = number;

// ── Citas ──────────────────────────────────────────────────────────────────

export type TEstadoCita =
  | 'sin_asignar'
  | 'pendiente'
  | 'confirmada'
  | 'en_curso'
  | 'completada'
  | 'cancelada'
  | 'no_presentado';

// ── Roles ──────────────────────────────────────────────────────────────────

export type TNombreRol = 'superadmin' | 'masajista' | 'recepcionista';

// ── Horarios ───────────────────────────────────────────────────────────────

/** 'recurrente' = repeating weekly | 'especifico' = one-off date */
export type TTipoHorario = 'recurrente' | 'especifico';

/** ISO weekday: 1 = Monday … 7 = Sunday */
export type TDiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ── Ausencias ──────────────────────────────────────────────────────────────

export type TTipoAusencia = 'vacaciones' | 'baja_medica' | 'festivo' | 'permiso';

// ── Servicios ──────────────────────────────────────────────────────────────

export type TEstadoServicio = 'activo' | 'inactivo' | 'archivado';

// ── Pagos ──────────────────────────────────────────────────────────────────

export type TEstadoPago = 'pendiente' | 'completado' | 'reembolsado' | 'fallido';

export type TMetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'bono';

// ── Shared DTOs ────────────────────────────────────────────────────────────
// DTOs are data transfer shapes — not entities.
// Used as inputs to services and repository ports.

export interface IPaginationParams {
  readonly page: number;
  readonly perPage: number;
}

export interface IDateRangeFilter {
  readonly from: Date;
  readonly to: Date;
}

export interface ISortParams<T extends string = string> {
  readonly field: T;
  readonly direction: 'asc' | 'desc';
}

export interface IPaginatedResult<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
  readonly totalPages: number;
}

// ── Domain error types ─────────────────────────────────────────────────────

export class DomainError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class ValidationError extends DomainError {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class BusinessRuleViolation extends DomainError {
  constructor(message: string, rule: string) {
    super(message, rule);
    this.name = 'BusinessRuleViolation';
  }
}

// ── Terapeutas ─────────────────────────────────────────────────────────────

export type TTerapeutaEstado = 'en_sala' | 'disponible' | 'descanso' | 'inactivo' | 'ausente';

// ── Dashboard routing ──────────────────────────────────────────────────────

export type TDashboardRouteId =
  | 'overview'
  | 'agenda'
  | 'clientes'
  | 'rituales'
  | 'terapeutas'
  | 'caja'
  | 'informes'
  | 'ajustes'
  | 'centros';

// ── Agenda ─────────────────────────────────────────────────────────────────

export type TAgendaEvtVariant =
  | 'gold'
  | 'jungle'
  | 'clay'
  | 'lotus'
  | 'sand'
  | 'pending'
  | 'break'
  | 'unassigned';
export type TAgendaTimelineState = 'done' | 'now' | 'pending' | 'break';
export type TAgendaRoleView = 'admin' | 'therapist';
export type TAgendaDateMode = 'day' | 'week' | 'month' | 'list';
export type TAgendaTherapistDateMode = 'day' | 'week';
/** Color slot assigned per-therapist identity in week view (round-robin, palette a–f) */
export type TAgendaTherapistColor = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

export class ForbiddenError extends DomainError {
  readonly routeId: TDashboardRouteId;
  readonly userRoles: readonly TNombreRol[];

  constructor(routeId: TDashboardRouteId, userRoles: readonly TNombreRol[]) {
    super(
      `Access to route "${routeId}" is forbidden for roles: ${userRoles.join(', ')}`,
      'FORBIDDEN',
    );
    this.name = 'ForbiddenError';
    this.routeId = routeId;
    this.userRoles = userRoles;
  }
}

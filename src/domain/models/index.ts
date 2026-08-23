/**
 * domain/models/index.ts — All domain entities
 *
 * Pure TypeScript interfaces — no decorators, no ORM, no framework.
 * Each interface maps one-to-one with a Supabase table but uses
 * domain naming conventions (camelCase, semantic types).
 *
 * Relationships are represented as IDs, never as nested objects,
 * to prevent the N+1 aggregation anti-pattern in the domain layer.
 */

import type {
  TUserId,
  TRolId,
  TCentroId,
  TSalaId,
  TServicioId,
  TClienteId,
  TCitaId,
  TAusenciaId,
  THorarioId,
  TTipoServicioId,
  TPagoId,
  TBonoId,
  TEstadoCita,
  TNombreRol,
  TTipoHorario,
  TDiaSemana,
  TTipoAusencia,
  TEstadoServicio,
  TEstadoPago,
  TMetodoPago,
} from '../types';

// ── Usuarios ───────────────────────────────────────────────────────────────
export interface IUsuario {
  readonly id: TUserId;
  readonly nombre: string;
  readonly apellidos: string;
  readonly email: string; // Use Email VO when creating/validating
  readonly telefono: string | null;
  readonly activo: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ICreateUsuarioDTO {
  readonly nombre: string;
  readonly apellidos: string;
  readonly email: string;
  readonly telefono?: string;
  // Defaults to true in the adapter — direct panel creation implies admin approval.
  // Pass false explicitly when creating via Supabase Auth invite flow (activation deferred).
  readonly activo?: boolean;
}

export interface IUpdateUsuarioDTO {
  readonly nombre?: string;
  readonly apellidos?: string;
  readonly telefono?: string;
  readonly activo?: boolean;
}

// ── Roles ──────────────────────────────────────────────────────────────────
export interface IRol {
  readonly id: TRolId;
  readonly nombre: TNombreRol;
  readonly descripcion: string | null;
}

// ── Usuarios_Roles (junction) ──────────────────────────────────────────────
export interface IUsuarioRol {
  readonly usuarioId: TUserId;
  readonly rolId: TRolId;
  readonly assignedAt: Date;
}

// ── Centros ────────────────────────────────────────────────────────────────
export interface ICentro {
  readonly id: TCentroId;
  readonly nombre: string;
  readonly direccion: string;
  readonly ciudad: string;
  readonly codigoPostal: string;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly activo: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ICreateCentroDTO {
  readonly nombre: string;
  readonly direccion: string;
  readonly ciudad: string;
  readonly codigoPostal: string;
  readonly telefono?: string;
  readonly email?: string;
}

export interface IUpdateCentroDTO {
  readonly nombre?: string;
  readonly direccion?: string;
  readonly ciudad?: string;
  readonly codigoPostal?: string;
  readonly telefono?: string;
  readonly email?: string;
  readonly activo?: boolean;
}

// ── Salas ──────────────────────────────────────────────────────────────────
export interface ISala {
  readonly id: TSalaId;
  readonly centroId: TCentroId;
  readonly nombre: string;
  readonly capacidad: number; // max simultaneous therapists
  readonly activa: boolean;
  readonly descripcion: string | null;
}

export interface ICreateSalaDTO {
  readonly centroId: TCentroId;
  readonly nombre: string;
  readonly capacidad: number;
  readonly descripcion?: string;
}

export interface IUpdateSalaDTO {
  readonly nombre?: string;
  readonly capacidad?: number;
  readonly descripcion?: string;
  readonly activa?: boolean;
}

// ── Tipos_Servicios ────────────────────────────────────────────────────────
export interface ITipoServicio {
  readonly id: TTipoServicioId;
  readonly nombre: string;
  readonly descripcion: string | null;
}

// ── Servicios ──────────────────────────────────────────────────────────────
export interface IServicio {
  readonly id: TServicioId;
  readonly tipoServicioId: TTipoServicioId;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly duracionMinutos: number;
  readonly precioBase: number; // euros (numeric from DB) — use Money.fromEuros() externally
  readonly esBono: boolean; // session package
  readonly sesionesTotales: number | null; // null if not a bono
  readonly tieneDescuento: boolean;
  readonly porcentajeDescuento: number; // 0–100
  readonly estado: TEstadoServicio;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ICreateServicioDTO {
  readonly tipoServicioId: TTipoServicioId;
  readonly nombre: string;
  readonly duracionMinutos: number;
  readonly precioBase: number;
  readonly esBono?: boolean;
  readonly sesionesTotales?: number;
  readonly tieneDescuento?: boolean;
  readonly porcentajeDescuento?: number;
  readonly descripcion?: string;
}

export interface IUpdateServicioDTO {
  readonly nombre?: string;
  readonly descripcion?: string;
  readonly duracionMinutos?: number;
  readonly precioBase?: number;
  readonly esBono?: boolean;
  readonly sesionesTotales?: number;
  readonly tieneDescuento?: boolean;
  readonly porcentajeDescuento?: number;
  readonly estado?: TEstadoServicio;
}

// ── Servicios_Centro (junction) ────────────────────────────────────────────
export interface IServicioCentro {
  readonly servicioId: TServicioId;
  readonly centroId: TCentroId;
  /** Optional price override per center */
  readonly precioPersonalizado: number | null;
  readonly activo: boolean;
}

// ── Usuarios_Centro (junction) ─────────────────────────────────────────────
export interface IUsuarioCentro {
  readonly usuarioId: TUserId;
  readonly centroId: TCentroId;
  readonly esPrincipal: boolean; // primary work center
  readonly activo: boolean; // soft-delete flag — false = unassigned
  readonly assignedAt: Date;
}

// ── Horarios_Trabajo ───────────────────────────────────────────────────────
export interface IHorarioTrabajo {
  readonly id: THorarioId;
  readonly usuarioId: TUserId;
  readonly centroId: TCentroId;
  readonly tipo: TTipoHorario;
  /** 1–7 (Mon–Sun) — used when tipo = 'recurrente' */
  readonly diaSemana: TDiaSemana | null;
  /** Specific date — used when tipo = 'especifico' */
  readonly fecha: Date | null;
  readonly horaInicio: string; // HH:MM
  readonly horaFin: string; // HH:MM — MUST be after horaInicio
  readonly activo: boolean;
}

export interface ICreateHorarioDTO {
  readonly usuarioId: TUserId;
  readonly centroId: TCentroId;
  readonly tipo: TTipoHorario;
  readonly diaSemana?: TDiaSemana;
  readonly fecha?: Date;
  readonly horaInicio: string;
  readonly horaFin: string;
}

// ── Ausencias ──────────────────────────────────────────────────────────────
export interface IAusencia {
  readonly id: TAusenciaId;
  readonly usuarioId: TUserId;
  readonly tipo: TTipoAusencia;
  readonly fechaInicio: Date;
  readonly fechaFin: Date; // MUST be >= fechaInicio
  readonly motivo: string | null;
  readonly aprobada: boolean;
  readonly aprobadaPor: TUserId | null;
  readonly createdAt: Date;
}

export interface ICreateAusenciaDTO {
  readonly usuarioId: TUserId;
  readonly tipo: TTipoAusencia;
  readonly fechaInicio: Date;
  readonly fechaFin: Date;
  readonly aprobadaPor: TUserId; // NOT NULL en DB — quién autoriza la ausencia (manager/superadmin)
  readonly motivo?: string;
}

// ── Clientes ───────────────────────────────────────────────────────────────
export interface ICliente {
  readonly id: TClienteId;
  readonly nombre: string;
  readonly apellidos: string;
  readonly email: string | null;
  readonly telefono: string;
  readonly fechaNacimiento: Date | null;
  readonly observaciones: string | null;
  readonly activo: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ICreateClienteDTO {
  readonly nombre: string;
  readonly apellidos: string;
  readonly telefono: string;
  readonly email?: string;
  readonly fechaNacimiento?: Date;
  readonly observaciones?: string;
}

export interface IUpdateClienteDTO {
  readonly nombre?: string;
  readonly apellidos?: string;
  readonly telefono?: string;
  readonly email?: string;
  readonly fechaNacimiento?: Date;
  readonly observaciones?: string;
  readonly activo?: boolean;
}

// ── Citas ──────────────────────────────────────────────────────────────────
export interface ICita {
  readonly id: TCitaId;
  /** Nullable: cita may be created without a client yet (estado = 'sin_asignar'). */
  readonly clienteId: TClienteId | null;
  /** Nullable: cita may be created without a therapist yet (estado = 'sin_asignar'). */
  readonly usuarioId: TUserId | null;
  readonly centroId: TCentroId;
  /** Nullable: cita may be created without a room yet (estado = 'sin_asignar'). */
  readonly salaId: TSalaId | null;
  readonly servicioId: TServicioId;
  readonly fechaHoraInicio: Date;
  readonly fechaHoraFin: Date; // MUST be after fechaHoraInicio
  readonly estado: TEstadoCita;
  readonly precioFinal: number; // cents — use Money VO externally
  readonly notas: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ICreateCitaDTO {
  /** Optional: omit or pass null to create a 'sin_asignar' cita. */
  readonly clienteId?: TClienteId | null;
  /** Optional: omit or pass null to create a 'sin_asignar' cita. */
  readonly usuarioId?: TUserId | null;
  readonly centroId: TCentroId;
  /** Optional: omit or pass null to create a 'sin_asignar' cita. */
  readonly salaId?: TSalaId | null;
  readonly servicioId: TServicioId;
  readonly fechaHoraInicio: Date;
  readonly fechaHoraFin: Date;
  readonly precioFinal: number;
  readonly notas?: string;
  /** Estado override — set by CitaService.schedule; callers should not pass this directly. */
  readonly estado?: TEstadoCita;
}

export interface IUpdateCitaEstadoDTO {
  readonly id: TCitaId;
  readonly estado: TEstadoCita;
}

/**
 * Partial reschedule/reassign payload for an existing cita.
 *
 * Every field is optional: callers send only what changes. The CitaService
 * merges the partial onto the current cita and re-runs the full schedule rule
 * set (1–10) against the resulting appointment. Estado is intentionally NOT
 * reschedulable here — estado transitions go through changeEstado/updateEstado.
 *
 * For the three nullable fields (clienteId, usuarioId, salaId):
 *   - undefined (field absent) → no change, keep current value
 *   - null (field explicitly null) → clear the field, set it to null
 *   - number → reassign to the new ID
 */
export interface IUpdateCitaDTO {
  readonly clienteId?: TClienteId | null;
  readonly usuarioId?: TUserId | null;
  readonly salaId?: TSalaId | null;
  readonly servicioId?: TServicioId;
  readonly fechaHoraInicio?: Date;
  readonly fechaHoraFin?: Date;
  readonly notas?: string | null;
}

// ── Pagos ──────────────────────────────────────────────────────────────────
export interface IPago {
  readonly id: TPagoId;
  readonly citaId: TCitaId;
  readonly clienteId: TClienteId;
  readonly centroId: TCentroId;
  readonly monto: number; // cents
  readonly metodoPago: TMetodoPago;
  readonly estado: TEstadoPago;
  readonly referenciaExterna: string | null;
  readonly notas: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ICreatePagoDTO {
  readonly citaId: TCitaId;
  readonly clienteId: TClienteId;
  readonly centroId: TCentroId;
  readonly monto: number;
  readonly metodoPago: TMetodoPago;
  readonly referenciaExterna?: string;
  readonly notas?: string;
}

// ── Bonos_Cliente ──────────────────────────────────────────────────────────
export interface IClienteBono {
  readonly id: TBonoId;
  readonly clienteId: TClienteId;
  readonly servicioId: TServicioId;
  readonly centroId: TCentroId;
  readonly sesionesTotales: number;
  readonly sesionesUsadas: number;
  readonly sesionesRestantes: number; // derived: sesionesTotales - sesionesUsadas
  readonly activo: boolean;
  readonly fechaCompra: Date;
  readonly fechaExpiracion: Date | null;
  readonly pagoId: TPagoId | null;
  readonly createdAt: Date;
}

export interface ICreateClienteBonoDTO {
  readonly clienteId: TClienteId;
  readonly servicioId: TServicioId;
  readonly centroId: TCentroId;
  readonly sesionesTotales: number;
  readonly fechaExpiracion?: Date;
  readonly pagoId?: TPagoId;
}

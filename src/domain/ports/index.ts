/**
 * domain/ports/index.ts — Repository port contracts
 *
 * These interfaces are the "ports" in Hexagonal Architecture.
 * The domain defines WHAT it needs; adapters (Supabase, in-memory, etc.)
 * decide HOW to provide it.
 *
 * Rules:
 *   - No async implementation details
 *   - No database types
 *   - Inputs are DTOs; outputs are domain entities
 */

import type {
  IAgendaRawCita,
  IAgendaTerapeutaRow,
  IHorarioForDateRow,
} from '../models/agenda.models';

import type {
  IUsuario,
  ICreateUsuarioDTO,
  IUpdateUsuarioDTO,
  IRol,
  IUsuarioRol,
  ICentro,
  ICreateCentroDTO,
  IUpdateCentroDTO,
  ISala,
  ICreateSalaDTO,
  IUpdateSalaDTO,
  ITipoServicio,
  IServicio,
  ICreateServicioDTO,
  IUpdateServicioDTO,
  IServicioCentro,
  IUsuarioCentro,
  IHorarioTrabajo,
  ICreateHorarioDTO,
  IAusencia,
  ICreateAusenciaDTO,
  ICliente,
  ICreateClienteDTO,
  IUpdateClienteDTO,
  ICita,
  ICreateCitaDTO,
  IUpdateCitaDTO,
  IUpdateCitaEstadoDTO,
  IPago,
  ICreatePagoDTO,
  IClienteBono,
  ICreateClienteBonoDTO,
} from '../models';

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
  TTipoAusencia,
  TEstadoPago,
  TNombreRol,
  IPaginationParams,
  IPaginatedResult,
  IDateRangeFilter,
} from '../types';
import type { Email } from '../value-objects/Email';

// ── IUsuarioRepositoryPort ─────────────────────────────────────────────────
export interface IUsuarioRepositoryPort {
  findById(id: TUserId): Promise<IUsuario | null>;
  findByEmail(email: string): Promise<IUsuario | null>;
  findAll(params?: IPaginationParams): Promise<IPaginatedResult<IUsuario>>;
  findByCentro(centroId: TCentroId): Promise<readonly IUsuario[]>;
  create(data: ICreateUsuarioDTO): Promise<IUsuario>;
  update(id: TUserId, data: IUpdateUsuarioDTO): Promise<IUsuario>;
  deactivate(id: TUserId): Promise<void>;
}

// ── IRolRepositoryPort ─────────────────────────────────────────────────────
export interface IRolRepositoryPort {
  findAll(): Promise<readonly IRol[]>;
  findById(id: TRolId): Promise<IRol | null>;
  assignRolToUsuario(usuarioId: TUserId, rolId: TRolId): Promise<IUsuarioRol>;
  removeRolFromUsuario(usuarioId: TUserId, rolId: TRolId): Promise<void>;
  findRolesByUsuario(usuarioId: TUserId): Promise<readonly IRol[]>;
}

// ── ICentroRepositoryPort ──────────────────────────────────────────────────
export interface ICentroRepositoryPort {
  findById(id: TCentroId): Promise<ICentro | null>;
  findAll(params?: IPaginationParams): Promise<IPaginatedResult<ICentro>>;
  findActivos(): Promise<readonly ICentro[]>;
  create(data: ICreateCentroDTO): Promise<ICentro>;
  update(id: TCentroId, data: IUpdateCentroDTO): Promise<ICentro>;
  deactivate(id: TCentroId): Promise<void>;
}

// ── ISalaRepositoryPort ────────────────────────────────────────────────────
export interface ISalaRepositoryPort {
  findById(id: TSalaId): Promise<ISala | null>;
  findByCentro(centroId: TCentroId): Promise<readonly ISala[]>;
  findActivasByCentro(centroId: TCentroId): Promise<readonly ISala[]>;
  create(data: ICreateSalaDTO): Promise<ISala>;
  update(id: TSalaId, data: IUpdateSalaDTO): Promise<ISala>;
  deactivate(id: TSalaId): Promise<void>;
}

// ── ITipoServicioRepositoryPort ────────────────────────────────────────────
export interface ITipoServicioRepositoryPort {
  findAll(): Promise<readonly ITipoServicio[]>;
  findById(id: TTipoServicioId): Promise<ITipoServicio | null>;
}

// ── IServicioRepositoryPort ────────────────────────────────────────────────
export interface IServicioRepositoryPort {
  findById(id: TServicioId): Promise<IServicio | null>;
  findAll(params?: IPaginationParams): Promise<IPaginatedResult<IServicio>>;
  findByCentro(centroId: TCentroId): Promise<readonly IServicio[]>;
  findActivos(): Promise<readonly IServicio[]>;
  findBonos(): Promise<readonly IServicio[]>;
  create(data: ICreateServicioDTO): Promise<IServicio>;
  update(id: TServicioId, data: IUpdateServicioDTO): Promise<IServicio>;
  deactivate(id: TServicioId): Promise<void>;
  assignToCentro(data: IServicioCentro): Promise<IServicioCentro>;
  removeFromCentro(servicioId: TServicioId, centroId: TCentroId): Promise<void>;
  findServicioCentro(servicioId: TServicioId, centroId: TCentroId): Promise<IServicioCentro | null>;
}

// ── IUsuarioCentroRepositoryPort ───────────────────────────────────────────
export interface IUsuarioCentroRepositoryPort {
  assign(usuarioId: TUserId, centroId: TCentroId, esPrincipal?: boolean): Promise<IUsuarioCentro>;
  unassign(usuarioId: TUserId, centroId: TCentroId): Promise<void>;
  findByUsuario(usuarioId: TUserId): Promise<readonly IUsuarioCentro[]>;
  findByCentro(centroId: TCentroId): Promise<readonly IUsuarioCentro[]>;
  /**
   * Returns the user's active primary-center assignment
   * (es_principal = true AND activo = true), or null if none exists.
   */
  findPrincipalByUsuario(usuarioId: TUserId): Promise<IUsuarioCentro | null>;
  setPrincipal(usuarioId: TUserId, centroId: TCentroId): Promise<void>;
}

// ── IHorarioRepositoryPort ─────────────────────────────────────────────────
export interface IHorarioRepositoryPort {
  findById(id: THorarioId): Promise<IHorarioTrabajo | null>;
  findByUsuario(usuarioId: TUserId): Promise<readonly IHorarioTrabajo[]>;
  findByUsuarioAndCentro(
    usuarioId: TUserId,
    centroId: TCentroId,
  ): Promise<readonly IHorarioTrabajo[]>;
  /**
   * All active (activo = true) horarios for a centre — BOTH tipos
   * (recurrente + especifico) for every therapist of the centre, in one query.
   * Centre-wide read used by the schedule planner; avoids the N+1 of calling
   * findByUsuarioAndCentro per therapist.
   */
  findByCentro(centroId: TCentroId): Promise<readonly IHorarioTrabajo[]>;
  findActivosByFecha(centroId: TCentroId, fecha: Date): Promise<readonly IHorarioTrabajo[]>;
  create(data: ICreateHorarioDTO): Promise<IHorarioTrabajo>;
  update(id: THorarioId, data: Partial<ICreateHorarioDTO>): Promise<IHorarioTrabajo>;
  deactivate(id: THorarioId): Promise<void>;
}

// ── IAusenciaRepositoryPort ────────────────────────────────────────────────
export interface IAusenciaRepositoryPort {
  findById(id: TAusenciaId): Promise<IAusencia | null>;
  findByUsuario(usuarioId: TUserId, params?: IDateRangeFilter): Promise<readonly IAusencia[]>;
  findPendientesAprobacion(): Promise<readonly IAusencia[]>;
  findByTipo(tipo: TTipoAusencia): Promise<readonly IAusencia[]>;
  create(data: ICreateAusenciaDTO): Promise<IAusencia>;
  aprobar(id: TAusenciaId, aprobadaPor: TUserId): Promise<IAusencia>;
  rechazar(id: TAusenciaId): Promise<void>;
}

// ── IClienteRepositoryPort ─────────────────────────────────────────────────
export interface IClienteRepositoryPort {
  findById(id: TClienteId): Promise<ICliente | null>;
  findByEmail(email: string): Promise<ICliente | null>;
  findByTelefono(telefono: string): Promise<ICliente | null>;
  findAll(params?: IPaginationParams): Promise<IPaginatedResult<ICliente>>;
  search(query: string): Promise<readonly ICliente[]>;
  create(data: ICreateClienteDTO): Promise<ICliente>;
  update(id: TClienteId, data: IUpdateClienteDTO): Promise<ICliente>;
  deactivate(id: TClienteId): Promise<void>;
  reactivate(id: TClienteId): Promise<void>;
  deactivateWithCancellation(id: TClienteId): Promise<number>;
}

// ── ICitaRepositoryPort ────────────────────────────────────────────────────
export interface ICitaRepositoryPort {
  findById(id: TCitaId): Promise<ICita | null>;
  findByCentroAndFecha(centroId: TCentroId, fecha: Date): Promise<readonly ICita[]>;
  findByCliente(
    clienteId: TClienteId,
    params?: IPaginationParams,
  ): Promise<IPaginatedResult<ICita>>;
  findByUsuario(usuarioId: TUserId, range: IDateRangeFilter): Promise<readonly ICita[]>;
  findBySala(salaId: TSalaId, fecha: Date): Promise<readonly ICita[]>;
  findByCentroAndRange(centroId: TCentroId, range: IDateRangeFilter): Promise<readonly ICita[]>;
  findByEstado(estado: TEstadoCita, centroId?: TCentroId): Promise<readonly ICita[]>;
  /**
   * Returns non-cancelled citas for a centro on a given date that are missing
   * at least one of: usuario_id, sala_id, cliente_id (estado = 'sin_asignar').
   */
  fetchUnassigned(centroId: TCentroId, fecha: Date): Promise<readonly ICita[]>;
  create(data: ICreateCitaDTO): Promise<ICita>;
  update(id: TCitaId, data: IUpdateCitaDTO): Promise<ICita>;
  updateEstado(data: IUpdateCitaEstadoDTO): Promise<ICita>;
  cancel(id: TCitaId, motivo?: string): Promise<void>;
  countActiveCitasByUsuario(usuarioId: TUserId, from: Date, to: Date): Promise<number>;
  countActiveCitasBySala(salaId: TSalaId, from: Date, to: Date): Promise<number>;
  countFutureCitas(clienteId: TClienteId, from: Date): Promise<number>;
}

// ── IPagoRepositoryPort ─────────────────────────────────────────────────────
export interface IPagoRepositoryPort {
  findById(id: TPagoId): Promise<IPago | null>;
  findByCita(citaId: TCitaId): Promise<readonly IPago[]>;
  findByCliente(
    clienteId: TClienteId,
    params?: IPaginationParams,
  ): Promise<IPaginatedResult<IPago>>;
  findByCentro(centroId: TCentroId, params?: IPaginationParams): Promise<IPaginatedResult<IPago>>;
  findByEstado(estado: TEstadoPago): Promise<readonly IPago[]>;
  create(data: ICreatePagoDTO): Promise<IPago>;
  updateEstado(id: TPagoId, estado: TEstadoPago): Promise<IPago>;
  reembolsar(id: TPagoId, motivo?: string): Promise<IPago>;
}

// ── IBonoRepositoryPort ─────────────────────────────────────────────────────
export interface IBonoRepositoryPort {
  findById(id: TBonoId): Promise<IClienteBono | null>;
  findByCliente(clienteId: TClienteId): Promise<readonly IClienteBono[]>;
  findActivosByCliente(clienteId: TClienteId): Promise<readonly IClienteBono[]>;
  findByServicio(servicioId: TServicioId): Promise<readonly IClienteBono[]>;
  create(data: ICreateClienteBonoDTO): Promise<IClienteBono>;
  usarSesion(id: TBonoId): Promise<IClienteBono>;
  deactivate(id: TBonoId): Promise<void>;
}

// ── IAgendaRepositoryPort ──────────────────────────────────────────────────
export interface IAgendaRepositoryPort {
  /**
   * Active (non-cancelled) citas for the day that have a therapist assigned.
   * Sin-asignar citas (usuario_id IS NULL) are excluded — use fetchDayUnassignedCitas instead.
   */
  fetchDayCitas(centroId: TCentroId, date: Date): Promise<readonly IAgendaRawCita[]>;
  /**
   * Cancelled / no-show citas for the day — the default fetchDayCitas excludes
   * these, so the rail's cancellation alerts need a dedicated honest fetch.
   */
  fetchDayCancelledCitas(centroId: TCentroId, date: Date): Promise<readonly IAgendaRawCita[]>;
  fetchTherapistDayCitas(therapistId: TUserId, date: Date): Promise<readonly IAgendaRawCita[]>;
  fetchDayTerapeutas(centroId: TCentroId): Promise<readonly IAgendaTerapeutaRow[]>;
  fetchWeekCitas(centroId: TCentroId, weekStart: Date): Promise<readonly IAgendaRawCita[]>;
  fetchMonthCitas(
    centroId: TCentroId,
    year: number,
    month: number,
  ): Promise<readonly IAgendaRawCita[]>;
  fetchTherapistWeekCitas(
    therapistId: TUserId,
    weekStart: Date,
  ): Promise<readonly IAgendaRawCita[]>;
  /** All active horarios_trabajo for a centro on a given date (recurrente matching weekday + especifico matching date). */
  fetchDayHorarios(centroId: TCentroId, date: Date): Promise<readonly IHorarioForDateRow[]>;
  /**
   * Non-cancelled citas for the day that have at least one of
   * usuario_id / sala_id / cliente_id as NULL (estado = 'sin_asignar').
   */
  fetchDayUnassignedCitas(centroId: TCentroId, date: Date): Promise<readonly IAgendaRawCita[]>;
}

// ── IAuthPort ───────────────────────────────────────────────────────────────
// Auth is backed by Supabase Auth (auth.users) + public.usuarios profile + RBAC.
// Schema reference: .claude/rules/database-schema.md
// Migration:        .claude/migrations/001_supabase_auth_migration.sql

export interface IAuthenticatedUser {
  readonly id: number; // public.usuarios.id (bigint → number)
  readonly nombre: string; // unique username
  readonly apellidos: string;
  readonly email: string;
  readonly roles: readonly TNombreRol[]; // ALL roles — never a single role
  readonly isActive: boolean;
  readonly centroPrincipalNombre: string | null; // sourced from RPC — bypass RLS via SECURITY DEFINER
}

export interface ISignInDTO {
  readonly email: Email;
  readonly password: string; // plaintext — sent over TLS to Supabase Auth; bcrypt runs server-side inside auth.users
}

export interface IChangePasswordDTO {
  readonly userId: number;
  readonly currentPassword: string; // plaintext — re-authenticated via signInWithPassword to verify before change
  readonly newPassword: string; // plaintext — passed to supabase.auth.updateUser; bcrypt runs server-side
}

export interface IAuthSession {
  readonly user: IAuthenticatedUser;
  readonly expiresAt: Date; // sourced from Supabase session.expires_at; auto-refreshed by SDK
}

// Auth events mirror Supabase Auth lifecycle; handled in useAuthBootstrap.
export type TAuthEvent = 'SIGNED_IN' | 'SIGNED_OUT';

/**
 * Subset of Supabase Auth lifecycle events that the application cares about.
 * The adapter is responsible for filtering provider-specific events down to
 * these two semantic ones — callers never receive raw Supabase event strings.
 */
export type TAuthChangeEvent = 'SIGNED_OUT' | 'TOKEN_REFRESHED';

export interface IAuthPort {
  signIn(dto: ISignInDTO): Promise<IAuthSession>;
  signOut(): Promise<void>;
  getSession(): Promise<IAuthSession | null>;
  getCurrentUser(): Promise<IAuthenticatedUser | null>;
  /** Returns true if the user holds at least one of the specified roles */
  hasAnyRole(userId: number, roles: readonly TNombreRol[]): Promise<boolean>;
  /**
   * Changes a user's password after verifying the current one server-side.
   * Both passwords are plaintext here — bcrypt operations run inside the DB RPC.
   * Throws BusinessRuleViolation('INVALID_CREDENTIALS') if currentPassword is wrong.
   */
  changePassword(dto: IChangePasswordDTO): Promise<void>;
  /**
   * Subscribes to session lifecycle events for the lifetime of the app.
   * The adapter filters raw provider events to the two semantically meaningful
   * ones: SIGNED_OUT (session revoked / explicit sign-out) and TOKEN_REFRESHED
   * (Supabase auto-refreshed the JWT). All other provider events are silently
   * ignored — the handler is never invoked for them.
   *
   * @param handler - Called with the event type and the new token expiry
   *   (null when SIGNED_OUT).
   * @returns Unsubscribe function — call it in the useEffect cleanup.
   */
  onAuthStateChange(handler: (event: TAuthChangeEvent, expiresAt: Date | null) => void): () => void;
}

// Legacy re-export for compatibility — TMetodoPago available via @domain/types
export type { TMetodoPago } from '../types';

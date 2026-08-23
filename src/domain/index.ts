// ── Types & enums ─────────────────────────────────────────────────────────
export type {
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
  IPaginationParams,
  IDateRangeFilter,
  ISortParams,
  IPaginatedResult,
} from './types';

export { DomainError, ValidationError, BusinessRuleViolation } from './types';

// ── Value Objects ─────────────────────────────────────────────────────────
export { Email } from './value-objects/Email';
export { DateRange } from './value-objects/DateRange';
export { TimeRange } from './value-objects/TimeRange';
export type { TTimeString } from './value-objects/TimeRange';
export { Money } from './value-objects/Money';
export { PhoneNumber } from './value-objects/PhoneNumber';
export { CodigoPostal } from './value-objects/CodigoPostal';

// ── Models (entities + DTOs) ──────────────────────────────────────────────
export type {
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
} from './models';

// ── Ports (repository contracts) ──────────────────────────────────────────
export type {
  IUsuarioRepositoryPort,
  IRolRepositoryPort,
  ICentroRepositoryPort,
  ISalaRepositoryPort,
  ITipoServicioRepositoryPort,
  IServicioRepositoryPort,
  IUsuarioCentroRepositoryPort,
  IHorarioRepositoryPort,
  IAusenciaRepositoryPort,
  IClienteRepositoryPort,
  ICitaRepositoryPort,
  IPagoRepositoryPort,
  IBonoRepositoryPort,
  IAuthPort,
  IAuthenticatedUser,
} from './ports';

// ── Domain Services ───────────────────────────────────────────────────────
export { CitaService } from './services/CitaService';
export { AvailabilityService } from './services/AvailabilityService';
export type { IAvailableSlot, IAvailabilityResult } from './services/AvailabilityService';
export {
  computeAvailableStartTimes,
  AGENDA_OPEN_MIN,
  AGENDA_CLOSE_MIN,
  SLOT_STEP_MIN,
} from './services/availability.slots';
export type {
  IComputeAvailableStartTimesParams,
  IBookedRange,
  IAbsenceRange,
  IWorkingWindow,
} from './services/availability.slots';
export {
  toTherapistSchedule,
  isRecurrente,
  isEspecifico,
  timeRangesOverlap,
  findScheduleConflict,
  resolveWorkingWindowsForDate,
} from './services/horarioSchedule';
export type {
  TTherapistSchedule,
  IRecurrenteHorario,
  IEspecificoHorario,
  IScheduleConflictCandidate,
} from './services/horarioSchedule';
export {
  legalNextEstados,
  isLegalEstadoTransition,
  isTerminalEstado,
} from './services/citaEstadoTransitions';
export { AusenciaService } from './services/AusenciaService';
export { UsuarioService } from './services/UsuarioService';
export { ClienteService } from './services/ClienteService';
export { FeaturePermissionService } from './services/FeaturePermissionService';

import type {
  TCitaId,
  TUserId,
  TSalaId,
  TCentroId,
  TEstadoCita,
  TAgendaEvtVariant,
  TAgendaTimelineState,
  TAgendaDateMode,
  TAgendaTherapistColor,
} from '../types';

// ── Raw types — adapter output consumed by AgendaEnrichmentService ─────────────

export interface IAgendaRawCita {
  readonly id: TCitaId;
  /** Null when the cita has no therapist assigned yet (estado = 'sin_asignar'). */
  readonly therapistId: TUserId | null;
  readonly startIso: string;
  readonly endIso: string;
  /** Null when the cita has no client assigned yet (estado = 'sin_asignar'). */
  readonly clientName: string | null;
  readonly serviceName: string;
  /** Null when the cita has no room assigned yet (estado = 'sin_asignar'). */
  readonly sala: string | null;
  /** Null when the cita has no room assigned yet (estado = 'sin_asignar'). */
  readonly salaId: TSalaId | null;
  readonly centroId: TCentroId;
  /** Display name of the cita's centro (join citas → centros.nombre); '' when unresolved. */
  readonly centroName: string;
  readonly durationMin: number;
  readonly estado: TEstadoCita;
  /**
   * Free-text observation (citas.observaciones). Optional on the raw DTO: a
   * given fetch/fixture may omit it. The adapter always supplies it; the
   * enrichment normalises a missing value to null.
   */
  readonly notes?: string | null;
  readonly precio: number;
}

export interface IAgendaTerapeutaRow {
  readonly id: TUserId;
  readonly nombre: string;
  readonly apellidos: string;
  readonly isActive: boolean;
}

/** Slim horario row needed by the availability check — no full IHorarioTrabajo needed. */
export interface IHorarioForDateRow {
  readonly usuarioId: TUserId;
  readonly tipo: 'recurrente' | 'especifico';
  readonly diaSemana: number | null;
  readonly fecha: string | null;
  readonly horaInicio: string;
  readonly horaFin: string;
}

export interface IAgendaCalendarFilters {
  readonly dateMode: TAgendaDateMode;
  readonly activeDate: string;
  readonly selectedTerapeutas: readonly string[];
  readonly selectedServicio: string | null;
  readonly selectedEstado: TEstadoCita | null;
  readonly selectedSala: string | null;
}

export interface IAgendaAppointment {
  readonly id: TCitaId;
  /** Null when the cita has no therapist assigned yet (estado = 'sin_asignar'). */
  readonly therapistId: TUserId | null;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMin: number;
  /** Null when the cita has no client assigned yet (estado = 'sin_asignar'). */
  readonly clientName: string | null;
  readonly visitInfo: string | null;
  readonly serviceName: string;
  /** Null when the cita has no room assigned yet (estado = 'sin_asignar'). */
  readonly sala: string | null;
  /** Null when the cita has no room assigned yet (estado = 'sin_asignar'). */
  readonly salaId: TSalaId | null;
  readonly centroId: TCentroId;
  /** Display name of the cita's centro (join citas → centros.nombre); '' when unresolved. */
  readonly centroName: string;
  readonly estado: TEstadoCita;
  readonly timelineState: TAgendaTimelineState;
  readonly evtVariant: TAgendaEvtVariant;
  readonly notes: string | null;
  readonly tags: readonly string[];
  readonly precioFinal: number;
}

export interface IAgendaTherapist {
  readonly id: TUserId;
  readonly nombre: string;
  readonly apellidos: string;
  readonly initials: string;
  readonly sala: string;
  readonly appointmentCount: number;
  readonly isActive: boolean;
  /** True if therapist has ≥1 active horario_trabajo covering the queried date. */
  readonly isAvailableOnDate: boolean;
}

export interface IAgendaKpi {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly denominator: number | null;
  readonly unit: string | null;
  readonly subtext: string | null;
  readonly isAccent: boolean;
}

export interface IAgendaAlert {
  readonly id: string;
  readonly type: 'double_booking' | 'cancellation' | 'warning' | 'missing_schedule' | 'sin_asignar';
  readonly title: string;
  readonly message: string;
}

export interface IAgendaReview {
  readonly id: string;
  readonly stars: 1 | 2 | 3 | 4 | 5;
  readonly body: string;
  readonly fromClient: string;
  readonly date: string;
}

export interface IAgendaDayNotes {
  readonly id: string;
  readonly body: string;
  readonly author: string;
  readonly time: string;
}

export interface IAgendaLegendItem {
  readonly variant: TAgendaEvtVariant;
  readonly label: string;
}

export interface IAgendaShiftStats {
  readonly citasTotal: number;
  readonly citasCompletadas: number;
  readonly horasEnSala: number;
  readonly propinas: number;
  readonly valoracionMedia: number;
}

// ── Week / Month / Therapist-week shapes ──────────────────────────────────────

/** Maps therapist userId → color slot (a–f, round-robin) */
export type TTherapistColorMap = Readonly<Record<TUserId, TAgendaTherapistColor>>;

/** One day column in the admin week grid */
export interface IAgendaWeekDay {
  readonly dateStr: string;
  readonly label: string;
  readonly dateNumber: number;
  readonly appointments: readonly IAgendaAppointment[];
  readonly isDayOff: boolean;
  readonly citaCount: number;
  readonly isToday: boolean;
}

/** Minimal cita chip rendered inside a month cell */
export interface IAgendaMonthChipData {
  readonly id: TCitaId;
  readonly startTime: string;
  /** End time (HH:MM) — carried so a month drag can build the reschedule payload. */
  readonly endTime: string;
  /** Service duration (min) — the drag keeps the time and moves only the day. */
  readonly durationMin: number;
  /** Service display name — shown in the reschedule confirm dialog. */
  readonly serviceName: string;
  /** Estado — gates drag eligibility (terminal citas are not draggable). */
  readonly estado: TEstadoCita;
  /** Null when the cita has no client assigned yet (estado = 'sin_asignar'). */
  readonly clientName: string | null;
  /** Null when the cita has no therapist assigned yet (estado = 'sin_asignar'). */
  readonly therapistId: TUserId | null;
}

/** One cell in the month calendar (may be padding from adj. month) */
export interface IAgendaMonthCell {
  readonly dateStr: string;
  readonly dateNumber: number;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly citaCount: number;
  /** 0 = empty … 5 = very dense; used for dot/bg density indicator */
  readonly densityLevel: 0 | 1 | 2 | 3 | 4 | 5;
  readonly chips: readonly IAgendaMonthChipData[];
  readonly overflowCount: number;
}

/** Footer stats strip below the month grid */
export interface IAgendaMonthFooterKpis {
  readonly totalCitas: number;
  readonly monthLabel: string;
  readonly ocupacionPct: number | null;
  readonly peakDays: readonly number[];
}

/** One row in the therapist week swimlane grid */
export interface IAgendaTherapistWeekDay {
  readonly dateStr: string;
  readonly label: string;
  readonly dateNumber: number;
  readonly dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  readonly isToday: boolean;
  readonly isPast: boolean;
  /** Libranza heuristic: service name contains 'libranza' */
  readonly isLibranza: boolean;
  readonly appointments: readonly IAgendaAppointment[];
  readonly citaCount: number;
  readonly hoursWorked: number;
  readonly revenueForDay: number;
}

/** Aggregate balance for the therapist's week rail */
export interface IAgendaWeekBalance {
  readonly citasTotal: number;
  readonly citasCompletadas: number;
  readonly horasEnSala: number;
  readonly propinas: number;
  readonly valoracionMedia: number;
  readonly weekLabel: string;
}

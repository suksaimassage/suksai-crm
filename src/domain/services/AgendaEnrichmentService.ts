import type {
  IAgendaRawCita,
  IAgendaTerapeutaRow,
  IAgendaAppointment,
  IAgendaTherapist,
  IAgendaKpi,
  IAgendaAlert,
  IAgendaLegendItem,
  IAgendaShiftStats,
  IAgendaWeekDay,
  IAgendaMonthCell,
  IAgendaMonthChipData,
  IAgendaMonthFooterKpis,
  IAgendaTherapistWeekDay,
  IAgendaWeekBalance,
  TTherapistColorMap,
  IHorarioForDateRow,
} from '../models/agenda.models';
import type {
  TAgendaEvtVariant,
  TAgendaTimelineState,
  TEstadoCita,
  TAgendaTherapistColor,
  TUserId,
} from '../types';

/**
 * Serializes a Date to YYYY-MM-DD using LOCAL calendar parts, never toISOString()
 * which is UTC and rolls the day back in positive-offset zones (e.g. Europe/Madrid
 * UTC+1/+2 where midnight local = 22:00/23:00 of the PREVIOUS UTC day).
 */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function deriveEvtVariant(serviceName: string, estado: TEstadoCita): TAgendaEvtVariant {
  if (estado === 'sin_asignar') return 'unassigned';
  if (estado === 'pendiente') return 'pending';
  const n = serviceName.toLowerCase();
  if (n.includes('descanso') || n.includes('pausa') || n.includes('libranza')) return 'break';
  if (n.includes('bloqueo') || n.includes('mantenimiento')) return 'sand';
  if (n.includes('pareja') || n.includes('aroma')) return 'lotus';
  if (n.includes('primera') || n.includes('diagnóstico') || n.includes('diagnostico'))
    return 'clay';
  if (n.includes('reflexo') || n.includes('espalda') || n.includes('cabeza')) return 'jungle';
  return 'gold';
}

function deriveTimelineState(
  startIso: string,
  endIso: string,
  now: Date,
  serviceName: string,
): TAgendaTimelineState {
  const n = serviceName.toLowerCase();
  if (
    n.includes('descanso') ||
    n.includes('pausa') ||
    n.includes('libranza') ||
    n.includes('bloqueo') ||
    n.includes('mantenimiento')
  ) {
    return 'break';
  }
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (now >= end) return 'done';
  if (now >= start) return 'now';
  return 'pending';
}

function formatTimeFromIso(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function deriveInitials(nombre: string, apellidos: string): string {
  const first = nombre.trim().charAt(0).toUpperCase();
  const last = apellidos.trim().charAt(0).toUpperCase();
  return last ? `${first}${last}` : first || nombre.slice(0, 2).toUpperCase();
}

function resolveAvailabilityForDate(horarios: readonly IHorarioForDateRow[], date: Date): boolean {
  const dateStr = localDateKey(date);
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
  return horarios.some(
    (h) =>
      (h.tipo === 'especifico' && h.fecha === dateStr) ||
      (h.tipo === 'recurrente' && h.diaSemana === dayOfWeek),
  );
}

function isRealAppointment(serviceName: string): boolean {
  const n = serviceName.toLowerCase();
  return (
    !n.includes('descanso') &&
    !n.includes('pausa') &&
    !n.includes('libranza') &&
    !n.includes('bloqueo') &&
    !n.includes('mantenimiento')
  );
}

function enrichAppointments(
  rawCitas: readonly IAgendaRawCita[],
  now: Date,
): readonly IAgendaAppointment[] {
  return rawCitas.map((c) => ({
    id: c.id,
    therapistId: c.therapistId,
    startTime: formatTimeFromIso(c.startIso),
    endTime: formatTimeFromIso(c.endIso),
    durationMin: c.durationMin,
    clientName: c.clientName,
    visitInfo: null,
    serviceName: c.serviceName,
    sala: c.sala,
    salaId: c.salaId,
    centroId: c.centroId,
    centroName: c.centroName,
    estado: c.estado,
    timelineState: deriveTimelineState(c.startIso, c.endIso, now, c.serviceName),
    evtVariant: deriveEvtVariant(c.serviceName, c.estado),
    notes: c.notes ?? null,
    tags: [],
    precioFinal: c.precio,
  }));
}

function deriveTherapists(
  terapeutas: readonly IAgendaTerapeutaRow[],
  rawCitas: readonly IAgendaRawCita[],
  horariosMap: ReadonlyMap<TUserId, readonly IHorarioForDateRow[]>,
  activeDate: Date,
): readonly IAgendaTherapist[] {
  return terapeutas.map((t) => {
    const therapistCitas = rawCitas.filter((c) => c.therapistId === t.id);
    const sortedFirst = [...therapistCitas]
      .sort((a, b) => a.startIso.localeCompare(b.startIso))
      .at(0);
    const horarios = horariosMap.get(t.id) ?? [];
    return {
      id: t.id,
      nombre: t.nombre,
      apellidos: t.apellidos,
      initials: deriveInitials(t.nombre, t.apellidos),
      sala: sortedFirst?.sala ?? '—',
      appointmentCount: therapistCitas.filter((c) => isRealAppointment(c.serviceName)).length,
      isActive: t.isActive,
      isAvailableOnDate: resolveAvailabilityForDate(horarios, activeDate),
    };
  });
}

/** Pending citas whose start is within the next `withinMinutes` from `now`. */
function countPendingDueSoon(
  realCitas: readonly IAgendaRawCita[],
  now: Date,
  withinMinutes: number,
): number {
  const horizon = now.getTime() + withinMinutes * 60_000;
  return realCitas.filter((c) => {
    if (c.estado !== 'pendiente') return false;
    const start = new Date(c.startIso).getTime();
    return start >= now.getTime() && start <= horizon;
  }).length;
}

/**
 * Computes the 5-card KPI strip. The domain returns display-ready Spanish
 * strings for `label`/`subtext` (established AgendaEnrichmentService convention
 * — these are rendered verbatim by AgendaKpiCard). Values are honest
 * derivations from the loaded day; "Lista de espera" has no backing table, so
 * it is a transparent placeholder (value 0) with an explanatory subtext.
 *
 * Only one card (`reservas-hoy`) is accented, per the design spec.
 */
function computeKpis(
  rawCitas: readonly IAgendaRawCita[],
  terapeutas: readonly IAgendaTerapeutaRow[],
  now: Date = new Date(),
): readonly IAgendaKpi[] {
  const realCitas = rawCitas.filter((c) => isRealAppointment(c.serviceName));
  const pendingCount = realCitas.filter((c) => c.estado === 'pendiente').length;
  const dueSoonCount = countPendingDueSoon(realCitas, now, 60);
  const activeTerapeutas = terapeutas.filter((t) => t.isActive).length;
  const inactiveTerapeuta = terapeutas.find((t) => !t.isActive);
  const ingresosPrev = realCitas
    .filter((c) => c.estado !== 'cancelada' && c.estado !== 'no_presentado')
    .reduce((sum, c) => sum + c.precio, 0);

  return [
    {
      id: 'reservas-hoy',
      label: 'Reservas · Hoy',
      value: realCitas.length,
      denominator: activeTerapeutas > 0 ? activeTerapeutas * 8 : null,
      unit: 'citas',
      subtext: null,
      isAccent: true,
    },
    {
      id: 'por-confirmar',
      label: 'Por confirmar',
      value: pendingCount,
      denominator: null,
      unit: null,
      subtext: dueSoonCount > 0 ? `⏱ ${dueSoonCount} vencen en 1 h` : null,
      isAccent: false,
    },
    {
      id: 'terapeutas-activos',
      label: 'Terapeutas activos',
      value: activeTerapeutas,
      denominator: terapeutas.length,
      unit: null,
      subtext: inactiveTerapeuta
        ? `🛋 ${inactiveTerapeuta.nombre}${inactiveTerapeuta.apellidos ? ' ' + inactiveTerapeuta.apellidos : ''} · libranza`
        : null,
      isAccent: false,
    },
    {
      id: 'ingresos-previstos',
      label: 'Ingresos previstos',
      value: ingresosPrev,
      denominator: null,
      unit: '€',
      subtext: null,
      isAccent: false,
    },
    {
      id: 'lista-espera',
      label: 'Lista de espera',
      value: 0,
      denominator: null,
      unit: null,
      subtext: '⏰ Si hay huecos, avisar',
      isAccent: false,
    },
  ];
}

/**
 * Computes the rail's "Alertas del día" from real citas — no fabricated data.
 *
 * Two alert kinds:
 *  - double_booking: two non-cancelled citas overlapping in time AND sharing a
 *    therapist OR a sala. `dayCitas` here are already non-cancelled (the agenda
 *    day fetch excludes cancelada/no_presentado), so any overlap is genuine.
 *  - cancellation: each cancelled cita for the day. These are NOT present in the
 *    standard day fetch, so the caller passes them in from a dedicated
 *    fetchDayCancelledCitas query. If none are supplied, no cancellation alerts
 *    are produced (honest: absence of data, not a fake zero).
 *
 * Titles/messages are display-ready Spanish strings, matching the
 * domain-produces-display-strings convention used across this service and
 * consumed verbatim by AgendaAdminRail.
 */
function computeAlerts(
  dayCitas: readonly IAgendaRawCita[],
  cancelledCitas: readonly IAgendaRawCita[] = [],
): readonly IAgendaAlert[] {
  const alerts: IAgendaAlert[] = [];
  const real = dayCitas.filter((c) => isRealAppointment(c.serviceName) && c.estado !== 'cancelada');

  // ── Double-booking detection (pairwise overlap on shared therapist or sala) ──
  for (let i = 0; i < real.length; i++) {
    for (let j = i + 1; j < real.length; j++) {
      const a = real[i];
      const b = real[j];
      // Null therapist/sala means "unassigned" — two unassigned citas don't share
      // a therapist or a sala, so we guard against null === null false positives.
      const sharesTherapist =
        a.therapistId !== null && b.therapistId !== null && a.therapistId === b.therapistId;
      const sharesSala = a.salaId !== null && b.salaId !== null && a.salaId === b.salaId;
      if (!sharesTherapist && !sharesSala) continue;

      const aStart = new Date(a.startIso).getTime();
      const aEnd = new Date(a.endIso).getTime();
      const bStart = new Date(b.startIso).getTime();
      const bEnd = new Date(b.endIso).getTime();
      const overlaps = aStart < bEnd && bStart < aEnd;
      if (!overlaps) continue;

      const scope = sharesTherapist ? 'el mismo terapeuta' : `la sala ${a.sala ?? '—'}`;
      alerts.push({
        id: `double-${a.id}-${b.id}`,
        type: 'double_booking',
        title: 'Solapamiento de citas',
        message: `${a.clientName ?? '—'} y ${b.clientName ?? '—'} se solapan en ${scope}.`,
      });
    }
  }

  // ── Cancellation alerts (one per cancelled cita supplied) ────────────────────
  for (const c of cancelledCitas) {
    alerts.push({
      id: `cancel-${c.id}`,
      type: 'cancellation',
      title: 'Cita cancelada',
      message: `${c.clientName ?? '—'} · ${formatTimeFromIso(c.startIso)} · ${c.serviceName}`,
    });
  }

  return alerts;
}

function computeShiftStats(rawCitas: readonly IAgendaRawCita[]): IAgendaShiftStats {
  const realCitas = rawCitas.filter((c) => isRealAppointment(c.serviceName));
  const completed = realCitas.filter((c) => c.estado === 'completada').length;
  const horasEnSala =
    rawCitas
      .filter((c) => c.estado !== 'cancelada' && c.estado !== 'no_presentado')
      .reduce((sum, c) => sum + c.durationMin, 0) / 60;

  return {
    citasTotal: realCitas.length,
    citasCompletadas: completed,
    horasEnSala: Math.round(horasEnSala * 10) / 10,
    propinas: 0,
    valoracionMedia: 0,
  };
}

const LEGEND_ITEMS: readonly IAgendaLegendItem[] = [
  { variant: 'gold', label: 'Tradicional / Hierbas' },
  { variant: 'jungle', label: 'Espalda / Reflexología' },
  { variant: 'lotus', label: 'Pareja / Aromaterapia' },
  { variant: 'clay', label: 'Primera visita' },
  { variant: 'pending', label: 'Por confirmar' },
  { variant: 'break', label: 'Descanso' },
];

const THERAPIST_COLOR_SLOTS: readonly TAgendaTherapistColor[] = ['a', 'b', 'c', 'd', 'e', 'f'];

function deriveTherapistColorMap(therapistIds: readonly TUserId[]): TTherapistColorMap {
  const map: Record<TUserId, TAgendaTherapistColor> = {};
  therapistIds.forEach((id, i) => {
    map[id] = THERAPIST_COLOR_SLOTS[i % THERAPIST_COLOR_SLOTS.length];
  });
  return map;
}

const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'] as const;

function getWeekStartFromDate(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeekDays(
  weekStartStr: string,
  rawCitas: readonly IAgendaRawCita[],
  today: string,
  now: Date,
): readonly IAgendaWeekDay[] {
  const weekStart = new Date(weekStartStr + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = localDateKey(d);
    const dayRaw = rawCitas.filter((c) => c.startIso.startsWith(dateStr));
    const enriched = enrichAppointments(dayRaw, now);
    const citaCount = dayRaw.filter((c) => isRealAppointment(c.serviceName)).length;
    return {
      dateStr,
      label: DAY_LABELS[i] ?? 'LUN',
      dateNumber: d.getDate(),
      appointments: enriched,
      isDayOff: false,
      citaCount,
      isToday: dateStr === today,
    };
  });
}

const MAX_MONTH_CHIPS = 3;
const DENSITY_THRESHOLDS = [0, 1, 3, 6, 10, 15] as const;

function computeDensityLevel(count: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (count === 0) return 0;
  if (count < DENSITY_THRESHOLDS[2]) return 1;
  if (count < DENSITY_THRESHOLDS[3]) return 2;
  if (count < DENSITY_THRESHOLDS[4]) return 3;
  if (count < DENSITY_THRESHOLDS[5]) return 4;
  return 5;
}

function buildMonthCells(
  year: number,
  month: number,
  rawCitas: readonly IAgendaRawCita[],
  today: string,
): readonly IAgendaMonthCell[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstDow = firstOfMonth.getDay();
  const leadingDays = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  const cells: IAgendaMonthCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(year, month - 1, 1 - leadingDays + i);
    const dateStr = localDateKey(cellDate);
    const isCurrentMonth = cellDate.getMonth() === month - 1;
    const dayRaw = rawCitas.filter((c) => c.startIso.startsWith(dateStr));
    const realDay = dayRaw.filter((c) => isRealAppointment(c.serviceName));
    const chips: IAgendaMonthChipData[] = realDay.slice(0, MAX_MONTH_CHIPS).map((c) => ({
      id: c.id,
      startTime: formatTimeFromIso(c.startIso),
      endTime: formatTimeFromIso(c.endIso),
      durationMin: c.durationMin,
      serviceName: c.serviceName,
      estado: c.estado,
      clientName: c.clientName,
      therapistId: c.therapistId,
    }));
    cells.push({
      dateStr,
      dateNumber: cellDate.getDate(),
      isCurrentMonth,
      isToday: dateStr === today,
      citaCount: realDay.length,
      densityLevel: computeDensityLevel(realDay.length),
      chips,
      overflowCount: Math.max(0, realDay.length - MAX_MONTH_CHIPS),
    });
  }
  return cells;
}

function computeMonthFooterKpis(
  rawCitas: readonly IAgendaRawCita[],
  year: number,
  month: number,
): IAgendaMonthFooterKpis {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthCitas = rawCitas.filter(
    (c) => c.startIso.startsWith(monthStr) && isRealAppointment(c.serviceName),
  );
  const dayCounts: Record<string, number> = {};
  monthCitas.forEach((c) => {
    const d = c.startIso.slice(0, 10);
    dayCounts[d] = (dayCounts[d] ?? 0) + 1;
  });
  const maxCount = Math.max(0, ...Object.values(dayCounts));
  const peakDays = Object.entries(dayCounts)
    .filter(([, count]) => count === maxCount && maxCount > 0)
    .map(([dateStr]) => Number(dateStr.slice(8, 10)));

  const MONTH_NAMES_ES = [
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE',
  ];

  return {
    totalCitas: monthCitas.length,
    monthLabel: MONTH_NAMES_ES[month - 1] ?? '',
    ocupacionPct: null,
    peakDays,
  };
}

function buildTherapistWeekDays(
  weekStartStr: string,
  rawCitas: readonly IAgendaRawCita[],
  today: string,
  now: Date,
): readonly IAgendaTherapistWeekDay[] {
  const weekStart = new Date(weekStartStr + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = localDateKey(d);
    const dayRaw = rawCitas.filter((c) => c.startIso.startsWith(dateStr));
    const enriched = enrichAppointments(dayRaw, now);
    const realCitas = dayRaw.filter((c) => isRealAppointment(c.serviceName));
    const hoursWorked =
      dayRaw
        .filter((c) => c.estado !== 'cancelada' && c.estado !== 'no_presentado')
        .reduce((s, c) => s + c.durationMin, 0) / 60;
    const isLibranza = dayRaw.some((c) => c.serviceName.toLowerCase().includes('libranza'));
    return {
      dateStr,
      label: DAY_LABELS[i] ?? 'LUN',
      dateNumber: d.getDate(),
      dayOfWeek: (i === 6 ? 7 : i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
      isToday: dateStr === today,
      isPast: dateStr < today,
      isLibranza,
      appointments: enriched,
      citaCount: realCitas.length,
      hoursWorked: Math.round(hoursWorked * 10) / 10,
      revenueForDay: realCitas
        .filter((c) => c.estado !== 'cancelada' && c.estado !== 'no_presentado')
        .reduce((s, c) => s + c.precio, 0),
    };
  });
}

function computeWeekBalance(
  weekDays: readonly IAgendaTherapistWeekDay[],
  weekStartStr: string,
): IAgendaWeekBalance {
  const citasTotal = weekDays.reduce((s, d) => s + d.citaCount, 0);
  const citasCompletadas = weekDays.reduce(
    (s, d) => s + d.appointments.filter((a) => a.estado === 'completada').length,
    0,
  );
  const horasEnSala = weekDays.reduce((s, d) => s + d.hoursWorked, 0);
  const propinas = 0;
  const valoracionMedia = 0;
  const weekStart = new Date(weekStartStr + 'T00:00:00');
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const intlFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
  const fmt = (d: Date): string => intlFmt.format(d);
  const weekLabel = `${fmt(weekStart)} – ${fmt(weekEnd)}`;
  return {
    citasTotal,
    citasCompletadas,
    horasEnSala: Math.round(horasEnSala * 10) / 10,
    propinas,
    valoracionMedia,
    weekLabel,
  };
}

export const AgendaEnrichmentService = {
  enrichAppointments,
  deriveTherapists,
  computeKpis,
  computeAlerts,
  computeShiftStats,
  legendItems: LEGEND_ITEMS,
  deriveTherapistColorMap,
  getWeekStartFromDate,
  buildWeekDays,
  buildMonthCells,
  computeMonthFooterKpis,
  buildTherapistWeekDays,
  computeWeekBalance,
} as const;

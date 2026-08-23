import type { IKPICard } from '@infra/components/ui/common/KPI';
import type { TEstadoCita } from '@domain/types';
import type { IVolumeData } from '@infra/components/ui/common/CalendarVolume';

// ── View-model types ─────────────────────────────────────────────────────────

export type TClientTag = 'vip' | 'bono_activo' | 'frecuente' | 'nuevo';

export interface IDashboardClientRow {
  readonly id: number;
  readonly nombre: string;
  readonly apellidos: string;
  readonly tags: readonly TClientTag[];
  readonly ltv: number;
  readonly lastAppointment: string | null;
  readonly lastAppointmentServicio: string | null;
  readonly lastAppointmentSala: string | null;
  readonly numeroVisitas?: number;
}

export interface IDashboardAppointmentRow {
  readonly id: number;
  readonly fechaHoraInicio: string;
  readonly clienteNombre: string;
  readonly servicioNombre: string;
  readonly terapeutaNombre: string;
  readonly salaNombre: string;
  readonly duracionMinutos?: string;
  readonly estado: TEstadoCita;
}

// ── KPI mock data ─────────────────────────────────────────────────────────────

const NOW = Date.now();
const DAY_MS = 86_400_000;

export const MOCK_KPIS: readonly IKPICard[] = [
  {
    id: 'reservas-hoy',
    title: 'reservasHoy',
    value: 8,
    color: 'primary',
    comparison: {
      previousValue: 6,
      percentChange: 33.3,
      trend: 'up',
    },
    sparklineData: [
      { timestamp: NOW - 6 * DAY_MS, value: 4 },
      { timestamp: NOW - 5 * DAY_MS, value: 7 },
      { timestamp: NOW - 4 * DAY_MS, value: 5 },
      { timestamp: NOW - 3 * DAY_MS, value: 8 },
      { timestamp: NOW - 2 * DAY_MS, value: 6 },
      { timestamp: NOW - 1 * DAY_MS, value: 9 },
      { timestamp: NOW, value: 8 },
    ],
  },
  {
    id: 'ingresos-semana',
    title: 'ingresosSemana',
    value: 132_000,
    suffix: ' €',
    color: 'secondary',
    comparison: {
      previousValue: 118_000,
      percentChange: 11.9,
      trend: 'up',
    },
    sparklineData: [
      { timestamp: NOW - 6 * DAY_MS, value: 95_000 },
      { timestamp: NOW - 5 * DAY_MS, value: 110_000 },
      { timestamp: NOW - 4 * DAY_MS, value: 105_000 },
      { timestamp: NOW - 3 * DAY_MS, value: 118_000 },
      { timestamp: NOW - 2 * DAY_MS, value: 112_000 },
      { timestamp: NOW - 1 * DAY_MS, value: 125_000 },
      { timestamp: NOW, value: 132_000 },
    ],
  },
  {
    id: 'ocupacion-semana',
    title: 'ocupacionSemana',
    value: 74,
    suffix: '%',
    color: 'success',
    comparison: {
      previousValue: 68,
      percentChange: 8.8,
      trend: 'up',
    },
    sparklineData: [
      { timestamp: NOW - 6 * DAY_MS, value: 55 },
      { timestamp: NOW - 5 * DAY_MS, value: 62 },
      { timestamp: NOW - 4 * DAY_MS, value: 68 },
      { timestamp: NOW - 3 * DAY_MS, value: 70 },
      { timestamp: NOW - 2 * DAY_MS, value: 65 },
      { timestamp: NOW - 1 * DAY_MS, value: 71 },
      { timestamp: NOW, value: 74 },
    ],
  },
  {
    id: 'nps',
    title: 'satisfaccionNPS',
    value: 42,
    color: 'info',
    comparison: {
      previousValue: 38,
      percentChange: 10.5,
      trend: 'up',
    },
    sparklineData: [
      { timestamp: NOW - 6 * DAY_MS, value: 30 },
      { timestamp: NOW - 5 * DAY_MS, value: 34 },
      { timestamp: NOW - 4 * DAY_MS, value: 36 },
      { timestamp: NOW - 3 * DAY_MS, value: 38 },
      { timestamp: NOW - 2 * DAY_MS, value: 35 },
      { timestamp: NOW - 1 * DAY_MS, value: 40 },
      { timestamp: NOW, value: 42 },
    ],
  },
] as const;

// ── Client mock data ──────────────────────────────────────────────────────────

export const MOCK_CLIENTS: readonly IDashboardClientRow[] = [
  {
    id: 1,
    nombre: 'Laleh',
    apellidos: 'Ahmadi',
    tags: ['vip', 'bono_activo'],
    ltv: 4_800,
    lastAppointment: new Date(NOW - 2 * 3600_000).toISOString(),
    lastAppointmentServicio: 'Thai Massage 60 min',
    lastAppointmentSala: 'Sala Zen',
  },
  {
    id: 2,
    nombre: 'Marcus',
    apellidos: 'Lindqvist',
    tags: ['frecuente'],
    ltv: 2_100,
    lastAppointment: new Date(NOW - DAY_MS).toISOString(),
    lastAppointmentServicio: 'Reflexología podal',
    lastAppointmentSala: 'Sala Lotus',
  },
  {
    id: 3,
    nombre: 'Yuki',
    apellidos: 'Tanaka',
    tags: ['nuevo'],
    ltv: 90,
    lastAppointment: null,
    lastAppointmentServicio: null,
    lastAppointmentSala: null,
  },
];

// ── Appointment mock data ─────────────────────────────────────────────────────

export const MOCK_APPOINTMENTS: readonly IDashboardAppointmentRow[] = [
  {
    id: 101,
    fechaHoraInicio: '2026-05-14T09:00:00',
    clienteNombre: 'Laleh Ahmadi',
    servicioNombre: 'Thai Massage 60 min',
    terapeutaNombre: 'Naree A.',
    salaNombre: 'Sala Zen',
    estado: 'confirmada',
  },
  {
    id: 102,
    fechaHoraInicio: '2026-05-14T10:00:00',
    clienteNombre: 'Marcus Lindqvist',
    servicioNombre: 'Reflexología podal',
    terapeutaNombre: 'Suda B.',
    salaNombre: 'Sala Lotus',
    estado: 'pendiente',
  },
  {
    id: 103,
    fechaHoraInicio: '2026-05-14T11:30:00',
    clienteNombre: 'Yuki Tanaka',
    servicioNombre: 'Aromaterapia 90 min',
    terapeutaNombre: 'Naree A.',
    salaNombre: 'Sala Zen',
    estado: 'confirmada',
  },
  {
    id: 104,
    fechaHoraInicio: '2026-05-14T13:00:00',
    clienteNombre: 'Carla Méndez',
    servicioNombre: 'Thai Massage 90 min',
    terapeutaNombre: 'Kanya C.',
    salaNombre: 'Sala Bambú',
    estado: 'en_curso',
  },
  {
    id: 105,
    fechaHoraInicio: '2026-05-14T15:00:00',
    clienteNombre: 'Erik Svensson',
    servicioNombre: 'Masaje deportivo',
    terapeutaNombre: 'Suda B.',
    salaNombre: 'Sala Lotus',
    estado: 'pendiente',
  },
] as const;

// ── Volume mock data ──────────────────────────────────────────────────────────

const RAW_VOLUME: Record<string, number> = {
  '0_0': 2,
  '0_1': 3,
  '0_2': 2,
  '0_3': 1,
  '0_4': 2,
  '0_5': 1,
  '0_6': 2,
  '0_7': 1,
  '0_8': 1,
  '1_0': 3,
  '1_1': 5,
  '1_2': 4,
  '1_3': 3,
  '1_4': 3,
  '1_5': 2,
  '1_6': 2,
  '1_7': 1,
  '1_8': 1,
  '1_9': 1,
  '2_0': 5,
  '2_1': 7,
  '2_2': 8,
  '2_3': 6,
  '2_4': 5,
  '2_5': 4,
  '2_6': 3,
  '2_7': 2,
  '2_8': 2,
  '2_9': 1,
  '3_0': 4,
  '3_1': 6,
  '3_2': 7,
  '3_3': 5,
  '3_4': 4,
  '3_5': 3,
  '3_6': 3,
  '3_7': 2,
  '3_8': 1,
  '3_9': 1,
  '4_0': 3,
  '4_1': 5,
  '4_2': 5,
  '4_3': 4,
  '4_4': 3,
  '4_5': 3,
  '4_6': 4,
  '4_7': 3,
  '4_8': 2,
  '4_9': 1,
  '5_0': 2,
  '5_1': 3,
  '5_2': 3,
  '5_3': 3,
  '5_4': 4,
  '5_5': 4,
  '5_6': 3,
  '5_7': 2,
  '5_8': 1,
  '6_0': 1,
  '6_1': 1,
  '6_2': 2,
  '6_3': 2,
  '6_4': 2,
  '6_5': 1,
  '6_6': 1,
};

const buildVolumeData = (): readonly IVolumeData[] => {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const entries: IVolumeData[] = [];
  for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + dayOffset);
    const isoDay = date.toISOString().split('T')[0];
    for (let slotIndex = 0; slotIndex <= 9; slotIndex++) {
      const hour = 9 + slotIndex;
      const value = RAW_VOLUME[`${dayOffset}_${slotIndex}`] ?? 0;
      if (value > 0) {
        entries.push({ day: isoDay, hour, value });
      }
    }
  }
  return entries;
};

export const MOCK_VOLUME_DATA: readonly IVolumeData[] = buildVolumeData();

/**
 * Clientes.fixtures.ts — Mock data for the ClientesPage static phase.
 *
 * Used as a fallback when the Supabase adapter returns 0 results so that
 * the UI is always populated during development.
 */

import type {
  IClientesKPIData,
  IClienteDetalle,
  ICitaEnriquecida,
  IClienteTableRow,
} from './Clientes.types';

// ── Table rows mock (8 clients) ───────────────────────────────────────────────

export const MOCK_CLIENTES_TABLE: readonly IClienteTableRow[] = [
  {
    clienteId: 1,
    nombreCompleto: 'Lucía Ramos',
    telefono: '+34 611 234 567',
    email: 'lucia.ramos@email.com',
    segmento: 'vip',
    activo: true,
    ultimaVisita: new Date('2026-04-10'),
    ritualFavorito: 'Tradicional Tailandés',
    duracionRitual: 90,
    frecuenciaVisitas: 2.0,
    gastoAnual: 190_000,
    totalVisitasAnio: 22,
    createdAt: new Date('2023-09-01'),
  },
  {
    clienteId: 2,
    nombreCompleto: 'Diego Romero',
    telefono: '+34 622 345 678',
    email: 'diego.romero@email.com',
    segmento: 'inactivo',
    activo: false,
    ultimaVisita: new Date('2025-06-15'),
    ritualFavorito: 'Aceites Cálidos',
    duracionRitual: 60,
    frecuenciaVisitas: 0,
    gastoAnual: 0,
    totalVisitasAnio: 0,
    createdAt: new Date('2022-03-15'),
  },
  {
    clienteId: 3,
    nombreCompleto: 'Adrián Torres',
    telefono: '+34 644 567 890',
    email: 'adrian.torres@email.com',
    segmento: 'activo',
    activo: true,
    ultimaVisita: new Date('2026-03-20'),
    ritualFavorito: 'Piedras Calientes',
    duracionRitual: 75,
    frecuenciaVisitas: 1.3,
    gastoAnual: 45_000,
    totalVisitasAnio: 6,
    createdAt: new Date('2023-01-10'),
  },
  {
    clienteId: 4,
    nombreCompleto: 'Inés Vega',
    telefono: '+34 633 456 789',
    email: 'ines.vega@email.com',
    segmento: 'nuevo',
    activo: true,
    ultimaVisita: new Date('2026-05-01'),
    ritualFavorito: null,
    duracionRitual: null,
    frecuenciaVisitas: 0.7,
    gastoAnual: 12_000,
    totalVisitasAnio: 2,
    createdAt: new Date('2026-04-01'),
  },
  {
    clienteId: 5,
    nombreCompleto: 'Carlos Fuentes',
    telefono: '+34 655 678 901',
    email: 'carlos.fuentes@email.com',
    segmento: 'activo',
    activo: true,
    ultimaVisita: new Date('2026-02-14'),
    ritualFavorito: 'Reflexología',
    duracionRitual: 45,
    frecuenciaVisitas: 0.9,
    gastoAnual: 32_000,
    totalVisitasAnio: 5,
    createdAt: new Date('2022-11-20'),
  },
  {
    clienteId: 6,
    nombreCompleto: 'Elena Vargas',
    telefono: '+34 666 789 012',
    email: 'elena.vargas@email.com',
    segmento: 'en_riesgo',
    activo: true,
    ultimaVisita: new Date('2025-11-30'),
    ritualFavorito: 'Tradicional Tailandés',
    duracionRitual: 90,
    frecuenciaVisitas: 0.2,
    gastoAnual: 18_000,
    totalVisitasAnio: 1,
    createdAt: new Date('2021-07-08'),
  },
  {
    clienteId: 7,
    nombreCompleto: 'Sara Castillo',
    telefono: '+34 677 890 123',
    email: 'sara.castillo@email.com',
    segmento: 'activo',
    activo: true,
    ultimaVisita: new Date('2026-04-28'),
    ritualFavorito: 'Aceites Cálidos',
    duracionRitual: 60,
    frecuenciaVisitas: 1.1,
    gastoAnual: 28_000,
    totalVisitasAnio: 4,
    createdAt: new Date('2023-05-22'),
  },
  {
    clienteId: 8,
    nombreCompleto: 'Paula Herrera',
    telefono: '+34 688 901 234',
    email: 'paula.herrera@email.com',
    segmento: 'vip',
    activo: true,
    ultimaVisita: new Date('2026-05-10'),
    ritualFavorito: 'Cuatro Manos',
    duracionRitual: 120,
    frecuenciaVisitas: 2.3,
    gastoAnual: 210_000,
    totalVisitasAnio: 18,
    createdAt: new Date('2020-12-01'),
  },
] as const;

// ── KPI mock ──────────────────────────────────────────────────────────────────

export const MOCK_KPI: IClientesKPIData = {
  totalClientes: 642,
  nuevos30Dias: 24,
  recurrenciaPct: 68,
  gastoMedioCliente: 18_600, // 186 €
} as const;

// ── Client detail mock ────────────────────────────────────────────────────────

const MOCK_PROXIMA_CITA: ICitaEnriquecida = {
  citaId: 101,
  fechaHoraInicio: new Date('2026-06-15T11:00:00'),
  fechaHoraFin: new Date('2026-06-15T12:30:00'),
  estado: 'confirmada',
  servicioNombre: 'Tradicional Tailandés',
  duracionMinutos: 90,
  salaNombre: 'Sala Zen',
  terapeutaNombre: 'Naree Apinya',
  valoracion: null,
};

const MOCK_CITAS_RECIENTES: readonly ICitaEnriquecida[] = [
  {
    citaId: 99,
    fechaHoraInicio: new Date('2026-04-10T10:00:00'),
    fechaHoraFin: new Date('2026-04-10T11:00:00'),
    estado: 'completada',
    servicioNombre: 'Aceites Cálidos',
    duracionMinutos: 60,
    salaNombre: 'Sala Zen',
    terapeutaNombre: 'Naree Apinya',
    valoracion: 5,
  },
  {
    citaId: 85,
    fechaHoraInicio: new Date('2026-03-02T09:30:00'),
    fechaHoraFin: new Date('2026-03-02T11:00:00'),
    estado: 'completada',
    servicioNombre: 'Tradicional Tailandés',
    duracionMinutos: 90,
    salaNombre: 'Sala Serenidad',
    terapeutaNombre: 'Naree Apinya',
    valoracion: 4,
  },
] as const;

export const MOCK_LUCIA_DETALLE: IClienteDetalle = {
  cliente: {
    id: 7,
    nombre: 'Lucía',
    apellidos: 'Ramos',
    email: 'lucia.ramos@email.com',
    telefono: '+34 611 234 567',
    fechaNacimiento: null,
    observaciones: 'Tensión recurrente en zona lumbar. Prefiere presión media-alta.',
    activo: true,
    createdAt: new Date('2023-09-01T00:00:00'),
    updatedAt: new Date('2024-11-20T00:00:00'),
  },
  segmento: 'vip',
  plan: 'Bono 10 sesiones',
  puntos: 340,
  gastoAnio: 190_000, // 1 900 €
  totalVisitasAnio: 22,
  proximaCita: MOCK_PROXIMA_CITA,
  citasRecientes: MOCK_CITAS_RECIENTES,
  notaEstudio: 'Tensión recurrente en zona lumbar. Prefiere presión media-alta.',
  notaAutor: 'Naree Apinya',
  notaFecha: null,
};

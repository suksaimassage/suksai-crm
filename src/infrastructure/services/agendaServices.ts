/**
 * infrastructure/services/agendaServices.ts — Agenda composition root
 *
 * Wires the domain services (CitaService, AvailabilityService) to their concrete
 * Supabase adapters and exposes them as module-level singletons.
 *
 * This is the deliberate "Option A" from the Analyst spec: ALL cita mutations
 * flow through the domain service (which owns the overlap-prevention and
 * estado-transition rules) rather than calling adapters directly. The mutation
 * hooks (useCreateCita, useRescheduleCita, …) import these singletons.
 *
 * Lives in the INFRASTRUCTURE layer because it is the binding seam between the
 * domain ports and their Supabase adapter implementations — only infrastructure
 * may depend on both. (Placing it in application/ would pull Supabase adapters
 * into the application layer, which repo-map.md forbids.)
 */

import { CitaService, AvailabilityService } from '@domain/index';

import { SupabaseCitaAdapter } from '@infra/adapters/SupabaseCitaAdapter';
import { SupabaseHorarioAdapter } from '@infra/adapters/SupabaseHorarioAdapter';
import { SupabaseAusenciaAdapter } from '@infra/adapters/SupabaseAusenciaAdapter';
import { SupabaseSalaAdapter } from '@infra/adapters/SupabaseSalaAdapter';
import { SupabaseServicioAdapter } from '@infra/adapters/SupabaseServicioAdapter';
import { SupabaseUsuarioCentroAdapter } from '@infra/adapters/SupabaseUsuarioCentroAdapter';

// ── Adapter singletons (module scope — instantiated once) ──────────────────────
const citaRepository = new SupabaseCitaAdapter();
const horarioRepository = new SupabaseHorarioAdapter();
const ausenciaRepository = new SupabaseAusenciaAdapter();
const salaRepository = new SupabaseSalaAdapter();
const servicioRepository = new SupabaseServicioAdapter();
const usuarioCentroRepository = new SupabaseUsuarioCentroAdapter();

// ── Domain service singletons ──────────────────────────────────────────────────
export const citaService = new CitaService({
  citaRepository,
  horarioRepository,
  ausenciaRepository,
  salaRepository,
  servicioRepository,
  usuarioCentroRepository,
});

export const availabilityService = new AvailabilityService({
  horarioRepository,
  ausenciaRepository,
  citaRepository,
  salaRepository,
});

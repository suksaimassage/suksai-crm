/**
 * database.types.ts — TypeScript mirror of the `suksai` schema.
 *
 * Schema source of truth: .claude/rules/database-schema.md
 * Auth flow spec:         .claude/flows/auth-login.md
 *
 * Auth: Supabase Auth JWT (auth.users → suksai.usuarios via auth_user_id).
 * No columna `password` en suksai.usuarios — hash nunca sale de auth.users.
 *
 * Tables (suksai schema):
 *   usuarios        — application profile linked to auth.users via auth_user_id
 *   roles           — named roles: superadmin | masajista | recepcionista
 *   usuarios_roles  — many-to-many: one user can hold multiple roles
 *   ausencias       — therapist absences / leave
 *   centros         — massage center locations
 *   salas           — rooms within a centro
 *   tipo_servicios  — service categories
 *   servicios       — individual services offered
 *   servicios_centro — junction: which services are available at which centro
 *   usuarios_centro  — junction: which users work at which centro
 *   horarios_trabajo — therapist work schedules (recurring weekly or one-off)
 *   clientes        — client / customer records
 *   citas           — appointments
 *
 * All IDs are bigint in Postgres → number in TypeScript (safe JS range).
 * Add new tables to IDatabase.suksai.Tables as the schema grows.
 */

import type { TNombreRol } from '@domain/types';

// ── suksai.usuarios ───────────────────────────────────────────────────────────
// `password` does NOT exist on this table — authentication is handled by Supabase
// Auth JWT (auth.users). `auth_user_id` is the pivot linking the two systems.
// Never expose `auth_user_id` in API responses — internal-only for RPCs.

export interface IUsuariosRow {
  readonly id: number;
  readonly nombre: string;
  readonly apellidos: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
  readonly auth_user_id: string | null; // uuid FK → auth.users(id)
}

export interface IUsuariosInsert {
  nombre: string;
  email: string;
  apellidos?: string;
  telefono?: string | null;
  is_active?: boolean;
}

export interface IUsuariosUpdate {
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string | null;
  is_active?: boolean;
  auth_user_id?: string | null;
}

// ── suksai.roles ──────────────────────────────────────────────────────────────

export interface IRolesRow {
  readonly id: number;
  readonly nombre: TNombreRol;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface IRolesInsert {
  nombre: TNombreRol;
}

export interface IRolesUpdate {
  nombre?: TNombreRol;
}

// ── suksai.usuarios_roles ─────────────────────────────────────────────────────
// Many-to-many bridge. Unique constraint: (usuario_id, rol_id).

export interface IUsuariosRolesRow {
  readonly id: number;
  readonly usuario_id: number;
  readonly rol_id: number;
}

export interface IUsuariosRolesInsert {
  usuario_id: number;
  rol_id: number;
}

// UPDATE is used to change rol_id (DELETE is not permitted by RLS for the authenticated role).
export interface IUsuariosRolesUpdate {
  rol_id?: number;
}

// ── suksai.ausencias ──────────────────────────────────────────────────────────

export interface IAusenciasRow {
  readonly id: number;
  readonly usuario_id: number;
  readonly tipo: string;
  readonly fecha_inicio: string;
  readonly fecha_fin: string;
  readonly activa: boolean; // approval flag — true = approved/active; false = pending or deactivated
  readonly aprobado_por: number; // FK → usuarios(id) — NOT NULL
  readonly observaciones: string | null;
  readonly created_at: string;
}

export interface IAusenciasInsert {
  usuario_id: number;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  aprobado_por: number; // NOT NULL — quien aprueba la ausencia
  activa?: boolean;
  observaciones?: string | null;
}

export interface IAusenciasUpdate {
  activa?: boolean;
  aprobado_por?: number;
  observaciones?: string | null;
  fecha_inicio?: string;
  fecha_fin?: string;
}

// ── suksai.centros ────────────────────────────────────────────────────────────

export interface ICentrosRow {
  readonly id: number;
  readonly nombre: string;
  readonly direccion: string;
  readonly ciudad: string;
  readonly codigo_postal: string | null;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly activo: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ICentrosInsert {
  nombre: string;
  direccion: string;
  ciudad?: string;
  codigo_postal?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo?: boolean;
}

export interface ICentrosUpdate {
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo?: boolean;
}

// ── suksai.salas ──────────────────────────────────────────────────────────────

export interface ISalasRow {
  readonly id: number;
  readonly nombre: string;
  readonly centro_id: number | null;
  readonly capacidad: number;
  readonly activa: boolean;
  readonly descripcion: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ISalasInsert {
  nombre: string;
  centro_id?: number | null;
  capacidad?: number;
  activa?: boolean;
  descripcion?: string | null;
}

export interface ISalasUpdate {
  nombre?: string;
  centro_id?: number | null;
  capacidad?: number;
  activa?: boolean;
  descripcion?: string | null;
}

// ── suksai.tipo_servicios ─────────────────────────────────────────────────────

export interface ITipoServiciosRow {
  readonly id: number;
  readonly nombre: string;
  readonly categoria: string;
  readonly created_at: string;
}

export interface ITipoServiciosInsert {
  nombre: string;
  categoria: string;
}

export interface ITipoServiciosUpdate {
  nombre?: string;
  categoria?: string;
}

// ── suksai.servicios ──────────────────────────────────────────────────────────

export interface IServiciosRow {
  readonly id: number;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly duracion: number;
  readonly precio: number | null;
  readonly descuento: number;
  readonly permite_bono: boolean;
  readonly sesiones_totales: number | null;
  readonly tipo_servicio: number;
  readonly estado: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface IServiciosInsert {
  nombre: string;
  duracion: number;
  tipo_servicio: number;
  descripcion?: string | null;
  precio?: number | null;
  descuento?: number;
  permite_bono?: boolean;
  sesiones_totales?: number | null;
  estado?: string;
}

export interface IServiciosUpdate {
  nombre?: string;
  descripcion?: string | null;
  duracion?: number;
  precio?: number | null;
  descuento?: number;
  permite_bono?: boolean;
  sesiones_totales?: number | null;
  tipo_servicio?: number;
  estado?: string;
}

// ── suksai.servicios_centro ───────────────────────────────────────────────────

export interface IServiciosCentroRow {
  readonly id: number;
  readonly centro_id: number;
  readonly servicio_id: number;
  readonly created_at: string;
}

export interface IServiciosCentroInsert {
  centro_id: number;
  servicio_id: number;
}

// ── suksai.usuarios_centro ────────────────────────────────────────────────────

export interface IUsuariosCentroRow {
  readonly id: number;
  readonly usuario_id: number;
  readonly centro_id: number;
  readonly es_principal: boolean; // true = centro habitual del usuario
  readonly activo: boolean; // soft-delete flag — false = unassigned (no DELETE policy)
  readonly created_at: string;
}

export interface IUsuariosCentroInsert {
  usuario_id: number;
  centro_id: number;
  es_principal?: boolean; // default false en DB
  activo?: boolean; // default false en DB — asignación empieza inactiva hasta activación explícita
}

export interface IUsuariosCentroUpdate {
  es_principal?: boolean;
  activo?: boolean;
}

// ── suksai.horarios_trabajo ───────────────────────────────────────────────────

export interface IHorariosTrabajoRow {
  readonly id: number;
  readonly usuario_id: number | null;
  readonly centro_id: number; // FK → centros(id) — NOT NULL
  readonly tipo: string;
  readonly dia_semana: number | null;
  readonly fecha: string | null;
  readonly hora_inicio: string;
  readonly hora_fin: string;
  readonly activo: boolean; // soft-delete flag — false = deactivated (no DELETE policy)
  readonly created_at: string;
  readonly updated_at: string;
}

export interface IHorariosTrabajoInsert {
  usuario_id?: number | null;
  tipo: string;
  dia_semana?: number | null;
  fecha?: string | null;
  hora_inicio: string;
  hora_fin: string;
  centro_id: number; // NOT NULL — obligatorio
  activo?: boolean; // default true en DB
}

export interface IHorariosTrabajoUpdate {
  usuario_id?: number | null; // updatable: a Day-view drag can reassign the shift to another therapist
  tipo?: string;
  dia_semana?: number | null;
  fecha?: string | null;
  hora_inicio?: string;
  hora_fin?: string;
  centro_id?: number;
  activo?: boolean;
}

// ── suksai.clientes ───────────────────────────────────────────────────────────

export interface IClientesRow {
  readonly id: number;
  readonly nombre: string;
  readonly apellidos: string | null;
  readonly email: string | null;
  readonly telefono: string | null;
  readonly observaciones: string | null;
  readonly activo?: boolean;
  readonly created_at: string;
  readonly updated_at?: string;
}

export interface IClientesInsert {
  nombre: string;
  apellidos?: string | null;
  email?: string | null;
  telefono?: string | null;
  observaciones?: string | null;
}

export interface IClientesUpdate {
  nombre?: string;
  apellidos?: string | null;
  email?: string | null;
  telefono?: string | null;
  observaciones?: string | null;
  activo?: boolean;
}

// ── suksai.citas ──────────────────────────────────────────────────────────────

export interface ICitasRow {
  readonly id: number;
  /** Null when no therapist is assigned yet (cita is in 'sin_asignar' estado). */
  readonly usuario_id: number | null;
  readonly centro_id: number;
  /** Null when no room is assigned yet (cita is in 'sin_asignar' estado). */
  readonly sala_id: number | null;
  readonly servicio_id: number;
  /** Null when no client is assigned yet (cita is in 'sin_asignar' estado). */
  readonly cliente_id: number | null;
  readonly fecha_inicio: string; // ISO 8601 — NOT NULL en DB
  readonly fecha_fin: string; // ISO 8601 — NOT NULL en DB
  readonly estado: string | null;
  readonly observaciones: string | null;
  readonly created_at: string;
}

export interface ICitasInsert {
  /** Optional: omit or null to create a 'sin_asignar' cita. */
  usuario_id?: number | null;
  centro_id: number;
  /** Optional: omit or null to create a 'sin_asignar' cita. */
  sala_id?: number | null;
  servicio_id: number;
  /** Optional: omit or null to create a 'sin_asignar' cita. */
  cliente_id?: number | null;
  fecha_inicio: string; // NOT NULL
  fecha_fin: string; // NOT NULL
  estado?: string | null;
  observaciones?: string | null;
}

export interface ICitasUpdate {
  usuario_id?: number | null; // null = clear therapist assignment
  sala_id?: number | null; // null = clear room assignment
  servicio_id?: number; // reschedule/edit can change the service
  cliente_id?: number | null; // null = clear client assignment
  fecha_inicio?: string; // NOT NULL in DB — omit to leave unchanged, never null
  fecha_fin?: string; // NOT NULL in DB — omit to leave unchanged, never null
  estado?: string | null;
  observaciones?: string | null;
}

// ── IDatabase — Supabase client generic ───────────────────────────────────────
// Used as: createClient<IDatabase>(url, key)
// Ensures all .from() calls and .rpc() calls are type-checked against the schema.
//
// Why TSchemaShape<T>?
// TypeScript `interface` declarations are "open" types (augmentable) and do NOT
// extend `Record<string, unknown>` — the GenericSchema constraint Supabase uses.
// A homomorphic mapped type `{ [K in keyof T]: T[K] }` produces a structurally
// equivalent CLOSED type that DOES satisfy `Record<string, unknown>`.
// All domain interfaces (IUsuariosRow, etc.) keep their `readonly` modifiers;
// TSchemaShape just bridges the structural gap for the Supabase client generic.
type TSchemaShape<T> = { [K in keyof T]: T[K] };

/**
 * ICitaEnrichadaRow — result shape for the enriched cita queries
 * used by SupabaseCitaAdapter.findEnrichedByCliente.
 * This is NOT a table row type — it is a query result helper.
 */
export interface ICitaEnrichadaRow {
  readonly id: number;
  readonly fecha_inicio: string | null;
  readonly fecha_fin: string | null;
  readonly estado: string | null;
  readonly servicio_id: number | null;
  readonly sala_id: number | null;
  readonly usuario_id: number | null;
}

export interface IDatabase {
  suksai: {
    Tables: {
      usuarios: {
        Row: TSchemaShape<IUsuariosRow>;
        Insert: TSchemaShape<IUsuariosInsert>;
        Update: TSchemaShape<IUsuariosUpdate>;
        Relationships: [];
      };
      roles: {
        Row: TSchemaShape<IRolesRow>;
        Insert: TSchemaShape<IRolesInsert>;
        Update: TSchemaShape<IRolesUpdate>;
        Relationships: [];
      };
      usuarios_roles: {
        Row: TSchemaShape<IUsuariosRolesRow>;
        Insert: TSchemaShape<IUsuariosRolesInsert>;
        Update: TSchemaShape<IUsuariosRolesUpdate>;
        Relationships: [];
      };
      ausencias: {
        Row: TSchemaShape<IAusenciasRow>;
        Insert: TSchemaShape<IAusenciasInsert>;
        Update: TSchemaShape<IAusenciasUpdate>;
        Relationships: [];
      };
      centros: {
        Row: TSchemaShape<ICentrosRow>;
        Insert: TSchemaShape<ICentrosInsert>;
        Update: TSchemaShape<ICentrosUpdate>;
        Relationships: [];
      };
      salas: {
        Row: TSchemaShape<ISalasRow>;
        Insert: TSchemaShape<ISalasInsert>;
        Update: TSchemaShape<ISalasUpdate>;
        Relationships: [];
      };
      tipo_servicios: {
        Row: TSchemaShape<ITipoServiciosRow>;
        Insert: TSchemaShape<ITipoServiciosInsert>;
        Update: TSchemaShape<ITipoServiciosUpdate>;
        Relationships: [];
      };
      servicios: {
        Row: TSchemaShape<IServiciosRow>;
        Insert: TSchemaShape<IServiciosInsert>;
        Update: TSchemaShape<IServiciosUpdate>;
        Relationships: [];
      };
      servicios_centro: {
        Row: TSchemaShape<IServiciosCentroRow>;
        Insert: TSchemaShape<IServiciosCentroInsert>;
        Update: Record<string, never>;
        Relationships: [];
      };
      usuarios_centro: {
        Row: TSchemaShape<IUsuariosCentroRow>;
        Insert: TSchemaShape<IUsuariosCentroInsert>;
        Update: TSchemaShape<IUsuariosCentroUpdate>;
        Relationships: [];
      };
      horarios_trabajo: {
        Row: TSchemaShape<IHorariosTrabajoRow>;
        Insert: TSchemaShape<IHorariosTrabajoInsert>;
        Update: TSchemaShape<IHorariosTrabajoUpdate>;
        Relationships: [];
      };
      clientes: {
        Row: TSchemaShape<IClientesRow>;
        Insert: TSchemaShape<IClientesInsert>;
        Update: TSchemaShape<IClientesUpdate>;
        Relationships: [];
      };
      citas: {
        Row: TSchemaShape<ICitasRow>;
        Insert: TSchemaShape<ICitasInsert>;
        Update: TSchemaShape<ICitasUpdate>;
        Relationships: [
          {
            foreignKeyName: 'citas_servicio_id_fkey';
            columns: ['servicio_id'];
            referencedRelation: 'servicios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'citas_usuario_id_fkey';
            columns: ['usuario_id'];
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'citas_cliente_id_fkey';
            columns: ['cliente_id'];
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'citas_centro_id_fkey';
            columns: ['centro_id'];
            referencedRelation: 'centros';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'citas_sala_id_fkey';
            columns: ['sala_id'];
            referencedRelation: 'salas';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      /**
       * clientes_ultima_visita — most recent completed visit date per client.
       *
       * Created by: .claude/migrations/005_clientes_stats_aggregates.sql
       * SECURITY INVOKER — RLS on suksai.citas is applied, so a terapeuta
       * only sees rows for their own citas.
       *
       * Used by: SupabaseClienteAdapter.findAllWithStats (ultimaVisita aggregation)
       */
      clientes_ultima_visita: {
        Row: {
          readonly cliente_id: number;
          readonly ultima_visita: string | null; // ISO 8601 timestamp
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      /**
       * get_current_user_profile — resolve profile + roles for the authenticated caller.
       *
       * Uses auth.uid() to look up the suksai.usuarios row linked via auth_user_id.
       * Returns one row with aggregated roles[], or empty array if user is not found
       * or is_active = false.
       *
       * Called by: SupabaseAuthAdapter.signIn, getSession, useAuthBootstrap.
       * Migration:  .claude/migrations/001_supabase_auth_migration.sql
       */
      get_current_user_profile: {
        Args: Record<never, never>;
        Returns: {
          id: number;
          nombre: string;
          email: string;
          is_active: boolean;
          roles: string[];
        }[];
      };
      /**
       * kpi_recurrencia_90d — recurrencia percentage (0-100) of clients who
       * visited in the last 90 days and came back more than once.
       * Replicates the JS Map-based recurrence calculation in findClienteKPI.
       *
       * SECURITY INVOKER — RLS on suksai.citas applies.
       * Returns: integer 0-100 (the recurrenciaPct value directly).
       *
       * Migration: .claude/migrations/005_clientes_stats_aggregates.sql
       */
      kpi_recurrencia_90d: {
        Args: Record<never, never>;
        Returns: number; // integer 0-100
      };
    };
    Enums: Record<never, never>;
  };
}

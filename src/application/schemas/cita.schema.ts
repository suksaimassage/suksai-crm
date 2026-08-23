import { z } from 'zod';

/**
 * Validation schema for the CitaModal create/edit form.
 *
 * Mirrors the precedent in terapeuta.schema.ts (Zod, ES messages, z.infer
 * exports). The form collects: cliente, servicio, therapist, sala, fecha
 * (YYYY-MM-DD) and horaInicio (HH:MM, one of the available slots). The end time
 * is DERIVED from the service duration downstream — it is not a form field, so
 * it is absent here by design (Analyst edge case #2: end must be structurally
 * un-editable).
 */

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Local (wall-clock) today as YYYY-MM-DD — string compare == chronological for this format. */
function localTodayStr(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const citaBaseSchema = z.object({
  // Optional fields — may be assigned after creation (estado 'sin_asignar').
  clienteId: z.number().int().positive().nullish(),
  usuarioId: z.number().int().positive().nullish(),
  salaId: z.number().int().positive().nullish(),
  // Always required.
  servicioId: z
    .number({ message: 'Selecciona un servicio' })
    .int()
    .positive('Selecciona un servicio'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha válida'),
  horaInicio: z.string().regex(HORA_REGEX, 'Selecciona una hora de inicio'),
  observaciones: z.string().optional(),
});

/**
 * Create rejects past dates (same-day is allowed, so a walk-in earlier today can
 * still be logged). Editing an existing cita does NOT carry this rule — a past
 * cita must remain editable (e.g. to mark it completada/no_presentado).
 *
 * `centroId` is required ONLY on create: the modal lets the user pick which
 * centro the cita belongs to (it scopes servicio/sala/masajista). On edit the
 * centro is read-only (changing it would invalidate the existing sala/servicio/
 * masajista), so it is absent from the edit schema by design.
 */
export const citaCreateSchema = citaBaseSchema
  .extend({
    centroId: z.number({ message: 'Selecciona un centro' }).int().positive('Selecciona un centro'),
  })
  .refine((data) => data.fecha >= localTodayStr(), {
    message: 'No se pueden crear citas en fechas pasadas.',
    path: ['fecha'],
  });

export const citaEditSchema = citaBaseSchema;

export type TCitaCreateInput = z.infer<typeof citaCreateSchema>;
export type TCitaEditInput = z.infer<typeof citaEditSchema>;

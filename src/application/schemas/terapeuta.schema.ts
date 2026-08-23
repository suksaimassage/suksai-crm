import { z } from 'zod';

/**
 * When `principalCentroId` is provided (non-null), it MUST be one of the
 * assigned `centroIds`. The UI prevents the violation, but the refine guards
 * against programming errors and surfaces a domain-validation message.
 */
const principalInCentros = (data: {
  readonly centroIds?: readonly number[];
  readonly principalCentroId?: number | null;
}): boolean => {
  if (data.principalCentroId === null || data.principalCentroId === undefined) return true;
  return (data.centroIds ?? []).includes(data.principalCentroId);
};

const PRINCIPAL_REFINE = {
  message: 'El centro principal debe estar entre los centros asignados.',
  path: ['principalCentroId'] as PropertyKey[],
};

export const terapeutaCreateSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellidos: z.string().optional(),
    email: z.email('Introduce un correo válido'),
    telefono: z.string().optional(),
    centroIds: z.array(z.number()).default([]),
    principalCentroId: z.number().nullable().optional(),
    rolNombre: z.string().min(1, 'Selecciona un rol'),
  })
  .refine(principalInCentros, PRINCIPAL_REFINE);

export const terapeutaUpdateSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellidos: z.string().optional(),
    email: z.email('Introduce un correo válido').optional(),
    telefono: z.string().optional(),
    centroIds: z.array(z.number()).default([]),
    principalCentroId: z.number().nullable().optional(),
    rolNombre: z.string().min(1, 'Selecciona un rol').optional(),
  })
  .refine(principalInCentros, PRINCIPAL_REFINE);

export type TTerapeutaCreateInput = z.infer<typeof terapeutaCreateSchema>;
export type TTerapeutaUpdateInput = z.infer<typeof terapeutaUpdateSchema>;

import { z } from 'zod';

export const centroCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  direccion: z.string().optional().or(z.literal('')),
  ciudad: z.string().min(1, 'La ciudad es obligatoria'),
  codigoPostal: z.string().optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  email: z.union([z.email('Introduce un correo válido'), z.literal('')]).optional(),
});

export const centroUpdateSchema = centroCreateSchema.partial().extend({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  activo: z.boolean().optional(),
});

export type TCentroCreateInput = z.infer<typeof centroCreateSchema>;
export type TCentroUpdateInput = z.infer<typeof centroUpdateSchema>;

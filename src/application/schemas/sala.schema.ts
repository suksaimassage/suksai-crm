import { z } from 'zod';

export const salaCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  capacidad: z.coerce.number().int().min(1, 'La capacidad mínima es 1'),
  descripcion: z.string().optional().or(z.literal('')),
});

export const salaUpdateSchema = salaCreateSchema.partial().extend({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  activa: z.boolean().optional(),
});

export type TSalaCreateInput = z.infer<typeof salaCreateSchema>;
export type TSalaUpdateInput = z.infer<typeof salaUpdateSchema>;

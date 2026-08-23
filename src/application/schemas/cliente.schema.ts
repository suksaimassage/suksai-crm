import { z } from 'zod';

export const clienteCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  email: z.union([z.email('Introduce un correo válido'), z.literal('')]).optional(),
  telefono: z.string().regex(/^\d*$/, 'Solo cifras, sin espacios').optional().or(z.literal('')),
  observaciones: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

export const clienteUpdateSchema = clienteCreateSchema.partial().extend({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
});

export type TClienteCreateInput = z.infer<typeof clienteCreateSchema>;
export type TClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;

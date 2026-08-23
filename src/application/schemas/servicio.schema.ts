import { z } from 'zod';

const servicioBaseObjectSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipoServicioId: z.number({ error: 'Selecciona una categoría' }),
  duracionMinutos: z
    .number({ error: 'La duración es obligatoria' })
    .min(15, 'La duración mínima es 15 minutos'),
  precioBase: z
    .string()
    .min(1, 'El precio es obligatorio')
    .refine(
      (v) => {
        const n = parseFloat(v.replace(',', '.'));
        return !isNaN(n) && n >= 0;
      },
      { message: 'Introduce un importe válido en euros' },
    ),
  esBono: z.boolean().default(false),
  sesionesTotales: z.number().min(2, 'Mínimo 2 sesiones').optional(),
  tieneDescuento: z.boolean().default(false),
  porcentajeDescuento: z.number().min(1).max(100).optional(),
  centroIds: z.array(z.number()).default([]),
});

export const servicioCreateSchema = servicioBaseObjectSchema.superRefine((data, ctx) => {
  if (data.esBono && (data.sesionesTotales === undefined || data.sesionesTotales < 2)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Los bonos requieren al menos 2 sesiones',
      path: ['sesionesTotales'],
    });
  }
  if (
    data.tieneDescuento &&
    (data.porcentajeDescuento === undefined ||
      data.porcentajeDescuento < 1 ||
      data.porcentajeDescuento > 100)
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'El descuento debe estar entre 1 y 100',
      path: ['porcentajeDescuento'],
    });
  }
});

export const servicioUpdateSchema = servicioBaseObjectSchema
  .partial()
  .extend({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
  })
  .superRefine((data, ctx) => {
    if (data.esBono && (data.sesionesTotales === undefined || data.sesionesTotales < 2)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Los bonos requieren al menos 2 sesiones',
        path: ['sesionesTotales'],
      });
    }
    if (
      data.tieneDescuento &&
      (data.porcentajeDescuento === undefined ||
        data.porcentajeDescuento < 1 ||
        data.porcentajeDescuento > 100)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'El descuento debe estar entre 1 y 100',
        path: ['porcentajeDescuento'],
      });
    }
  });

export type TServicioCreateInput = z.infer<typeof servicioCreateSchema>;
export type TServicioUpdateInput = z.infer<typeof servicioUpdateSchema>;

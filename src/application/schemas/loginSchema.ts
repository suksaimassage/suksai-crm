/**
 * application/schemas/loginSchema.ts — Zod schema for the login form.
 *
 * Bridges raw form strings to domain Value Objects (Email).
 * Error keys are i18n namespace:key references resolved at the UI layer.
 */

import { z } from 'zod';
import { Email } from '@domain/value-objects/Email';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'login:field.email.required')
    .max(254)
    .refine((value) => {
      try {
        Email.create(value);
        return true;
      } catch {
        return false;
      }
    }, 'login:field.email.invalid'),
  password: z.string().min(1, 'login:field.password.required').max(128),
});

export type ILoginFormValues = z.infer<typeof loginSchema>;

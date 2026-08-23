/**
 * Form.context — Contexto neutral del compound component Form
 *
 * Este módulo aloja el FormContext y sus dos hooks consumidores. Vive separado
 * de `Form.tsx` y `Form.items.tsx` para romper la dependencia circular entre
 * ambos (Form.tsx importa FormInput de Form.items; Form.items necesita los hooks
 * de contexto). Al residir en un módulo neutral que NO importa de Form.items, el
 * grafo deja de tener ciclo.
 *
 * Integración:
 * - El contexto FormContext provee register/setValue/getError (vía el shape que
 *   inyecta useForm en `form._ctx`).
 * - Los controles del design system leen el contexto si está disponible para
 *   auto-registrarse. Si no hay provider (uso standalone), funcionan igual.
 */

import { createContext, useContext } from 'react';

// ─── Context ──────────────────────────────────────────────────────────────────

export interface IFormContextValue {
  readonly hasBody?: boolean;
  readonly setValue: (name: string, value: unknown) => void;
  readonly errors: Record<string, string | null>;
}

export const FormContext = createContext<IFormContextValue | null>(null);

/**
 * Hook OPCIONAL para consumir el FormContext.
 *
 * Devuelve `null` cuando se usa fuera de un <Form>. Los controles del design
 * system (DatePicker, Switch, Radio, Checkbox, DatePickerGroup, …) están
 * diseñados para funcionar dentro o fuera de un <Form>: leen el contexto vía
 * optional chaining (`form?.setValue` / `form?.errors`) y caen a su estado
 * interno cuando no hay provider. Por eso este hook NUNCA lanza — su firma
 * `| null` es real, no decorativa.
 */
export function useFormContext(): IFormContextValue | null {
  return useContext(FormContext);
}

/**
 * Variante ESTRICTA: exige que el componente viva dentro de un <Form>.
 * La usan las subpartes estructurales del compound component (Header/Body/
 * Footer/Input), cuyo uso fuera de <Form> es un error de programación.
 *
 * Interno al módulo Form — no se reexporta desde `index.ts`.
 */
export function useFormContextOrThrow(): IFormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Form components must be used within <Form>');
  }
  return context;
}

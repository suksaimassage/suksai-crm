/**
 * useForm — Hook de gestión de formulario
 *
 * Responsabilidad única: registrar campos, rastrear valores,
 * ejecutar validaciones y exponer handleSubmit.
 *
 * Patrón de integración con FormInput:
 *   const form = useForm();
 *   <Form form={form}>
 *     <FormInput name="email" validate={validateEmail} />
 *   </Form>
 *
 * FormInput notifica cambios via onChange nativo (name + value).
 * useForm recoge los valores escuchando el evento nativo del form
 * o mediante setValue expuesto en el contexto.
 */

import type React from 'react';
import type { ValidateFn } from '@infra/components/ui/common/Form/Form.types';
import { useCallback, useRef, useState } from 'react';

// ── Local type aliases (mirror the types declared in Form.tsx) ────────────────

type TFormValues = Record<string, unknown>;
type TFormErrors = Record<string, string | null>;

interface IFormContextValue {
  readonly register: (name: string, validate?: ValidateFn) => void;
  readonly setValue: (name: string, value: unknown) => void;
  readonly getError: (name: string) => string | null;
  readonly errors: TFormErrors;
  readonly submitted: boolean;
}

interface IUseFormReturn {
  values: TFormValues;
  errors: TFormErrors;
  isValid: boolean;
  reset: () => void;
  handleSubmit: (
    onValid: (values: TFormValues) => void,
    onInvalid?: (errors: TFormErrors) => void,
  ) => (event: React.SyntheticEvent<HTMLFormElement>) => void;
}

export function useForm(): IUseFormReturn & { _ctx: IFormContextValue } {
  const validators = useRef<Record<string, ValidateFn | undefined>>({});
  const [values, setValues] = useState<TFormValues>({});
  const [errors, setErrors] = useState<TFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // ── Registro de campo ──────────────────────────────────────────────────────
  const register = useCallback((name: string, validate?: ValidateFn) => {
    if (validators.current[name] !== validate) {
      validators.current[name] = validate;
    }
    setValues((prev) => (name in prev ? prev : { ...prev, [name]: '' }));
  }, []);

  // ── Actualizar valor + validar ─────────────────────────────────────────────
  const setValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const validate = validators.current[name];
    const err = validate ? (validate(value) ?? null) : null;
    setErrors((prev) => ({ ...prev, [name]: err }));
  }, []);

  // ── Leer error de un campo ─────────────────────────────────────────────────
  const getError = useCallback(
    (name: string): string | null => {
      if (!submitted) return null;
      const e = (errors as Record<string, string | null | undefined>)[name];
      return e ?? null;
    },
    [submitted, errors],
  );

  // ── Validar todos los campos ───────────────────────────────────────────────
  const validateAll = useCallback((): TFormErrors => {
    const result: TFormErrors = {};
    for (const [name, validate] of Object.entries(validators.current)) {
      const val = (values as Record<string, unknown>)[name];
      result[name] = validate ? (validate(val) ?? null) : null;
    }
    return result;
  }, [values]);

  // ── isValid ────────────────────────────────────────────────────────────────
  const isValid = Object.values(errors as Record<string, string | null>).every((e) => !e);

  // ── handleSubmit ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (
      onValid: (v: TFormValues) => void,
      onInvalid?: (e: TFormErrors) => void,
    ): ((event: React.SyntheticEvent<HTMLFormElement>) => void) =>
      (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);
        const allErrors = validateAll();
        setErrors(allErrors);
        const hasErrors = Object.values(allErrors as Record<string, string | null>).some(Boolean);
        if (hasErrors) {
          onInvalid?.(allErrors);
          return;
        }
        onValid(values);
      },
    [values, validateAll],
  );

  // ── reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setValues((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, ''])));
    setErrors({});
    setSubmitted(false);
  }, []);

  return {
    values,
    errors,
    isValid,
    reset,
    handleSubmit,
    _ctx: { register, setValue, getError, errors, submitted },
  };
}

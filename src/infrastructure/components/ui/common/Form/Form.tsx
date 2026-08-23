/**
 * Form — Componente de formulario con apariencia de Card
 *
 * Composición:
 *   <Form form={form} onSubmit={handleValid}>
 *     <FormHeader title="Login" />
 *     <FormBody>
 *       <FormInput name="email" label="Email" validate={...} />
 *     </FormBody>
 *     <FormFooter align="right">
 *       <Button type="submit">Entrar</Button>
 *     </FormFooter>
 *   </Form>
 *
 * Integración con FormInput:
 * - El contexto FormContext provee register/setValue/getError.
 * - FormInput debe leer el contexto si está disponible para auto-registrarse.
 *   Si no usa el contexto (uso standalone), funciona igual que siempre.
 * - El Form escucha el evento nativo `change` del <form> como fallback,
 *   capturando name + value de cualquier input hijo.
 */

import React, { type FormHTMLAttributes, type ReactNode } from 'react';
import type { TCardSize, TCardVariant } from '@infra/components/ui/common/Card';
import { FormInput } from './Form.items';
import { FormContext, useFormContextOrThrow, type IFormContextValue } from './Form.context';
import type { IFormInputProps } from './Form.item.types';
import * as S from './Form.styles';

// ─── Form ─────────────────────────────────────────────────────────────────────

/**
 * TFormValues acepta cualquier tipo de campo:
 * string (FormInput), boolean (Switch/Checkbox), Date | null (DatePicker), etc.
 */
type TFormValues = Record<string, unknown>;
type TFormErrors = Record<string, string | null>;

interface UseFormReturn {
  /** Valores actuales de todos los campos registrados */
  values: TFormValues;
  /** Errores actuales */
  errors: TFormErrors;
  /** true si todos los campos registrados son válidos */
  isValid: boolean;
  /** Limpia valores y errores */
  reset: () => void;
  /** Handler para el onSubmit del Form */
  handleSubmit: (
    onValid: (values: TFormValues) => void,
    onInvalid?: (errors: TFormErrors) => void,
  ) => React.SubmitEventHandler<HTMLFormElement>;
}

interface IFormProps extends Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'onInvalid' | 'action'
> {
  readonly children: ReactNode;
  /** Mismas variantes que Card: default | outlined | elevated | filled */
  readonly variant?: TCardVariant;
  /** Mismos tamaños que Card: sm | md | lg */
  readonly size?: TCardSize;
  /** Ancho 100% */
  readonly fullWidth?: boolean;
  /**
   * Instancia de useForm — conecta el Form con el hook de validación interna.
   * Opcional cuando se usa `action` como React 19 dispatch (useActionState).
   */
  readonly form?: UseFormReturn & { _ctx: IFormContextValue };
  /** Llamado con los valores cuando todos los campos son válidos */
  readonly onSubmit?: (values: TFormValues) => void;
  /** Llamado cuando hay errores en el submit */
  readonly onInvalid?: (errors: TFormErrors) => void;
  /**
   * Acepta una string (URL nativa) o una función React 19 (useActionState dispatch).
   * Cuando es función, el Form delega el submit a React — no se llama preventDefault.
   */
  readonly action?: string | ((formData: FormData) => void | Promise<void>);
}

type TFormComponent = React.FC<IFormProps> & {
  Header: React.FC<IFormHeaderProps>;
  Body: React.FC<IFormBodyProps>;
  Footer: React.FC<IFormFooterProps>;
  Input: React.FC<IFormInputProps & { ref?: React.Ref<HTMLElement> }>;
};

const NOOP_CTX: IFormContextValue = {
  setValue: () => {
    /* fallback — no form instance */
  },
  errors: {},
};

export const Form: TFormComponent = ({
  children,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  form,
  onSubmit,
  onInvalid,
  action,
  className,
  id,
  ...htmlProps
}) => {
  const noop = () => {
    /* do nothing */
  };

  // When action is a React 19 dispatch fn, let React own the submission.
  // Otherwise use the internal handleSubmit which calls preventDefault.
  const isReact19Action = typeof action === 'function';
  const submitHandler =
    !isReact19Action && form ? form.handleSubmit(onSubmit ?? noop, onInvalid) : undefined;

  const ctx = form?._ctx ?? NOOP_CTX;

  /**
   * Fallback: captura cambios de cualquier input nativo dentro del form
   * que NO esté conectado via contexto (inputs HTML puros, etc.).
   */
  const handleChange = form
    ? (e: React.ChangeEvent<HTMLFormElement>) => {
        const target = e.target as unknown as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement;
        if (target.name) {
          ctx.setValue(target.name, target.value);
        }
      }
    : undefined;

  return (
    <FormContext.Provider value={ctx}>
      <S.StyledForm
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        onSubmit={submitHandler}
        onChange={handleChange}
        action={action}
        className={className}
        id={id}
        noValidate
        {...htmlProps}
      >
        {children}
      </S.StyledForm>
    </FormContext.Provider>
  );
};

// ─── FormHeader ───────────────────────────────────────────────────────────────

interface IFormHeaderProps {
  readonly children?: ReactNode;
  readonly title?: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
}

const FormHeader: React.FC<IFormHeaderProps> = ({ children, title, subtitle, action }) => {
  useFormContextOrThrow();
  return (
    <S.StyledFormHeader $size="md">
      <S.StyledFormHeaderContent>
        {title && <S.StyledFormHeaderTitle>{title}</S.StyledFormHeaderTitle>}
        {subtitle && <S.StyledFormHeaderSubtitle>{subtitle}</S.StyledFormHeaderSubtitle>}
        {children}
      </S.StyledFormHeaderContent>
      {action && <S.StyledFormHeaderAction>{action}</S.StyledFormHeaderAction>}
    </S.StyledFormHeader>
  );
};

FormHeader.displayName = 'Form.Header';

// ─── FormBody ─────────────────────────────────────────────────────────────────

interface IFormBodyProps {
  readonly children: ReactNode;
}

const FormBody: React.FC<IFormBodyProps> = ({ children }) => {
  useFormContextOrThrow();
  return <S.StyledFormBody $size="md">{children}</S.StyledFormBody>;
};

FormBody.displayName = 'Form.Body';

// ─── FormFooter ───────────────────────────────────────────────────────────────

interface IFormFooterProps {
  readonly children: ReactNode;
  readonly align?: 'left' | 'center' | 'right' | 'between';
}

const FormFooter: React.FC<IFormFooterProps> = ({ children, align = 'right' }) => {
  useFormContextOrThrow();
  return (
    <S.StyledFormFooter $size="md" $align={align}>
      {children}
    </S.StyledFormFooter>
  );
};

FormFooter.displayName = 'Form.Footer';

// ─── Display names ────────────────────────────────────────────────────────────

Form.displayName = 'Form';
Form.Header = FormHeader;
Form.Body = FormBody;
Form.Footer = FormFooter;
Form.Input = FormInput;

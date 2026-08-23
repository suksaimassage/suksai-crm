/**
 * Radio / RadioGroup — Selección única accesible
 *
 * SOLID:
 * - SRP: Radio renderiza un ítem; RadioGroup orquesta la lista y el estado.
 * - OCP: variantes extensibles via RadioVariant sin tocar la lógica base.
 * - LSP: Radio funciona standalone o dentro de RadioGroup.
 * - ISP: RadioProps ≠ RadioGroupProps — mínimas y separadas.
 * - DIP: form-friendly via FormContext (si existe), sino onChange directo.
 *
 * @example Standalone
 * <Radio value="opt" label="Opción" checked={val==="opt"} onChange={setVal} />
 *
 * @example Controlled group
 * <RadioGroup name="plan" value={plan} onChange={setPlan} options={PLANS} />
 *
 * @example Button strip
 * <RadioGroup name="size" variant="button" value={size} onChange={setSize} options={SIZES} />
 *
 * @example Form-friendly
 * <Form form={form} onSubmit={handleSubmit}>
 *   <RadioGroup name="role" label="Rol" options={ROLES} />
 * </Form>
 */

import React, { useId, useCallback } from 'react';
import * as S from './Radio.styles';
import { useFormContext } from '@infra/components/ui/common/Form';
import type { RadioProps, RadioGroupProps, RadioSize } from './Radio.types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconError = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 3.5v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
// Radio — ítem individual
// ════════════════════════════════════════════════════════════════════════════

/**
 * Radio — Responsabilidad única: renderizar un radio button accesible.
 * Soporta variantes default, card. (button se usa solo vía RadioGroup)
 */
export const Radio: React.FC<RadioProps> = ({
  value,
  label,
  description,
  icon,
  checked = false,
  onChange,
  name,
  disabled = false,
  size = 'md',
  variant = 'default',
  className,
  ariaLabel,
}) => {
  const uid = useId();

  const handleChange = useCallback(() => {
    if (!disabled) onChange?.(value);
  }, [disabled, onChange, value]);

  const circle = (
    <S.RadioCircle $size={size} $checked={checked} $disabled={disabled} aria-hidden="true" />
  );

  const labelContent = (
    <S.LabelContent>
      <S.LabelRow $size={size}>
        {icon}
        {label}
      </S.LabelRow>
      {description && <S.Description $size={size}>{description}</S.Description>}
    </S.LabelContent>
  );

  // ── variant: card ─────────────────────────────────────────────────────────
  if (variant === 'card') {
    return (
      <S.CardWrap
        htmlFor={uid}
        $size={size}
        $checked={checked}
        $disabled={disabled}
        className={className}
        data-disabled={disabled || undefined}
      >
        <S.HiddenInput
          type="radio"
          id={uid}
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          aria-checked={checked}
          aria-label={ariaLabel}
        />
        {circle}
        {icon && <S.CardIcon $checked={checked}>{icon}</S.CardIcon>}
        {labelContent}
      </S.CardWrap>
    );
  }

  // ── variant: default ──────────────────────────────────────────────────────
  return (
    <S.DefaultWrap
      htmlFor={uid}
      $size={size}
      $disabled={disabled}
      className={className}
      data-disabled={disabled || undefined}
    >
      <S.HiddenInput
        type="radio"
        id={uid}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        aria-checked={checked}
        aria-label={ariaLabel}
      />
      {circle}
      {labelContent}
    </S.DefaultWrap>
  );
};

Radio.displayName = 'Radio';

// ════════════════════════════════════════════════════════════════════════════
// ButtonItem — ítem del strip de botones (interno, no exportado)
// ════════════════════════════════════════════════════════════════════════════

const RadioButtonItem: React.FC<{
  option: RadioGroupProps['options'][number];
  name: string;
  checked: boolean;
  size: RadioSize;
  orientation: 'horizontal' | 'vertical';
  groupDisabled: boolean;
  onChange: (v: string) => void;
}> = ({ option, name, checked, size, orientation, groupDisabled, onChange }) => {
  const uid = useId();
  const disabled = groupDisabled || !!option.disabled;

  return (
    <S.ButtonItem
      htmlFor={uid}
      $size={size}
      $checked={checked}
      $disabled={disabled}
      $orientation={orientation}
    >
      <S.HiddenInput
        type="radio"
        id={uid}
        name={name}
        value={option.value}
        checked={checked}
        disabled={disabled}
        onChange={() => {
          if (!disabled) onChange(option.value);
        }}
        aria-checked={checked}
      />
      {option.icon}
      {option.label}
    </S.ButtonItem>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// RadioGroup — orquesta la lista, maneja estado y forma
// ════════════════════════════════════════════════════════════════════════════

/**
 * RadioGroup — Responsabilidad: gestionar el grupo de radios.
 * Se conecta a FormContext si existe (form-friendly).
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value: valueProp,
  onChange,
  variant = 'default',
  size = 'md',
  orientation = 'vertical',
  label,
  error: errorProp,
  hint,
  disabled = false,
  required = false,
  className,
}) => {
  // ── Form context integration ──────────────────────────────────────────────
  const form = useFormContext();

  const handleChange = useCallback(
    (val: string) => {
      onChange?.(val);
      form?.setValue(name, val);
    },
    [onChange, form, name],
  );

  const error = errorProp ?? null;

  // ── Button strip ──────────────────────────────────────────────────────────
  if (variant === 'button') {
    return (
      <S.GroupRoot className={className} aria-label={label} role="group">
        {label && (
          <S.GroupLegend>
            {label}
            {required && <S.RequiredMark aria-hidden="true">*</S.RequiredMark>}
          </S.GroupLegend>
        )}

        <S.OptionsWrap $orientation={orientation} $variant="button">
          <S.ButtonStrip $orientation={orientation} role="radiogroup" aria-label={label}>
            {options.map((opt) => (
              <RadioButtonItem
                key={opt.value}
                option={opt}
                name={name}
                checked={valueProp === opt.value}
                size={size}
                orientation={orientation}
                groupDisabled={disabled}
                onChange={handleChange}
              />
            ))}
          </S.ButtonStrip>
        </S.OptionsWrap>

        {(hint != null || error != null) && (
          <S.HintText $error={!!error}>
            {error && <IconError />}
            {error ?? hint}
          </S.HintText>
        )}
      </S.GroupRoot>
    );
  }

  // ── default / card ────────────────────────────────────────────────────────
  return (
    <S.GroupRoot className={className} aria-label={label}>
      {label && (
        <S.GroupLegend>
          {label}
          {required && <S.RequiredMark aria-hidden="true">*</S.RequiredMark>}
        </S.GroupLegend>
      )}

      <S.OptionsWrap $orientation={orientation} $variant={variant}>
        {options.map((opt) => (
          <Radio
            key={opt.value}
            value={opt.value}
            label={opt.label}
            description={opt.description}
            icon={opt.icon}
            checked={valueProp === opt.value}
            onChange={handleChange}
            name={name}
            disabled={disabled || opt.disabled}
            size={size}
            variant={variant}
          />
        ))}
      </S.OptionsWrap>

      {(hint != null || error != null) && (
        <S.HintText $error={!!error}>
          {error && <IconError />}
          {error ?? hint}
        </S.HintText>
      )}
    </S.GroupRoot>
  );
};

RadioGroup.displayName = 'RadioGroup';

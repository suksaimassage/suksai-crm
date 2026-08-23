/**
 * Checkbox / CheckboxGroup
 *
 * SOLID:
 * - SRP: Checkbox = un ítem bool. CheckboxGroup = lista multi-select.
 * - OCP: variantes via CheckboxVariant sin tocar lógica base.
 * - LSP: Checkbox funciona standalone o dentro de CheckboxGroup.
 * - ISP: ICheckboxProps ≠ ICheckboxGroupProps (boolean vs string[]).
 * - DIP: form-friendly via FormContext opcional.
 *
 * Diferencias clave vs Radio:
 * - checked es boolean (no string)
 * - Soporta estado `indeterminate` (guión — para "seleccionar todos" parcial)
 * - CheckboxGroup maneja string[] (multi-select, no exclusión mutua)
 * - FormContext: setValue serializa como JSON array
 *
 * @example
 * <Checkbox label="Acepto términos" checked={ok} onChange={setOk} />
 *
 * <CheckboxGroup
 *   name="features"
 *   options={FEATURES}
 *   value={selected}
 *   onChange={setSelected}
 *   variant="card"
 * />
 *
 * <CheckboxGroup name="tags" variant="button" options={TAGS} value={tags} onChange={setTags} />
 */

import React, { useId, useCallback, useRef, useEffect } from 'react';
import * as S from './Checkbox.styles';
import { useFormContext } from '@infra/components/ui/common/Form';
import type { ICheckboxProps, ICheckboxGroupProps, TCheckboxSize } from './Checkbox.types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconCheck = ({ size }: { size: TCheckboxSize }) => {
  const s = size === 'sm' ? 9 : size === 'lg' ? 14 : 11;
  return (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const IconMinus = ({ size }: { size: TCheckboxSize }) => {
  const s = size === 'sm' ? 9 : size === 'lg' ? 14 : 11;
  return (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const IconError = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 3.5v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── useIndeterminate — sincroniza la prop nativa indeterminate ───────────────

function useIndeterminate(indeterminate: boolean) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return ref;
}

// ════════════════════════════════════════════════════════════════════════════
// Checkbox — ítem individual
// ════════════════════════════════════════════════════════════════════════════

export const Checkbox: React.FC<ICheckboxProps> = ({
  name,
  label,
  description,
  icon,
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  className,
}) => {
  const uid = useId();
  const inputRef = useIndeterminate(indeterminate);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled) onChange?.(e.target.checked);
    },
    [disabled, onChange],
  );

  const isActive = checked || indeterminate;

  const box = (
    <S.CheckBox
      $size={size}
      $checked={checked}
      $indeterminate={indeterminate}
      $disabled={disabled}
      aria-hidden="true"
    >
      {indeterminate ? <IconMinus size={size} /> : <IconCheck size={size} />}
    </S.CheckBox>
  );

  const labelContent = (
    <S.LabelContent>
      <S.LabelRow $size={size}>
        {icon}
        {label}
      </S.LabelRow>
      {description && <S.Description>{description}</S.Description>}
    </S.LabelContent>
  );

  const hiddenInput = (
    <S.HiddenInput
      ref={inputRef}
      type="checkbox"
      id={uid}
      name={name}
      checked={checked}
      disabled={disabled}
      onChange={handleChange}
      aria-checked={indeterminate ? 'mixed' : checked}
    />
  );

  // ── variant: card ─────────────────────────────────────────────────────────
  if (variant === 'card') {
    return (
      <S.ButtonCardWrap
        htmlFor={uid}
        $size={size}
        $checked={isActive}
        $disabled={disabled}
        className={className}
      >
        {hiddenInput}
        {box}
        {icon && <S.ButtonCardIcon $checked={isActive}>{icon}</S.ButtonCardIcon>}
        {labelContent}
      </S.ButtonCardWrap>
    );
  }

  // ── variant: default ──────────────────────────────────────────────────────
  return (
    <S.DefaultWrap htmlFor={uid} $size={size} $disabled={disabled} className={className}>
      {hiddenInput}
      {box}
      {labelContent}
    </S.DefaultWrap>
  );
};

Checkbox.displayName = 'Checkbox';

// ════════════════════════════════════════════════════════════════════════════
// ButtonItem — ítem del strip multi-select (interno)
// ════════════════════════════════════════════════════════════════════════════

const CheckboxButtonItem: React.FC<{
  option: ICheckboxGroupProps['options'][number];
  name: string;
  checked: boolean;
  size: TCheckboxSize;
  orientation: 'horizontal' | 'vertical';
  groupDisabled: boolean;
  onToggle: (value: string) => void;
}> = ({ option, name, checked, size, orientation, groupDisabled, onToggle }) => {
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
        type="checkbox"
        id={uid}
        name={name}
        value={option.value}
        checked={checked}
        disabled={disabled}
        onChange={() => {
          if (!disabled) onToggle(option.value);
        }}
        aria-checked={checked}
      />
      {option.icon}
      {option.label}
    </S.ButtonItem>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// CheckboxGroup — multi-selección
// ════════════════════════════════════════════════════════════════════════════

export const CheckboxGroup: React.FC<ICheckboxGroupProps> = ({
  name,
  options,
  value: valueProp = [],
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
  const form = useFormContext();

  // Toggle de un valor en el array
  const handleToggle = useCallback(
    (val: string) => {
      const next = valueProp.includes(val)
        ? valueProp.filter((v) => v !== val)
        : [...valueProp, val];
      onChange?.(next);
      // FormContext: serializa array como JSON string
      form?.setValue(name, JSON.stringify(next));
    },
    [valueProp, onChange, form, name],
  );

  const error = errorProp ?? null;

  // ── variant: button ───────────────────────────────────────────────────────
  if (variant === 'button') {
    return (
      <S.GroupRoot className={className} aria-label={label}>
        {label && (
          <S.GroupLegend>
            {label}
            {required && <S.RequiredMark aria-hidden="true">*</S.RequiredMark>}
          </S.GroupLegend>
        )}
        <S.OptionsWrap $orientation={orientation} $variant="button">
          <S.ButtonStrip $orientation={orientation} role="group" aria-label={label}>
            {options.map((opt) => (
              <CheckboxButtonItem
                key={opt.value}
                option={opt}
                name={name}
                checked={valueProp.includes(opt.value)}
                size={size}
                orientation={orientation}
                groupDisabled={disabled}
                onToggle={handleToggle}
              />
            ))}
          </S.ButtonStrip>
        </S.OptionsWrap>
        {(hint ?? error) && (
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
          <Checkbox
            key={opt.value}
            name={name}
            label={opt.label}
            description={opt.description}
            icon={opt.icon}
            checked={valueProp.includes(opt.value)}
            onChange={() => {
              handleToggle(opt.value);
            }}
            disabled={disabled || opt.disabled}
            size={size}
            variant={variant}
          />
        ))}
      </S.OptionsWrap>
      {(hint ?? error) && (
        <S.HintText $error={!!error}>
          {error && <IconError />}
          {error ?? hint}
        </S.HintText>
      )}
    </S.GroupRoot>
  );
};

CheckboxGroup.displayName = 'CheckboxGroup';

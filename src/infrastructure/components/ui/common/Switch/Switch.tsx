/**
 * Switch — Componente de activar/desactivar
 *
 * SOLID:
 * - SRP: renderizado + estado local. Lógica de form delegada a FormContext.
 * - OCP: variantes/colores/tamaños via props.
 * - LSP: reemplazable por <input type="checkbox"> nativo en formularios.
 * - DIP: depende de SwitchProps (contrato) y FormContext (abstracción).
 *
 * Form-friendly:
 * - Registra su valor booleano en FormContext si recibe `name`.
 * - Soporta controlled (checked + onChange) y uncontrolled (defaultChecked).
 *
 * @example — Básico
 * <Switch label="Notificaciones" checked={on} onChange={setOn} />
 *
 * @example — Con iconos
 * <Switch iconOn={<MoonIcon />} iconOff={<SunIcon />} label="Modo oscuro" />
 *
 * @example — Variante card
 * <Switch variant="card" label="Emails de marketing" description="Recibirás ofertas semanales" />
 *
 * @example — Dentro de StepForm (form-friendly)
 * <Switch name="notifications" label="Activar alertas" />
 */

import React, { useState, useCallback, useId } from 'react';
import * as S from './Switch.styles';
import type { SwitchProps } from './Switch.types';
import { useFormContext } from '@infra/components/ui/common/Form';

export const Switch: React.FC<SwitchProps> = ({
  name,
  label,
  description,
  iconOn,
  iconOff,
  labelOn,
  labelOff,
  checked: checkedProp,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  color = 'primary',
  className,
}) => {
  const uid = useId();
  const form = useFormContext();

  // ── Estado interno (uncontrolled fallback) ──────────────────────────────
  const [internal, setInternal] = useState(defaultChecked);
  const checked = checkedProp ?? internal;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const next = e.target.checked;
      if (checkedProp === undefined) setInternal(next);
      onChange?.(next);
      // Form-friendly: registra en FormContext
      if (name) form?.setValue(name, String(next));
    },
    [disabled, checkedProp, onChange, name, form],
  );

  const showIcon = iconOn != null || iconOff != null;
  const currentIcon = checked ? iconOn : iconOff;

  return (
    <S.SwitchRoot className={className}>
      <S.Label
        htmlFor={uid}
        $variant={variant}
        $checked={checked}
        $disabled={disabled}
        $size={size}
      >
        {/* Input nativo oculto — accesible + form-serializable */}
        <S.HiddenInput
          id={uid}
          type="checkbox"
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          role="switch"
          aria-checked={checked}
        />

        {/* Track */}
        <S.Track
          $size={size}
          $checked={checked}
          $disabled={disabled}
          $variant={variant}
          $color={color}
          aria-hidden="true"
        >
          {/* Etiquetas dentro del track (ej. "ON" / "OFF") */}
          {labelOn && (
            <S.TrackLabel $side="on" $size={size} $checked={checked}>
              {labelOn}
            </S.TrackLabel>
          )}
          {labelOff && (
            <S.TrackLabel $side="off" $size={size} $checked={checked}>
              {labelOff}
            </S.TrackLabel>
          )}

          {/* Thumb */}
          <S.Thumb $size={size} $checked={checked} $color={color}>
            {showIcon && currentIcon && (
              <S.ThumbIcon $size={size} key={String(checked)}>
                {currentIcon}
              </S.ThumbIcon>
            )}
          </S.Thumb>
        </S.Track>

        {/* Label + descripción */}
        {(label != null || description != null) && (
          <S.LabelContent>
            {label && <S.LabelText $size={size}>{label}</S.LabelText>}
            {description && <S.Description $size={size}>{description}</S.Description>}
          </S.LabelContent>
        )}
      </S.Label>
    </S.SwitchRoot>
  );
};

Switch.displayName = 'Switch';

/**
 * DatePicker / DateTimePicker
 *
 * El popup del calendario se renderiza vía createPortal + useFloatingPanel
 * para evitar recorte por overflow:hidden y auto-flip en el viewport.
 *
 * SOLID:
 * - SRP: orquesta trigger + popup + form integration.
 * - OCP: DateTimePicker extiende DatePicker con la sección de tiempo.
 * - DIP: depende de DatePickerProps (contrato), no de implementaciones.
 */
import React, { useState, useCallback, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFloatingPanel } from '@infra/hooks/useFloatingPanel';
import { useFormContext } from '@infra/components/ui/common/Form';
import { Calendar } from './DatePickerCalendar';
import type { DatePickerProps, DateTimePickerProps } from './DatePicker.types';
import * as S from './DatePicker.styles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(d: Date): string {
  return `${formatDate(d)}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function generateHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

function generateMinutes(step = 15): number[] {
  const mins: number[] = [];
  for (let m = 0; m < 60; m += step) mins.push(m);
  return mins;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ClearIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// ─── useClickOutsidePortal ────────────────────────────────────────────────────
// Click-outside that checks both trigger and floating panel (in portal).

function useClickOutsidePortal(
  triggerRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  cb: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        cb();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [triggerRef, panelRef, cb, enabled]);
}

// ─── useEscapeClose ───────────────────────────────────────────────────────────

function useEscapeClose(cb: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cb();
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [cb, enabled]);
}

// ─── TimePickerSection ────────────────────────────────────────────────────────

interface TimePickerSectionProps {
  date: Date;
  step?: number;
  onChange: (d: Date) => void;
}

const TimePickerSection: React.FC<TimePickerSectionProps> = ({ date, step = 15, onChange }) => {
  const { t } = useTranslation('common');
  const hours = generateHours();
  const minutes = generateMinutes(step);

  const setHour = (h: number) => {
    const d = new Date(date);
    d.setHours(h);
    onChange(d);
  };
  const setMin = (m: number) => {
    const d = new Date(date);
    d.setMinutes(m);
    onChange(d);
  };

  return (
    <>
      <S.TimeSeparator />
      <S.TimeWrap>
        <S.TimeLabel>
          <ClockIcon /> Hora
        </S.TimeLabel>
        <S.TimeRow>
          <S.TimeSelect
            value={date.getHours()}
            onChange={(e) => {
              setHour(Number(e.target.value));
            }}
            aria-label={t('datePicker.hourAriaLabel')}
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {h.toString().padStart(2, '0')}
              </option>
            ))}
          </S.TimeSelect>
          <S.TimeColon>:</S.TimeColon>
          <S.TimeSelect
            value={minutes.reduce((prev, curr) =>
              Math.abs(curr - date.getMinutes()) < Math.abs(prev - date.getMinutes()) ? curr : prev,
            )}
            onChange={(e) => {
              setMin(Number(e.target.value));
            }}
            aria-label={t('datePicker.minuteAriaLabel')}
          >
            {minutes.map((m) => (
              <option key={m} value={m}>
                {m.toString().padStart(2, '0')}
              </option>
            ))}
          </S.TimeSelect>
        </S.TimeRow>
      </S.TimeWrap>
    </>
  );
};

// ─── DatePicker ───────────────────────────────────────────────────────────────

export const DatePicker: React.FC<DatePickerProps> = ({
  name,
  label,
  hint,
  error: errorProp,
  disabled = false,
  required = false,
  variant = 'default',
  size = 'md',
  min,
  max,
  placeholder = 'Selecciona una fecha',
  value,
  defaultValue,
  onChange,
  className,
}) => {
  const { t } = useTranslation('common');
  const id = useId();
  const form = useFormContext();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<Date | null>(defaultValue ?? null);
  const current = isControlled ? (value ?? null) : internal;

  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const { panelRef, floatingStyles, mounted } = useFloatingPanel(triggerRef, open, {
    placement: 'bottom-start',
    offset: 6,
    matchTriggerWidth: false,
  });

  const formError = name ? (form?.errors[name] ?? null) : null;
  const error = errorProp ?? formError;

  const handleSelect = useCallback(
    (date: Date) => {
      if (!isControlled) setInternal(date);
      onChange?.(date);
      if (name) form?.setValue(name, date);
      setOpen(false);
    },
    [isControlled, onChange, name, form],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isControlled) setInternal(null);
      onChange?.(null);
      if (name) form?.setValue(name, null);
    },
    [isControlled, onChange, name, form],
  );

  useClickOutsidePortal(triggerRef, panelRef, close, open);
  useEscapeClose(close, open);

  return (
    <S.Root className={className}>
      {label && (
        <S.Label htmlFor={id}>
          {label}
          {required && (
            <span className="required" aria-hidden="true">
              *
            </span>
          )}
        </S.Label>
      )}

      <S.Trigger
        ref={triggerRef}
        id={id}
        type="button"
        $variant={variant}
        $size={size}
        $error={!!error}
        $disabled={disabled}
        $hasValue={!!current}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label ?? t('datePicker.selectDateAriaLabel')}
        disabled={disabled}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        <span className="dp-trigger-icon">
          <CalendarIcon />
        </span>
        <span className="dp-trigger-text">{current ? formatDate(current) : placeholder}</span>
        {current && (
          <span
            className="dp-clear"
            role="button"
            aria-label={t('datePicker.clearAriaLabel')}
            onClick={handleClear}
          >
            <ClearIcon />
          </span>
        )}
        <span className="dp-trigger-icon">
          <ChevronIcon />
        </span>
      </S.Trigger>

      {open &&
        mounted &&
        createPortal(
          <S.Popup
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('datePicker.selectDateAriaLabel')}
            style={floatingStyles}
          >
            <Calendar
              selected={current}
              min={min}
              max={max}
              onSelect={handleSelect}
              onClose={close}
            />
          </S.Popup>,
          document.body,
        )}

      {error && <S.FooterText $error>{error}</S.FooterText>}
      {!error && hint && <S.FooterText>{hint}</S.FooterText>}
    </S.Root>
  );
};

// ─── DateTimePicker ───────────────────────────────────────────────────────────

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  timeStep = 15,
  placeholder = 'Selecciona fecha y hora',
  ...props
}) => {
  const { t } = useTranslation('common');
  const id = useId();
  const form = useFormContext();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const {
    name,
    label,
    hint,
    error: errorProp,
    disabled = false,
    required = false,
    variant = 'default',
    size = 'md',
    min,
    max,
    value,
    defaultValue,
    onChange,
    className,
  } = props;

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<Date | null>(defaultValue ?? null);
  const current = isControlled ? (value ?? null) : internal;

  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const { panelRef, floatingStyles, mounted } = useFloatingPanel(triggerRef, open, {
    placement: 'bottom-start',
    offset: 6,
    matchTriggerWidth: false,
  });

  const formError = name ? (form?.errors[name] ?? null) : null;
  const error = errorProp ?? formError;

  const handleDaySelect = useCallback(
    (date: Date) => {
      const next = new Date(date);
      if (current) {
        next.setHours(current.getHours());
        next.setMinutes(current.getMinutes());
      } else {
        next.setHours(9);
        next.setMinutes(0);
      }
      if (!isControlled) setInternal(next);
      onChange?.(next);
      if (name) form?.setValue(name, next);
    },
    [current, isControlled, onChange, name, form],
  );

  const handleTimeChange = useCallback(
    (d: Date) => {
      if (!isControlled) setInternal(d);
      onChange?.(d);
      if (name) form?.setValue(name, d);
    },
    [isControlled, onChange, name, form],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isControlled) setInternal(null);
      onChange?.(null);
      if (name) form?.setValue(name, null);
    },
    [isControlled, onChange, name, form],
  );

  useClickOutsidePortal(triggerRef, panelRef, close, open);
  useEscapeClose(close, open);

  return (
    <S.Root className={className}>
      {label && (
        <S.Label htmlFor={id}>
          {label}
          {required && (
            <span className="required" aria-hidden="true">
              *
            </span>
          )}
        </S.Label>
      )}

      <S.Trigger
        ref={triggerRef}
        id={id}
        type="button"
        $variant={variant}
        $size={size}
        $error={!!error}
        $disabled={disabled}
        $hasValue={!!current}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        <span className="dp-trigger-icon">
          <CalendarIcon />
        </span>
        <span className="dp-trigger-text">{current ? formatDateTime(current) : placeholder}</span>
        {current && (
          <span
            className="dp-clear"
            role="button"
            aria-label={t('datePicker.clearAriaLabel')}
            onClick={handleClear}
          >
            <ClearIcon />
          </span>
        )}
        <span className="dp-trigger-icon">
          <ChevronIcon />
        </span>
      </S.Trigger>

      {open &&
        mounted &&
        createPortal(
          <S.Popup ref={panelRef} role="dialog" aria-modal="true" style={floatingStyles}>
            <Calendar
              selected={current}
              min={min}
              max={max}
              onSelect={handleDaySelect}
              onClose={close}
            />
            {current && (
              <TimePickerSection date={current} step={timeStep} onChange={handleTimeChange} />
            )}
          </S.Popup>,
          document.body,
        )}

      {error && <S.FooterText $error>{error}</S.FooterText>}
      {!error && hint && <S.FooterText>{hint}</S.FooterText>}
    </S.Root>
  );
};

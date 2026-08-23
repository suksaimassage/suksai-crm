/**
 * DatePickerGroup / DateTimePickerGroup — Range selectors (attached)
 *
 * CRITICAL FIXES:
 * - Popups rendered via createPortal → no layout collapse on open
 * - useFloatingPanel per trigger → viewport-safe positioning
 * - useClickOutsideMultiple → works across portal boundaries
 * - Error state propagated to GroupSeparatorIcon
 * - ESC closes active calendar
 *
 * SOLID:
 * - SRP: gestiona solo la lógica de rango (start/end).
 * - OCP: DateTimePickerGroup extiende DatePickerGroup con time section.
 * - DIP: delega renderizado del calendario a <Calendar />.
 */
import React, { useState, useCallback, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Calendar } from './DatePickerCalendar';
import { useFloatingPanel } from '@infra/hooks/useFloatingPanel';
import { useFormContext } from '@infra/components/ui/common/Form';
import type {
  DatePickerGroupProps,
  DateTimePickerGroupProps,
  DateRangeValue,
  DatePickerVariant,
  DatePickerSize,
} from './DatePicker.types';
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
  return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg
    width="15"
    height="15"
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
const ChevronIcon = () => (
  <svg
    width="13"
    height="13"
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
const ClockIcon = () => (
  <svg
    width="13"
    height="13"
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
const ArrowIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// ─── useClickOutsideMultiple ──────────────────────────────────────────────────
// Handles click-outside across multiple refs (including portal panels).

function useClickOutsideMultiple(
  refs: React.RefObject<HTMLElement | null>[],
  cb: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inside = refs.some((r) => r.current?.contains(target));
      if (!inside) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cb]);
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

// ─── TimeSection ──────────────────────────────────────────────────────────────

const TimeSection: React.FC<{
  date: Date;
  step?: number;
  label: string;
  onChange: (d: Date) => void;
}> = ({ date, step = 15, label, onChange }) => {
  const { t } = useTranslation('common');
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes: number[] = [];
  for (let m = 0; m < 60; m += step) minutes.push(m);

  return (
    <>
      <S.TimeSeparator />
      <S.TimeWrap>
        <S.TimeLabel>
          <ClockIcon /> {label}
        </S.TimeLabel>
        <S.TimeRow>
          <S.TimeSelect
            value={date.getHours()}
            onChange={(e) => {
              const d = new Date(date);
              d.setHours(Number(e.target.value));
              onChange(d);
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
            value={minutes.reduce((p, c) =>
              Math.abs(c - date.getMinutes()) < Math.abs(p - date.getMinutes()) ? c : p,
            )}
            onChange={(e) => {
              const d = new Date(date);
              d.setMinutes(Number(e.target.value));
              onChange(d);
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

// ─── GroupTrigger ─────────────────────────────────────────────────────────────

interface GroupTriggerProps {
  value: Date | null;
  placeholder: string;
  showDateTime?: boolean;
  active: boolean;
  error: boolean;
  disabled: boolean;
  size: DatePickerSize;
  variant: DatePickerVariant;
  id: string;
  label?: string;
  onClick: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}

const GroupTrigger = ({
  ref,
  value,
  placeholder,
  showDateTime = false,
  active,
  error,
  disabled,
  size,
  variant,
  id,
  label,
  onClick,
}: GroupTriggerProps) => (
  <S.Trigger
    ref={ref}
    id={id}
    type="button"
    $variant={variant}
    $size={size}
    $error={error}
    $disabled={disabled}
    $hasValue={!!value}
    aria-haspopup="dialog"
    aria-expanded={active}
    aria-label={label ?? placeholder}
    disabled={disabled}
    onClick={onClick}
  >
    <span className="dp-trigger-icon">
      <CalendarIcon />
    </span>
    <span className="dp-trigger-text">
      {value ? (showDateTime ? formatDateTime(value) : formatDate(value)) : placeholder}
    </span>
    <span className="dp-trigger-icon">
      <ChevronIcon />
    </span>
  </S.Trigger>
);

// ─── DatePickerGroup ──────────────────────────────────────────────────────────

export const DatePickerGroup: React.FC<DatePickerGroupProps> = ({
  label,
  hint,
  error: errorProp,
  disabled = false,
  required = false,
  variant = 'default',
  size = 'md',
  min,
  max,
  placeholderStart,
  placeholderEnd,
  nameStart,
  nameEnd,
  value,
  defaultValue,
  onChange,
  className,
}) => {
  const { t } = useTranslation('common');
  const idStart = useId();
  const idEnd = useId();
  const form = useFormContext();

  const startTriggerRef = useRef<HTMLButtonElement>(null);
  const endTriggerRef = useRef<HTMLButtonElement>(null);

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<DateRangeValue>(
    defaultValue ?? { start: null, end: null },
  );
  const range = isControlled ? value : internal;

  const [active, setActive] = useState<'start' | 'end' | null>(null);
  const close = useCallback(() => {
    setActive(null);
  }, []);

  // Floating panels — one per trigger
  const {
    panelRef: startPanelRef,
    floatingStyles: startFloatingStyles,
    mounted: startMounted,
  } = useFloatingPanel(startTriggerRef, active === 'start', {
    placement: 'bottom-start',
    offset: 6,
    matchTriggerWidth: false,
  });

  const {
    panelRef: endPanelRef,
    floatingStyles: endFloatingStyles,
    mounted: endMounted,
  } = useFloatingPanel(endTriggerRef, active === 'end', {
    placement: 'bottom-start',
    offset: 6,
    matchTriggerWidth: false,
  });

  const formError =
    (nameStart ? form?.errors[nameStart] : undefined) ??
    (nameEnd ? form?.errors[nameEnd] : undefined);
  const error = errorProp ?? formError;

  // Click-outside must check all 4 elements (2 triggers + 2 panels)
  useClickOutsideMultiple(
    [startTriggerRef, endTriggerRef, startPanelRef, endPanelRef],
    close,
    active !== null,
  );
  useEscapeClose(close, active !== null);

  const update = useCallback(
    (next: DateRangeValue) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
      if (nameStart) form?.setValue(nameStart, next.start);
      if (nameEnd) form?.setValue(nameEnd, next.end);
    },
    [isControlled, onChange, nameStart, nameEnd, form],
  );

  const handleSelectStart = useCallback(
    (date: Date) => {
      const next: DateRangeValue = {
        start: date,
        end: range.end && date > range.end ? null : range.end,
      };
      update(next);
      setActive('end'); // auto-advance
    },
    [range.end, update],
  );

  const handleSelectEnd = useCallback(
    (date: Date) => {
      const start = range.start;
      if (start && date < start) {
        update({ start: date, end: start });
      } else {
        update({ start: range.start, end: date });
      }
      setActive(null);
    },
    [range.start, update],
  );

  return (
    <S.GroupRoot className={className}>
      {label && (
        <S.GroupLabel as="div">
          {label}
          {required && (
            <span className="required" aria-hidden="true">
              *
            </span>
          )}
        </S.GroupLabel>
      )}

      {/* GroupAttached is ONLY the trigger row — no Popup child here */}
      <S.GroupAttached $error={!!error}>
        <GroupTrigger
          ref={startTriggerRef}
          id={idStart}
          value={range.start}
          placeholder={placeholderStart ?? t('datePicker.rangeStartPlaceholder')}
          active={active === 'start'}
          error={!!error}
          disabled={disabled}
          size={size}
          variant={variant}
          onClick={() => {
            setActive((a) => (a === 'start' ? null : 'start'));
          }}
        />

        <S.GroupSeparatorIcon $error={!!error}>
          <ArrowIcon />
        </S.GroupSeparatorIcon>

        <GroupTrigger
          ref={endTriggerRef}
          id={idEnd}
          value={range.end}
          placeholder={placeholderEnd ?? t('datePicker.rangeEndPlaceholder')}
          active={active === 'end'}
          error={!!error}
          disabled={disabled}
          size={size}
          variant={variant}
          onClick={() => {
            setActive((a) => (a === 'end' ? null : 'end'));
          }}
        />
      </S.GroupAttached>

      {/* Portals — rendered outside GroupAttached to prevent layout collapse */}
      {active === 'start' &&
        startMounted &&
        createPortal(
          <S.Popup
            ref={startPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('datePicker.selectStartDateAriaLabel')}
            style={startFloatingStyles}
          >
            <Calendar
              rangeStart={range.start}
              rangeEnd={range.end}
              min={min}
              max={max}
              onSelect={handleSelectStart}
              onClose={close}
              initialMonth={range.start ?? undefined}
            />
          </S.Popup>,
          document.body,
        )}

      {active === 'end' &&
        endMounted &&
        createPortal(
          <S.Popup
            ref={endPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('datePicker.selectEndDateAriaLabel')}
            style={endFloatingStyles}
          >
            <Calendar
              rangeStart={range.start}
              rangeEnd={range.end}
              min={range.start ?? min}
              max={max}
              onSelect={handleSelectEnd}
              onClose={close}
              initialMonth={range.end ?? range.start ?? undefined}
            />
          </S.Popup>,
          document.body,
        )}

      {error && <S.FooterText $error>{error}</S.FooterText>}
      {!error && hint && <S.FooterText>{hint}</S.FooterText>}
    </S.GroupRoot>
  );
};

// ─── DateTimePickerGroup ──────────────────────────────────────────────────────

export const DateTimePickerGroup: React.FC<DateTimePickerGroupProps> = ({
  timeStep = 15,
  placeholderStart,
  placeholderEnd,
  ...props
}) => {
  const { t } = useTranslation('common');
  const idStart = useId();
  const idEnd = useId();
  const form = useFormContext();

  const startTriggerRef = useRef<HTMLButtonElement>(null);
  const endTriggerRef = useRef<HTMLButtonElement>(null);

  const {
    label,
    hint,
    error: errorProp,
    disabled = false,
    required = false,
    variant = 'default',
    size = 'md',
    min,
    max,
    nameStart,
    nameEnd,
    value,
    defaultValue,
    onChange,
    className,
  } = props;

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<DateRangeValue>(
    defaultValue ?? { start: null, end: null },
  );
  const range = isControlled ? value : internal;

  const [active, setActive] = useState<'start' | 'end' | null>(null);
  const close = useCallback(() => {
    setActive(null);
  }, []);

  const {
    panelRef: startPanelRef,
    floatingStyles: startFloatingStyles,
    mounted: startMounted,
  } = useFloatingPanel(startTriggerRef, active === 'start', {
    placement: 'bottom-start',
    offset: 6,
    matchTriggerWidth: false,
  });

  const {
    panelRef: endPanelRef,
    floatingStyles: endFloatingStyles,
    mounted: endMounted,
  } = useFloatingPanel(endTriggerRef, active === 'end', {
    placement: 'bottom-start',
    offset: 6,
    matchTriggerWidth: false,
  });

  const formError =
    (nameStart ? form?.errors[nameStart] : undefined) ??
    (nameEnd ? form?.errors[nameEnd] : undefined);
  const error = errorProp ?? formError;

  useClickOutsideMultiple(
    [startTriggerRef, endTriggerRef, startPanelRef, endPanelRef],
    close,
    active !== null,
  );
  useEscapeClose(close, active !== null);

  const update = useCallback(
    (next: DateRangeValue) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
      if (nameStart) form?.setValue(nameStart, next.start);
      if (nameEnd) form?.setValue(nameEnd, next.end);
    },
    [isControlled, onChange, nameStart, nameEnd, form],
  );

  const applyDefaultTime = (date: Date, hour = 9): Date => {
    const d = new Date(date);
    d.setHours(hour);
    d.setMinutes(0);
    return d;
  };

  const handleDayStart = useCallback(
    (date: Date) => {
      const d = range.start
        ? new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            range.start.getHours(),
            range.start.getMinutes(),
          )
        : applyDefaultTime(date, 9);
      const end = range.end && d > range.end ? null : range.end;
      update({ start: d, end });
    },
    [range.start, range.end, update],
  );

  const handleTimeStart = useCallback(
    (d: Date) => {
      update({ start: d, end: range.end });
    },
    [range.end, update],
  );

  const handleDayEnd = useCallback(
    (date: Date) => {
      const d = range.end
        ? new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            range.end.getHours(),
            range.end.getMinutes(),
          )
        : applyDefaultTime(date, 18);
      update({ start: range.start, end: d });
    },
    [range.end, range.start, update],
  );

  const handleTimeEnd = useCallback(
    (d: Date) => {
      update({ start: range.start, end: d });
    },
    [range.start, update],
  );

  return (
    <S.GroupRoot className={className}>
      {label && (
        <S.GroupLabel as="div">
          {label}
          {required && (
            <span className="required" aria-hidden="true">
              *
            </span>
          )}
        </S.GroupLabel>
      )}

      <S.GroupAttached $error={!!error}>
        <GroupTrigger
          ref={startTriggerRef}
          id={idStart}
          value={range.start}
          placeholder={placeholderStart ?? t('datePicker.dateTimeStartPlaceholder')}
          showDateTime
          active={active === 'start'}
          error={!!error}
          disabled={disabled}
          size={size}
          variant={variant}
          label={t('datePicker.rangeStartLabel')}
          onClick={() => {
            setActive((a) => (a === 'start' ? null : 'start'));
          }}
        />

        <S.GroupSeparatorIcon $error={!!error}>
          <ArrowIcon />
        </S.GroupSeparatorIcon>

        <GroupTrigger
          ref={endTriggerRef}
          id={idEnd}
          value={range.end}
          placeholder={placeholderEnd ?? t('datePicker.dateTimeEndPlaceholder')}
          showDateTime
          active={active === 'end'}
          error={!!error}
          disabled={disabled}
          size={size}
          variant={variant}
          label={t('datePicker.rangeEndLabel')}
          onClick={() => {
            setActive((a) => (a === 'end' ? null : 'end'));
          }}
        />
      </S.GroupAttached>

      {active === 'start' &&
        startMounted &&
        createPortal(
          <S.Popup ref={startPanelRef} role="dialog" aria-modal="true" style={startFloatingStyles}>
            <Calendar
              rangeStart={range.start}
              rangeEnd={range.end}
              min={min}
              max={max}
              onSelect={handleDayStart}
              onClose={close}
              initialMonth={range.start ?? undefined}
            />
            {range.start && (
              <TimeSection
                date={range.start}
                step={timeStep}
                label={t('datePicker.timeStartLabel')}
                onChange={handleTimeStart}
              />
            )}
          </S.Popup>,
          document.body,
        )}

      {active === 'end' &&
        endMounted &&
        createPortal(
          <S.Popup ref={endPanelRef} role="dialog" aria-modal="true" style={endFloatingStyles}>
            <Calendar
              rangeStart={range.start}
              rangeEnd={range.end}
              min={range.start ?? min}
              max={max}
              onSelect={handleDayEnd}
              onClose={close}
              initialMonth={range.end ?? range.start ?? undefined}
            />
            {range.end && (
              <TimeSection
                date={range.end}
                step={timeStep}
                label={t('datePicker.timeEndLabel')}
                onChange={handleTimeEnd}
              />
            )}
          </S.Popup>,
          document.body,
        )}

      {error && <S.FooterText $error>{error}</S.FooterText>}
      {!error && hint && <S.FooterText>{hint}</S.FooterText>}
    </S.GroupRoot>
  );
};

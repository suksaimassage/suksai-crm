/**
 * DatePicker — Styled Components
 * SRP: solo estilos. Mobile First.
 */
import styled, { css, keyframes } from 'styled-components';
import type { DatePickerVariant, DatePickerSize } from './DatePicker.types';
import { StyledButton } from '@infra/components/ui/common/Button/Button.styles';

// ─── Animations ───────────────────────────────────────────────────────────────

const popIn = keyframes`
  from { opacity: 0; transform: translateY(6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZES: Record<DatePickerSize, { h: string; px: string; fs: string; radius: string }> = {
  sm: { h: '34px', px: '10px', fs: '0.8125rem', radius: '8px' },
  md: { h: '42px', px: '12px', fs: '0.9375rem', radius: '10px' },
  lg: { h: '50px', px: '14px', fs: '1rem', radius: '12px' },
};

// ─── Variant tokens ───────────────────────────────────────────────────────────

const getVariant = (v: DatePickerVariant) => {
  const map: Record<DatePickerVariant, ReturnType<typeof css>> = {
    default: css`
      background: var(--dp-bg-default);
      border: 1.5px solid var(--dp-border);
      &:focus-within {
        border-color: var(--dp-accent);
        box-shadow: 0 0 0 3px var(--dp-ring);
      }
    `,
    outlined: css`
      background: transparent;
      border: 2px solid var(--dp-border);
      &:focus-within {
        border-color: var(--dp-accent);
        box-shadow: 0 0 0 3px var(--dp-ring);
      }
    `,
    ghost: css`
      background: transparent;
      border: 1.5px solid transparent;
      &:focus-within {
        background: var(--dp-bg-default);
        border-color: var(--dp-accent);
        box-shadow: 0 0 0 3px var(--dp-ring);
      }
    `,
  };
  return map[v];
};

// ─── CSS var block — shared across Root, GroupRoot, Popup ─────────────────────

const dpVars = css`
  --dp-accent: ${({ theme }) => theme.color.primary[500]};
  --dp-accent-light: ${({ theme }) => theme.color.primary[100]};
  --dp-accent-hover: ${({ theme }) => theme.color.primary[600]};
  --dp-ring: ${({ theme }) => theme.color.primary[500]}22;
  --dp-border: ${({ theme }) => theme.color.neutral[200]};
  --dp-border-error: ${({ theme }) => theme.color.error[500]};
  --dp-ring-error: ${({ theme }) => theme.color.error[500]}22;
  --dp-bg-default: ${({ theme }) => theme.color.background.light};
  --dp-bg-popup: ${({ theme }) => theme.color.background.light};
  --dp-text: ${({ theme }) => theme.color.neutral[900]};
  --dp-text-muted: ${({ theme }) => theme.color.neutral[400]};
  --dp-text-label: ${({ theme }) => theme.color.neutral[700]};
  --dp-day-hover: ${({ theme }) => theme.color.neutral[100]};
  --dp-day-inrange: ${({ theme }) => theme.color.primary[50]};
  --dp-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  --dp-disabled-bg: ${({ theme }) => theme.color.neutral[50]};
  --dp-disabled-fg: ${({ theme }) => theme.color.neutral[300]};

  /* ── Dark mode overrides — all variables flip to neutralDark/intent scale ── */
  ${({ theme }) =>
    theme.isDark &&
    css`
      --dp-accent: ${theme.color.intent.primary};
      --dp-accent-light: ${theme.color.brand.gold.bg};
      --dp-accent-hover: ${theme.color.intent.primaryHover};
      --dp-ring: ${theme.color.intent.primary}33;
      --dp-border: ${theme.border.color.neutral.light};
      --dp-border-error: ${theme.color.error[300]};
      --dp-ring-error: ${theme.color.error[300]}33;
      --dp-bg-default: ${theme.color.background.card};
      --dp-bg-popup: ${theme.color.background.elevated};
      --dp-text: ${theme.color.text.primary};
      --dp-text-muted: ${theme.color.text.muted};
      --dp-text-label: ${theme.color.text.secondary};
      --dp-day-hover: ${theme.color.background.neutral};
      --dp-day-inrange: ${theme.color.brand.gold.bg};
      --dp-shadow: 0 8px 32px oklch(0.08 0.02 204 / 0.4), 0 2px 8px oklch(0.08 0.02 204 / 0.24);
      --dp-disabled-bg: ${theme.color.background.light};
      --dp-disabled-fg: ${theme.color.text.muted};
    `}
`;

// ─── Root ─────────────────────────────────────────────────────────────────────

export const Root = styled.div`
  ${dpVars}
  display: inline-flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
`;

// ─── Label ────────────────────────────────────────────────────────────────────

export const Label = styled.label`
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--dp-text-label);
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 3px;

  span.required {
    color: var(--dp-border-error);
    font-size: 0.875rem;
    line-height: 1;
  }
`;

// ─── Trigger (input visible) ──────────────────────────────────────────────────

interface TriggerProps {
  $variant: DatePickerVariant;
  $size: DatePickerSize;
  $error: boolean;
  $disabled: boolean;
  $hasValue: boolean;
}

export const Trigger = styled.button<TriggerProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: ${(p) => SIZES[p.$size].h};
  /* Explicit min-height prevents flex collapse when sibling portals mount */
  min-height: ${(p) => SIZES[p.$size].h};
  padding: 0 ${(p) => SIZES[p.$size].px};
  font-size: ${(p) => SIZES[p.$size].fs};
  border-radius: ${(p) => SIZES[p.$size].radius};
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s,
    box-shadow 0.18s,
    background 0.18s;
  color: ${(p) => (p.$hasValue ? 'var(--dp-text)' : 'var(--dp-text-muted)')};
  outline: none;

  ${(p) => getVariant(p.$variant)}

  /* Error state */
  ${(p) =>
    p.$error &&
    css`
      border-color: var(--dp-border-error) !important;
      &:focus-within {
        box-shadow: 0 0 0 3px var(--dp-ring-error) !important;
      }
    `}

  /* Disabled */
  ${(p) =>
    p.$disabled &&
    css`
      background: var(--dp-disabled-bg) !important;
      color: var(--dp-disabled-fg) !important;
      cursor: not-allowed;
      pointer-events: none;
    `}

  .dp-trigger-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dp-trigger-icon {
    flex-shrink: 0;
    color: var(--dp-text-muted);
    transition: transform 0.2s;
  }
  &[aria-expanded='true'] .dp-trigger-icon:last-child {
    transform: rotate(180deg);
  }

  /* WCAG 2.5.5 target size — sm/md fall under 44px otherwise (mirrors the
     equivalent mobile override in Select.styles.ts). */
  @media (max-width: 767px) {
    ${(p) =>
      (p.$size === 'sm' || p.$size === 'md') &&
      css`
        min-height: 44px;
        height: 44px;
      `}
  }

  .dp-clear {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    color: var(--dp-text-muted);
    transition:
      background 0.15s,
      color 0.15s;
    &:hover {
      background: var(--dp-day-hover);
      color: var(--dp-text);
    }
  }
`;

// ─── Popup ────────────────────────────────────────────────────────────────────
// Always rendered via createPortal → posicionado con inline styles desde
// useFloatingPanel. Aquí solo estilos visuales.
// Re-define CSS vars porque el portal rompe la cascada del Root/GroupRoot.

export const Popup = styled.div`
  ${dpVars}

  background: var(--dp-bg-popup);
  border-radius: 14px;
  box-shadow: var(--dp-shadow);
  border: 1.5px solid var(--dp-border);
  overflow: hidden;
  animation: ${popIn} 0.18s ease-out;
  min-width: 300px;
`;

// ─── Calendar ─────────────────────────────────────────────────────────────────

export const CalendarWrap = styled.div`
  padding: 16px;
  user-select: none;
  /* Keyboard focus trap needs an outline-capable target */
  &:focus {
    outline: none;
  }
`;

export const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
`;

/** @deprecated – kept for backwards compat; use Button component instead */
export const NavBtn = styled(StyledButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--dp-text-muted);
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
  cursor: pointer;
  outline: none;
  &:hover {
    background: var(--dp-day-hover);
    color: var(--dp-text);
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px var(--dp-accent);
  }
`;

export const MonthLabel = styled.button`
  flex: 1;
  text-align: center;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--dp-text);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
  outline: none;
  &:hover {
    background: var(--dp-day-hover);
  }
`;

export const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
`;

export const WeekDay = styled.span`
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--dp-text-muted);
  padding: 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

interface DayProps {
  $today?: boolean;
  $selected?: boolean;
  $inRange?: boolean;
  $rangeStart?: boolean;
  $rangeEnd?: boolean;
  $disabled?: boolean;
  $outside?: boolean;
  $focused?: boolean;
}

export const Day = styled.button<DayProps>`
  ${({
    theme,
    $today,
    $selected,
    $inRange,
    $rangeStart,
    $rangeEnd,
    $disabled,
    $outside,
    $focused,
  }) => css`
    position: relative;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    border: 1.5px solid
      ${theme.isDark ? theme.border.color.neutral.subtle : theme.color.neutral[100]};
    border-radius: ${theme.border.radius.md};
    cursor: pointer;
    outline: none;
    transition:
      background 0.12s,
      color 0.12s,
      transform 0.1s;

    color: ${$outside ? 'var(--dp-text-muted)' : 'var(--dp-text)'};

    /* in-range */
    ${$inRange &&
    !$selected &&
    css`
      background: var(--dp-day-inrange);
      border-radius: 0;
    `}
    ${$rangeStart &&
    !$rangeEnd &&
    css`
      border-radius: 8px 0 0 8px;
    `}
    ${$rangeEnd &&
    !$rangeStart &&
    css`
      border-radius: 0 8px 8px 0;
    `}

    /* selected */
    ${$selected &&
    css`
      background: ${theme.isDark ? theme.color.intent.primary : theme.color.primary[600]};
      color: ${theme.color.text.inverse};
      font-weight: 600;
    `}

    /* keyboard focus indicator */
    ${$focused &&
    !$selected &&
    css`
      box-shadow: 0 0 0 2px var(--dp-accent);
      z-index: 1;
    `}

    /* today ring */
    ${$today &&
    !$selected &&
    css`
      &::after {
        content: '';
        position: absolute;
        bottom: 4px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--dp-accent);
      }
    `}

    /* hover */
    &:not(:disabled):hover {
      background: ${$selected
        ? theme.isDark
          ? theme.color.intent.primaryHover
          : theme.color.primary[500]
        : theme.isDark
          ? theme.color.background.neutral
          : theme.color.primary[200]};
      box-shadow: ${theme.effect.shadow.primary?.xs};
    }
    &:focus-visible {
      box-shadow: 0 0 0 2px var(--dp-accent);
    }

    /* disabled */
    ${$disabled &&
    css`
      color: var(--dp-text-muted) !important;
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    `}
  `}
`;

// ─── Time Picker ──────────────────────────────────────────────────────────────

export const TimeSeparator = styled.div`
  height: 1px;
  background: var(--dp-border);
  margin: 0 16px;
`;

export const TimeWrap = styled.div`
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const TimeLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--dp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const TimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const TimeSelect = styled.select`
  flex: 1;
  height: 36px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1.5px solid var(--dp-border);
  background: var(--dp-bg-default);
  color: var(--dp-text);
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
  appearance: none;
  text-align: center;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  &:focus {
    border-color: var(--dp-accent);
    box-shadow: 0 0 0 3px var(--dp-ring);
  }
`;

export const TimeColon = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--dp-text-muted);
`;

// ─── Footer hint/error ────────────────────────────────────────────────────────

export const FooterText = styled.p<{ $error?: boolean }>`
  font-size: 0.8rem;
  color: ${(p) => (p.$error ? 'var(--dp-border-error)' : 'var(--dp-text-muted)')};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: ${fadeIn} 0.2s ease;
`;

// ─── Group ────────────────────────────────────────────────────────────────────

export const GroupRoot = styled.div`
  ${dpVars}
  display: inline-flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
`;

export const GroupLabel = styled(Label)``;

export const GroupAttached = styled.div<{ $error: boolean }>`
  display: flex;
  align-items: stretch;
  width: 100%;

  /* Attached: los dos triggers comparten borde */
  & > button:first-of-type {
    border-radius: 10px 0 0 10px;
    border-right: none;
    flex: 1;
    min-width: 0; /* prevent flex overflow */
  }
  & > button:last-of-type {
    border-radius: 0 10px 10px 0;
    flex: 1;
    min-width: 0;
  }

  ${(p) =>
    p.$error &&
    css`
      & > button {
        border-color: var(--dp-border-error) !important;
      }
    `}
`;

export const GroupDivider = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1px;
  background: var(--dp-border);
  flex-shrink: 0;
  z-index: 1;
`;

interface GroupSeparatorIconProps {
  $error?: boolean;
}

export const GroupSeparatorIcon = styled.div<GroupSeparatorIconProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  flex-shrink: 0;
  /* Propagate error state to the separator border + icon */
  color: ${(p) => (p.$error ? 'var(--dp-border-error)' : 'var(--dp-text-muted)')};
  background: var(--dp-bg-default);
  border-top: 1.5px solid ${(p) => (p.$error ? 'var(--dp-border-error)' : 'var(--dp-border)')};
  border-bottom: 1.5px solid ${(p) => (p.$error ? 'var(--dp-border-error)' : 'var(--dp-border)')};
  transition:
    border-color 0.18s,
    color 0.18s;
`;

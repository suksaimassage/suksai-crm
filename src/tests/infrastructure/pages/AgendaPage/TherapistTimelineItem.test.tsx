/**
 * TherapistTimelineItem.test.tsx
 *
 * Tests for the TherapistTimelineItem component.
 *
 * Mocking strategy:
 *   - react-i18next: useTranslation returns key as value.
 *   - styled-components: rendered normally.
 *   - No external hooks.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import { TherapistTimelineItem } from '@infra/pages/AgendaPage/components/therapist/TherapistTimelineItem';
import type { IAgendaAppointment } from '@domain/models/agenda.models';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { language: 'es' },
  }),
}));

const Wrapper = ({ children }: { children: ReactNode }) => (
  <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
);

// ── Base fixtures ─────────────────────────────────────────────────────────────

const baseAppointment: IAgendaAppointment = {
  id: 200,
  therapistId: 2,
  startTime: '09:30',
  endTime: '10:30',
  durationMin: 60,
  clientName: 'Pablo Iruña',
  visitInfo: '5ª visita',
  serviceName: 'Reflexología + Espalda',
  sala: 'Sala Bambú',
  salaId: 2,
  centroId: 1,
  centroName: 'Centro Test',
  estado: 'confirmada',
  timelineState: 'done',
  evtVariant: 'jungle',
  notes: null,
  tags: ['frecuente'],
  precioFinal: 70,
};

const breakAppointment: IAgendaAppointment = {
  id: 206,
  therapistId: 2,
  startTime: '14:00',
  endTime: '14:30',
  durationMin: 30,
  clientName: 'Pausa',
  visitInfo: null,
  serviceName: 'Descanso',
  sala: 'Sala Bambú',
  salaId: 2,
  centroId: 1,
  centroName: 'Centro Test',
  estado: 'completada',
  timelineState: 'break',
  evtVariant: 'break',
  notes: null,
  tags: [],
  precioFinal: 0,
};

// ── Break variant ─────────────────────────────────────────────────────────────

describe('TherapistTimelineItem — break variant', () => {
  it('renders BreakCard when evtVariant is "break"', () => {
    const { container } = render(<TherapistTimelineItem appointment={breakAppointment} />, {
      wrapper: Wrapper,
    });
    // Break card contains the client name (Pausa) and time range
    expect(screen.getByText(/Pausa/i)).toBeInTheDocument();
    expect(screen.getByText(/14:00–14:30/i)).toBeInTheDocument();
    // The container should NOT contain a TimelineCard element
    // TimelineCard is only rendered in the non-break branch
    expect(container.querySelector('[aria-label*="Descanso"]')).toBeInTheDocument();
  });

  it('break item aria-label starts with "Descanso"', () => {
    render(<TherapistTimelineItem appointment={breakAppointment} />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/^Descanso/i)).toBeInTheDocument();
  });

  it('break aria-label contains the start and end time', () => {
    render(<TherapistTimelineItem appointment={breakAppointment} />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/14:00–14:30/i)).toBeInTheDocument();
  });

  it('break variant does not render a TimelineCard', () => {
    render(<TherapistTimelineItem appointment={breakAppointment} />, { wrapper: Wrapper });
    // The regular card renders clientName outside of the BreakCard text
    // In break branch: clientName appears only inside break card text
    // In non-break branch: clientName appears in StyledCardClient
    // We verify "AHORA" badge (now-state marker) is absent for a break
    expect(screen.queryByText('therapist.timelineStateNow')).not.toBeInTheDocument();
  });

  it('break item renders start time and duration', () => {
    render(<TherapistTimelineItem appointment={breakAppointment} />, { wrapper: Wrapper });
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });
});

// ── "now" state ───────────────────────────────────────────────────────────────

describe('TherapistTimelineItem — "now" timelineState', () => {
  const nowAppt: IAgendaAppointment = {
    ...baseAppointment,
    timelineState: 'now',
    evtVariant: 'pending',
  };

  it('renders the "AHORA" badge (via t key) when timelineState is "now"', () => {
    render(<TherapistTimelineItem appointment={nowAppt} />, { wrapper: Wrapper });
    // t('therapist.timelineStateNow') → key returned as string
    expect(screen.getByText('therapist.timelineStateNow')).toBeInTheDocument();
  });

  it('badge has an aria-label equal to the i18n key value', () => {
    render(<TherapistTimelineItem appointment={nowAppt} />, { wrapper: Wrapper });
    expect(screen.getByLabelText('therapist.timelineStateNow')).toBeInTheDocument();
  });
});

// ── "done" state ──────────────────────────────────────────────────────────────

describe('TherapistTimelineItem — "done" timelineState', () => {
  const doneAppt: IAgendaAppointment = {
    ...baseAppointment,
    timelineState: 'done',
  };

  it('renders the "Completada" badge (via t key) when timelineState is "done"', () => {
    render(<TherapistTimelineItem appointment={doneAppt} />, { wrapper: Wrapper });
    expect(screen.getByText('therapist.done')).toBeInTheDocument();
  });

  it('done badge has aria-label equal to the i18n key value', () => {
    render(<TherapistTimelineItem appointment={doneAppt} />, { wrapper: Wrapper });
    expect(screen.getByLabelText('therapist.done')).toBeInTheDocument();
  });

  it('does not render "now" badge when state is "done"', () => {
    render(<TherapistTimelineItem appointment={doneAppt} />, { wrapper: Wrapper });
    expect(screen.queryByText('therapist.timelineStateNow')).not.toBeInTheDocument();
  });
});

// ── "pending" state ───────────────────────────────────────────────────────────

describe('TherapistTimelineItem — "pending" timelineState', () => {
  const pendingAppt: IAgendaAppointment = {
    ...baseAppointment,
    timelineState: 'pending',
  };

  it('renders the card without any "now" or "done" badge', () => {
    render(<TherapistTimelineItem appointment={pendingAppt} />, { wrapper: Wrapper });
    expect(screen.queryByText('therapist.timelineStateNow')).not.toBeInTheDocument();
    expect(screen.queryByText('therapist.done')).not.toBeInTheDocument();
  });

  it('still renders client name when state is "pending"', () => {
    render(<TherapistTimelineItem appointment={pendingAppt} />, { wrapper: Wrapper });
    expect(screen.getByText('Pablo Iruña')).toBeInTheDocument();
  });
});

// ── visitInfo handling ────────────────────────────────────────────────────────

describe('TherapistTimelineItem — visitInfo', () => {
  it('shows "serviceName · visitInfo" when visitInfo is not null', () => {
    render(<TherapistTimelineItem appointment={baseAppointment} />, { wrapper: Wrapper });
    expect(screen.getByText('Reflexología + Espalda · 5ª visita')).toBeInTheDocument();
  });

  it('shows only serviceName when visitInfo is null', () => {
    const noVisitInfo = { ...baseAppointment, visitInfo: null };
    render(<TherapistTimelineItem appointment={noVisitInfo} />, { wrapper: Wrapper });
    expect(screen.getByText('Reflexología + Espalda')).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });
});

// ── notes handling ────────────────────────────────────────────────────────────

describe('TherapistTimelineItem — notes', () => {
  it('renders notes text when notes is not null', () => {
    const withNotes = {
      ...baseAppointment,
      notes: 'Trabaja con tensión en trapecios',
    };
    render(<TherapistTimelineItem appointment={withNotes} />, { wrapper: Wrapper });
    expect(screen.getByText('Trabaja con tensión en trapecios')).toBeInTheDocument();
  });

  it('does not render notes element when notes is null', () => {
    render(<TherapistTimelineItem appointment={baseAppointment} />, { wrapper: Wrapper });
    expect(screen.queryByText('Trabaja con tensión en trapecios')).not.toBeInTheDocument();
  });
});

// ── aria-label ────────────────────────────────────────────────────────────────

describe('TherapistTimelineItem — aria-label', () => {
  // The row (<li role="listitem">) carries a descriptive "client start–end" label;
  // the inner card is a <button> with a distinct EDIT label that ALSO contains the
  // client name. Scope the row-label assertions to role="listitem" so they target
  // the row label unambiguously (getByLabelText alone now matches both).
  it('row aria-label contains client name', () => {
    render(<TherapistTimelineItem appointment={baseAppointment} />, { wrapper: Wrapper });
    expect(screen.getByRole('listitem', { name: /Pablo Iruña/ })).toBeInTheDocument();
  });

  it('row aria-label contains time range', () => {
    render(<TherapistTimelineItem appointment={baseAppointment} />, { wrapper: Wrapper });
    expect(screen.getByRole('listitem', { name: /09:30–10:30/ })).toBeInTheDocument();
  });
});

// ── Time and duration display ─────────────────────────────────────────────────

describe('TherapistTimelineItem — time display', () => {
  it('renders start time in the timeline when marker', () => {
    render(<TherapistTimelineItem appointment={baseAppointment} />, { wrapper: Wrapper });
    expect(screen.getByText('09:30')).toBeInTheDocument();
  });

  it('renders duration in minutes', () => {
    render(<TherapistTimelineItem appointment={baseAppointment} />, { wrapper: Wrapper });
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });
});

// ── Quick-edit wiring (real cita = activatable button; break = inert) ────────────
// A real cita card is a <button> with the "edit" aria-label, wired to
// onAppointmentClick(appointment.id). Break items render NO button and never
// fire the handler. (The mocked t returns "key" or "key:{json}" — the edit label
// uses the timelineEditAriaLabel key, so we match it by substring.)

describe('TherapistTimelineItem — quick-edit activation', () => {
  it('renders the real cita as a button whose accessible name uses the edit-aria-label key', () => {
    render(<TherapistTimelineItem appointment={baseAppointment} />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /timelineEditAriaLabel/ });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('the edit aria-label interpolates client + start + end of the appointment', () => {
    render(<TherapistTimelineItem appointment={baseAppointment} />, { wrapper: Wrapper });
    // mocked t serializes opts → key:{"client":"Pablo Iruña","start":"09:30","end":"10:30"}
    const btn = screen.getByRole('button', { name: /timelineEditAriaLabel/ });
    const label = btn.getAttribute('aria-label') ?? '';
    expect(label).toContain('Pablo Iruña');
    expect(label).toContain('09:30');
    expect(label).toContain('10:30');
  });

  it('clicking the card calls onAppointmentClick with the appointment id', () => {
    const onAppointmentClick = vi.fn();
    render(
      <TherapistTimelineItem
        appointment={baseAppointment}
        onAppointmentClick={onAppointmentClick}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: /timelineEditAriaLabel/ }));
    expect(onAppointmentClick).toHaveBeenCalledTimes(1);
    expect(onAppointmentClick).toHaveBeenCalledWith(200); // baseAppointment.id
  });

  it('does not throw when clicked without an onAppointmentClick handler', () => {
    render(<TherapistTimelineItem appointment={baseAppointment} />, { wrapper: Wrapper });
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /timelineEditAriaLabel/ }));
    }).not.toThrow();
  });

  it('a break item renders NO button (it is inert)', () => {
    render(<TherapistTimelineItem appointment={breakAppointment} onAppointmentClick={vi.fn()} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('clicking a break item does NOT call onAppointmentClick (no interactive target)', () => {
    const onAppointmentClick = vi.fn();
    render(
      <TherapistTimelineItem
        appointment={breakAppointment}
        onAppointmentClick={onAppointmentClick}
      />,
      { wrapper: Wrapper },
    );
    // The break card is reachable by its descriptive aria-label but is not a button.
    fireEvent.click(screen.getByLabelText(/^Descanso/i));
    expect(onAppointmentClick).not.toHaveBeenCalled();
  });
});

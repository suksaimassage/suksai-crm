/**
 * CalendarDayKanban.test.tsx
 *
 * Behaviour of the presentational kanban board (bottom-left zone of the overlay):
 * the day's citas split into TWO columns by therapist ASSIGNMENT — `sinAsignar`
 * (therapistId === null) and `asignadas` (therapistId !== null) — columns always
 * visible even when empty, card content (hour / service / meta = therapist ·
 * room · centre) with LOCALISED placeholders for nulls (never the literal
 * "null"), card click → `onCardEdit(citaId)`, and the loading / empty / error
 * states (role="status" skeletons, localised empties, role="alert" + Retry →
 * `onRetry`).
 *
 * Data arrives as real `IAgendaAppointment` props — no MOCK_* business data, no
 * data-hook mocking: this is the pure view. i18n is the real `agenda` bundle.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type {
  IAgendaAppointment,
  IAgendaTherapist,
  TTherapistColorMap,
} from '@domain/models/agenda.models';
import type { TCitaId, TEstadoCita } from '@domain/types';
import { CalendarDayKanban } from '@infra/pages/AgendaPage/components/admin/CalendarDayKanban';
import type { ICalendarDayKanbanProps } from '@infra/pages/AgendaPage/components/admin/CalendarDayKanban';

// ── i18n (real agenda bundle) ─────────────────────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const buildAppointment = (
  overrides: Partial<IAgendaAppointment> & { readonly id: TCitaId; readonly estado: TEstadoCita },
): IAgendaAppointment => ({
  therapistId: 1,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Carmen Valverde',
  visitInfo: null,
  serviceName: 'Masaje Tradicional Tailandés',
  sala: 'Sala Loto',
  salaId: 1,
  centroId: 1,
  centroName: 'Centro Test',
  timelineState: 'pending',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 65,
  ...overrides,
});

const THERAPISTS: IAgendaTherapist[] = [
  {
    id: 1,
    nombre: 'Naree',
    apellidos: 'Anongphan',
    initials: 'NA',
    sala: 'Sala Loto',
    appointmentCount: 3,
    isActive: true,
    isAvailableOnDate: true,
  },
];

const COLOR_MAP: TTherapistColorMap = { 1: 'a' };

const baseProps: ICalendarDayKanbanProps = {
  dayCitas: [],
  therapists: THERAPISTS,
  colorMap: COLOR_MAP,
  centroName: 'Centro Madrid',
  dateLabel: 'Miércoles, 20 de mayo',
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  onCardEdit: vi.fn(),
};

function renderKanban(overrides: Partial<ICalendarDayKanbanProps> = {}) {
  const onRetry = vi.fn();
  const onCardEdit = vi.fn();
  const props = { ...baseProps, onRetry, onCardEdit, ...overrides };
  render(<CalendarDayKanban {...props} />, { wrapper: Wrapper });
  return { onRetry, onCardEdit };
}

const columnGroup = (name: 'Sin asignar' | 'Asignadas') => screen.getByRole('group', { name });

// ── Partition into 2 columns by assignment ────────────────────────────────────

describe('CalendarDayKanban — column partition', () => {
  it('splits the day citas into the 2 assignment columns (disjoint)', () => {
    renderKanban({
      dayCitas: [
        buildAppointment({ id: 1, estado: 'confirmada', therapistId: 1 }), // → Asignadas
        buildAppointment({ id: 2, estado: 'sin_asignar', therapistId: null }), // → Sin asignar
      ],
    });

    expect(within(columnGroup('Asignadas')).getAllByRole('button')).toHaveLength(1);
    expect(within(columnGroup('Sin asignar')).getAllByRole('button')).toHaveLength(1);
  });

  it('routes by therapistId: null → Sin asignar, otherwise → Asignadas', () => {
    renderKanban({
      dayCitas: [
        buildAppointment({ id: 1, estado: 'sin_asignar', therapistId: null }),
        buildAppointment({ id: 2, estado: 'confirmada', therapistId: null }), // no masajista yet
        buildAppointment({ id: 3, estado: 'en_curso', therapistId: 1 }),
        buildAppointment({ id: 4, estado: 'completada', therapistId: 1 }),
      ],
    });

    expect(within(columnGroup('Sin asignar')).getAllByRole('button')).toHaveLength(2);
    expect(within(columnGroup('Asignadas')).getAllByRole('button')).toHaveLength(2);
  });

  it('keeps both columns visible even when one is empty', () => {
    renderKanban({ dayCitas: [buildAppointment({ id: 1, estado: 'confirmada', therapistId: 1 })] });

    expect(columnGroup('Sin asignar')).toBeInTheDocument();
    expect(columnGroup('Asignadas')).toBeInTheDocument();
  });

  it('shows the localised empty state per empty column', () => {
    renderKanban({ dayCitas: [buildAppointment({ id: 1, estado: 'confirmada', therapistId: 1 })] });

    // asignadas has a card → no empty; sinAsignar shows its localised empty
    expect(
      within(columnGroup('Sin asignar')).getByText('No hay citas sin asignar'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No hay citas asignadas')).not.toBeInTheDocument();
  });

  it('shows both empties when the day has no citas', () => {
    renderKanban({ dayCitas: [] });

    expect(screen.getByText('No hay citas sin asignar')).toBeInTheDocument();
    expect(screen.getByText('No hay citas asignadas')).toBeInTheDocument();
  });
});

// ── Card content ──────────────────────────────────────────────────────────────

describe('CalendarDayKanban — card content', () => {
  it('renders hour, service and the meta line (therapist · room · centre)', () => {
    renderKanban({
      dayCitas: [
        buildAppointment({
          id: 1,
          estado: 'confirmada',
          therapistId: 1,
          startTime: '10:00',
          serviceName: 'Masaje Thai',
          sala: 'Sala 1',
        }),
      ],
    });

    const card = screen.getByRole('button', {
      name: '10:00, Masaje Thai, sala Sala 1, con Naree Anongphan, en Centro Madrid',
    });
    expect(card).toBeInTheDocument();
    // hour + service + each meta segment are visible
    expect(within(card).getByText('10:00')).toBeInTheDocument();
    expect(within(card).getByText('Masaje Thai')).toBeInTheDocument();
    expect(within(card).getByText('Naree Anongphan')).toBeInTheDocument();
    expect(within(card).getByText('Sala 1')).toBeInTheDocument();
    expect(within(card).getByText('Centro Madrid')).toBeInTheDocument();
    // meta segments are joined by the '·' separator
    expect(within(card).getAllByText('·')).toHaveLength(2);
  });

  it('localises the placeholders for null therapist / null room — never the literal "null"', () => {
    renderKanban({
      centroName: 'Centro Madrid',
      dayCitas: [
        buildAppointment({
          id: 2,
          estado: 'sin_asignar',
          therapistId: null,
          sala: null,
          serviceName: 'Masaje Relax',
        }),
      ],
    });

    const card = screen.getByRole('button', {
      name: '10:00, Masaje Relax, sala Sala por definir, con Sin asignar, en Centro Madrid',
    });
    expect(within(card).getByText('Sin asignar')).toBeInTheDocument();
    expect(within(card).getByText('Sala por definir')).toBeInTheDocument();
    // the centre still comes from the centroName prop
    expect(within(card).getByText('Centro Madrid')).toBeInTheDocument();
    // the literal "null" never leaks into the card
    expect(within(card).queryByText('null')).not.toBeInTheDocument();
  });

  it('invokes onCardEdit with the cita id when a card is clicked', () => {
    const { onCardEdit } = renderKanban({
      dayCitas: [buildAppointment({ id: 42, estado: 'confirmada', serviceName: 'Masaje Thai' })],
    });

    fireEvent.click(screen.getByRole('button', { name: /10:00, Masaje Thai/ }));

    expect(onCardEdit).toHaveBeenCalledTimes(1);
    expect(onCardEdit).toHaveBeenCalledWith(42);
  });
});

// ── Loading / error states ────────────────────────────────────────────────────

describe('CalendarDayKanban — loading state', () => {
  it('renders a role="status" container with aria-hidden skeletons and no cards', () => {
    renderKanban({ isLoading: true, dayCitas: [buildAppointment({ id: 1, estado: 'pendiente' })] });

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    // skeletons are decorative — hidden from the a11y tree
    expect(status.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    // no real cards while loading
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    // no column groups painted during load
    expect(screen.queryByRole('group', { name: 'Sin asignar' })).not.toBeInTheDocument();
  });
});

describe('CalendarDayKanban — error state', () => {
  it('renders a role="alert" with a Retry button that invokes onRetry (the invalidate ["agenda"] callback)', () => {
    const { onRetry } = renderKanban({ isError: true });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('No se pudieron cargar las citas');

    const retry = within(alert).getByRole('button', { name: 'Reintentar' });
    fireEvent.click(retry);

    // the view delegates recovery to the injected callback (overlay wires it to
    // queryClient.invalidateQueries({ queryKey: ['agenda'] }))
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not paint the columns nor the loading status while in error', () => {
    renderKanban({ isError: true });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Sin asignar' })).not.toBeInTheDocument();
  });
});

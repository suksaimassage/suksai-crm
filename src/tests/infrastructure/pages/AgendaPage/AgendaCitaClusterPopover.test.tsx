/**
 * AgendaCitaClusterPopover.test.tsx
 *
 * The anchored list popup of EDIT-ONLY rows for a week-view "folder"
 * (Designer §1.3, §5; RESOLVED OQ-2). Behaviours under test:
 *   - renders N rows, each a <button> inside role="list"/listitem (NOT
 *     menu/menuitem, NOT listbox/option — Analyst §5 / Designer §5);
 *   - each row's accessible name = week.cluster.rowLabel;
 *   - clicking a row → onEdit(id) (the parent closes the popup + opens the modal);
 *   - estado language is reused: cancelada strikes the client name (E13),
 *     pendiente shows the ⏳ glyph;
 *   - sin_asignar rows fall back to "Sin cliente" (rail.sinCliente);
 *   - the first row is focused on open (Analyst §5);
 *   - Escape / close-button drive onOpenChange(false);
 *   - large-N: the list is a single scroll container (E12).
 *
 * Mock strategy: NONE — the popover is prop-driven; the real Popover renders its
 * content into a document.body portal (so queries hit `screen`/`document`, not
 * the render container). i18n loads `agenda` (row/trigger labels) + `common`
 * (the PopoverHeader close button name).
 *
 * NOTE on interactions: `@testing-library/user-event` is NOT a project dependency
 * (only @testing-library/{dom,jest-dom,react} are installed) and the Tester brief
 * forbids adding deps. Every existing agenda popover test uses `fireEvent`; this
 * suite follows that established convention. See the test report's Missing Risks
 * ([TESTABILITY GAP] — userEvent unavailable).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import esCommon from '@infra/i18n/locales/es/common.json';
import { AgendaCitaClusterPopover } from '@infra/pages/AgendaPage/components/admin/AgendaCitaClusterPopover';
import type { IAgendaAppointment, TTherapistColorMap } from '@domain/models/agenda.models';

// ── i18n (agenda for labels, common for the Popover close button) ──────────────
const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda', 'common'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda, common: esCommon } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeAppt = (overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment => ({
  id: 1,
  therapistId: 10,
  startTime: '10:00',
  endTime: '11:00',
  durationMin: 60,
  clientName: 'Lucía Reyes',
  visitInfo: null,
  serviceName: 'Aromaterapia',
  sala: 'Suite',
  salaId: 2,
  centroId: 1,
  centroName: 'Centro Test',
  estado: 'confirmada',
  timelineState: 'done',
  evtVariant: 'gold',
  notes: null,
  tags: [],
  precioFinal: 6500,
  ...overrides,
});

const COLOR_MAP: TTherapistColorMap = { 10: 'a', 11: 'b' };

const baseProps = (
  overrides: Partial<React.ComponentProps<typeof AgendaCitaClusterPopover>> = {},
): React.ComponentProps<typeof AgendaCitaClusterPopover> => ({
  open: true,
  onOpenChange: vi.fn(),
  appointments: [
    makeAppt({ id: 1, clientName: 'Lucía Reyes', startTime: '10:00', endTime: '11:00' }),
    makeAppt({
      id: 2,
      clientName: 'Marco Díaz',
      startTime: '10:30',
      endTime: '11:30',
      therapistId: 11,
    }),
  ],
  colorMap: COLOR_MAP,
  optimisticId: null,
  rangeStart: '10:00',
  rangeEnd: '11:30',
  onEdit: vi.fn(),
  children: <button type="button">folder</button>,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── List + row semantics (honest list-of-buttons, NOT menu/listbox) ────────────

describe('AgendaCitaClusterPopover — list & row semantics', () => {
  it('renders a role="list" labelled with the count + time range', () => {
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    // listLabel reuses triggerLabel: "Grupo de 2 citas, 10:00–11:30"
    expect(screen.getByRole('list', { name: 'Grupo de 2 citas, 10:00–11:30' })).toBeInTheDocument();
  });

  it('renders one listitem per appointment', () => {
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('each row is a <button> (not a menuitem / option)', () => {
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    const list = screen.getByRole('list');
    // Two row buttons live inside the list (the header close button is outside it).
    expect(within(list).getAllByRole('button')).toHaveLength(2);
    // Honest mapping: no menu / listbox semantics anywhere.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('renders N rows for a larger cluster', () => {
    const appts = Array.from({ length: 6 }, (_, i) =>
      makeAppt({ id: i + 1, clientName: `Cliente ${i + 1}`, startTime: '10:00' }),
    );
    render(<AgendaCitaClusterPopover {...baseProps({ appointments: appts })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });
});

// ── Row accessible name (week.cluster.rowLabel) ────────────────────────────────

describe('AgendaCitaClusterPopover — row accessible name', () => {
  it('row button name = rowLabel { client, start–end, service, estado }', () => {
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    // "Lucía Reyes, 10:00–11:00, Aromaterapia, Confirmada"
    expect(
      screen.getByRole('button', { name: 'Lucía Reyes, 10:00–11:00, Aromaterapia, Confirmada' }),
    ).toBeInTheDocument();
  });

  it('shows the client name and the time range as visible text', () => {
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Lucía Reyes')).toBeInTheDocument();
    expect(screen.getByText('10:00–11:00')).toBeInTheDocument();
  });

  it('row meta shows "service · sala" when a sala is present', () => {
    // Distinct sala on the first row so the meta string is unique in the list.
    const appts = [
      makeAppt({ id: 1, serviceName: 'Aromaterapia', sala: 'Suite' }),
      makeAppt({ id: 2, startTime: '10:15', serviceName: 'Reflexología', sala: 'Sala 2' }),
    ];
    render(<AgendaCitaClusterPopover {...baseProps({ appointments: appts })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Aromaterapia · Suite')).toBeInTheDocument();
    expect(screen.getByText('Reflexología · Sala 2')).toBeInTheDocument();
  });

  it('row meta shows the service alone when sala is null', () => {
    const appts = [
      makeAppt({ id: 1, serviceName: 'Reflexología', sala: null }),
      makeAppt({ id: 2, startTime: '10:15' }),
    ];
    render(<AgendaCitaClusterPopover {...baseProps({ appointments: appts })} />, {
      wrapper: Wrapper,
    });
    // No " · " separator for the null-sala row.
    expect(screen.getByText('Reflexología')).toBeInTheDocument();
  });
});

// ── Edit-only rows: click → onEdit(id) (RESOLVED OQ-2) ─────────────────────────

describe('AgendaCitaClusterPopover — edit-only rows', () => {
  it('clicking a row calls onEdit with that cita id', () => {
    const onEdit = vi.fn();
    render(<AgendaCitaClusterPopover {...baseProps({ onEdit })} />, { wrapper: Wrapper });

    fireEvent.click(
      screen.getByRole('button', { name: 'Lucía Reyes, 10:00–11:00, Aromaterapia, Confirmada' }),
    );
    expect(onEdit).toHaveBeenCalledWith(1);
  });

  it('clicking the second row calls onEdit with the second id', () => {
    const onEdit = vi.fn();
    render(<AgendaCitaClusterPopover {...baseProps({ onEdit })} />, { wrapper: Wrapper });

    fireEvent.click(
      screen.getByRole('button', { name: 'Marco Díaz, 10:30–11:30, Aromaterapia, Confirmada' }),
    );
    expect(onEdit).toHaveBeenCalledWith(2);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('does NOT replicate Confirmar / Cancelar lifecycle controls in rows', () => {
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar cita' })).not.toBeInTheDocument();
  });
});

// ── Estado language reuse (glyph + strikethrough) — E13 ─────────────────────────

describe('AgendaCitaClusterPopover — estado language', () => {
  it('E13: a cancelada row strikes the client name (line-through)', () => {
    const appts = [
      makeAppt({ id: 1, clientName: 'Cancelada Cliente', estado: 'cancelada' }),
      makeAppt({ id: 2, startTime: '10:15', estado: 'completada' }),
    ];
    render(<AgendaCitaClusterPopover {...baseProps({ appointments: appts })} />, {
      wrapper: Wrapper,
    });
    const name = screen.getByText('Cancelada Cliente');
    // Behavioral signal: the strikethrough decoration is applied (not a color check).
    // styled-components emits the `text-decoration` shorthand → assert that form.
    expect(name).toHaveStyle('text-decoration: line-through');
  });

  it('E13: a cancelada row still renders an edit button (terminal estado still opens)', () => {
    const onEdit = vi.fn();
    const appts = [
      makeAppt({ id: 1, clientName: 'Cancelada Cliente', estado: 'cancelada' }),
      makeAppt({ id: 2, startTime: '10:15', estado: 'completada', clientName: 'Done Cliente' }),
    ];
    render(<AgendaCitaClusterPopover {...baseProps({ appointments: appts, onEdit })} />, {
      wrapper: Wrapper,
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Cancelada Cliente, 10:00–11:00, Aromaterapia, Cancelada',
      }),
    );
    expect(onEdit).toHaveBeenCalledWith(1);
  });

  it('renders the estado word for each row (e.g. "Por confirmar" for pendiente)', () => {
    const appts = [
      makeAppt({ id: 1, estado: 'pendiente' }),
      makeAppt({ id: 2, startTime: '10:15', estado: 'pendiente', clientName: 'Otro' }),
    ];
    render(<AgendaCitaClusterPopover {...baseProps({ appointments: appts })} />, {
      wrapper: Wrapper,
    });
    // estado.pendiente = "Por confirmar"; both rows render it.
    expect(screen.getAllByText('Por confirmar')).toHaveLength(2);
  });
});

// ── sin_asignar fallback ───────────────────────────────────────────────────────

describe('AgendaCitaClusterPopover — sin_asignar rows', () => {
  it('falls back to "Sin cliente" for a null clientName', () => {
    const appts = [
      makeAppt({ id: 1, clientName: null, therapistId: null, estado: 'sin_asignar', sala: null }),
      makeAppt({ id: 2, startTime: '10:15', clientName: 'Asignada' }),
    ];
    render(<AgendaCitaClusterPopover {...baseProps({ appointments: appts })} />, {
      wrapper: Wrapper,
    });
    // rail.sinCliente = "Sin cliente" — appears in the row text AND the aria-label.
    expect(screen.getByText('Sin cliente')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Sin cliente, 10:00–11:00, Aromaterapia, Sin asignar',
      }),
    ).toBeInTheDocument();
  });
});

// ── Optimistic row dimming — E6 ────────────────────────────────────────────────

describe('AgendaCitaClusterPopover — optimistic member (E6)', () => {
  it('dims the row whose id === optimisticId', () => {
    render(<AgendaCitaClusterPopover {...baseProps({ optimisticId: 2 })} />, { wrapper: Wrapper });
    const dimmed = screen.getByRole('button', {
      name: 'Marco Díaz, 10:30–11:30, Aromaterapia, Confirmada',
    });
    // $optimistic → opacity 0.6 (the reused StyledWeekEvt dimming pattern).
    expect(dimmed).toHaveStyle({ opacity: '0.6' });
  });

  it('leaves non-optimistic rows at full opacity', () => {
    render(<AgendaCitaClusterPopover {...baseProps({ optimisticId: 2 })} />, { wrapper: Wrapper });
    const normal = screen.getByRole('button', {
      name: 'Lucía Reyes, 10:00–11:00, Aromaterapia, Confirmada',
    });
    expect(normal).toHaveStyle({ opacity: '1' });
  });
});

// ── Header + close behavior ────────────────────────────────────────────────────

describe('AgendaCitaClusterPopover — header & close', () => {
  it('renders the popup title ("Citas solapadas")', () => {
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Citas solapadas')).toBeInTheDocument();
  });

  it('the header close button calls onOpenChange(false)', () => {
    const onOpenChange = vi.fn();
    render(<AgendaCitaClusterPopover {...baseProps({ onOpenChange })} />, { wrapper: Wrapper });
    // common: popover.closeAriaLabel = "Cerrar popover"
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar popover' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('Escape closes the popup (onOpenChange(false))', () => {
    const onOpenChange = vi.fn();
    render(<AgendaCitaClusterPopover {...baseProps({ onOpenChange })} />, { wrapper: Wrapper });
    // Popover's useEscapeKey listens on the document.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not render the list content when closed (open=false)', () => {
    render(<AgendaCitaClusterPopover {...baseProps({ open: false })} />, { wrapper: Wrapper });
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('Citas solapadas')).not.toBeInTheDocument();
  });
});

// ── Dialog semantics (WCAG 4.1.2 name/role/value) ──────────────────────────────

describe('AgendaCitaClusterPopover — dialog semantics', () => {
  it('the opened surface is a role="dialog", not a tooltip', () => {
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('the dialog surface has an accessible name (week.cluster.title)', () => {
    // axe-core requires a dialog node to have an accessible name; it is supplied
    // via ariaLabel={t('week.cluster.title')} → "Citas solapadas".
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('dialog', { name: 'Citas solapadas' })).toBeInTheDocument();
  });

  it('the trigger advertises aria-haspopup="dialog" (derived from the dialog role)', () => {
    // baseProps() passes a bare <button> with no aria-haspopup of its own, so the
    // value is derived from the Popover role="dialog" rather than clobbered to "true".
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'folder' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });

  it('preserves an explicit aria-haspopup="dialog" on the trigger child when open', () => {
    render(
      <AgendaCitaClusterPopover
        {...baseProps({
          children: (
            <button type="button" aria-haspopup="dialog">
              folder
            </button>
          ),
        })}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: 'folder' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });
});

// ── Focus-on-open (Analyst §5) ─────────────────────────────────────────────────

describe('AgendaCitaClusterPopover — focus management', () => {
  it('focuses the first row button on open', async () => {
    render(<AgendaCitaClusterPopover {...baseProps()} />, { wrapper: Wrapper });
    const firstRow = screen.getByRole('button', {
      name: 'Lucía Reyes, 10:00–11:00, Aromaterapia, Confirmada',
    });
    // Focus is moved inside a requestAnimationFrame; await a frame before asserting.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
    expect(firstRow).toHaveFocus();
  });
});

// ── Large-N scroll container (E12) ─────────────────────────────────────────────

describe('AgendaCitaClusterPopover — large N (E12)', () => {
  it('the list is a single scroll container holding every row', () => {
    const appts = Array.from({ length: 12 }, (_, i) =>
      makeAppt({ id: i + 1, clientName: `Cliente ${i + 1}`, startTime: '10:00' }),
    );
    render(<AgendaCitaClusterPopover {...baseProps({ appointments: appts })} />, {
      wrapper: Wrapper,
    });
    const list = screen.getByRole('list');
    // Behavioral: ONE list, all rows inside it (overflow handled by the container).
    expect(within(list).getAllByRole('listitem')).toHaveLength(12);
    expect(list).toHaveStyle({ 'overflow-y': 'auto' });
  });
});

/**
 * CentrosPageSalaMenu.test.tsx
 *
 * Integration tests for AREA 1 (Centros y Salas) surfaces that live in the
 * CentrosPage tree:
 *   - Goal 5: the sala grid-card three-dots context menu (Editar / Disable↔Enable
 *     / Delete), gated to superadmin (canWrite).
 *   - Goal 2/3: removal of the disabled "Ver mapa" (page header) and "Ver agenda"
 *     (detail panel) buttons; "Editar" (centro) is preserved.
 *   - The toggle-activa flow (useUpdateSala) with success toast.
 *   - The delete flow through the REAL useSalaDeletion hook composed with mocked
 *     useDeleteSala + useActiveCitasBySala (guard → confirm Dialog → delete).
 *
 * Mock strategy:
 *   - Data hooks (useCentrosPage, useCentroDetail) are mocked to render a
 *     deterministic single-centro / two-sala detail panel.
 *   - useUpdateSala.mutate invokes its onSuccess/onError callback so toast
 *     assertions are deterministic.
 *   - useDeleteSala + useActiveCitasBySala are mocked at the boundary; the real
 *     useSalaDeletion orchestration runs.
 *   - CentroModal / SalaModal are stubbed (they own their own test suites); we
 *     only assert they mount with the right mode/sala when an action fires.
 *   - useUserStore is mocked with a mutable roles array so we can flip
 *     superadmin → recepcionista to assert the canWrite gate.
 *
 * [NEEDS MANUAL] The DropdownMenu panel is portal-rendered and positioned by
 * useFloatingPanel (getBoundingClientRect). jsdom returns zeroed rects, so the
 * panel still mounts and is queryable, but real placement/auto-flip and the
 * 44×44 hit-area visual cannot be asserted here — QA must verify visually.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// Full-page renders + queryByRole(name:…) recompute accessible names across the
// whole CentrosPage tree; under parallel full-suite load this file exceeds the
// 5s default (tests are synchronous — it's CPU contention, not a hang).
vi.setConfig({ testTimeout: 15_000 });
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import enDashboard from '@infra/i18n/locales/en/dashboard.json';
import type { ICentro, ISala } from '@domain/models';
import type { TNombreRol } from '@domain/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CENTRO: ICentro = {
  id: 1,
  nombre: 'Suksai Madrid',
  direccion: 'Calle Mayor 10',
  ciudad: 'Madrid',
  codigoPostal: '28001',
  telefono: '+34 910 000 000',
  email: 'madrid@suksai.com',
  activo: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const SALA_ACTIVE: ISala = {
  id: 10,
  centroId: 1,
  nombre: 'Lotus',
  capacidad: 2,
  activa: true,
  descripcion: 'Aromatherapy, Heated floor',
};

const SALA_INACTIVE: ISala = {
  id: 11,
  centroId: 1,
  nombre: 'Orchid',
  capacidad: 1,
  activa: false,
  descripcion: null,
};

// ── Mutable role state (for the canWrite gate) ────────────────────────────────

let mockRoles: readonly TNombreRol[] = ['superadmin'];

vi.mock('@app/stores/useUserStore', () => ({
  useUserStore: (selector: (s: { user: { roles: readonly TNombreRol[] } }) => unknown) =>
    selector({ user: { roles: mockRoles } }),
}));

// ── Data hook mocks ───────────────────────────────────────────────────────────

let mockSalas: readonly ISala[] = [SALA_ACTIVE, SALA_INACTIVE];

vi.mock('@infra/hooks/useCentrosPage', () => ({
  useCentrosPage: () => ({
    centros: [CENTRO],
    networkKPIs: { centrosActivos: 1, salasTotales: 2, ocupacionHoyPct: 0, enMantenimiento: 1 },
    centroStats: new Map([[1, { salaCount: 2, staffCount: 0, ocupacionPct: 0 }]]),
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@infra/hooks/useCentroDetail', () => ({
  useCentroDetail: () => ({
    salas: mockSalas,
    salaOccupancy: new Map(),
    detailKPIs: {
      salaCount: mockSalas.length,
      ocupacionPct: 0,
      sesionesHoy: 0,
      ingresoHoyEuros: 0,
    },
    isLoading: false,
    isError: false,
  }),
}));

// ── Mutation hook mocks ───────────────────────────────────────────────────────
// useUpdateSala.mutate must invoke its callbacks so toast assertions resolve.

interface IMutateOpts {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}
const mockUpdateMutate = vi.fn();
let updateShouldFail = false;

vi.mock('@infra/hooks/useUpdateSala', () => ({
  useUpdateSala: () => ({
    mutate: (vars: unknown, opts?: IMutateOpts) => {
      mockUpdateMutate(vars);
      if (updateShouldFail) opts?.onError?.(new Error('toggle failed'));
      else opts?.onSuccess?.();
    },
    isPending: false,
  }),
}));

// Dependencies of the REAL useSalaDeletion hook.
const mockDeleteMutateAsync = vi.fn();
const mockCheckCitas = vi.fn();

vi.mock('@infra/hooks/useDeleteSala', () => ({
  useDeleteSala: () => ({ mutateAsync: mockDeleteMutateAsync, isPending: false }),
}));

vi.mock('@infra/hooks/useActiveCitasBySala', () => ({
  useActiveCitasBySala: () => ({ check: mockCheckCitas }),
}));

// ── Toast mock ──────────────────────────────────────────────────────────────────

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('@infra/components/ui/common/Toast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
  ToastProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// ── Modal stubs (own suites cover their internals) ────────────────────────────

vi.mock('@infra/components/ui/domain/modals/CentroModal', () => ({
  CentroModal: ({ open, mode }: { open: boolean; mode: string }) =>
    open ? <div data-testid="centro-modal">{`centro-modal:${mode}`}</div> : null,
}));

vi.mock('@infra/components/ui/domain/modals/SalaModal', () => ({
  SalaModal: ({ open, mode, salaId }: { open: boolean; mode: string; salaId?: number }) =>
    open ? <div data-testid="sala-modal">{`sala-modal:${mode}:${salaId ?? 'none'}`}</div> : null,
}));

// ── i18n setup ────────────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['dashboard'],
  defaultNS: 'dashboard',
  resources: { en: { dashboard: enDashboard } },
  interpolation: { escapeValue: false },
});

// ── Import after mocks ──────────────────────────────────────────────────────────

import { CentrosPage } from '@infra/pages/CentrosPage/CentrosPage';

// ── Wrapper ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={testI18n}>
        <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

function renderPage() {
  return render(<CentrosPage />, { wrapper: createWrapper() });
}

/** Opens the three-dots menu for the sala card with the given accessible name. */
function openSalaMenu(salaNombre: string) {
  const trigger = screen.getByRole('button', {
    name: new RegExp(`more options for ${salaNombre}`, 'i'),
  });
  fireEvent.click(trigger);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRoles = ['superadmin'];
  mockSalas = [SALA_ACTIVE, SALA_INACTIVE];
  updateShouldFail = false;
  mockCheckCitas.mockResolvedValue(0);
  mockDeleteMutateAsync.mockResolvedValue(undefined);
});

// ── Removed actions (Goals 2 & 3) ─────────────────────────────────────────────

describe('CentrosPage — removed disabled actions', () => {
  it('does NOT render a "Ver mapa" / "View map" page-header button', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /ver mapa|view map/i })).not.toBeInTheDocument();
  });

  it('does NOT render a "Ver agenda" / "View agenda" detail-panel button', () => {
    renderPage();
    expect(
      screen.queryByRole('button', { name: /ver agenda|view (agenda|schedule)/i }),
    ).not.toBeInTheDocument();
  });

  it('still renders the "Edit centre" detail-panel button (preserved)', () => {
    renderPage();
    // The button's accessible name comes from its aria-label ("Edit this centre").
    expect(
      screen.getByRole('button', { name: /edit this centre|editar este centro/i }),
    ).toBeInTheDocument();
  });
});

// ── canWrite gate (RBAC) ──────────────────────────────────────────────────────

describe('CentrosPage — sala menu RBAC gate', () => {
  it('renders the three-dots trigger for each sala when superadmin', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /more options for Lotus/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more options for Orchid/i })).toBeInTheDocument();
  });

  it('does NOT render the three-dots trigger when the user is not superadmin', () => {
    mockRoles = ['recepcionista'];
    renderPage();
    expect(screen.queryByRole('button', { name: /more options for/i })).not.toBeInTheDocument();
  });
});

// ── Menu entries & Editar ─────────────────────────────────────────────────────

describe('CentrosPage — sala menu entries', () => {
  it('opens a menu with Edit / Disable / Delete for an ACTIVE sala', () => {
    renderPage();
    openSalaMenu('Lotus');

    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /^edit$/i })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /^disable$/i })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /^delete$/i })).toBeInTheDocument();
    // Inactive-only label must be absent for an active sala.
    expect(within(menu).queryByRole('menuitem', { name: /^enable$/i })).not.toBeInTheDocument();
  });

  it('shows "Enable" (not "Disable") for an INACTIVE sala', () => {
    renderPage();
    openSalaMenu('Orchid');

    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /^enable$/i })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: /^disable$/i })).not.toBeInTheDocument();
  });

  it('selecting "Edit" opens the SalaModal in edit mode for that sala', () => {
    renderPage();
    openSalaMenu('Lotus');

    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /^edit$/i }));

    expect(screen.getByTestId('sala-modal')).toHaveTextContent('sala-modal:edit:10');
  });
});

// ── Toggle activa ─────────────────────────────────────────────────────────────

describe('CentrosPage — sala toggle (Disable/Enable)', () => {
  it('"Disable" on an active sala calls useUpdateSala with activa:false and toasts success', async () => {
    renderPage();
    openSalaMenu('Lotus');

    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /^disable$/i }));

    expect(mockUpdateMutate).toHaveBeenCalledWith({ id: 10, dto: { activa: false } });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Room disabled');
    });
  });

  it('"Enable" on an inactive sala calls useUpdateSala with activa:true and toasts success', async () => {
    renderPage();
    openSalaMenu('Orchid');

    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /^enable$/i }));

    expect(mockUpdateMutate).toHaveBeenCalledWith({ id: 11, dto: { activa: true } });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Room enabled');
    });
  });

  it('toasts an error when the toggle mutation fails', async () => {
    updateShouldFail = true;
    renderPage();
    openSalaMenu('Lotus');

    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /^disable$/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('toggle failed');
    });
  });
});

// ── Menu trigger isolation + keyboard (A11y) ──────────────────────────────────

describe('CentrosPage — sala menu trigger isolation & keyboard', () => {
  it('opening the menu does NOT trigger the card edit action (stopPropagation — Edge Case 9)', () => {
    renderPage();
    openSalaMenu('Lotus');

    // Menu is open…
    expect(screen.getByRole('menu')).toBeInTheDocument();
    // …but the card's primary click (edit → SalaModal) must NOT have fired.
    expect(screen.queryByTestId('sala-modal')).not.toBeInTheDocument();
  });

  it('the three-dots trigger is a focusable button reachable for keyboard users', () => {
    renderPage();
    const trigger = screen.getByRole('button', { name: /more options for Lotus/i });
    trigger.focus();
    expect(trigger).toHaveFocus();
  });

  it('opens the menu via ArrowDown on the focused trigger', () => {
    renderPage();
    const trigger = screen.getByRole('button', { name: /more options for Lotus/i });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('opens the menu via Enter on the focused trigger', () => {
    renderPage();
    const trigger = screen.getByRole('button', { name: /more options for Orchid/i });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes the open menu when Escape is pressed on the trigger', () => {
    renderPage();
    const trigger = screen.getByRole('button', { name: /more options for Lotus/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('exposes aria-haspopup="menu" and toggles aria-expanded on the trigger wrapper', () => {
    renderPage();
    const trigger = screen.getByRole('button', { name: /more options for Lotus/i });
    // The DropdownMenu trigger wrapper carries the aria attributes.
    const wrapper = trigger.closest('[aria-haspopup="menu"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(wrapper).toHaveAttribute('aria-expanded', 'true');
  });
});

// ── Delete via menu — guard + confirm Dialog ──────────────────────────────────

describe('CentrosPage — sala delete via menu', () => {
  it('runs the active-citas guard with the sala id when "Delete" is selected', async () => {
    renderPage();
    openSalaMenu('Lotus');

    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockCheckCitas).toHaveBeenCalledWith(10);
    });
  });

  it('opens the confirmation Dialog and deletes on confirm when there are no active citas', async () => {
    renderPage();
    openSalaMenu('Lotus');
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /^delete$/i }));

    const message = await screen.findByText(/are you sure you want to delete the room/i);
    const dialog = message.closest<HTMLElement>('[role="dialog"]')!;
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith(10);
    });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Room deleted');
    });
  });

  it('blocks deletion and shows the guard dialog when active citas exist', async () => {
    mockCheckCitas.mockResolvedValue(4);
    renderPage();
    openSalaMenu('Lotus');
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /^delete$/i }));

    await screen.findByText(/no se puede eliminar/i);
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByText(/are you sure you want to delete the room/i)).not.toBeInTheDocument();
  });

  it('toasts an error when the delete mutation rejects (confirm path)', async () => {
    mockDeleteMutateAsync.mockRejectedValue(new Error('delete boom'));
    renderPage();
    openSalaMenu('Lotus');
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /^delete$/i }));

    const message = await screen.findByText(/are you sure you want to delete the room/i);
    const dialog = message.closest<HTMLElement>('[role="dialog"]')!;
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Could not delete the room');
    });
  });
});

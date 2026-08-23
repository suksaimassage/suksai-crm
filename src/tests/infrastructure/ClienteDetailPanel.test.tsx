/**
 * ClienteDetailPanel.test.tsx
 *
 * Tests the three render states (closed, loading, error, ready) and all
 * interactive behaviours of the detail panel component.
 *
 * Strategy:
 *   - The component has no external data hooks — it receives all data via props.
 *   - Wrap with ThemeProvider + I18nextProvider (same pattern as LoginPage.test.tsx).
 *   - Use fireEvent for click interactions.
 *   - No snapshot tests.
 *
 * [TESTABILITY GAP] @testing-library/user-event is not installed in this project.
 * fireEvent is used as a substitute for click interactions. Install
 * @testing-library/user-event to gain realistic pointer event sequences,
 * focus management assertions, and keyboard navigation tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import enClientes from '@infra/i18n/locales/en/clientes.json';
import { ClienteDetailPanel } from '@infra/components/ui/domain/ClienteDetailPanel';
import { MOCK_LUCIA_DETALLE } from '@infra/pages/ClientesPage/Clientes.fixtures';
import type { IClienteDetailPanelProps } from '@infra/components/ui/domain/ClienteDetailPanel';
import type { IClienteDetalle } from '@infra/pages/ClientesPage/Clientes.types';

// ── i18n test instance ────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();

void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['clientes'],
  defaultNS: 'clientes',
  resources: { en: { clientes: enClientes } },
  interpolation: { escapeValue: false },
});

// ── Wrapper ───────────────────────────────────────────────────────────────────

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Base props factory ────────────────────────────────────────────────────────

function makeProps(overrides: Partial<IClienteDetailPanelProps> = {}): IClienteDetailPanelProps {
  return {
    detalle: null,
    isOpen: true,
    isLoading: false,
    isError: false,
    onClose: vi.fn(),
    onSchedule: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onReactivate: vi.fn(),
    isReactivatePending: false,
    onRetry: vi.fn(),
    currentUserName: 'Test User',
    ...overrides,
  };
}

// ── Closed state ──────────────────────────────────────────────────────────────

describe('ClienteDetailPanel — closed state', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(<ClienteDetailPanel {...makeProps({ isOpen: false })} />, {
      wrapper: Wrapper,
    });
    // Component returns null
    expect(container.firstChild).toBeNull();
  });
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('ClienteDetailPanel — loading state', () => {
  it('renders the panel (role="complementary") when isOpen=true and isLoading=true', () => {
    render(<ClienteDetailPanel {...makeProps({ isLoading: true })} />, { wrapper: Wrapper });
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders skeleton blocks (no client name visible) when isLoading=true', () => {
    render(<ClienteDetailPanel {...makeProps({ isLoading: true })} />, { wrapper: Wrapper });
    // Lucía's name must not be visible in the skeleton state
    expect(screen.queryByText('Lucía Ramos')).not.toBeInTheDocument();
  });

  it('does not show the error alert when isLoading=true', () => {
    render(<ClienteDetailPanel {...makeProps({ isLoading: true })} />, { wrapper: Wrapper });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('ClienteDetailPanel — error state', () => {
  it('renders an alert when isError=true and isLoading=false', () => {
    render(<ClienteDetailPanel {...makeProps({ isError: true, isLoading: false })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows error message text in the alert', () => {
    render(<ClienteDetailPanel {...makeProps({ isError: true, isLoading: false })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load client detail/i);
  });

  it('shows a retry button in the error state', () => {
    render(<ClienteDetailPanel {...makeProps({ isError: true, isLoading: false })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ClienteDetailPanel {...makeProps({ isError: true, isLoading: false, onRetry })} />, {
      wrapper: Wrapper,
    });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render skeleton when isError=true and isLoading=false', () => {
    render(<ClienteDetailPanel {...makeProps({ isError: true, isLoading: false })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Lucía Ramos')).not.toBeInTheDocument();
  });
});

// ── Null detalle (ready but no data) ─────────────────────────────────────────

describe('ClienteDetailPanel — null detalle while not loading and not erroring', () => {
  it('does not crash when detalle=null, isLoading=false, isError=false', () => {
    // The implementation guards: !isLoading && !isError && detalle !== null — renders nothing extra
    expect(() =>
      render(
        <ClienteDetailPanel {...makeProps({ detalle: null, isLoading: false, isError: false })} />,
        { wrapper: Wrapper },
      ),
    ).not.toThrow();
  });

  it('renders the panel shell but no client content when detalle=null', () => {
    render(
      <ClienteDetailPanel {...makeProps({ detalle: null, isLoading: false, isError: false })} />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByText('Lucía Ramos')).not.toBeInTheDocument();
  });
});

// ── Ready state — full Lucía fixture ─────────────────────────────────────────

describe('ClienteDetailPanel — ready state with MOCK_LUCIA_DETALLE', () => {
  const defaultReadyProps = (): IClienteDetailPanelProps =>
    makeProps({
      detalle: MOCK_LUCIA_DETALLE,
      isLoading: false,
      isError: false,
    });

  it('renders client full name', () => {
    render(<ClienteDetailPanel {...defaultReadyProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Lucía Ramos')).toBeInTheDocument();
  });

  it('renders client phone number', () => {
    render(<ClienteDetailPanel {...defaultReadyProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('+34 611 234 567')).toBeInTheDocument();
  });

  it('renders client email address', () => {
    render(<ClienteDetailPanel {...defaultReadyProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('lucia.ramos@email.com')).toBeInTheDocument();
  });

  it('email link has correct mailto: href', () => {
    render(<ClienteDetailPanel {...defaultReadyProps()} />, { wrapper: Wrapper });
    const emailLink = screen.getByRole('link', { name: /send email to lucia/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:lucia.ramos@email.com');
  });

  it('renders the VIP segment badge', () => {
    render(<ClienteDetailPanel {...defaultReadyProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('renders the plan label "Bono 10 sesiones"', () => {
    render(<ClienteDetailPanel {...defaultReadyProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Bono 10 sesiones')).toBeInTheDocument();
  });
});

// ── Close button ──────────────────────────────────────────────────────────────

describe('ClienteDetailPanel — close button', () => {
  it('renders a close button with accessible label', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('button', { name: /close client panel/i })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE, onClose })} />, {
      wrapper: Wrapper,
    });

    fireEvent.click(screen.getByRole('button', { name: /close client panel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── Action buttons ────────────────────────────────────────────────────────────

describe('ClienteDetailPanel — Mensaje button', () => {
  it('Mensaje button is enabled when email is present', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    // aria-label equals the translation of 'actions.mensaje' ("Message")
    const btn = screen.getByRole('button', { name: /message/i });
    expect(btn).not.toBeDisabled();
  });

  it('Mensaje button is disabled when email is null', () => {
    const detalleNoEmail = {
      ...MOCK_LUCIA_DETALLE,
      cliente: { ...MOCK_LUCIA_DETALLE.cliente, email: null },
    };
    render(<ClienteDetailPanel {...makeProps({ detalle: detalleNoEmail })} />, {
      wrapper: Wrapper,
    });
    // Button still renders with 'Message' text but aria-label is sinEmail
    const btn = screen.getByRole('button', { name: /no email/i });
    expect(btn).toBeDisabled();
  });
});

describe('ClienteDetailPanel — Agendar button', () => {
  it('Agendar button is enabled and calls onSchedule when clicked', () => {
    const onSchedule = vi.fn();
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE, onSchedule })} />, {
      wrapper: Wrapper,
    });

    const btn = screen.getByRole('button', { name: /^schedule$/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onSchedule).toHaveBeenCalledTimes(1);
  });
});

// ── Preferences section ───────────────────────────────────────────────────────
// NOTE: preferencias was removed from IClienteDetalle — the field no longer exists
// on the domain type. This describe block is intentionally left empty to mark
// where preference tests would live once the feature is re-implemented.

// ── Note section ──────────────────────────────────────────────────────────────

describe('ClienteDetailPanel — note section', () => {
  it('renders the observation note text', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    // MOCK_LUCIA_DETALLE.notaEstudio contains "Tensión recurrente"
    expect(screen.getByText(/Tensión recurrente/)).toBeInTheDocument();
  });

  it('renders the note author', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    // Naree Apinya appears as therapist in cita rows AND as note author — use getAllByText
    const instances = screen.getAllByText(/Naree Apinya/);
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render note section when notaEstudio is null', () => {
    const detalleNoNota = { ...MOCK_LUCIA_DETALLE, notaEstudio: null };
    render(<ClienteDetailPanel {...makeProps({ detalle: detalleNoNota })} />, { wrapper: Wrapper });
    expect(screen.queryByText(/Tensión recurrente/)).not.toBeInTheDocument();
  });
});

// ── Stats section ─────────────────────────────────────────────────────────────

describe('ClienteDetailPanel — stats section', () => {
  it('renders total visits count', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    // totalVisitasAnio = 22
    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('renders loyalty points', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    // puntos = 340
    expect(screen.getByText('340')).toBeInTheDocument();
  });
});

// ── Appointments section ──────────────────────────────────────────────────────

describe('ClienteDetailPanel — appointments section', () => {
  it('renders próxima cita service name', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    // "Tradicional Tailandés" appears in both próxima cita and citasRecientes[1]
    const instances = screen.getAllByText(/Tradicional Tailandés/);
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it('renders past cita service names', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    // citasRecientes[0] servicioNombre = 'Aceites Cálidos'
    expect(screen.getByText(/Aceites Cálidos/)).toBeInTheDocument();
  });

  it('renders therapist name for past citas', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    // All citas have terapeutaNombre 'Naree Apinya' — multiple instances present
    const names = screen.getAllByText('Naree Apinya');
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "No appointments on record" when there are no citas and no proximaCita', () => {
    const detalleNoCitas = {
      ...MOCK_LUCIA_DETALLE,
      proximaCita: null,
      citasRecientes: [] as const,
    };
    render(<ClienteDetailPanel {...makeProps({ detalle: detalleNoCitas })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText(/no appointments on record/i)).toBeInTheDocument();
  });
});

// ── Reactivation button ───────────────────────────────────────────────────────

const MOCK_LUCIA_INACTIVE: IClienteDetalle = {
  ...MOCK_LUCIA_DETALLE,
  cliente: { ...MOCK_LUCIA_DETALLE.cliente, activo: false },
  segmento: 'inactivo',
};

describe('ClienteDetailPanel — Reactivar button', () => {
  it('shows "Reactivar" button when client is inactive', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_INACTIVE })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('button', { name: /reactivate lucía ramos/i })).toBeInTheDocument();
  });

  it('does not show "Eliminar" when client is inactive', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_INACTIVE })} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByRole('button', { name: /delete lucía ramos/i })).not.toBeInTheDocument();
  });

  it('shows "Eliminar" button when client is active', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('button', { name: /delete lucía ramos/i })).toBeInTheDocument();
  });

  it('calls onReactivate when Reactivar button is clicked', () => {
    const onReactivate = vi.fn();
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_INACTIVE, onReactivate })} />, {
      wrapper: Wrapper,
    });

    fireEvent.click(screen.getByRole('button', { name: /reactivate lucía ramos/i }));
    expect(onReactivate).toHaveBeenCalledTimes(1);
  });

  it('Editar button is disabled while isReactivatePending=true', () => {
    render(
      <ClienteDetailPanel
        {...makeProps({ detalle: MOCK_LUCIA_INACTIVE, isReactivatePending: true })}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('button', { name: /edit lucía ramos/i })).toBeDisabled();
  });

  it('Reactivar button shows loading state when isReactivatePending=true', () => {
    render(
      <ClienteDetailPanel
        {...makeProps({ detalle: MOCK_LUCIA_INACTIVE, isReactivatePending: true })}
      />,
      { wrapper: Wrapper },
    );
    // When loading=true the Button component disables itself
    expect(screen.getByRole('button', { name: /reactivate lucía ramos/i })).toBeDisabled();
  });
});

// ── Accessibility contract ────────────────────────────────────────────────────

describe('ClienteDetailPanel — accessibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('root renders as role="complementary" (aside)', () => {
    render(<ClienteDetailPanel {...makeProps({ detalle: MOCK_LUCIA_DETALLE })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('error state uses role="alert" and aria-live="assertive"', () => {
    render(<ClienteDetailPanel {...makeProps({ isError: true, isLoading: false })} />, {
      wrapper: Wrapper,
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});

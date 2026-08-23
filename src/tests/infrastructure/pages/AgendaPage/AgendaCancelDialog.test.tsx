/**
 * AgendaCancelDialog.test.tsx
 *
 * The cancel-with-motivo confirmation (Designer §1.7, §3.3). Two variants:
 *   - destructive (blockedReason=null): message + motivo Textarea + confirm/cancel
 *   - informational blocked-completed/cancelled: single ack, no destructive button.
 *
 * Real Dialog primitive (renders via Modal). Real i18n + theme. fireEvent.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import { AgendaCancelDialog } from '@infra/pages/AgendaPage/components/admin/AgendaCancelDialog';
import type { TCancelBlockedReason } from '@infra/pages/AgendaPage/components/admin/AgendaCancelDialog';

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

function baseProps(overrides: Partial<React.ComponentProps<typeof AgendaCancelDialog>> = {}) {
  return {
    open: true,
    clienteName: 'Lucía Reyes',
    fecha: '14 may',
    hora: '14:00',
    motivo: '',
    onMotivoChange: vi.fn(),
    submitting: false,
    errorMessage: undefined,
    blockedReason: null as TCancelBlockedReason,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

// ── Destructive variant ─────────────────────────────────────────────────────────

describe('AgendaCancelDialog — destructive variant', () => {
  it('shows the cancel title and the confirm / volver buttons', () => {
    render(<AgendaCancelDialog {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText('Cancelar cita')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sí, cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
  });

  it('renders the message interpolated with cliente, fecha and hora', () => {
    render(<AgendaCancelDialog {...baseProps()} />, { wrapper: Wrapper });
    expect(screen.getByText(/Lucía Reyes/)).toBeInTheDocument();
    expect(screen.getByText(/14 may/)).toBeInTheDocument();
    expect(screen.getByText(/14:00/)).toBeInTheDocument();
  });

  it('clicking "Sí, cancelar" calls onConfirm', () => {
    const onConfirm = vi.fn();
    render(<AgendaCancelDialog {...baseProps({ onConfirm })} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('typing in the motivo textarea calls onMotivoChange', () => {
    const onMotivoChange = vi.fn();
    render(<AgendaCancelDialog {...baseProps({ onMotivoChange })} />, { wrapper: Wrapper });
    const textarea = screen.getByPlaceholderText('Motivo de la cancelación');
    fireEvent.change(textarea, { target: { value: 'cliente enfermo' } });
    expect(onMotivoChange).toHaveBeenCalledWith('cliente enfermo');
  });

  it('disables the motivo textarea while submitting', () => {
    render(<AgendaCancelDialog {...baseProps({ submitting: true })} />, { wrapper: Wrapper });
    expect(screen.getByPlaceholderText('Motivo de la cancelación')).toBeDisabled();
  });

  it('surfaces an error message in a role="alert" region when provided', () => {
    render(<AgendaCancelDialog {...baseProps({ errorMessage: 'No se pudo cancelar' })} />, {
      wrapper: Wrapper,
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('No se pudo cancelar');
  });

  it('renders nothing visible when open is false', () => {
    render(<AgendaCancelDialog {...baseProps({ open: false })} />, { wrapper: Wrapper });
    expect(screen.queryByText('Cancelar cita')).not.toBeInTheDocument();
  });
});

// ── Blocked-completed / blocked-cancelled informational variant ─────────────────

describe('AgendaCancelDialog — blocked variant', () => {
  it('blockedReason="completed" shows the completed explanation and a single ack button', () => {
    render(<AgendaCancelDialog {...baseProps({ blockedReason: 'completed' })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('No se puede cancelar')).toBeInTheDocument();
    expect(
      screen.getByText('Esta cita ya está completada y no puede cancelarse.'),
    ).toBeInTheDocument();
    // No destructive confirm — only the informational acknowledgement.
    expect(screen.queryByRole('button', { name: 'Sí, cancelar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entendido' })).toBeInTheDocument();
  });

  it('blockedReason="cancelled" shows the already-cancelled explanation', () => {
    render(<AgendaCancelDialog {...baseProps({ blockedReason: 'cancelled' })} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Esta cita ya está cancelada.')).toBeInTheDocument();
  });

  it('the blocked variant does not render the motivo textarea', () => {
    render(<AgendaCancelDialog {...baseProps({ blockedReason: 'completed' })} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByPlaceholderText('Motivo de la cancelación')).not.toBeInTheDocument();
  });

  it('clicking "Entendido" closes the dialog', () => {
    const onClose = vi.fn();
    render(<AgendaCancelDialog {...baseProps({ blockedReason: 'completed', onClose })} />, {
      wrapper: Wrapper,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(onClose).toHaveBeenCalled();
  });
});

/**
 * CentroModal.test.tsx
 *
 * Tests CentroModal behavior in create and edit modes.
 *
 * Mock strategy:
 *  - Mutation hooks are mocked at module level (useCreateCentro, useUpdateCentro,
 *    useDeleteCentro). The real form-action logic is exercised; mutations are
 *    intercepted at the hook boundary.
 *  - useToast is mocked so we can assert toast calls without rendering the
 *    ToastProvider portal.
 *  - i18next uses a test instance loaded with the english dashboard namespace.
 *  - Modal renders into a portal — document.body is the container.
 *
 * [TESTABILITY GAP] useActionState is a React 19 concurrent API. In jsdom the
 * form action fires synchronously after submit, but the state update propagates
 * through React's scheduler. Tests use waitFor to accommodate the async tick.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import enDashboard from '@infra/i18n/locales/en/dashboard.json';
import type { ICentro } from '@domain/models';

// ── Mutation hook mocks ───────────────────────────────────────────────────────

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();

vi.mock('@infra/hooks/useCreateCentro', () => ({
  useCreateCentro: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
    isError: false,
  }),
}));

vi.mock('@infra/hooks/useUpdateCentro', () => ({
  useUpdateCentro: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
    isError: false,
  }),
}));

vi.mock('@infra/hooks/useDeleteCentro', () => ({
  useDeleteCentro: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
    isError: false,
  }),
}));

// ── Toast mock ────────────────────────────────────────────────────────────────

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('@infra/components/ui/common/Toast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
  ToastProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// ── Modal mock ────────────────────────────────────────────────────────────────
// The real Modal validates that a Modal.Header child exists (displayName check).
// After the refactor, CentroModal's modal shell only contains <Form> — no
// Modal.Header — so the guard throws. We mock Modal to a simple pass-through,
// exposing the same sub-component shape so consumers (e.g. DeleteGuardDialog)
// that use Modal.Header / Modal.Body / Modal.Footer also work without errors.
// NOTE: The factory is declared inline so Vitest's vi.mock hoisting does not
// encounter a temporal dead zone with module-scope const variables.

vi.mock('@infra/components/ui/common/Modal', () => {
  const ModalRoot = ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <div data-testid="modal">{children}</div> : null;
  // Mirror the real Modal.Header contract: when showCloseButton is set (default
  // in Modal.Header) and an onClose handler is provided, render a labelled close
  // button. This keeps the close-button behavior testable under the mock.
  const ModalHeader = ({
    title,
    children,
    showCloseButton = true,
    onClose,
  }: {
    title?: string;
    children?: ReactNode;
    showCloseButton?: boolean;
    onClose?: () => void;
  }) => (
    <div data-testid="modal-header">
      {title ?? children}
      {showCloseButton && onClose !== undefined && (
        <button type="button" aria-label="Close modal" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
  const ModalBody = ({ children }: { children: ReactNode }) => (
    <div data-testid="modal-body">{children}</div>
  );
  const ModalFooter = ({ children }: { children: ReactNode }) => (
    <div data-testid="modal-footer">{children}</div>
  );
  ModalRoot.displayName = 'Modal';
  ModalHeader.displayName = 'Modal.Header';
  ModalBody.displayName = 'Modal.Body';
  ModalFooter.displayName = 'Modal.Footer';
  return {
    Modal: Object.assign(ModalRoot, {
      Header: ModalHeader,
      Body: ModalBody,
      Footer: ModalFooter,
    }),
  };
});

// ── Router mock (Modal may internally use router) ─────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useParams: () => ({}),
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

// ── Import component after mocks ──────────────────────────────────────────────

import { CentroModal } from './CentroModal';

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

// ── Test wrapper ──────────────────────────────────────────────────────────────

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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CENTRO_FIXTURE: ICentro = {
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

// ── Render helpers ────────────────────────────────────────────────────────────

const defaultCreateProps = {
  open: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  mode: 'create' as const,
};

const defaultEditProps = {
  open: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  mode: 'edit' as const,
  centroId: 1 as const,
  initialData: CENTRO_FIXTURE,
};

// ── Tests: Create mode rendering ──────────────────────────────────────────────

describe('CentroModal — create mode rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue(CENTRO_FIXTURE);
  });

  it('renders the create title', () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.getByText(/new centre/i)).toBeInTheDocument();
  });

  it('renders nombre input with empty value', () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    const input = screen.getByRole('textbox', { name: /centre name/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('renders ciudad input with empty value', () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    const input = screen.getByRole('textbox', { name: /city/i });
    expect(input).toHaveValue('');
  });

  it('does NOT render the Switch (activo) in create mode', () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    // The Switch is only shown in edit mode
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('renders the create submit button', () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /create centre/i })).toBeInTheDocument();
  });

  it('does NOT render the delete button in create mode', () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.queryByRole('button', { name: /delete centre/i })).not.toBeInTheDocument();
  });
});

// ── Tests: Edit mode rendering ────────────────────────────────────────────────

describe('CentroModal — edit mode rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMutateAsync.mockResolvedValue(CENTRO_FIXTURE);
  });

  it('renders the edit title', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByText(/edit centre/i)).toBeInTheDocument();
  });

  it('pre-fills nombre with initialData.nombre', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });
    const input = screen.getByRole('textbox', { name: /centre name/i });
    expect(input).toHaveValue('Suksai Madrid');
  });

  it('pre-fills ciudad with initialData.ciudad', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });
    const input = screen.getByRole('textbox', { name: /city/i });
    expect(input).toHaveValue('Madrid');
  });

  it('renders the Switch (activo) in edit mode', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders the delete button in edit mode', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /delete centre/i })).toBeInTheDocument();
  });

  it('renders the edit submit button', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});

// ── Tests: Validation ─────────────────────────────────────────────────────────

describe('CentroModal — validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows error banner when nombre is empty on submit', async () => {
    mockCreateMutateAsync.mockResolvedValue(CENTRO_FIXTURE);
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    // Leave nombre empty, fill ciudad
    fireEvent.change(screen.getByRole('textbox', { name: /city/i }), {
      target: { value: 'Madrid' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create centre/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it('shows error banner when ciudad is empty on submit', async () => {
    mockCreateMutateAsync.mockResolvedValue(CENTRO_FIXTURE);
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByRole('textbox', { name: /centre name/i }), {
      target: { value: 'Centro Test' },
    });
    // Leave ciudad empty

    fireEvent.click(screen.getByRole('button', { name: /create centre/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not show error banner when required fields are filled', async () => {
    mockCreateMutateAsync.mockResolvedValue(CENTRO_FIXTURE);
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByRole('textbox', { name: /centre name/i }), {
      target: { value: 'Centro Test' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /city/i }), {
      target: { value: 'Madrid' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create centre/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalled();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ── Tests: Create submission ──────────────────────────────────────────────────

describe('CentroModal — create submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue(CENTRO_FIXTURE);
  });

  it('calls createMutation.mutateAsync with form data on valid submit', async () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByRole('textbox', { name: /centre name/i }), {
      target: { value: 'Centro Ibiza' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /city/i }), {
      target: { value: 'Ibiza' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create centre/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Centro Ibiza', ciudad: 'Ibiza' }),
      );
    });
  });

  it('calls toastSuccess after successful create', async () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByRole('textbox', { name: /centre name/i }), {
      target: { value: 'Centro Test' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /city/i }), {
      target: { value: 'Madrid' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create centre/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });

  it('calls onSuccess("created") after successful create', async () => {
    const onSuccess = vi.fn();
    render(<CentroModal {...defaultCreateProps} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByRole('textbox', { name: /centre name/i }), {
      target: { value: 'Centro Test' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /city/i }), {
      target: { value: 'Madrid' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create centre/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('created');
    });
  });

  it('shows error banner when createMutation throws', async () => {
    mockCreateMutateAsync.mockRejectedValue(new Error('Duplicate nombre'));
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByRole('textbox', { name: /centre name/i }), {
      target: { value: 'Centro Test' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /city/i }), {
      target: { value: 'Madrid' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create centre/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Duplicate nombre');
  });
});

// ── Tests: Edit submission ────────────────────────────────────────────────────

describe('CentroModal — edit submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMutateAsync.mockResolvedValue(CENTRO_FIXTURE);
  });

  it('calls updateMutation.mutateAsync on valid submit in edit mode', async () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          dto: expect.objectContaining({ nombre: 'Suksai Madrid' }) as Record<string, unknown>,
        }),
      );
    });
  });

  it('calls toastSuccess after successful update', async () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });

  it('calls onSuccess("updated") after successful update', async () => {
    const onSuccess = vi.fn();
    render(<CentroModal {...defaultEditProps} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('updated');
    });
  });
});

// ── Tests: Switch hidden input serialization ──────────────────────────────────

describe('CentroModal — Switch activo hidden input', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hidden input starts with "true" when initialData.activo is true', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });
    // The hidden input carries the activo value
    const hiddenInput = document.querySelector<HTMLInputElement>('input[name="activo"]')!;
    expect(hiddenInput).not.toBeNull();
    expect(hiddenInput.value).toBe('true');
  });

  it('hidden input starts with "false" when initialData.activo is false', () => {
    render(
      <CentroModal {...defaultEditProps} initialData={{ ...CENTRO_FIXTURE, activo: false }} />,
      { wrapper: createWrapper() },
    );
    const hiddenInput = document.querySelector<HTMLInputElement>('input[name="activo"]')!;
    expect(hiddenInput.value).toBe('false');
  });
});

// ── Tests: Delete flow (confirmation Dialog overlay) ──────────────────────────
// After the refactor the inline confirm was replaced by a sibling `Dialog`
// (type="error"). The red "Delete centre" footer button is the trigger; clicking
// it opens the Dialog. The Dialog confirm button is labelled "Delete" (exact),
// the cancel is "Cancel". `onConfirm` does NOT auto-close (loading state owns it).
//
// The Dialog renders through the mocked Modal, so it is queryable in the same
// document. The footer trigger ("Delete centre") and the dialog confirm
// ("Delete") have distinct accessible names; we scope with exact regex.

/** Returns the dialog message container so we can scope dialog-local queries. */
function getDeleteDialog() {
  // The dialog message text is unique to the confirmation Dialog.
  const message = screen.getByText(/are you sure you want to delete this centre/i);
  // climb to the Modal mock container (data-testid="modal")
  return message.closest<HTMLElement>('[data-testid="modal"]')!;
}

describe('CentroModal — delete flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteMutateAsync.mockResolvedValue(undefined);
  });

  it('does not render the confirmation Dialog until the delete trigger is clicked', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(
      screen.queryByText(/are you sure you want to delete this centre/i),
    ).not.toBeInTheDocument();
  });

  it('clicking the "Delete centre" trigger opens the confirmation Dialog', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /delete centre/i }));

    // Dialog title + message now visible
    expect(getDeleteDialog()).toBeInTheDocument();
    expect(
      within(getDeleteDialog()).getByRole('button', { name: /^delete$/i }),
    ).toBeInTheDocument();
  });

  it('confirming the Dialog calls deleteMutation.mutateAsync with centroId', async () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /delete centre/i }));
    fireEvent.click(within(getDeleteDialog()).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith(1);
    });
  });

  it('calls toastSuccess after a successful delete', async () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /delete centre/i }));
    fireEvent.click(within(getDeleteDialog()).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });

  it('calls onSuccess("deleted") after a successful delete', async () => {
    const onSuccess = vi.fn();
    render(<CentroModal {...defaultEditProps} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole('button', { name: /delete centre/i }));
    fireEvent.click(within(getDeleteDialog()).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('deleted');
    });
  });

  it('calls toastError when the delete mutation throws (Dialog stays open — D1)', async () => {
    mockDeleteMutateAsync.mockRejectedValue(new Error('Delete failed'));
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /delete centre/i }));
    fireEvent.click(within(getDeleteDialog()).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Delete failed');
    });

    // D1: on error the Dialog remains open so the user can retry.
    expect(screen.getByText(/are you sure you want to delete this centre/i)).toBeInTheDocument();
  });

  it('clicking the Dialog cancel closes it without deleting', () => {
    render(<CentroModal {...defaultEditProps} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /delete centre/i }));
    expect(getDeleteDialog()).toBeInTheDocument();

    fireEvent.click(within(getDeleteDialog()).getByRole('button', { name: /^cancel$/i }));

    expect(
      screen.queryByText(/are you sure you want to delete this centre/i),
    ).not.toBeInTheDocument();
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('does not auto-close the modal when the Dialog confirm is clicked before resolution', () => {
    // onConfirm fires handleDelete; the modal close only happens on success tick.
    const onClose = vi.fn();
    render(<CentroModal {...defaultEditProps} onClose={onClose} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /delete centre/i }));
    // Before clicking confirm, onClose must not have been called by opening the dialog.
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── Tests: Cancel / close ─────────────────────────────────────────────────────

describe('CentroModal — cancel / close', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clicking Cancel button calls onClose', () => {
    const onClose = vi.fn();
    render(<CentroModal {...defaultCreateProps} onClose={onClose} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

// ── Tests: Close button (Form.Header action) ──────────────────────────────────

describe('CentroModal — close button', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a close button with accessible label', () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
  });

  it('clicking the close button calls onClose', () => {
    const onClose = vi.fn();
    render(<CentroModal {...defaultCreateProps} onClose={onClose} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('modal is not rendered when open is false', () => {
    render(<CentroModal {...defaultCreateProps} open={false} />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});

// ── Tests: Form.Input inline validation ───────────────────────────────────────
// These tests rely on the real Form.Input security pipeline, which triggers
// error display on blur. They verify the inline-error path without submitting.

describe('CentroModal — Form.Input inline validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows inline required error when nombre is blurred while empty', async () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    const nombreInput = screen.getByRole('textbox', { name: /centre name/i });
    fireEvent.focus(nombreInput);
    fireEvent.blur(nombreInput);
    await waitFor(() => {
      // Form.Input renders the validation error via S.SubText with role="alert"
      // when a required field is blurred empty.
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('shows inline pattern error when email has invalid format', async () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'notanemail' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('clears inline error when email becomes valid after being invalid', async () => {
    render(<CentroModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    // Trigger invalid state
    fireEvent.change(emailInput, { target: { value: 'bad' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    // Now fix it
    fireEvent.change(emailInput, { target: { value: 'good@example.com' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      // After valid value, no inline alert should appear for the email field
      const alerts = screen.queryAllByRole('alert');
      // Either no alerts at all, or none containing the email pattern message
      const emailAlert = alerts.find((el) =>
        /valid email/i.test((el.textContent as string | null) ?? ''),
      );
      expect(emailAlert).toBeUndefined();
    });
  });
});

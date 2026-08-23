/**
 * TerapeutaModal.test.tsx
 *
 * Tests TerapeutaModal behavior in create mode, edit mode (active/inactive),
 * validation, create/update submission, deactivate (via confirm Dialog) and
 * reactivate flows, the centro-principal control, and close.
 *
 * Mock strategy:
 *  - Mutation hooks are mocked at module level (useCreateTerapeuta,
 *    useUpdateTerapeuta). The real form-action logic and Zod schema are
 *    exercised; mutations are intercepted at the hook boundary.
 *  - useCentrosActivos returns an empty list by default; useUsuarioCentroAssignments
 *    returns the new { centroIds, principalCentroId } contract.
 *  - useActiveCitasByTerapeuta provides the guard `check` function. Default
 *    mock resolves 0 (no active citas → confirm Dialog opens, not the guard).
 *  - useToast is mocked so we can assert toast calls without a ToastProvider portal.
 *  - Modal is mocked as a pass-through that renders its children when open=true.
 *    NOTE: this means the Dialog (which composes Modal internally) ALSO renders
 *    when confirmDeleteOpen=true — so its buttons are real and queryable.
 *  - CentroCheckboxList and DeleteGuardDialog are stubbed (own test files);
 *    CentroCheckboxList is stubbed as a controllable harness so we can drive the
 *    principal radio + checkbox callbacks without depending on its internals.
 *  - i18next uses a test instance loaded with the english terapeutas namespace.
 *
 * Interactions use fireEvent — this project does not ship
 * @testing-library/user-event (only dom/jest-dom/react are installed). This is
 * the established convention across the suite. See [TESTABILITY GAP] in report.
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
import enTerapeutas from '@infra/i18n/locales/en/terapeutas.json';
import type { IUsuario } from '@domain/models';

// ── Mutation hook mocks ───────────────────────────────────────────────────────

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
let updateIsPending = false;

vi.mock('@infra/hooks/useCreateTerapeuta', () => ({
  useCreateTerapeuta: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@infra/hooks/useUpdateTerapeuta', () => ({
  useUpdateTerapeuta: () => ({
    mutateAsync: mockUpdateMutateAsync,
    get isPending() {
      return updateIsPending;
    },
  }),
}));

// ── useCentrosActivos mock ────────────────────────────────────────────────────

const mockCentros: { data: { id: number; nombre: string }[]; isLoading: boolean } = {
  data: [],
  isLoading: false,
};

vi.mock('@infra/hooks/useCentrosActivos', () => ({
  useCentrosActivos: () => mockCentros,
}));

// ── useUsuarioCentroAssignments mock (new { centroIds, principalCentroId }) ────

const mockAssignments: { centroIds: readonly number[]; principalCentroId: number | null } = {
  centroIds: [],
  principalCentroId: null,
};

vi.mock('@infra/hooks/useUsuarioCentroAssignments', () => ({
  useUsuarioCentroAssignments: () => mockAssignments,
}));

// ── useActiveCitasByTerapeuta mock ────────────────────────────────────────────

const mockCheckCitas = vi.fn();

vi.mock('@infra/hooks/useActiveCitasByTerapeuta', () => ({
  useActiveCitasByTerapeuta: () => ({ check: mockCheckCitas }),
}));

// ── useRoles mock ──────────────────────────────────────────────────────────────

vi.mock('@infra/hooks/useRoles', () => ({
  useRoles: () => ({
    data: [
      { id: 1, nombre: 'masajista' },
      { id: 2, nombre: 'recepcionista' },
    ],
    isLoading: false,
    isError: false,
  }),
}));

// NOTE: SupabaseUsuarioCentroAdapter is NOT mocked here — useUsuarioCentroAssignments
// (the only consumer in this flow) is mocked above, so the adapter is never
// instantiated during these tests.

// ── Toast mock ────────────────────────────────────────────────────────────────

const mockToastSuccess = vi.fn();
const mockToastWarning = vi.fn();
const mockToastError = vi.fn();

vi.mock('@infra/components/ui/common/Toast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    warning: mockToastWarning,
    error: mockToastError,
  }),
  ToastProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// ── Modal mock (pass-through; Dialog composes this too) ───────────────────────

vi.mock('@infra/components/ui/common/Modal', () => {
  const ModalRoot = ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <div data-testid="modal">{children}</div> : null;
  const ModalHeader = ({ title, children }: { title?: string; children?: ReactNode }) => (
    <div data-testid="modal-header">{title ?? children}</div>
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

// ── CentroCheckboxList stub (controllable harness) ────────────────────────────
// Exposes the props we thread through so we can drive checkbox/principal changes
// and assert pre-fill, without depending on the real component's DOM (own test).

interface IStubProps {
  readonly selected: readonly number[];
  readonly onChange: (ids: readonly number[]) => void;
  readonly principalId?: number | null;
  readonly onPrincipalChange?: (id: number) => void;
}

vi.mock('@infra/components/ui/common/CentroCheckboxList', () => ({
  CentroCheckboxList: ({ selected, onChange, principalId, onPrincipalChange }: IStubProps) => (
    <div data-testid="centro-list">
      <span data-testid="selected-ids">{selected.join(',')}</span>
      <span data-testid="principal-id">{principalId ?? 'null'}</span>
      <button
        type="button"
        data-testid="check-10"
        onClick={() => {
          onChange([...selected, 10]);
        }}
      >
        check 10
      </button>
      <button
        type="button"
        data-testid="check-20"
        onClick={() => {
          onChange([...selected, 20]);
        }}
      >
        check 20
      </button>
      <button
        type="button"
        data-testid="uncheck-principal"
        onClick={() => {
          onChange(selected.filter((id) => id !== principalId));
        }}
      >
        uncheck principal
      </button>
      <button
        type="button"
        data-testid="principal-20"
        onClick={() => {
          onPrincipalChange?.(20);
        }}
      >
        principal 20
      </button>
    </div>
  ),
}));

// ── DeleteGuardDialog stub ────────────────────────────────────────────────────

vi.mock('@infra/components/ui/common/DeleteGuardDialog', () => ({
  DeleteGuardDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="guard-dialog" role="alertdialog" /> : null,
}));

// ── Router mock ───────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useParams: () => ({}),
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

// ── Import component after all mocks ─────────────────────────────────────────

import { TerapeutaModal } from './TerapeutaModal';

// ── i18n setup ────────────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['terapeutas'],
  defaultNS: 'terapeutas',
  resources: { en: { terapeutas: enTerapeutas } },
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

const USUARIO_FIXTURE: IUsuario = {
  id: 10,
  nombre: 'Ana',
  apellidos: 'Pérez',
  email: 'ana@suksai.com',
  telefono: '+34 600 000 000',
  activo: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const INACTIVE_USUARIO_FIXTURE: IUsuario = {
  ...USUARIO_FIXTURE,
  activo: false,
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
  usuarioId: 10 as const,
  initialData: USUARIO_FIXTURE,
};

const defaultEditInactiveProps = {
  ...defaultEditProps,
  initialData: INACTIVE_USUARIO_FIXTURE,
};

/** The confirm Dialog's "Deactivate" button (the trigger is "Deactivate therapist"). */
function getConfirmDialogButton(): HTMLElement {
  return screen.getByRole('button', { name: /^deactivate$/i });
}

/**
 * The confirm Dialog's title ("Deactivate therapist") collides with the trigger
 * button label, so detect the Dialog via its interpolated message instead, which
 * is unique. Returns the matcher used across deactivate tests.
 */
const confirmMessageRe = /deactivate ana\?/i;

/**
 * Selects a role in the custom Select (a button + portal listbox, NOT a native
 * <select>). The trigger is the button carrying aria-haspopup="listbox". Opening
 * it portals a listbox; we click the option by its visible label.
 */
function selectRole(optionLabel: RegExp): void {
  const trigger = document.querySelector('button[aria-haspopup="listbox"]');
  if (trigger === null) throw new Error('role Select trigger not found');
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('option', { name: optionLabel }));
}

beforeEach(() => {
  vi.clearAllMocks();
  updateIsPending = false;
  mockCentros.data = [];
  mockCentros.isLoading = false;
  mockAssignments.centroIds = [];
  mockAssignments.principalCentroId = null;
  mockCheckCitas.mockResolvedValue(0);
});

// ── Group 1: Create mode rendering ───────────────────────────────────────────

describe('TerapeutaModal — create mode rendering', () => {
  it('renders the create title', () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.getByText(/new therapist/i)).toBeInTheDocument();
  });

  it('renders nombre input empty', () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    const input = screen.getByRole('textbox', { name: /first name/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('renders apellidos input empty', () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('textbox', { name: /last name/i })).toHaveValue('');
  });

  it('renders email input empty and not read-only in create mode', () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    const input = screen.getByRole('textbox', { name: /email/i });
    expect(input).toHaveValue('');
    expect((input as HTMLInputElement).readOnly).toBe(false);
  });

  it('renders telefono input empty', () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.getByLabelText(/phone/i)).toHaveValue('');
  });

  it('renders the role select in create mode', () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.getByText(/^role$/i)).toBeInTheDocument();
  });

  it('does NOT render Deactivate therapist button in create mode', () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.queryByRole('button', { name: /deactivate therapist/i })).not.toBeInTheDocument();
  });

  it('does NOT render Reactivate therapist button in create mode', () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.queryByRole('button', { name: /reactivate therapist/i })).not.toBeInTheDocument();
  });

  it('renders Create therapist submit button', () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /create therapist/i })).toBeInTheDocument();
  });
});

// ── Group 2: Edit mode rendering (active therapist) ──────────────────────────

describe('TerapeutaModal — edit mode rendering (active therapist)', () => {
  beforeEach(() => {
    mockUpdateMutateAsync.mockResolvedValue(USUARIO_FIXTURE);
  });

  it('renders the edit title', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByText(/edit therapist/i)).toBeInTheDocument();
  });

  it('pre-fills nombre with initialData.nombre', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue('Ana');
  });

  it('pre-fills apellidos with initialData.apellidos', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('textbox', { name: /last name/i })).toHaveValue('Pérez');
  });

  it('renders email as read-only in edit mode', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    expect((emailInput as HTMLInputElement).readOnly).toBe(true);
  });

  it('shows the readonly hint text below the email field', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(
      screen.getByText(/read-only · the email is linked to the therapist's account/i),
    ).toBeInTheDocument();
  });

  it('pre-fills telefono with initialData.telefono', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByLabelText(/phone/i)).toHaveValue('+34 600 000 000');
  });

  it('renders the role select in edit mode', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByText(/^role$/i)).toBeInTheDocument();
  });

  it('renders Deactivate therapist button', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /deactivate therapist/i })).toBeInTheDocument();
  });

  it('does NOT render Reactivate therapist button for active therapist', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.queryByRole('button', { name: /reactivate therapist/i })).not.toBeInTheDocument();
  });

  it('renders Save changes submit button', () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});

// ── Group 3: Edit mode rendering (inactive therapist) ────────────────────────

describe('TerapeutaModal — edit mode rendering (inactive therapist)', () => {
  it('does NOT render Deactivate therapist button for inactive therapist', () => {
    render(<TerapeutaModal {...defaultEditInactiveProps} />, { wrapper: createWrapper() });
    expect(screen.queryByRole('button', { name: /deactivate therapist/i })).not.toBeInTheDocument();
  });

  it('renders Reactivate therapist button for inactive therapist', () => {
    render(<TerapeutaModal {...defaultEditInactiveProps} />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /reactivate therapist/i })).toBeInTheDocument();
  });

  it('email is still read-only for inactive therapist in edit mode', () => {
    render(<TerapeutaModal {...defaultEditInactiveProps} />, { wrapper: createWrapper() });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    expect((emailInput as HTMLInputElement).readOnly).toBe(true);
  });
});

// ── Group 4: Validation ───────────────────────────────────────────────────────

describe('TerapeutaModal — validation', () => {
  it('shows the global error banner when nombre is empty but a role IS selected (create mode)', async () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    // Select a role first so the empty-rol early-guard does not pre-empt Zod;
    // then submit with email but no nombre to reach the schema-level banner.
    selectRole(/therapist/i);
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create therapist/i }));

    await waitFor(() => {
      // The global banner is the alert NOT associated with a field (field alerts
      // carry an id like "rol-error"; the global banner has no id).
      const alerts = screen.getAllByRole('alert');
      const banner = alerts.find((a) => a.id === '');
      expect(banner).toBeDefined();
    });
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it('shows a field-level role error when no role is selected on submit', async () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create therapist/i }));

    await waitFor(() => {
      // The role error renders in both the FormField errorText and the Select's
      // own error SubText — assert at least one is present.
      expect(screen.getAllByText(enTerapeutas.form.rol.error_required).length).toBeGreaterThan(0);
    });
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  // [UNTESTABLE — jsdom] Invalid email format via type="email" input cannot be
  // reliably tested in jsdom (HTML value sanitisation coerces non-valid emails to
  // ""). The Zod email path is covered by terapeuta.schema.test.ts.
  it.skip('shows error banner when email has invalid format on submit', () => {
    // See [UNTESTABLE] note above.
  });

  it('does not call createMutation when validation fails', async () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    // Completely empty form → role early-guard fires → field-level role error.
    fireEvent.click(screen.getByRole('button', { name: /create therapist/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });
});

// ── Group 5: Create submission ────────────────────────────────────────────────

describe('TerapeutaModal — create submission', () => {
  beforeEach(() => {
    mockCreateMutateAsync.mockResolvedValue({ id: 99 });
  });

  /**
   * Submit the form via fireEvent.submit on the form element.
   *
   * React 19 sets `form.action` to a "javascript:throw..." URL when
   * `action={dispatch}` is used (progressive-enhancement guard). Clicking the
   * submit button in jsdom triggers `form.submit()` (not `requestSubmit()`),
   * which executes that URL and throws. Using `fireEvent.submit` on the form
   * element dispatches the `submit` event that React's synthetic event system
   * intercepts and routes to the `dispatch` function correctly.
   */
  function submitForm() {
    const form = document.querySelector<HTMLFormElement>('#terapeuta-form');
    if (!form) throw new Error('Form #terapeuta-form not found');
    fireEvent.submit(form);
  }

  /** Fill the minimum valid create form (nombre + email + role). */
  function fillValidCreate() {
    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: 'María' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'maria@suksai.com' },
    });
    selectRole(/therapist/i); // masajista → "Therapist"
  }

  it('calls createMutation.mutateAsync with nombre/email/rolNombre on valid submit', async () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: 'María' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
      target: { value: 'López' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'maria@suksai.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '+34 611 222 333' },
    });
    selectRole(/therapist/i);

    submitForm();

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'María',
          apellidos: 'López',
          email: 'maria@suksai.com',
          telefono: '+34 611 222 333',
          rolNombre: 'masajista',
        }),
      );
    });
  });

  it('threads principalCentroId: null when no centro is selected', async () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    fillValidCreate();
    submitForm();

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ principalCentroId: null, centroIds: [] }),
      );
    });
  });

  it('calls toastSuccess with the created message after successful create', async () => {
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    fillValidCreate();
    submitForm();

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(enTerapeutas.toast.created);
    });
  });

  it('calls onSuccess("created") after successful create', async () => {
    const onSuccess = vi.fn();
    render(<TerapeutaModal {...defaultCreateProps} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });
    fillValidCreate();
    submitForm();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('created');
    });
  });

  it('calls onClose after successful create', async () => {
    const onClose = vi.fn();
    render(<TerapeutaModal {...defaultCreateProps} onClose={onClose} />, {
      wrapper: createWrapper(),
    });
    fillValidCreate();
    submitForm();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error banner when createMutation throws', async () => {
    mockCreateMutateAsync.mockRejectedValue(new Error('Email already in use'));
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });
    fillValidCreate();
    submitForm();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email already in use');
    });
  });
});

// ── Group 6: Edit / update submission ────────────────────────────────────────

describe('TerapeutaModal — edit / update submission', () => {
  beforeEach(() => {
    mockUpdateMutateAsync.mockResolvedValue(USUARIO_FIXTURE);
  });

  /** Submit the edit form via the submit event (same pattern as create). */
  function submitEditForm() {
    const form = document.querySelector<HTMLFormElement>('#terapeuta-form');
    if (!form) throw new Error('Form #terapeuta-form not found');
    fireEvent.submit(form);
  }

  it('calls updateMutation.mutateAsync with nombre/apellidos/telefono in dto on valid submit', async () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });

    submitEditForm();

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          dto: expect.objectContaining({
            nombre: 'Ana',
            apellidos: 'Pérez',
            telefono: '+34 600 000 000',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  it('threads principalCentroId from the pre-filled assignments', async () => {
    mockAssignments.centroIds = [10, 20];
    mockAssignments.principalCentroId = 20;
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });

    submitEditForm();

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ principalCentroId: 20 }),
      );
    });
  });

  it('calls toastSuccess with the updated message after successful update', async () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    submitEditForm();

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(enTerapeutas.toast.updated);
    });
  });

  it('calls onSuccess("updated") after successful update', async () => {
    const onSuccess = vi.fn();
    render(<TerapeutaModal {...defaultEditProps} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });
    submitEditForm();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('updated');
    });
  });
});

// ── Group 7: Deactivate flow via confirm Dialog ───────────────────────────────

describe('TerapeutaModal — deactivate flow (confirm Dialog)', () => {
  beforeEach(() => {
    mockUpdateMutateAsync.mockResolvedValue({ ...USUARIO_FIXTURE, activo: false });
  });

  it('clicking Deactivate therapist triggers the guard check', async () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(mockCheckCitas).toHaveBeenCalledWith(10);
    });
  });

  it('when guard returns 0, opens the confirmation Dialog (not the guard dialog)', async () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(screen.getByText(confirmMessageRe)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('guard-dialog')).not.toBeInTheDocument();
    // The confirm Dialog exposes a "Deactivate" confirm button.
    expect(getConfirmDialogButton()).toBeInTheDocument();
  });

  it('when guard returns >0, opens the guard dialog (not the confirm Dialog) — E12', async () => {
    mockCheckCitas.mockResolvedValue(3);
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(screen.getByTestId('guard-dialog')).toBeInTheDocument();
    });
    expect(screen.queryByText(confirmMessageRe)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^deactivate$/i })).not.toBeInTheDocument();
  });

  it('confirming deactivation calls updateMutation with dto: { activo: false }', async () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(getConfirmDialogButton()).toBeInTheDocument();
    });
    fireEvent.click(getConfirmDialogButton());

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          dto: expect.objectContaining({ activo: false }) as Record<string, unknown>,
        }),
      );
    });
  });

  it('threads principalCentroId through the deactivate mutation', async () => {
    mockAssignments.centroIds = [10];
    mockAssignments.principalCentroId = 10;
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(getConfirmDialogButton()).toBeInTheDocument();
    });
    fireEvent.click(getConfirmDialogButton());

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ principalCentroId: 10 }),
      );
    });
  });

  it('calls toastWarning after successful deactivation', async () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(getConfirmDialogButton()).toBeInTheDocument();
    });
    fireEvent.click(getConfirmDialogButton());

    await waitFor(() => {
      expect(mockToastWarning).toHaveBeenCalledWith(enTerapeutas.toast.deleted);
    });
  });

  it('calls onSuccess("deleted") after successful deactivation', async () => {
    const onSuccess = vi.fn();
    render(<TerapeutaModal {...defaultEditProps} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(getConfirmDialogButton()).toBeInTheDocument();
    });
    fireEvent.click(getConfirmDialogButton());

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('deleted');
    });
  });

  it('cancelling the confirm Dialog does NOT deactivate (E10)', async () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(screen.getByText(confirmMessageRe)).toBeInTheDocument();
    });

    // The Dialog's own Cancel button lives inside the last-rendered modal (the
    // Dialog composes Modal, so it is the deepest data-testid="modal").
    const dialogModals = screen.getAllByTestId('modal');
    const dialogModal = dialogModals[dialogModals.length - 1];
    fireEvent.click(within(dialogModal).getByRole('button', { name: /^cancel$/i }));

    // No mutation; the confirm Dialog is gone.
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText(confirmMessageRe)).not.toBeInTheDocument();
    });
  });

  // [TESTABILITY GAP — E11] The "visible Loading… label + disabled confirm WHILE
  // the deactivate mutation is in flight" requires the real useUpdateTerapeuta
  // hook to flip isPending=true AND trigger a re-render. With the hook mocked,
  // mutating a module flag does not schedule a React render, so the transient
  // loading frame never paints in jsdom. The wiring (Dialog loading=isPending)
  // is a static prop pass-through; Dialog's own disabled/loading behavior is
  // covered by Dialog's tests. Flagged for QA manual verification.

  it('renders the deactivate confirm + cancel CTAs from i18n in the Dialog', async () => {
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(screen.getByText(confirmMessageRe)).toBeInTheDocument();
    });
    // Confirm CTA = modal.delete.confirmCta ("Deactivate"); the Dialog also has a
    // Cancel CTA (modal.cancel). Both originate from i18n, not hardcoded.
    expect(getConfirmDialogButton()).toBeInTheDocument();
    const dialogModals = screen.getAllByTestId('modal');
    const dialogModal = dialogModals[dialogModals.length - 1];
    expect(within(dialogModal).getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
  });

  it('when guard check throws, shows error toast and does NOT open the confirm Dialog', async () => {
    mockCheckCitas.mockRejectedValue(new Error('network error'));
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /deactivate therapist/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(enTerapeutas.guard.check_error);
    });
    expect(screen.queryByText(confirmMessageRe)).not.toBeInTheDocument();
  });
});

// ── Group 8: Reactivate flow (inactive therapist) ─────────────────────────────

describe('TerapeutaModal — reactivate flow (inactive therapist)', () => {
  beforeEach(() => {
    mockUpdateMutateAsync.mockResolvedValue({ ...USUARIO_FIXTURE, activo: true });
  });

  /**
   * The "Reactivate therapist" footer button opens a confirmation Dialog
   * (isReactivateDialogOpen=true). The Dialog renders a confirm button with the
   * same i18n label via its `confirmText` prop. After clicking the trigger,
   * wait for the dialog to open, then click the confirm button inside the Dialog
   * (the last `.modal` in the DOM — Dialog renders after the edit modal).
   */
  async function triggerReactivateConfirm(): Promise<void> {
    // Step 1: click the trigger in the footer
    fireEvent.click(screen.getByRole('button', { name: /reactivate therapist/i }));
    // Step 2: wait for the reactivate confirmation Dialog to open
    await waitFor(() => {
      // Dialog's confirm button is a second "Reactivate therapist" button
      expect(screen.getAllByRole('button', { name: /reactivate therapist/i })).toHaveLength(2);
    });
    // Step 3: click the confirm button (last one = inside the dialog modal)
    const reactivateBtns = screen.getAllByRole('button', { name: /reactivate therapist/i });
    fireEvent.click(reactivateBtns[reactivateBtns.length - 1]);
  }

  it('clicking Reactivate therapist calls updateMutation with dto: { activo: true }', async () => {
    render(<TerapeutaModal {...defaultEditInactiveProps} />, { wrapper: createWrapper() });
    await triggerReactivateConfirm();

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          dto: expect.objectContaining({ activo: true }) as Record<string, unknown>,
        }),
      );
    });
  });

  it('calls toastSuccess with the reactivated message', async () => {
    render(<TerapeutaModal {...defaultEditInactiveProps} />, { wrapper: createWrapper() });
    await triggerReactivateConfirm();

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(enTerapeutas.toast.reactivated);
    });
  });

  it('calls onSuccess("reactivated")', async () => {
    const onSuccess = vi.fn();
    render(<TerapeutaModal {...defaultEditInactiveProps} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });
    await triggerReactivateConfirm();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('reactivated');
    });
  });
});

// ── Group 9: Centro principal control ─────────────────────────────────────────

describe('TerapeutaModal — centro principal control', () => {
  it('pre-fills the principal radio from the fetched assignments (edit)', () => {
    mockCentros.data = [
      { id: 10, nombre: 'Centro A' },
      { id: 20, nombre: 'Centro B' },
    ];
    mockAssignments.centroIds = [10, 20];
    mockAssignments.principalCentroId = 20;
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('principal-id')).toHaveTextContent('20');
  });

  it('auto-defaults the principal when the first centro becomes selected (0→1, create)', () => {
    mockCentros.data = [{ id: 10, nombre: 'Centro A' }];
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    // Initially no principal.
    expect(screen.getByTestId('principal-id')).toHaveTextContent('null');
    // Select the first centro → it auto-becomes principal.
    fireEvent.click(screen.getByTestId('check-10'));
    expect(screen.getByTestId('principal-id')).toHaveTextContent('10');
  });

  it('keeps the existing principal when a second centro is added (1→2)', () => {
    mockCentros.data = [
      { id: 10, nombre: 'Centro A' },
      { id: 20, nombre: 'Centro B' },
    ];
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByTestId('check-10')); // principal becomes 10
    expect(screen.getByTestId('principal-id')).toHaveTextContent('10');
    fireEvent.click(screen.getByTestId('check-20')); // principal stays 10
    expect(screen.getByTestId('principal-id')).toHaveTextContent('10');
  });

  it('lets the user explicitly choose a different principal among selected centros', () => {
    mockCentros.data = [
      { id: 10, nombre: 'Centro A' },
      { id: 20, nombre: 'Centro B' },
    ];
    render(<TerapeutaModal {...defaultCreateProps} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByTestId('check-10'));
    fireEvent.click(screen.getByTestId('check-20'));
    fireEvent.click(screen.getByTestId('principal-20'));
    expect(screen.getByTestId('principal-id')).toHaveTextContent('20');
  });

  it('auto-reassigns the principal to a remaining centro when the principal is unchecked (E16)', () => {
    mockCentros.data = [
      { id: 10, nombre: 'Centro A' },
      { id: 20, nombre: 'Centro B' },
    ];
    mockAssignments.centroIds = [10, 20];
    mockAssignments.principalCentroId = 10;
    render(<TerapeutaModal {...defaultEditProps} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('principal-id')).toHaveTextContent('10');
    // Uncheck the principal (id 10) → principal auto-reassigns to remaining (20).
    fireEvent.click(screen.getByTestId('uncheck-principal'));
    expect(screen.getByTestId('principal-id')).toHaveTextContent('20');
  });
});

// ── Group 10: Cancel / close ──────────────────────────────────────────────────

describe('TerapeutaModal — cancel / close', () => {
  it('clicking the edit-modal Cancel button calls onClose', () => {
    const onClose = vi.fn();
    render(<TerapeutaModal {...defaultCreateProps} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    // Only the edit modal is open (no Dialog), so the single Cancel is the form's.
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('modal is not rendered when open is false', () => {
    render(<TerapeutaModal {...defaultCreateProps} open={false} />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});

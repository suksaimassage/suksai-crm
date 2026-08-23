/**
 * CitaQuickEditModal.test.tsx
 *
 * The therapist quick-edit modal: edit the observation note and optionally ARM
 * "mark as completada", then commit both in one Save (note first, estado second,
 * each awaited). It receives the row (IAgendaAppointment) and never fetches.
 *
 * What these tests pin (behaviour, not structure):
 *   - the estado-driven completion affordance across all 7 estados (enabled
 *     armed toggle / disabled toggle + associated hint / read-only badge /
 *     terminal context line), with the observation textarea editable in EVERY
 *     case;
 *   - Save composition: note-only vs armed-completion ordering, empty→null,
 *     the single success toast + onSuccess(kind) + onClose;
 *   - the `savedNotas` guard — a partial failure (note saved, estado rejected)
 *     must NOT re-send the note on retry;
 *   - error handling keeps the modal OPEN with inputs + armed state intact;
 *   - non-dismissal: Escape / backdrop do not close;
 *   - focus moves to the textarea on open.
 *
 * Mock strategy (mirrors CitaModal.test.tsx):
 *   - the two mutation hooks (useUpdateCitaNotas / useChangeCitaEstado) are
 *     mocked so we drive mutateAsync + isPending directly — the REAL service is
 *     never touched here (it has its own unit tests);
 *   - useToast is mocked so success/error are spies we assert on;
 *   - real i18n (es agenda.json) + real theme + the REAL Modal (so the dialog,
 *     non-dismissal props and focus-on-open behave as in production).
 *
 * Interaction note: this project does NOT depend on @testing-library/user-event
 * (see package.json — only react + jest-dom). The whole existing suite drives
 * interactions with fireEvent, so these tests do too; the note field is a
 * controlled <textarea>, so fireEvent.change sets its value in one shot.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import type { ReactNode } from 'react';

import { lightTheme } from '@infra/styles/themes/light.theme';
import esAgenda from '@infra/i18n/locales/es/agenda.json';
import type { IAgendaAppointment } from '@domain/models/agenda.models';

// ── Hook + Toast mocks ─────────────────────────────────────────────────────────
const mockUpdateNotasMutate = vi.fn();
const mockChangeEstadoMutate = vi.fn();
let updateNotasPending = false;
let changeEstadoPending = false;

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('@infra/hooks/useUpdateCitaNotas', () => ({
  useUpdateCitaNotas: (): unknown => ({
    mutateAsync: (...a: unknown[]): unknown => mockUpdateNotasMutate(...a),
    isPending: updateNotasPending,
  }),
}));
vi.mock('@infra/hooks/useChangeCitaEstado', () => ({
  useChangeCitaEstado: (): unknown => ({
    mutateAsync: (...a: unknown[]): unknown => mockChangeEstadoMutate(...a),
    isPending: changeEstadoPending,
  }),
}));
vi.mock('@infra/components/ui/common/Toast', () => ({
  useToast: (): unknown => ({ success: mockToastSuccess, error: mockToastError }),
}));

import { CitaQuickEditModal } from '@infra/components/ui/domain/modals/CitaQuickEditModal';

// ── i18n + wrapper ──────────────────────────────────────────────────────────────

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['agenda', 'common'],
  defaultNS: 'agenda',
  resources: { es: { agenda: esAgenda, common: {} } },
  interpolation: { escapeValue: false },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
  </I18nextProvider>
);

// ── Fixtures ────────────────────────────────────────────────────────────────────

function makeAppt(overrides: Partial<IAgendaAppointment> = {}): IAgendaAppointment {
  return {
    id: 200,
    therapistId: 2,
    startTime: '10:00',
    endTime: '11:00',
    durationMin: 60,
    clientName: 'Pablo Iruña',
    visitInfo: '5ª visita',
    serviceName: 'Reflexología',
    sala: 'Sala Bambú',
    salaId: 2,
    centroId: 1,
    centroName: 'Centro Test',
    estado: 'confirmada',
    timelineState: 'done',
    evtVariant: 'jungle',
    notes: null,
    tags: [],
    precioFinal: 70,
    ...overrides,
  };
}

/** Render the modal open, with sensible spy defaults (success path). */
function renderModal(
  overrides: Partial<IAgendaAppointment> = {},
  props: {
    onClose?: () => void;
    onSuccess?: (kind: 'note' | 'completed') => void;
  } = {},
) {
  const onClose = props.onClose ?? vi.fn();
  const onSuccess = props.onSuccess ?? vi.fn();
  render(
    <CitaQuickEditModal
      open
      appointment={makeAppt(overrides)}
      onClose={onClose}
      onSuccess={onSuccess}
    />,
    { wrapper: Wrapper },
  );
  return { onClose, onSuccess };
}

/** The observation textarea (label "Observación"). */
const getTextarea = (): HTMLTextAreaElement => screen.getByLabelText('Observación');
/** The Save (commit) button — name flips between "Guardar" / "Guardar y completar". */
const getSaveButton = () => screen.getByRole('button', { name: /^(Guardar|Guardar y completar)$/ });

/** Set the controlled textarea value in one shot (no user-event available). */
const typeNote = (value: string) => {
  fireEvent.change(getTextarea(), { target: { value } });
};

/**
 * Click and let the awaited handleSave microtask chain settle. handleSave is an
 * async function fired from onClick; awaiting a macrotask flush lets its awaited
 * mutateAsync calls + the success/error branch run before assertions.
 */
const clickAndFlush = async (el: HTMLElement) => {
  fireEvent.click(el);
  // Flush the promise chain inside handleSave.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  updateNotasPending = false;
  changeEstadoPending = false;
  // Default: both mutations succeed instantly.
  mockUpdateNotasMutate.mockResolvedValue(makeAppt());
  mockChangeEstadoMutate.mockResolvedValue(makeAppt({ estado: 'completada' }));
});

// ════════════════════════════════════════════════════════════════════════════
// Completion affordance — parametrized over the 7 estados
// ════════════════════════════════════════════════════════════════════════════

describe('CitaQuickEditModal — completion affordance by estado', () => {
  it.each(['confirmada', 'en_curso'] as const)(
    'renders an ENABLED "Marcar como completada" toggle for estado=%s',
    (estado) => {
      renderModal({ estado });
      const toggle = screen.getByRole('button', { name: 'Marcar como completada' });
      expect(toggle).toBeEnabled();
      // It is an armed toggle, initially un-pressed.
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    },
  );

  it('arming the toggle sets aria-pressed=true and flips the Save label to "Guardar y completar"', () => {
    renderModal({ estado: 'confirmada' });

    // Before arming: Save reads "Guardar".
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));

    // The toggle re-labels to the armed copy and reports aria-pressed=true.
    const armed = screen.getByRole('button', { name: 'Se marcará como completada' });
    expect(armed).toHaveAttribute('aria-pressed', 'true');
    // …and the commit button now reads "Guardar y completar".
    expect(screen.getByRole('button', { name: 'Guardar y completar' })).toBeInTheDocument();
  });

  it('disarming the toggle returns aria-pressed to false and Save to "Guardar"', () => {
    renderModal({ estado: 'en_curso' });

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));
    fireEvent.click(screen.getByRole('button', { name: 'Se marcará como completada' }));

    expect(screen.getByRole('button', { name: 'Marcar como completada' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it.each([
    ['sin_asignar', 'Asigna y confirma la cita antes de completarla.'],
    ['pendiente', 'Confirma la cita antes de completarla.'],
  ] as const)(
    'estado=%s shows a DISABLED toggle whose aria-describedby points to the hint "%s"',
    (estado, hintCopy) => {
      renderModal({ estado });
      const toggle = screen.getByRole('button', { name: 'Marcar como completada' });
      expect(toggle).toBeDisabled();

      // The disabled toggle must be programmatically associated with its hint.
      const describedBy = toggle.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const hint = document.getElementById(describedBy!);
      expect(hint).not.toBeNull();
      expect(hint).toHaveTextContent(hintCopy);
      // It is NOT an armed toggle (no aria-pressed on the disabled affordance).
      expect(toggle).not.toHaveAttribute('aria-pressed');
    },
  );

  it('estado=completada renders a read-only "Completada" badge and NO completion toggle', () => {
    renderModal({ estado: 'completada' });
    // The status badge text is present…
    expect(screen.getByText('Completada')).toBeInTheDocument();
    // …and there is no completion toggle of any kind.
    expect(
      screen.queryByRole('button', { name: 'Marcar como completada' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Se marcará como completada' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['cancelada', 'Cita cancelada.'],
    ['no_presentado', 'Cliente no presentado.'],
  ] as const)('estado=%s shows the terminal context line "%s" and no toggle', (estado, copy) => {
    renderModal({ estado });
    expect(screen.getByText(copy)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /completada/i })).not.toBeInTheDocument();
  });

  it.each([
    'sin_asignar',
    'pendiente',
    'confirmada',
    'en_curso',
    'completada',
    'cancelada',
    'no_presentado',
  ] as const)('keeps the observation textarea editable for estado=%s', (estado) => {
    renderModal({ estado });
    const textarea = getTextarea();
    expect(textarea).toBeEnabled();
    typeNote('abc');
    expect(textarea).toHaveValue('abc');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Save — note-only path
// ════════════════════════════════════════════════════════════════════════════

describe('CitaQuickEditModal — Save (note-only)', () => {
  it('persists ONLY the note (no estado change) and reports onSuccess("note")', async () => {
    const { onClose, onSuccess } = renderModal({ estado: 'confirmada', notes: null });

    typeNote('tensión en trapecios');
    await clickAndFlush(getSaveButton());

    expect(mockUpdateNotasMutate).toHaveBeenCalledWith({
      citaId: 200,
      notas: 'tensión en trapecios',
    });
    // Estado is untouched on a note-only save.
    expect(mockChangeEstadoMutate).not.toHaveBeenCalled();
    // One success toast — the "saved" copy, not the "completed" copy.
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledWith('Observación guardada');
    expect(onSuccess).toHaveBeenCalledWith('note');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clearing an existing note sends notas: null (empty trimmed → null)', async () => {
    renderModal({ estado: 'confirmada', notes: 'una nota previa' });

    typeNote('');
    await clickAndFlush(getSaveButton());

    expect(mockUpdateNotasMutate).toHaveBeenCalledWith({ citaId: 200, notas: null });
  });

  it('a whitespace-only note equals the empty saved note → nothing to save (Save disabled)', () => {
    renderModal({ estado: 'confirmada', notes: null });

    typeNote('   ');
    // Whitespace trims to '' which equals the empty saved note → nothing to save.
    expect(getSaveButton()).toBeDisabled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Save — armed completion path
// ════════════════════════════════════════════════════════════════════════════

describe('CitaQuickEditModal — Save (armed completion)', () => {
  it('with armed completion + a note: persists the note THEN the estado, toasts "completed"', async () => {
    const callOrder: string[] = [];
    mockUpdateNotasMutate.mockImplementation(() => {
      callOrder.push('note');
      return Promise.resolve(makeAppt());
    });
    mockChangeEstadoMutate.mockImplementation(() => {
      callOrder.push('estado');
      return Promise.resolve(makeAppt({ estado: 'completada' }));
    });
    const { onSuccess } = renderModal({ estado: 'confirmada', notes: null });

    typeNote('sesión completada sin incidencias');
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));
    await clickAndFlush(screen.getByRole('button', { name: 'Guardar y completar' }));

    expect(mockUpdateNotasMutate).toHaveBeenCalledWith({
      citaId: 200,
      notas: 'sesión completada sin incidencias',
    });
    expect(mockChangeEstadoMutate).toHaveBeenCalledWith({ citaId: 200, estado: 'completada' });
    // Order: note first, estado second.
    expect(callOrder).toEqual(['note', 'estado']);
    expect(mockToastSuccess).toHaveBeenCalledWith('Cita completada');
    expect(onSuccess).toHaveBeenCalledWith('completed');
  });

  it('arming WITHOUT a note change moves only the estado (no updateNotas call)', async () => {
    renderModal({ estado: 'en_curso', notes: 'nota sin cambios' });

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));
    await clickAndFlush(screen.getByRole('button', { name: 'Guardar y completar' }));

    // The note never changed → updateNotas is skipped; only the estado moves.
    expect(mockUpdateNotasMutate).not.toHaveBeenCalled();
    expect(mockChangeEstadoMutate).toHaveBeenCalledWith({ citaId: 200, estado: 'completada' });
    expect(mockToastSuccess).toHaveBeenCalledWith('Cita completada');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Save gating
// ════════════════════════════════════════════════════════════════════════════

describe('CitaQuickEditModal — Save gating', () => {
  it('Save is disabled when nothing has changed (note unchanged, not armed)', () => {
    renderModal({ estado: 'confirmada', notes: 'algo' });
    expect(getSaveButton()).toBeDisabled();
  });

  it('Save enables once the note is edited', () => {
    renderModal({ estado: 'confirmada', notes: null });
    expect(getSaveButton()).toBeDisabled();
    typeNote('x');
    expect(getSaveButton()).toBeEnabled();
  });

  it('Save enables once completion is armed even with no note change', () => {
    renderModal({ estado: 'confirmada', notes: 'sin cambios' });
    expect(getSaveButton()).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));
    expect(screen.getByRole('button', { name: 'Guardar y completar' })).toBeEnabled();
  });

  it('completada estado: Save stays disabled until the note changes (no toggle available)', () => {
    renderModal({ estado: 'completada', notes: null });
    expect(getSaveButton()).toBeDisabled();
    typeNote('nota tardía');
    expect(getSaveButton()).toBeEnabled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Error handling + savedNotas guard
// ════════════════════════════════════════════════════════════════════════════

describe('CitaQuickEditModal — error handling', () => {
  it('a BusinessRuleViolation from changeEstado surfaces its message and keeps the modal open', async () => {
    const bizErr = new Error('Illegal estado transition: confirmada → completada');
    bizErr.name = 'BusinessRuleViolation';
    mockChangeEstadoMutate.mockRejectedValue(bizErr);
    const { onClose } = renderModal({ estado: 'confirmada', notes: null });

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));
    await clickAndFlush(screen.getByRole('button', { name: 'Guardar y completar' }));

    // The domain message is shown verbatim (not the generic fallback)…
    expect(mockToastError).toHaveBeenCalledWith(
      'Illegal estado transition: confirmada → completada',
    );
    expect(mockToastSuccess).not.toHaveBeenCalled();
    // …and the modal stays open (onClose not called) with the armed state intact.
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Se marcará como completada' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('a non-domain error falls back to the generic toast copy', async () => {
    mockUpdateNotasMutate.mockRejectedValue(new Error('network blip'));
    renderModal({ estado: 'confirmada', notes: null });

    typeNote('algo');
    await clickAndFlush(getSaveButton());

    expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Inténtalo de nuevo.');
  });

  it('savedNotas guard: after note OK + estado FAIL, retry does NOT re-send the note', async () => {
    // First Save: note succeeds, estado rejects.
    mockUpdateNotasMutate.mockResolvedValue(makeAppt());
    const estErr = new Error('Therapist has a conflicting appointment at this time');
    estErr.name = 'BusinessRuleViolation';
    mockChangeEstadoMutate.mockRejectedValueOnce(estErr);
    renderModal({ estado: 'confirmada', notes: null });

    typeNote('nota persistida');
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));
    await clickAndFlush(screen.getByRole('button', { name: 'Guardar y completar' }));

    // After the partial failure: note was written exactly once.
    expect(mockUpdateNotasMutate).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledTimes(1);

    // Second Save (retry) — estado now succeeds.
    mockChangeEstadoMutate.mockResolvedValue(makeAppt({ estado: 'completada' }));
    await clickAndFlush(screen.getByRole('button', { name: 'Guardar y completar' }));

    // The note is NOT re-sent: still exactly one updateNotas call across both
    // Saves (savedNotas now equals the draft → noteChanged is false on retry).
    expect(mockUpdateNotasMutate).toHaveBeenCalledTimes(1);
    // The estado was retried and this time succeeded.
    expect(mockChangeEstadoMutate).toHaveBeenCalledTimes(2);
    expect(mockToastSuccess).toHaveBeenCalledWith('Cita completada');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Non-dismissal (closeOnEscape / closeOnBackdropClick = false)
// ════════════════════════════════════════════════════════════════════════════

describe('CitaQuickEditModal — non-dismissal', () => {
  it('Escape does NOT close the modal (closeOnEscape=false)', () => {
    const { onClose } = renderModal({ estado: 'confirmada' });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    // The dialog is still mounted.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('clicking the backdrop does NOT close the modal (closeOnBackdropClick=false)', () => {
    const { onClose } = renderModal({ estado: 'confirmada' });

    // The presentation container wraps the dialog; clicking it (outside the
    // dialog content) is the backdrop gesture. With the prop false it is a no-op.
    const dialog = screen.getByRole('dialog');
    const presentation = dialog.parentElement!;
    fireEvent.click(presentation);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('the footer "Cancelar" button DOES close the modal', () => {
    const { onClose } = renderModal({ estado: 'confirmada' });

    // The footer "Cancelar" button is the labelled close affordance.
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Accessibility / focus
// ════════════════════════════════════════════════════════════════════════════

describe('CitaQuickEditModal — accessibility', () => {
  it('renders as a dialog with the quick-edit title', () => {
    renderModal({ estado: 'confirmada' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edición rápida')).toBeInTheDocument();
  });

  it('renders the client · time subtitle from the appointment', () => {
    renderModal({
      estado: 'confirmada',
      clientName: 'Naree',
      startTime: '12:00',
      endTime: '13:00',
    });
    // subtitle key → "{{client}} · {{start}}–{{end}}"
    expect(screen.getByText('Naree · 12:00–13:00')).toBeInTheDocument();
  });

  it('moves focus to the observation textarea after open', () => {
    // onAfterOpen fires on a 300ms timer (useAfterTransition) — drive it with
    // fake timers so the focus assertion is deterministic in jsdom.
    vi.useFakeTimers();
    try {
      renderModal({ estado: 'confirmada' });
      act(() => {
        vi.advanceTimersByTime(350);
      });
      expect(getTextarea()).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not render anything when open is false', () => {
    const onClose = vi.fn();
    render(<CitaQuickEditModal open={false} appointment={makeAppt()} onClose={onClose} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Edición rápida')).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Pending state
// ════════════════════════════════════════════════════════════════════════════

describe('CitaQuickEditModal — pending state', () => {
  afterEach(() => {
    updateNotasPending = false;
    changeEstadoPending = false;
  });

  it('disables the textarea and both footer buttons while a mutation is pending', () => {
    updateNotasPending = true;
    renderModal({ estado: 'confirmada', notes: null });

    expect(getTextarea()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    // While pending the commit button shows the loading label "Guardando…".
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });
});

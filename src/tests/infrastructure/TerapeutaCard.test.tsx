/**
 * TerapeutaCard.test.tsx
 *
 * Component tests for the TerapeutaCard compound component.
 * Validates rendering branches, ARIA attributes, text content, and the new
 * 3-dots actions menu (Editar / Horario de trabajo).
 *
 * Card API change (spec-mandated): the card is NO LONGER globally click-to-edit.
 * It now requires onEdit + onManageSchedule and exposes them via a DropdownMenu.
 *
 * NOTE: this project does NOT depend on @testing-library/user-event; the suite
 * uses fireEvent. DropdownMenu renders its panel into document.body via a portal.
 *
 * Mocks:
 *   - react-i18next → t() returns the key (with interpolation replacement)
 *   - styled-components → wrapped in ThemeProvider with light theme
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@infra/styles/themes/light.theme';
import { TerapeutaCard } from '@infra/components/ui/domain/TerapeutaCard/TerapeutaCard';
import type { ITerapeutaAggregate } from '@infra/hooks/useTerapeutas';
import type { IHorarioRaw } from '@infra/adapters/SupabaseTerapeutasAdapter';
import type { TTerapeutaEstado } from '@domain/types';

// ── i18n mock ──────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts !== undefined) {
        return Object.entries(opts).reduce((s, [k, v]) => s.replace(`{{${k}}}`, String(v)), key);
      }
      return key;
    },
    i18n: { language: 'es' },
  }),
}));

// ── ThemeProvider wrapper ──────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// ── Fixture factory ────────────────────────────────────────────────────────────

function makeHorario(overrides: Partial<IHorarioRaw> = {}): IHorarioRaw {
  return {
    id: 1,
    usuario_id: 1,
    tipo: 'recurrente',
    dia_semana: 1, // Monday
    fecha: null,
    hora_inicio: '09:00',
    hora_fin: '17:00',
    ...overrides,
  };
}

function makeAggregate(overrides: Partial<ITerapeutaAggregate> = {}): ITerapeutaAggregate {
  return {
    usuarioId: 1,
    nombre: 'Ana García',
    apellidos: '',
    email: '',
    telefono: null,
    activo: true,
    createdAt: new Date('2023-03-15'),
    estadoActual: 'disponible',
    salaActual: null,
    proximaCita: null,
    proximaCitaSala: null,
    horariosSemanales: [],
    totalHorasSemana: 8,
    sesionesEstaSemana: 3,
    ingresosSemana: 180,
    valoracionMedia: null,
    especialidades: [],
    roles: ['masajista'],
    servicioMasRealizado: null,
    ...overrides,
  };
}

// Default required action handlers — overridable per test.
function renderCard(
  agg: ITerapeutaAggregate,
  handlers: { onEdit?: () => void; onManageSchedule?: () => void } = {},
) {
  return render(
    <TerapeutaCard
      aggregate={agg}
      onEdit={handlers.onEdit ?? vi.fn()}
      onManageSchedule={handlers.onManageSchedule ?? vi.fn()}
    />,
    { wrapper },
  );
}

// ── Root card rendering ────────────────────────────────────────────────────────

describe('TerapeutaCard — root rendering', () => {
  it('renders an article element with the therapist name as aria-label', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    renderCard(agg);
    expect(screen.getByRole('article', { name: 'Ana García' })).toBeInTheDocument();
  });

  it('renders the therapist name in a heading', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Carlos Ruiz' });
    renderCard(agg);
    expect(screen.getByRole('heading', { name: 'Carlos Ruiz' })).toBeInTheDocument();
  });

  it('renders the year from createdAt via i18n key card.desde', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', createdAt: new Date('2021-05-20') });
    renderCard(agg);
    expect(screen.getByText(/card\.desde/)).toBeInTheDocument();
  });

  it('the card root is NOT a button (no global click-to-edit affordance)', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    renderCard(agg);
    // Only the menu trigger is interactive; the article root must not be a button.
    const article = screen.getByRole('article', { name: 'Ana García' });
    expect(article).not.toHaveAttribute('role', 'button');
    expect(article.tagName.toLowerCase()).not.toBe('button');
  });
});

// ── Actions menu (3-dots) ────────────────────────────────────────────────────

describe('TerapeutaCard — Actions menu', () => {
  it('renders a menu trigger with an i18n aria-label', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    renderCard(agg);
    // The i18n mock returns the key; the {{nombre}} token is interpolated but the
    // key itself has no literal token, so the accessible name is the key.
    expect(screen.getByRole('button', { name: /card\.menu\.ariaLabel/ })).toBeInTheDocument();
  });

  it('trigger advertises a popup menu (aria-haspopup="menu")', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    renderCard(agg);
    const trigger = screen.getByRole('button', { name: /card\.menu\.ariaLabel/ });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('opens the menu and shows Editar + Horario entries on trigger click', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    renderCard(agg);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /card\.menu\.ariaLabel/ }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /card\.menu\.editar/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /card\.menu\.horario/ })).toBeInTheDocument();
  });

  it('invokes onEdit when the Editar entry is selected', () => {
    const onEdit = vi.fn();
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    renderCard(agg, { onEdit });

    fireEvent.click(screen.getByRole('button', { name: /card\.menu\.ariaLabel/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /card\.menu\.editar/ }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('invokes onManageSchedule when the Horario entry is selected', () => {
    const onManageSchedule = vi.fn();
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    renderCard(agg, { onManageSchedule });

    fireEvent.click(screen.getByRole('button', { name: /card\.menu\.ariaLabel/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /card\.menu\.horario/ }));

    expect(onManageSchedule).toHaveBeenCalledOnce();
  });

  it('stops click propagation from the actions zone to any ancestor handler', () => {
    const ancestorClick = vi.fn();
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    render(
      <div onClick={ancestorClick}>
        <TerapeutaCard aggregate={agg} onEdit={vi.fn()} onManageSchedule={vi.fn()} />
      </div>,
      { wrapper },
    );

    fireEvent.click(screen.getByRole('button', { name: /card\.menu\.ariaLabel/ }));
    // The trigger's wrapper calls stopPropagation → ancestor must not see the click.
    expect(ancestorClick).not.toHaveBeenCalled();
  });

  it('exposes Actions as a compound sub-component', () => {
    expect(TerapeutaCard.Actions).toBeDefined();
  });
});

// ── StatusPill ─────────────────────────────────────────────────────────────────

describe('TerapeutaCard — StatusPill', () => {
  const estados: TTerapeutaEstado[] = ['en_sala', 'disponible', 'descanso', 'inactivo', 'ausente'];

  for (const estado of estados) {
    it(`renders StatusPill with role="status" and i18n label for estado "${estado}"`, () => {
      const agg = makeAggregate({ estadoActual: estado });
      renderCard(agg);
      const pill = screen.getByRole('status');
      expect(pill).toBeInTheDocument();
      expect(pill).toHaveAttribute('aria-label', `status.${estado}`);
      expect(pill).toHaveTextContent(`status.${estado}`);
    });
  }
});

// ── Specialty tags ─────────────────────────────────────────────────────────────

describe('TerapeutaCard — especialidades', () => {
  it('renders specialty tags when especialidades is non-empty', () => {
    const agg = makeAggregate({
      estadoActual: 'disponible',
      especialidades: ['Masaje Tailandés', 'Reflexología'],
    });
    renderCard(agg);
    expect(screen.getByText('Masaje Tailandés')).toBeInTheDocument();
    expect(screen.getByText('Reflexología')).toBeInTheDocument();
  });

  it('does NOT render specialty strip when especialidades is empty', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', especialidades: [] });
    renderCard(agg);
    expect(screen.queryByText(/Masaje/)).not.toBeInTheDocument();
  });

  it('renders all 3 especialidades (max cap enforced by domain layer)', () => {
    const agg = makeAggregate({
      estadoActual: 'disponible',
      especialidades: ['A', 'B', 'C'],
    });
    renderCard(agg);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});

// ── Proxima cita ───────────────────────────────────────────────────────────────

describe('TerapeutaCard — proxima cita', () => {
  it('shows "card.sin_proxima" when proximaCita is null', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', proximaCita: null });
    renderCard(agg);
    expect(screen.getByText('card.sin_proxima')).toBeInTheDocument();
  });

  it('shows the proxima cita time when proximaCita is a Date', () => {
    const cita = new Date('2024-06-12T14:30:00');
    const agg = makeAggregate({ estadoActual: 'disponible', proximaCita: cita });
    renderCard(agg);
    expect(screen.getByText(/card\.proxima/)).toBeInTheDocument();
  });

  it('proxima cita container has aria-live="polite"', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', proximaCita: null });
    renderCard(agg);
    expect(screen.getByText('card.sin_proxima').closest('[aria-live]')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });
});

// ── FootStats ──────────────────────────────────────────────────────────────────

describe('TerapeutaCard — FootStats', () => {
  it('renders sesionesEstaSemana count', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', sesionesEstaSemana: 7 });
    renderCard(agg);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders valoracion as N/D (kpi.no_data key)', () => {
    const agg = makeAggregate({ estadoActual: 'disponible' });
    renderCard(agg);
    expect(screen.getByText('kpi.no_data')).toBeInTheDocument();
  });

  it('renders ingresosSemana formatted with € prefix', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', ingresosSemana: 250 });
    renderCard(agg);
    expect(screen.getByText('€250')).toBeInTheDocument();
  });

  it('renders ingresosSemana of 0 as €0', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', ingresosSemana: 0 });
    renderCard(agg);
    expect(screen.getByText('€0')).toBeInTheDocument();
  });

  it('renders fractional ingresos rounded to 0 decimal places', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', ingresosSemana: 99.9 });
    renderCard(agg);
    expect(screen.getByText('€100')).toBeInTheDocument();
  });
});

// ── WeekBar ────────────────────────────────────────────────────────────────────

describe('TerapeutaCard — WeekBar', () => {
  it('renders a group with 7 columns (one per ISO day)', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', horariosSemanales: [] });
    renderCard(agg);
    const group = screen.getByRole('group');
    expect(group).toBeInTheDocument();
    const cols = group.querySelectorAll('[aria-label]');
    expect(cols).toHaveLength(7);
  });

  it('renders day columns with aria-label containing day key', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', horariosSemanales: [] });
    renderCard(agg);
    const group = screen.getByRole('group');
    const cols = Array.from(group.querySelectorAll('[aria-label]'));
    cols.forEach((col) => {
      expect(col.getAttribute('aria-label')).toMatch(/^days\.\d/);
    });
  });

  it('renders horario time range in aria-label when a shift exists for that day', () => {
    const mondayHorario = makeHorario({
      dia_semana: 1,
      hora_inicio: '09:00',
      hora_fin: '17:00',
    });
    const agg = makeAggregate({
      estadoActual: 'disponible',
      horariosSemanales: [mondayHorario],
    });
    renderCard(agg);
    const group = screen.getByRole('group');
    const mondayCol = Array.from(group.querySelectorAll('[aria-label]')).find((el) =>
      el.getAttribute('aria-label')?.includes('09:00'),
    );
    expect(mondayCol).toBeDefined();
    expect(mondayCol?.getAttribute('aria-label')).toMatch(/09:00.+17:00/);
  });

  it('renders off-day columns (no horario) without time range in aria-label', () => {
    const mondayHorario = makeHorario({ dia_semana: 1 });
    const agg = makeAggregate({
      estadoActual: 'disponible',
      horariosSemanales: [mondayHorario],
    });
    renderCard(agg);
    const group = screen.getByRole('group');
    const cols = Array.from(group.querySelectorAll('[aria-label]'));
    const offDayCols = cols.filter((el) => !el.getAttribute('aria-label')?.includes('09:00'));
    expect(offDayCols).toHaveLength(6);
    offDayCols.forEach((col) => {
      expect(col.getAttribute('aria-label')).not.toMatch(/\d{2}:\d{2}/);
    });
  });
});

// ── AvatarZone ─────────────────────────────────────────────────────────────────

describe('TerapeutaCard — AvatarZone', () => {
  it('renders avatar initials from nombre (first 2 words, first letter each)', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    renderCard(agg);
    expect(screen.getByText('AG')).toBeInTheDocument();
  });

  it('renders single-word nombre initials correctly', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Bruno' });
    renderCard(agg);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('avatar circle has aria-hidden="true"', () => {
    const agg = makeAggregate({ estadoActual: 'disponible', nombre: 'Ana García' });
    renderCard(agg);
    const avatar = screen.getByText('AG');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
  });
});

// ── Compound subcomponents exposed on TerapeutaCard ────────────────────────────

describe('TerapeutaCard — compound component structure', () => {
  it('exposes StatusPill as a sub-component', () => {
    expect(TerapeutaCard.StatusPill).toBeDefined();
  });

  it('exposes WeekBar as a sub-component', () => {
    expect(TerapeutaCard.WeekBar).toBeDefined();
  });

  it('exposes FootStats as a sub-component', () => {
    expect(TerapeutaCard.FootStats).toBeDefined();
  });
});

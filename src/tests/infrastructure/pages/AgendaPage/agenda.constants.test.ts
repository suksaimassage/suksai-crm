/**
 * agenda.constants.test.ts
 *
 * The AgendaCalendarOverlay kanban is partitioned by therapist ASSIGNMENT, not
 * by estado: exactly two columns, `sinAsignar` and `asignadas`, in that render
 * order. Pure test — no React.
 */

import { describe, it, expect } from 'vitest';
import { KANBAN_COLUMN_IDS, type TKanbanColumnId } from '@infra/pages/AgendaPage/agenda.constants';

describe('KANBAN_COLUMN_IDS — column identity', () => {
  it('exposes exactly the two assignment column ids, in render order', () => {
    expect(KANBAN_COLUMN_IDS).toEqual(['sinAsignar', 'asignadas']);
  });

  it('has no duplicated column id', () => {
    expect(new Set(KANBAN_COLUMN_IDS).size).toBe(KANBAN_COLUMN_IDS.length);
  });

  it('narrows to the TKanbanColumnId union', () => {
    const ids: readonly TKanbanColumnId[] = KANBAN_COLUMN_IDS;
    expect(ids).toContain('sinAsignar');
    expect(ids).toContain('asignadas');
  });
});

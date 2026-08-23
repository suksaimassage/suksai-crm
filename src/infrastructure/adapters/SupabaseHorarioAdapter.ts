import { supabase } from './supabase.client';
import type { IHorariosTrabajoRow } from './database.types';
import type { IHorarioRepositoryPort } from '@domain/ports';
import type { IHorarioTrabajo, ICreateHorarioDTO } from '@domain/models';
import type { THorarioId, TUserId, TCentroId, TTipoHorario, TDiaSemana } from '@domain/types';

const HORARIO_COLUMNS =
  'id, usuario_id, tipo, dia_semana, fecha, hora_inicio, hora_fin, centro_id, activo, created_at, updated_at';

export class SupabaseHorarioAdapter implements IHorarioRepositoryPort {
  #toModel(row: IHorariosTrabajoRow): IHorarioTrabajo {
    return {
      id: row.id,
      usuarioId: row.usuario_id ?? 0,
      centroId: row.centro_id,
      tipo: row.tipo as TTipoHorario,
      diaSemana: row.dia_semana !== null ? (row.dia_semana as TDiaSemana) : null,
      fecha: row.fecha !== null ? new Date(row.fecha) : null,
      horaInicio: row.hora_inicio.slice(0, 5),
      horaFin: row.hora_fin.slice(0, 5),
      activo: row.activo,
    };
  }

  async findById(id: THorarioId): Promise<IHorarioTrabajo | null> {
    const result = await supabase
      .from('horarios_trabajo')
      .select(HORARIO_COLUMNS)
      .eq('id', id)
      .eq('activo', true)
      .maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async findByUsuario(usuarioId: TUserId): Promise<readonly IHorarioTrabajo[]> {
    const result = await supabase
      .from('horarios_trabajo')
      .select(HORARIO_COLUMNS)
      .eq('usuario_id', usuarioId)
      .eq('activo', true);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IHorariosTrabajoRow[]).map((r) => this.#toModel(r));
  }

  async findByUsuarioAndCentro(
    usuarioId: TUserId,
    centroId: TCentroId,
  ): Promise<readonly IHorarioTrabajo[]> {
    const result = await supabase
      .from('horarios_trabajo')
      .select(HORARIO_COLUMNS)
      .eq('usuario_id', usuarioId)
      .eq('centro_id', centroId)
      .eq('activo', true);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IHorariosTrabajoRow[]).map((r) => this.#toModel(r));
  }

  async findByCentro(centroId: TCentroId): Promise<readonly IHorarioTrabajo[]> {
    const result = await supabase
      .from('horarios_trabajo')
      .select(HORARIO_COLUMNS)
      .eq('centro_id', centroId)
      .eq('activo', true);
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IHorariosTrabajoRow[]).map((r) => this.#toModel(r));
  }

  async findActivosByFecha(centroId: TCentroId, fecha: Date): Promise<readonly IHorarioTrabajo[]> {
    const dateStr = fecha.toISOString().slice(0, 10);
    // ISO weekday: Mon=1 … Sun=7 (JS getDay returns 0 for Sun)
    const dayOfWeek: TDiaSemana = (fecha.getDay() === 0 ? 7 : fecha.getDay()) as TDiaSemana;

    const [specificResult, recurringResult] = await Promise.all([
      supabase
        .from('horarios_trabajo')
        .select(HORARIO_COLUMNS)
        .eq('centro_id', centroId)
        .eq('fecha', dateStr)
        .eq('activo', true),
      supabase
        .from('horarios_trabajo')
        .select(HORARIO_COLUMNS)
        .eq('centro_id', centroId)
        .eq('tipo', 'recurrente')
        .eq('dia_semana', dayOfWeek)
        .eq('activo', true),
    ]);

    if (!specificResult.success) throw new Error(specificResult.error.message);
    if (!recurringResult.success) throw new Error(recurringResult.error.message);

    return [
      ...(specificResult.data as IHorariosTrabajoRow[]),
      ...(recurringResult.data as IHorariosTrabajoRow[]),
    ].map((r) => this.#toModel(r));
  }

  async create(data: ICreateHorarioDTO): Promise<IHorarioTrabajo> {
    const result = await supabase
      .from('horarios_trabajo')
      .insert({
        usuario_id: data.usuarioId,
        tipo: data.tipo,
        dia_semana: data.diaSemana ?? null,
        fecha: data.fecha ? data.fecha.toISOString().slice(0, 10) : null,
        hora_inicio: data.horaInicio,
        hora_fin: data.horaFin,
        centro_id: data.centroId,
      })
      .select(HORARIO_COLUMNS)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async update(id: THorarioId, data: Partial<ICreateHorarioDTO>): Promise<IHorarioTrabajo> {
    const patch: {
      usuario_id?: number;
      tipo?: string;
      dia_semana?: number | null;
      fecha?: string | null;
      hora_inicio?: string;
      hora_fin?: string;
      centro_id?: number;
    } = {};
    // usuario_id is mapped so a Day-view drag that reassigns a shift to another
    // therapist actually persists (was previously dropped here → the card jumped
    // back to the original therapist after refetch — latent reassignment defect).
    if (data.usuarioId !== undefined) patch.usuario_id = data.usuarioId;
    if (data.tipo !== undefined) patch.tipo = data.tipo;
    if (data.diaSemana !== undefined) patch.dia_semana = data.diaSemana;
    if (data.fecha !== undefined) patch.fecha = data.fecha.toISOString().slice(0, 10);
    if (data.horaInicio !== undefined) patch.hora_inicio = data.horaInicio;
    if (data.horaFin !== undefined) patch.hora_fin = data.horaFin;
    if (data.centroId !== undefined) patch.centro_id = data.centroId;

    const result = await supabase
      .from('horarios_trabajo')
      .update(patch)
      .eq('id', id)
      .eq('activo', true)
      .select(HORARIO_COLUMNS)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async deactivate(id: THorarioId): Promise<void> {
    const result = await supabase.from('horarios_trabajo').update({ activo: false }).eq('id', id);
    if (!result.success) throw new Error(result.error.message);
  }
}

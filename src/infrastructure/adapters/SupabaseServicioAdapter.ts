import { supabase } from './supabase.client';
import { buildPaginatedResult } from './pagination.helper';
import type { IServiciosRow, IServiciosCentroRow } from './database.types';
import type { IServicioRepositoryPort } from '@domain/ports';
import type {
  IServicio,
  ICreateServicioDTO,
  IUpdateServicioDTO,
  IServicioCentro,
} from '@domain/models';
import type {
  TServicioId,
  TCentroId,
  IPaginationParams,
  IPaginatedResult,
  TEstadoServicio,
} from '@domain/types';
import { BusinessRuleViolation } from '@domain/types';

const SELECT_SERVICIO =
  'id, nombre, descripcion, duracion, precio, descuento, permite_bono, sesiones_totales, tipo_servicio, estado, created_at, updated_at';

export class SupabaseServicioAdapter implements IServicioRepositoryPort {
  #toModel(row: IServiciosRow): IServicio {
    return {
      id: row.id,
      tipoServicioId: row.tipo_servicio,
      nombre: row.nombre,
      descripcion: row.descripcion ?? null,
      duracionMinutos: row.duracion,
      precioBase: row.precio ?? 0,
      esBono: row.permite_bono,
      sesionesTotales: row.sesiones_totales ?? null,
      tieneDescuento: row.descuento > 0,
      porcentajeDescuento: row.descuento,
      estado: row.estado as TEstadoServicio,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  #toServicioCentroModel(row: IServiciosCentroRow): IServicioCentro {
    return {
      servicioId: row.servicio_id,
      centroId: row.centro_id,
      precioPersonalizado: null,
      activo: true,
    };
  }

  async findById(id: TServicioId): Promise<IServicio | null> {
    const result = await supabase
      .from('servicios')
      .select(SELECT_SERVICIO)
      .eq('id', id)
      .maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toModel(row) : null;
  }

  async findAll(params?: IPaginationParams): Promise<IPaginatedResult<IServicio>> {
    const perPage = params?.perPage ?? 50;
    const page = params?.page ?? 1;
    const result = await supabase
      .from('servicios')
      .select(SELECT_SERVICIO, { count: 'exact' })
      .range((page - 1) * perPage, page * perPage - 1);
    if (!result.success) throw new Error(result.error.message);
    const rows = result.data as IServiciosRow[];
    return buildPaginatedResult(
      rows.map((r) => this.#toModel(r)),
      result.count,
      params,
    );
  }

  async findByCentro(centroId: TCentroId): Promise<readonly IServicio[]> {
    const result = await supabase
      .from('servicios_centro')
      .select(`servicios(${SELECT_SERVICIO})`)
      .eq('centro_id', centroId);
    if (!result.success) throw new Error(result.error.message);
    const rows = result.data as unknown as { servicios: IServiciosRow | null }[];
    return rows
      .map((r) => r.servicios)
      .filter((s): s is IServiciosRow => s !== null)
      .map((s) => this.#toModel(s));
  }

  async findActivos(): Promise<readonly IServicio[]> {
    const result = await supabase.from('servicios').select(SELECT_SERVICIO).eq('estado', 'activo');
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IServiciosRow[]).map((r) => this.#toModel(r));
  }

  async findBonos(): Promise<readonly IServicio[]> {
    const result = await supabase
      .from('servicios')
      .select(SELECT_SERVICIO)
      .eq('permite_bono', true)
      .eq('estado', 'activo');
    if (!result.success) throw new Error(result.error.message);
    return (result.data as IServiciosRow[]).map((r) => this.#toModel(r));
  }

  async create(data: ICreateServicioDTO): Promise<IServicio> {
    const result = await supabase
      .from('servicios')
      .insert({
        nombre: data.nombre,
        duracion: data.duracionMinutos,
        tipo_servicio: data.tipoServicioId,
        descripcion: data.descripcion ?? null,
        precio: data.precioBase,
        descuento: data.porcentajeDescuento ?? 0,
        permite_bono: data.esBono ?? false,
        sesiones_totales: data.sesionesTotales ?? null,
      })
      .select(SELECT_SERVICIO)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async update(id: TServicioId, data: IUpdateServicioDTO): Promise<IServicio> {
    const patch: {
      nombre?: string;
      descripcion?: string | null;
      duracion?: number;
      precio?: number | null;
      descuento?: number;
      permite_bono?: boolean;
      sesiones_totales?: number | null;
      tipo_servicio?: number;
      estado?: string;
    } = {};
    if (data.nombre !== undefined) patch.nombre = data.nombre;
    if (data.descripcion !== undefined) patch.descripcion = data.descripcion ?? null;
    if (data.duracionMinutos !== undefined) patch.duracion = data.duracionMinutos;
    if (data.precioBase !== undefined) patch.precio = data.precioBase;
    if (data.porcentajeDescuento !== undefined) patch.descuento = data.porcentajeDescuento;
    if (data.esBono !== undefined) patch.permite_bono = data.esBono;
    if (data.sesionesTotales !== undefined) patch.sesiones_totales = data.sesionesTotales ?? null;
    if (data.estado !== undefined) patch.estado = data.estado;

    const result = await supabase
      .from('servicios')
      .update(patch)
      .eq('id', id)
      .select(SELECT_SERVICIO)
      .single();
    if (!result.success) throw new Error(result.error.message);
    return this.#toModel(result.data);
  }

  async deactivate(id: TServicioId): Promise<void> {
    const result = await supabase.from('servicios').update({ estado: 'inactivo' }).eq('id', id);
    if (!result.success) throw new Error(result.error.message);
  }

  async assignToCentro(data: IServicioCentro): Promise<IServicioCentro> {
    const result = await supabase
      .from('servicios_centro')
      .insert({ centro_id: data.centroId, servicio_id: data.servicioId })
      .select('id, centro_id, servicio_id, created_at')
      .single();
    if (!result.success) {
      if (result.error.code === '23505') {
        throw new BusinessRuleViolation(
          'Servicio already assigned to centro',
          'SERVICIO_ALREADY_ASSIGNED',
        );
      }
      throw new Error(result.error.message);
    }
    return this.#toServicioCentroModel(result.data);
  }

  async removeFromCentro(servicioId: TServicioId, centroId: TCentroId): Promise<void> {
    const result = await supabase
      .from('servicios_centro')
      .delete()
      .eq('servicio_id', servicioId)
      .eq('centro_id', centroId);
    if (!result.success) throw new Error(result.error.message);
  }

  async findServicioCentro(
    servicioId: TServicioId,
    centroId: TCentroId,
  ): Promise<IServicioCentro | null> {
    const result = await supabase
      .from('servicios_centro')
      .select('id, centro_id, servicio_id, created_at')
      .eq('servicio_id', servicioId)
      .eq('centro_id', centroId)
      .maybeSingle();
    if (!result.success) throw new Error(result.error.message);
    const row = result.data;
    return row !== null ? this.#toServicioCentroModel(row) : null;
  }
}

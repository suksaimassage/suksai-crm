import type { IPagoRepositoryPort } from '@domain/ports';
import type { IPago, ICreatePagoDTO } from '@domain/models';
import type {
  TPagoId,
  TCitaId,
  TClienteId,
  TCentroId,
  TEstadoPago,
  IPaginationParams,
  IPaginatedResult,
} from '@domain/types';

// TODO: Implement once `pagos` table is added to the DB schema and database.types.ts
export class SupabasePagoAdapter implements IPagoRepositoryPort {
  findById(_id: TPagoId): Promise<IPago | null> {
    return Promise.reject(new Error('SupabasePagoAdapter.findById: pagos table not yet migrated'));
  }

  findByCita(_citaId: TCitaId): Promise<readonly IPago[]> {
    return Promise.reject(
      new Error('SupabasePagoAdapter.findByCita: pagos table not yet migrated'),
    );
  }

  findByCliente(
    _clienteId: TClienteId,
    _params?: IPaginationParams,
  ): Promise<IPaginatedResult<IPago>> {
    return Promise.reject(
      new Error('SupabasePagoAdapter.findByCliente: pagos table not yet migrated'),
    );
  }

  findByCentro(
    _centroId: TCentroId,
    _params?: IPaginationParams,
  ): Promise<IPaginatedResult<IPago>> {
    return Promise.reject(
      new Error('SupabasePagoAdapter.findByCentro: pagos table not yet migrated'),
    );
  }

  findByEstado(_estado: TEstadoPago): Promise<readonly IPago[]> {
    return Promise.reject(
      new Error('SupabasePagoAdapter.findByEstado: pagos table not yet migrated'),
    );
  }

  create(_data: ICreatePagoDTO): Promise<IPago> {
    return Promise.reject(new Error('SupabasePagoAdapter.create: pagos table not yet migrated'));
  }

  updateEstado(_id: TPagoId, _estado: TEstadoPago): Promise<IPago> {
    return Promise.reject(
      new Error('SupabasePagoAdapter.updateEstado: pagos table not yet migrated'),
    );
  }

  reembolsar(_id: TPagoId, _motivo?: string): Promise<IPago> {
    return Promise.reject(
      new Error('SupabasePagoAdapter.reembolsar: pagos table not yet migrated'),
    );
  }
}

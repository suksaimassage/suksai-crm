import type { IBonoRepositoryPort } from '@domain/ports';
import type { IClienteBono, ICreateClienteBonoDTO } from '@domain/models';
import type { TBonoId, TClienteId, TServicioId } from '@domain/types';

// TODO: Implement once `bonos_cliente` table is added to the DB schema and database.types.ts
export class SupabaseBonoAdapter implements IBonoRepositoryPort {
  findById(_id: TBonoId): Promise<IClienteBono | null> {
    return Promise.reject(
      new Error('SupabaseBonoAdapter.findById: bonos_cliente table not yet migrated'),
    );
  }

  findByCliente(_clienteId: TClienteId): Promise<readonly IClienteBono[]> {
    return Promise.reject(
      new Error('SupabaseBonoAdapter.findByCliente: bonos_cliente table not yet migrated'),
    );
  }

  findActivosByCliente(_clienteId: TClienteId): Promise<readonly IClienteBono[]> {
    return Promise.reject(
      new Error('SupabaseBonoAdapter.findActivosByCliente: bonos_cliente table not yet migrated'),
    );
  }

  findByServicio(_servicioId: TServicioId): Promise<readonly IClienteBono[]> {
    return Promise.reject(
      new Error('SupabaseBonoAdapter.findByServicio: bonos_cliente table not yet migrated'),
    );
  }

  create(_data: ICreateClienteBonoDTO): Promise<IClienteBono> {
    return Promise.reject(
      new Error('SupabaseBonoAdapter.create: bonos_cliente table not yet migrated'),
    );
  }

  usarSesion(_id: TBonoId): Promise<IClienteBono> {
    return Promise.reject(
      new Error('SupabaseBonoAdapter.usarSesion: bonos_cliente table not yet migrated'),
    );
  }

  deactivate(_id: TBonoId): Promise<void> {
    return Promise.reject(
      new Error('SupabaseBonoAdapter.deactivate: bonos_cliente table not yet migrated'),
    );
  }
}

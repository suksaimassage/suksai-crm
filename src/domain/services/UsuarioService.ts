import type { IUsuarioRepositoryPort } from '../ports';
import type { IRolRepositoryPort } from '../ports';
import type { IUsuario, ICreateUsuarioDTO, IUpdateUsuarioDTO } from '../models';
import type { TUserId, TRolId, TNombreRol } from '../types';
import { ValidationError, BusinessRuleViolation } from '../types';
import { Email } from '../value-objects/Email';

interface IUsuarioServiceDeps {
  readonly usuarioRepository: IUsuarioRepositoryPort;
  readonly rolRepository: IRolRepositoryPort;
}

export class UsuarioService {
  private readonly deps: IUsuarioServiceDeps;

  constructor(deps: IUsuarioServiceDeps) {
    this.deps = deps;
  }

  async create(data: ICreateUsuarioDTO): Promise<IUsuario> {
    Email.create(data.email);

    const existing = await this.deps.usuarioRepository.findByEmail(data.email);
    if (existing) {
      throw new BusinessRuleViolation(
        `A user with email ${data.email} already exists`,
        'DUPLICATE_EMAIL',
      );
    }

    return this.deps.usuarioRepository.create(data);
  }

  async update(id: TUserId, data: IUpdateUsuarioDTO): Promise<IUsuario> {
    const usuario = await this.deps.usuarioRepository.findById(id);
    if (!usuario) {
      throw new ValidationError(`Usuario ${id} not found`, 'usuarioId');
    }
    return this.deps.usuarioRepository.update(id, data);
  }

  async deactivate(id: TUserId): Promise<void> {
    const usuario = await this.deps.usuarioRepository.findById(id);
    if (!usuario) {
      throw new ValidationError(`Usuario ${id} not found`, 'usuarioId');
    }
    if (!usuario.activo) {
      throw new BusinessRuleViolation(`Usuario ${id} is already inactive`, 'ALREADY_INACTIVE');
    }
    await this.deps.usuarioRepository.deactivate(id);
  }

  async assignRol(usuarioId: TUserId, rolId: TRolId): Promise<void> {
    const usuario = await this.deps.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new ValidationError(`Usuario ${usuarioId} not found`, 'usuarioId');
    }
    const rol = await this.deps.rolRepository.findById(rolId);
    if (!rol) {
      throw new ValidationError(`Rol ${rolId} not found`, 'rolId');
    }
    const rolesActuales = await this.deps.rolRepository.findRolesByUsuario(usuarioId);
    const yaAsignado = rolesActuales.some((r) => r.id === rolId);
    if (yaAsignado) {
      throw new BusinessRuleViolation(
        `Usuario ${usuarioId} already has role ${rol.nombre}`,
        'ROLE_ALREADY_ASSIGNED',
      );
    }
    await this.deps.rolRepository.assignRolToUsuario(usuarioId, rolId);
  }

  async hasRole(usuarioId: TUserId, nombre: TNombreRol): Promise<boolean> {
    const roles = await this.deps.rolRepository.findRolesByUsuario(usuarioId);
    return roles.some((r) => r.nombre === nombre);
  }
}

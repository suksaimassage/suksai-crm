import type { IClienteRepositoryPort } from '../ports';
import type { ICliente, ICreateClienteDTO, IUpdateClienteDTO } from '../models';
import type { TClienteId } from '../types';
import { ValidationError, BusinessRuleViolation } from '../types';
import { Email } from '../value-objects/Email';
import { PhoneNumber } from '../value-objects/PhoneNumber';

interface IClienteServiceDeps {
  readonly clienteRepository: IClienteRepositoryPort;
}

export class ClienteService {
  private readonly deps: IClienteServiceDeps;

  constructor(deps: IClienteServiceDeps) {
    this.deps = deps;
  }

  async create(data: ICreateClienteDTO): Promise<ICliente> {
    PhoneNumber.create(data.telefono);

    const byPhone = await this.deps.clienteRepository.findByTelefono(data.telefono);
    if (byPhone) {
      throw new BusinessRuleViolation(
        `A client with phone ${data.telefono} already exists`,
        'DUPLICATE_TELEFONO',
      );
    }

    if (data.email) {
      Email.create(data.email);
      const byEmail = await this.deps.clienteRepository.findByEmail(data.email);
      if (byEmail) {
        throw new BusinessRuleViolation(
          `A client with email ${data.email} already exists`,
          'DUPLICATE_EMAIL',
        );
      }
    }

    return this.deps.clienteRepository.create(data);
  }

  async update(id: TClienteId, data: IUpdateClienteDTO): Promise<ICliente> {
    const cliente = await this.deps.clienteRepository.findById(id);
    if (!cliente) {
      throw new ValidationError(`Cliente ${id} not found`, 'clienteId');
    }

    if (data.telefono) {
      PhoneNumber.create(data.telefono);
      const byPhone = await this.deps.clienteRepository.findByTelefono(data.telefono);
      if (byPhone && byPhone.id !== id) {
        throw new BusinessRuleViolation(
          `Phone ${data.telefono} is already used by another client`,
          'DUPLICATE_TELEFONO',
        );
      }
    }

    if (data.email) {
      Email.create(data.email);
      const byEmail = await this.deps.clienteRepository.findByEmail(data.email);
      if (byEmail && byEmail.id !== id) {
        throw new BusinessRuleViolation(
          `Email ${data.email} is already used by another client`,
          'DUPLICATE_EMAIL',
        );
      }
    }

    return this.deps.clienteRepository.update(id, data);
  }

  async deactivate(id: TClienteId): Promise<void> {
    const cliente = await this.deps.clienteRepository.findById(id);
    if (!cliente) {
      throw new ValidationError(`Cliente ${id} not found`, 'clienteId');
    }
    await this.deps.clienteRepository.deactivate(id);
  }
}

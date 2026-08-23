import type { IAusenciaRepositoryPort } from '../ports';
import type { ICitaRepositoryPort } from '../ports';
import type { IAusencia, ICreateAusenciaDTO } from '../models';
import type { TUserId, TAusenciaId, TCitaId } from '../types';
import { ValidationError, BusinessRuleViolation } from '../types';
import { DateRange } from '../value-objects/DateRange';

interface IAusenciaServiceDeps {
  readonly ausenciaRepository: IAusenciaRepositoryPort;
  readonly citaRepository: ICitaRepositoryPort;
}

export class AusenciaService {
  private readonly deps: IAusenciaServiceDeps;

  constructor(deps: IAusenciaServiceDeps) {
    this.deps = deps;
  }

  async request(data: ICreateAusenciaDTO): Promise<IAusencia> {
    // Rule 1: valid date range — DateRange.create throws if start > end
    const range = DateRange.create(data.fechaInicio, data.fechaFin);

    // Rule 2: no overlapping ausencias (approved OR pending) for same user
    const existing = await this.deps.ausenciaRepository.findByUsuario(data.usuarioId, {
      from: range.start,
      to: range.end,
    });

    const hasOverlap = existing.some((a) =>
      DateRange.create(a.fechaInicio, a.fechaFin).overlaps(range),
    );

    if (hasOverlap) {
      throw new BusinessRuleViolation(
        'User already has an absence (approved or pending) that overlaps with this period',
        'OVERLAPPING_AUSENCIA',
      );
    }

    return this.deps.ausenciaRepository.create(data);
  }

  async approve(
    ausenciaId: TAusenciaId,
    aprobadaPor: TUserId,
  ): Promise<{ ausencia: IAusencia; affectedCitaIds: readonly TCitaId[] }> {
    const ausencia = await this.deps.ausenciaRepository.findById(ausenciaId);

    if (!ausencia) {
      throw new ValidationError(`Ausencia ${ausenciaId} not found`, 'ausenciaId');
    }

    if (ausencia.aprobada) {
      throw new BusinessRuleViolation('Ausencia is already approved', 'ALREADY_APPROVED');
    }

    const range = DateRange.create(ausencia.fechaInicio, ausencia.fechaFin);
    const citas = await this.deps.citaRepository.findByUsuario(ausencia.usuarioId, {
      from: range.start,
      to: range.end,
    });

    const affectedCitaIds: TCitaId[] = citas
      .filter(
        (c) =>
          c.estado !== 'cancelada' &&
          DateRange.create(c.fechaHoraInicio, c.fechaHoraFin).overlaps(range),
      )
      .map((c) => c.id);

    const approved = await this.deps.ausenciaRepository.aprobar(ausenciaId, aprobadaPor);

    return { ausencia: approved, affectedCitaIds };
  }
}

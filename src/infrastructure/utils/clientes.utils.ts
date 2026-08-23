import type { TClienteSegmento } from '@infra/pages/ClientesPage/Clientes.types';
import { VIP_THRESHOLD_CENTS } from '@infra/pages/ClientesPage/Clientes.types';

export function deriveSegmento(
  activo: boolean,
  gastoAnual: number,
  createdAt: Date,
  ultimaVisita: Date | null,
  totalVisitasAnio: number,
): TClienteSegmento {
  if (!activo) return 'inactivo';

  const now = new Date();
  const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (gastoAnual >= VIP_THRESHOLD_CENTS) return 'vip';
  if (daysSinceCreated <= 30) return 'nuevo';
  if (totalVisitasAnio < 3) return 'nuevo';
  if (ultimaVisita === null) return 'inactivo';

  const daysSinceVisit = (now.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceVisit > 90) return 'inactivo';
  if (daysSinceVisit > 60) return 'en_riesgo';
  return 'activo';
}

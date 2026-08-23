/**
 * rituales.utils.tsx — pure helpers shared across RitualesPage components.
 * Kept in a separate file so react-refresh does not warn about non-component
 * exports co-located with component files.
 */

import type { ReactNode } from 'react';
import {
  IcoCatMassage,
  IcoCatDrop,
  IcoCatStone,
  IcoCatMoon,
  IcoCatCouples,
  IcoCatSports,
  IcoCatPrenatal,
  IcoCatDefault,
} from './RitualesIcons';

export type TActiveTab = 'activos' | 'inactivos' | 'archivados' | 'todos';

export const TABS: readonly TActiveTab[] = ['activos', 'inactivos', 'archivados', 'todos'];

export function getServiceIcon(tipoNombre: string, size: number): ReactNode {
  const n = tipoNombre.toLowerCase();
  if (n.includes('tradic') || n.includes('masaje')) return <IcoCatMassage size={size} />;
  if (n.includes('aceite') || n.includes('aromaterapia')) return <IcoCatDrop size={size} />;
  if (n.includes('piedra') || n.includes('calor')) return <IcoCatStone size={size} />;
  if (n.includes('facial')) return <IcoCatMoon size={size} />;
  if (n.includes('pareja') || n.includes('suite')) return <IcoCatCouples size={size} />;
  if (n.includes('deport') || n.includes('tissue')) return <IcoCatSports size={size} />;
  if (n.includes('prenatal') || n.includes('embarazo')) return <IcoCatPrenatal size={size} />;
  return <IcoCatDefault size={size} />;
}

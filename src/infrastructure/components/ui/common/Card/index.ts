/**
 * Card Component - Public API
 *
 * Barrel export para mantener imports limpios
 *
 * @example
 * import { Card, CardHeader, CardBody, CardFooter } from '@ui/Card';
 */

// Named exports
export { Card } from './Card';

// Type exports
export type {
  ICardProps,
  ICardHeaderProps,
  ICardBodyProps,
  ICardFooterProps,
  TCardVariant,
  TCardSize,
} from './Card.types';

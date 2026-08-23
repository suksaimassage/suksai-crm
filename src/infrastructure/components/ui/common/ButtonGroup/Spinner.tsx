/**
 * Spinner Component
 *
 * Componente de loading spinner para el botón
 *
 * Principios:
 * - Single Responsibility: Solo muestra animación de carga
 * - Reutilizable en otros contextos
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';

/**
 * Props del spinner de carga
 */
interface SpinnerProps {
  readonly size?: number;
  readonly color?: string;
  readonly className?: string;
}

// ========================================
// ANIMATIONS
// ========================================

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// ========================================
// STYLED COMPONENT
// ========================================

const StyledSpinner = styled.div<{ $size: number; $color: string }>`
  display: inline-block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border: 2px solid transparent;
  border-top-color: ${({ $color }) => $color};
  border-right-color: ${({ $color }) => $color};
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
  flex-shrink: 0;
`;

// ========================================
// COMPONENT
// ========================================

/**
 * Spinner - Indicador de carga circular
 *
 * @example
 * <Spinner size={16} color="#fff" />
 */
const Spinner: React.FC<SpinnerProps> = ({ size = 16, color = 'currentColor', className }) => {
  const { t } = useTranslation('common');
  return (
    <StyledSpinner
      $size={size}
      $color={color}
      className={className}
      role="status"
      aria-label={t('loading')}
    />
  );
};

Spinner.displayName = 'Spinner';

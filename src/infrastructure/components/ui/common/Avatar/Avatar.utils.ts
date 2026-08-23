/**
 * Avatar Utilities
 *
 * Responsabilidad: Funciones helper para el Avatar
 *
 * Principios:
 * - Single Responsibility: Cada función hace una cosa
 * - Pure Functions: Sin side effects
 */

import type { TAvatarBadgePosition, TAvatarSize } from './Avatar.types';

/**
 * Genera iniciales desde un nombre completo
 * Máximo 2 letras en mayúsculas
 *
 * @example
 * getInitials('John Doe') // → 'JD'
 * getInitials('John') // → 'JO'
 * getInitials('John Michael Smith') // → 'JS'
 * getInitials('') // → '?'
 */
export const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '?';
  }

  // Limpiar y dividir el nombre
  const cleanName = name.trim();

  if (cleanName.length === 0) {
    return '?';
  }

  // Dividir por espacios y filtrar strings vacíos
  const parts = cleanName.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  // Si solo hay una palabra
  if (parts.length === 1) {
    const word = parts[0];
    // Tomar las primeras 2 letras
    return word.substring(0, 2).toUpperCase();
  }

  // Si hay múltiples palabras
  // Tomar primera letra de la primera palabra + primera letra de la última palabra
  const firstInitial = parts[0][0];
  const lastInitial = parts[parts.length - 1][0];

  return (firstInitial + lastInitial).toUpperCase();
};

/**
 * Genera un color consistente basado en el nombre
 * Usa hash del string para seleccionar un color
 *
 * @example
 * getColorFromName('John Doe') // → 'primary'
 * getColorFromName('Jane Smith') // → 'secondary'
 */
export const getColorFromName = (name: string): string => {
  if (!name) return 'neutral';

  // Colores disponibles
  const colors = ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error'];

  // Simple hash del nombre
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Seleccionar color basado en hash
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Verifica si una URL de imagen es válida
 *
 * @example
 * isValidImageUrl('https://example.com/image.jpg') // → true
 * isValidImageUrl('') // → false
 * isValidImageUrl(undefined) // → false
 */
export const isValidImageUrl = (url: string | undefined): url is string => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Verificar que no esté vacía
  if (url.trim().length === 0) {
    return false;
  }

  // Verificar que sea una URL válida (básico)
  try {
    new URL(url);
    return true;
  } catch {
    // Si no es URL absoluta, aceptar URLs relativas
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
};

/**
 * Calcula el tamaño del badge según el tamaño del avatar
 *
 * @example
 * getBadgeSize('md') // → '12px'
 */
export const getBadgeSize = (avatarSize: TAvatarSize): string => {
  const sizes: Record<TAvatarSize, string> = {
    xs: '8px',
    sm: '10px',
    md: '12px',
    lg: '14px',
    xl: '16px',
    '2xl': '18px',
  };

  return sizes[avatarSize] || '12px';
};

/**
 * Obtiene el offset del badge según la posición
 *
 * @example
 * getBadgeOffset('top-right') // → { top: '0', right: '0' }
 */
export const getBadgeOffset = (position: TAvatarBadgePosition): Record<string, string> => {
  const offsets: Record<TAvatarBadgePosition, Record<string, string>> = {
    'top-right': { top: '0', right: '0' },
    'top-left': { top: '0', left: '0' },
    'bottom-right': { bottom: '0', right: '0' },
    'bottom-left': { bottom: '0', left: '0' },
  };

  return offsets[position];
};

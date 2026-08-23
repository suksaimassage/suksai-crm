/**
 * Card Component
 *
 * Componente de tarjeta versátil y responsive.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Cada subcomponente tiene una sola responsabilidad.
 * - Open/Closed: Extensible mediante props, cerrado a modificación.
 * - Liskov Substitution: Puede usarse con o sin header/body/footer.
 * - Interface Segregation: Props separadas por subcomponente.
 * - Dependency Inversion: Depende de abstracciones (tipos e interfaces).
 *
 * @example
 * // Card básico
 * <Card>
 *   <Card.Body>Content</Card.Body>
 * </Card>
 *
 * @example
 * // Card completo — size="lg" se propaga a todos los subcomponentes
 * <Card variant="elevated" size="lg">
 *   <Card.Header title="Title" subtitle="Subtitle" />
 *   <Card.Body>Content</Card.Body>
 *   <Card.Footer align="right">
 *     <Button>Action</Button>
 *   </Card.Footer>
 * </Card>
 *
 * @example
 * // Card clickeable
 * <Card clickable onClick={() => console.log('clicked')}>
 *   <Card.Body>Click me</Card.Body>
 * </Card>
 */

import React, { Children, createContext, isValidElement, useContext } from 'react';
import * as S from './Card.styles';
import type {
  ICardProps,
  ICardHeaderProps,
  ICardBodyProps,
  ICardFooterProps,
  TCardSize,
} from './Card.types';

// ========================================
// CARD CONTEXT
// ========================================

/**
 * CardContext — Comparte el estado interno del Card con sus subcomponentes.
 *
 * Responsabilidad: Evitar prop drilling entre Card y CardHeader/Body/Footer.
 * El consumidor (usuario del componente) no necesita pasar `size` a cada parte.
 *
 * Patrón: Compound Component con Context implícito.
 */
interface ICardContextValue {
  readonly hasHeader?: boolean;
  readonly hasBody?: boolean;
  readonly hasFooter?: boolean;
  readonly size: TCardSize;
}

const CardContext = createContext<ICardContextValue | null>(null);

/**
 * Hook interno para consumir el CardContext.
 * Centraliza el acceso y permite detectar uso fuera del contexto.
 */
const useCardContext = (): ICardContextValue => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('Card components must be used within <Card>');
  }
  return context;
};

// ========================================
// CARD HEADER
// ========================================

/**
 * CardHeader — Encabezado del card.
 *
 * Responsabilidad: Mostrar título, subtítulo, avatar y acciones.
 * Lee el `size` del CardContext en lugar de tenerlo hardcodeado.
 *
 * @example
 * <Card.Header title="Title" subtitle="Subtitle" />
 *
 * @example
 * <Card.Header
 *   title="User Profile"
 *   avatar={<Avatar>JD</Avatar>}
 *   action={<IconButton>⋮</IconButton>}
 * />
 */
const CardHeader: React.FC<ICardHeaderProps> = ({
  children,
  padding,
  title,
  subtitle,
  avatar,
  action,
  className,
}) => {
  // ✅ FIX: Lee el size real del Card padre (era "md" hardcodeado antes)
  const { size } = useCardContext();

  if (!title && !subtitle && !avatar && !action) {
    return (
      <S.StyledCardHeader $size={size} className={className} $customPadding={padding}>
        {children}
      </S.StyledCardHeader>
    );
  }

  return (
    <S.StyledCardHeader $size={size} className={className}>
      {avatar && <S.StyledCardHeaderAvatar>{avatar}</S.StyledCardHeaderAvatar>}

      <S.StyledCardHeaderContent>
        {title && <S.StyledCardHeaderTitle>{title}</S.StyledCardHeaderTitle>}
        {subtitle && <S.StyledCardHeaderSubtitle>{subtitle}</S.StyledCardHeaderSubtitle>}
        {children}
      </S.StyledCardHeaderContent>

      {action && <S.StyledCardHeaderAction>{action}</S.StyledCardHeaderAction>}
    </S.StyledCardHeader>
  );
};

CardHeader.displayName = 'Card.Header';

// ========================================
// CARD BODY
// ========================================

/**
 * CardBody — Cuerpo del card.
 *
 * Responsabilidad: Mostrar el contenido principal.
 * Lee el `size` del CardContext.
 *
 * @example
 * <Card.Body>Simple content</Card.Body>
 *
 * @example
 * <Card.Body padding="lg">Content with large padding</Card.Body>
 *
 * @example
 * <Card.Body padding="none">
 *   <img src="..." alt="Full bleed image" />
 * </Card.Body>
 */
const CardBody: React.FC<ICardBodyProps> = ({ children, padding, className }) => {
  useCardContext();
  // ✅ FIX: Lee el size real del Card padre (era "md" hardcodeado antes)
  const { size } = useCardContext();

  return (
    <S.StyledCardBody $size={size} $customPadding={padding} className={className}>
      {children}
    </S.StyledCardBody>
  );
};

CardBody.displayName = 'Card.Body';

// ========================================
// CARD FOOTER
// ========================================

/**
 * CardFooter — Pie del card.
 *
 * Responsabilidad: Mostrar acciones o información secundaria.
 * Lee el `size` del CardContext.
 *
 * @example
 * <Card.Footer>
 *   <Button variant="text">Cancel</Button>
 *   <Button variant="solid">Submit</Button>
 * </Card.Footer>
 *
 * @example
 * <Card.Footer align="between">
 *   <span>Info</span>
 *   <Button>Action</Button>
 * </Card.Footer>
 */
const CardFooter: React.FC<ICardFooterProps> = ({ children, align = 'left', className }) => {
  // ✅ FIX: Lee el size real del Card padre (era "md" hardcodeado antes)
  const { size } = useCardContext();

  return (
    <S.StyledCardFooter $size={size} $align={align} className={className}>
      {children}
    </S.StyledCardFooter>
  );
};
CardFooter.displayName = 'Card.Footer';

// ========================================
// CARD CONTAINER (Main Component)
// ========================================

/**
 * Card — Componente contenedor principal.
 *
 * Responsabilidad: Proveer el contenedor, estados visuales
 * y contexto compartido para sus subcomponentes.
 */
const CardBase: React.FC<ICardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  clickable = false,
  onClick,
  className,
  id,
  fullWidth = false,
  disabled = false,
  ...ariaProps
}) => {
  const isClickable = clickable || !!onClick;

  const htmlProps = {
    onClick: !disabled && onClick ? onClick : undefined,
    tabIndex: isClickable && !disabled ? 0 : undefined,
    role: isClickable ? ('button' as const) : undefined,
    'aria-disabled': disabled ? true : undefined,
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && onClick && isClickable) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }
  };

  const childrenArray = Children.toArray(children);

  const hasBody = childrenArray.some(
    (child) => isValidElement(child) && (child.type as React.FC).displayName === 'Card.Body',
  );

  if (!hasBody) {
    throw new Error('Card must include a Card.Body');
  }

  return (
    /*
     * CardContext.Provider envuelve el contenido con el `size` del Card.
     * CardHeader, CardBody y CardFooter lo leen via `useCardContext()`.
     * Si el usuario cambia size="sm" o size="lg", todos los subcomponentes
     * se actualizan automáticamente sin cambios adicionales.
     */
    <CardContext.Provider value={{ size }}>
      <S.StyledCard
        $variant={variant}
        $size={size}
        $clickable={isClickable}
        $fullWidth={fullWidth}
        $disabled={disabled}
        className={className}
        id={id}
        onKeyDown={handleKeyDown}
        {...ariaProps}
        {...htmlProps}
      >
        {children}
      </S.StyledCard>
    </CardContext.Provider>
  );
};

// ========================================
// DISPLAY NAMES (para React DevTools)
// ========================================
type TCardComponent = typeof CardBase & {
  Header: React.FC<ICardHeaderProps>;
  Body: React.FC<ICardBodyProps>;
  Footer: React.FC<ICardFooterProps>;
};

export const Card = CardBase as TCardComponent;

Card.displayName = 'Card';
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

/**
 * Layout — Componentes semánticos de layout
 *
 * Sistema de bloques HTML5 semánticos integrados con el design system RDSFS.
 * Cada componente mapea a un elemento HTML semántico específico,
 * con props que consumen los tokens del theme.
 *
 * Principios SOLID:
 * - Single Responsibility: cada componente tiene una función semántica única.
 * - Open/Closed: extensibles via props, comportamiento base inmutable.
 * - Liskov Substitution: prop `as` permite cambiar el elemento HTML.
 * - Interface Segregation: cada componente recibe solo las props que usa.
 * - Dependency Inversion: dependen del theme (abstracción), no de literales.
 *
 * Jerarquía de uso:
 *
 *   <PageLayout>
 *     <Section>
 *       <Container>
 *         <SectionHeader bordered>...</SectionHeader>
 *         <Article prose elevated>...</Article>
 *         <Aside width="280px" border="start">...</Aside>
 *         <SectionFooter bordered align="between">...</SectionFooter>
 *       </Container>
 *     </Section>
 *     <Divider label="O continúa con" />
 *   </PageLayout>
 */

import React, { createContext, useContext } from 'react';
import type {
  IContainerProps,
  IPageLayoutProps,
  ISectionProps,
  IArticleProps,
  IAsideProps,
  ISectionHeaderProps,
  ISectionFooterProps,
  IDividerProps,
} from './Layout.types';
import type { ITypographyProps } from '../Typography/Typography.types';
import { Typography } from '../Typography';
import * as S from './Layout.styles';

// ─── Container ─────────────────────────────────────────────────────────────

/**
 * Container — Centra y limita el ancho del contenido.
 *
 * El bloque fundamental de cualquier layout: aplica max-width y
 * gutter (padding horizontal) responsive para que el contenido nunca
 * toque los bordes de la pantalla.
 *
 * @example
 * // Uso básico — 1280px, gutter responsivo
 * <Container>
 *   <h1>Título</h1>
 * </Container>
 *
 * @example
 * // Para columnas de lectura
 * <Container size="md">
 *   <Article prose>...</Article>
 * </Container>
 *
 * @example
 * // Con elemento HTML personalizado
 * <Container as="section" size="lg" gutter="xl">
 *   ...
 * </Container>
 */
export const Container: React.FC<IContainerProps> = ({
  children,
  size = 'xl',
  gutter,
  center = true,
  as,
  className,
  id,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}) => (
  <S.StyledContainer
    as={as}
    $size={size}
    $center={center}
    $gutter={gutter}
    className={className}
    id={id}
    style={style}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
  >
    {children}
  </S.StyledContainer>
);

Container.displayName = 'Container';

// ─── PageLayout ────────────────────────────────────────────────────────────

/**
 * PageLayout — Envuelve el contenido principal de la página (<main>).
 *
 * Un único PageLayout por página, como hijo directo del layout de ruta.
 * Garantiza min-height: 100dvh para que el footer quede siempre al fondo.
 *
 * @example
 * <PageLayout>
 *   <Section>...</Section>
 *   <Section background={theme.color.neutral[50]}>...</Section>
 * </PageLayout>
 */
export const PageLayout: React.FC<IPageLayoutProps> = ({
  children,
  $py,
  background,
  as,
  className,
  id,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}) => (
  <S.StyledPageLayout
    as={as ?? 'main'}
    $py={$py}
    $background={background}
    className={className}
    id={id ?? 'main-content'}
    style={style}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
  >
    {children}
  </S.StyledPageLayout>
);

PageLayout.displayName = 'PageLayout';

// ─── Section ───────────────────────────────────────────────────────────────

type TSectionComponent = React.FC<ISectionProps> & {
  Title: React.FC<ITypographyProps>;
  Subtitle: React.FC<ITypographyProps>;
  Header: React.FC<ISectionHeaderProps>;
  Footer: React.FC<ISectionFooterProps>;
};

/**
 * Section — Bloque temático de contenido.
 *
 * Agrupa contenido relacionado bajo un tema o propósito común.
 * El padding vertical generoso (Mobile First) crea separación visual
 * entre secciones sin necesidad de bordes ni sombras.
 *
 * Buenas prácticas:
 * - Cada Section debería tener un heading que la identifique.
 * - Usar aria-labelledby apuntando al id del heading interno.
 * - Alternar background entre secciones para separación visual.
 *
 * @example
 * <Section aria-labelledby="features-heading">
 *   <Container>
 *     <h2 id="features-heading">Características</h2>
 *   </Container>
 * </Section>
 *
 * @example
 * <Section background={theme.color.neutral[50]} align="center" minHeight="80vh">
 *   <Container size="md">
 *     <h2>Hero centrado</h2>
 *   </Container>
 * </Section>
 */

interface ISectionContextValue {
  readonly hasTitle?: boolean;
  readonly hasSubtitle?: boolean;
}

const SectionContext = createContext<ISectionContextValue | null>(null);

const useSectionContext = (): ISectionContextValue => {
  const context = useContext(SectionContext);
  if (!context) {
    throw new Error('Secton components must be used within <Section>');
  }
  return context;
};

// ─── SectionHeader ─────────────────────────────────────────────────────────

/**
 * SectionHeader — Cabecera semántica de una sección o artículo.
 *
 * No confundir con el Navbar (header de página).
 * Este elemento vive dentro de <section> o <article>.
 * Agrupa heading, subtítulo y acciones de cabecera.
 *
 * @example
 * <Section>
 *   <Container>
 *     <Section.Header bordered>
 *       <Typography variant="h2">Título</Typography>
 *       <Typography variant="subtitle" color="secondary">Descripción</Typography>
 *     </Section.Header>
 *     ...contenido
 *   </Container>
 * </Section>
 */
const SectionHeader: React.FC<ISectionHeaderProps> = ({
  children,
  $py,
  $px,
  bordered = false,
  className,
  id,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}) => (
  <S.StyledSectionHeader
    $py={$py}
    $px={$px}
    $bordered={bordered}
    className={className}
    id={id}
    style={style}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
  >
    {children}
  </S.StyledSectionHeader>
);

SectionHeader.displayName = 'SectionHeader';

// ─── SectionFooter ─────────────────────────────────────────────────────────

/**
 * SectionFooter — Pie semántico de una sección o artículo.
 *
 * Agrupa acciones, metadatos, paginación o créditos.
 *
 * @example
 * // Formulario con acciones
 * <Article>
 *   <Section.Header bordered><h3>Nuevo registro</h3></Section.Header>
 *   <form>...</form>
 *   <Section.Footer bordered align="between">
 *     <Button variant="text">Cancelar</Button>
 *     <Button>Guardar</Button>
 *   </Section.Footer>
 * </Article>
 */
const SectionFooter: React.FC<ISectionFooterProps> = ({
  children,
  $py,
  bordered = false,
  align = 'left',
  className,
  id,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}) => {
  useSectionContext();
  return (
    <S.StyledSectionFooter
      $py={$py}
      $bordered={bordered}
      $align={align}
      className={className}
      id={id}
      style={style}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </S.StyledSectionFooter>
  );
};
SectionFooter.displayName = 'SectionFooter';

export const Section: TSectionComponent = ({
  children,
  $py = 'md',
  $px,
  background,
  align = 'left',
  minHeight,
  className,
  id,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}) => (
  <SectionContext.Provider value={{}}>
    <S.StyledSection
      $py={$py}
      $px={$px}
      $background={background}
      $align={align}
      $minHeight={minHeight as string | undefined}
      className={className}
      id={id}
      style={style}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </S.StyledSection>
  </SectionContext.Provider>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => {
  useSectionContext();
  return (
    <Typography variant="h3" gutterBottom>
      {children}
    </Typography>
  );
};

const SectionSubtitle = ({ children }: { children: React.ReactNode }) => {
  useSectionContext();
  return <Typography variant="subtitle">{children}</Typography>;
};

Section.displayName = 'Section';
Section.Title = SectionTitle;
Section.Subtitle = SectionSubtitle;
Section.Header = SectionHeader;
Section.Footer = SectionFooter;

// ─── Article ───────────────────────────────────────────────────────────────

/**
 * Article — Contenido autocontenido y redistribuible.
 *
 * Usar cuando el contenido tiene sentido fuera de su contexto:
 * blog post, noticia, ficha de producto, comentario, perfil.
 *
 * Modo `prose`: aplica estilos tipográficos automáticos a h1–h6,
 * p, ul, ol, blockquote, pre, code — ideal para contenido de CMS,
 * MDX, Markdown o cualquier HTML dinámico.
 *
 * @example
 * // Post de blog
 * <Article prose maxWidth="72ch">
 *   <h1>Título del artículo</h1>
 *   <p>Primer párrafo...</p>
 * </Article>
 *
 * @example
 * // Card elevada
 * <Article elevated>
 *   <h2>Producto</h2>
 *   <p>Descripción breve</p>
 * </Article>
 */
export const Article: React.FC<IArticleProps> = ({
  children,
  $p,
  maxWidth,
  prose = false,
  elevated = false,
  className,
  id,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}) => (
  <S.StyledArticle
    $p={$p}
    $maxWidth={maxWidth as string | undefined}
    $prose={prose}
    $elevated={elevated}
    className={className}
    id={id}
    style={style}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
  >
    {children}
  </S.StyledArticle>
);

Article.displayName = 'Article';

// ─── Aside ─────────────────────────────────────────────────────────────────

/**
 * Aside — Contenido complementario al contenido principal.
 *
 * Relacionado indirectamente: navegación secundaria, filtros,
 * widgets, información adicional, publicidad contextual.
 *
 * En layouts dos columnas, combinar con flexbox en el componente padre:
 *
 * @example
 * // Layout con sidebar
 * <div style={{ display: "flex", gap: theme.spacing.xl }}>
 *   <Article style={{ flex: 1 }}>Contenido principal</Article>
 *   <Aside width="280px" border="start">Sidebar</Aside>
 * </div>
 */
export const Aside: React.FC<IAsideProps> = ({
  children,
  $p,
  width,
  border = 'none',
  className,
  id,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}) => (
  <S.StyledAside
    $p={$p}
    $width={width as string | undefined}
    $border={border}
    className={className}
    id={id}
    style={style}
    aria-label={ariaLabel ?? 'Contenido complementario'}
    aria-labelledby={ariaLabelledby}
  >
    {children}
  </S.StyledAside>
);

Aside.displayName = 'Aside';

// ─── Divider ───────────────────────────────────────────────────────────────

/**
 * Divider — Separador semántico entre grupos de contenido.
 *
 * Renderiza como <hr> (elemento semántico HTML5).
 * Con `label`, transforma la línea en un separador decorativo:
 *   ────────── O continúa con ──────────
 *
 * @example
 * <Divider />
 * <Divider variant="dashed" spacing="2xl" />
 * <Divider label="O continúa con" />
 * <Divider orientation="vertical" />
 * <Divider color={theme.color.primary[300]} label="Sección A" />
 */
export const Divider: React.FC<IDividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  spacing,
  color,
  label,
  className,
  style,
}) => (
  <S.StyledDivider
    $orientation={orientation}
    $variant={variant}
    $spacing={spacing}
    $color={color}
    $hasLabel={!!label}
    className={className}
    style={style}
    role="separator"
    aria-orientation={orientation}
    data-content={label ?? label}
  />
);

Divider.displayName = 'Divider';

// ----- Dashboard

interface IDashboardlayout {
  children: React.ReactNode;
  collapsed: boolean;
}

export const DashboardLayout: React.FC<IDashboardlayout> = ({ children, collapsed }) => {
  return <S.StyledDashbordLayout $collapsed={collapsed}>{children}</S.StyledDashbordLayout>;
};

DashboardLayout.displayName = 'DashboardLayout';

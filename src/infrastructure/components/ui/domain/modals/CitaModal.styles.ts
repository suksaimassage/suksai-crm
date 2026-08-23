/**
 * CitaModal.styles.ts — styled primitives for the create/edit appointment modal.
 *
 * Composes the shared EntityModal grid/banner where possible; adds the
 * appointment-specific derived-end chip, price summary, picker hints and the
 * availability "validating" note. All values are theme tokens (Designer §2.5,
 * §3.1, §6). Transient props use the `$` prefix.
 */
import styled from 'styled-components';

/** Vertical stack of form rows inside the modal body. */
export const StyledCitaFormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

/** Two-column row (collapses to one column on narrow screens). */
export const StyledFormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

/** Form-level domain error banner (THERAPIST_CONFLICT, SALA_CONFLICT, …). */
export const StyledFormBanner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.intent.errorZone};
  border: 1px solid ${({ theme }) => theme.color.intent.errorSubtle};
`;

export const StyledFormBannerText = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.intent.error};
  margin: 0;
`;

/** Inline "Reintentar" button hosted inside the network-error banner. */
export const StyledBannerRetry = styled.button`
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0;
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.color.intent.error};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.brand.gold[400]};
    outline-offset: 2px;
  }
`;

/** Read-only derived end-time chip — structurally un-editable (Analyst edge #2). */
export const StyledDerivedField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const StyledDerivedLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.color.text.secondary};
`;

export const StyledDerivedValue = styled.div`
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.background.light};
  border: 1px solid ${({ theme }) => theme.color.neutralWarm[200]};
  font-family: ${({ theme }) => theme.typography.font.mono};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.brand.ink[700]};
`;

/** Quiet display-only price summary row (precio not persisted, Q7). */
export const StyledPriceSummary = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.color.background.light};
  border: 1px solid ${({ theme }) => theme.color.neutralWarm[200]};
`;

export const StyledPriceLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.brand.ink[500]};
`;

export const StyledPriceValue = styled.span`
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.xl};
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.brand.ink[900]};
`;

/** Small hint under a picker pointing at the fix (e.g. "Crea un cliente primero"). */
export const StyledFormHint = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
`;

/** aria-live caption shown while availability is being checked. */
export const StyledValidatingNote = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.brand.gold[700]};
`;

/**
 * Slot-field status caption (mutually exclusive with StyledValidatingNote — only
 * one renders at a time, so no cumulative layout shift). Used for the
 * "no schedule that day → full-grid fallback" message: informational, NOT an
 * error, so it recedes in muted text rather than an intent colour. `aria-live`
 * polite (set on the element) so it does not interrupt mid-field-edit.
 */
export const StyledSlotStatus = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.color.text.muted};
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
`;

export const StyledOptionalHint = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.regular};
  color: ${({ theme }) => theme.color.text.muted};
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

export const StyledFooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Inline presentation container (`presentation="inline"`). A flat pane with NO
 * dialog chrome (no shadow, no border, no backdrop) — it is embedded inside a
 * host quadrant that owns the surface. Scrolls independently (`min-height: 0`
 * lets it shrink inside a grid track so the pane, not the page, scrolls).
 */
export const StyledFormPane = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  min-height: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  background: transparent;
  overflow-y: auto;
`;

/** Section heading (`<h3>`) that replaces the Modal.Header title in inline mode. */
export const StyledFormSectionTitle = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.font.display};
  font-size: ${({ theme }) => theme.typography.size.xl};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.color.text.primary};
`;

/**
 * Flat action footer for inline mode — same right-aligned button cluster as the
 * Modal.Footer but without the dialog chrome. `margin-top: auto` pins it to the
 * bottom of the pane when the form is shorter than the quadrant.
 */
export const StyledInlineActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.sm};
`;

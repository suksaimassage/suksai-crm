import styled from 'styled-components';
import { Button } from '@infra/components/ui/common/Button';

// ── Local styles ──────────────────────────────────────────────────────────────

const StyledRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const StyledLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  flex: 1;
  min-width: 0;
`;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface IInlineDeleteConfirmProps {
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly isPending: boolean;
  readonly entityLabel: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const InlineDeleteConfirm = ({
  onConfirm,
  onCancel,
  isPending,
  entityLabel,
}: IInlineDeleteConfirmProps) => (
  <StyledRow role="group" aria-label={`Confirmar eliminación de ${entityLabel}`}>
    <StyledLabel>{`¿Eliminar ${entityLabel}?`}</StyledLabel>
    <Button
      variant="ghost"
      color="neutral"
      size="sm"
      type="button"
      disabled={isPending}
      onClick={onCancel}
    >
      Cancelar
    </Button>
    <Button
      variant="solid"
      color="error"
      size="sm"
      type="button"
      loading={isPending}
      onClick={onConfirm}
      aria-label={`Confirmar eliminación de ${entityLabel}`}
      autoFocus
    >
      Eliminar
    </Button>
  </StyledRow>
);

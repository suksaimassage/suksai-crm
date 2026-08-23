import { useEffect, useRef } from 'react';
import { Modal } from '@infra/components/ui/common/Modal';
import { Button } from '@infra/components/ui/common/Button';
import styled from 'styled-components';

// ── Local styles ──────────────────────────────────────────────────────────────

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  text-align: center;
`;

const StyledMessage = styled.p`
  font-family: ${({ theme }) => theme.typography.font.body};
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  margin: 0;
  max-width: 360px;
`;

const StyledCount = styled.strong`
  color: ${({ theme }) => theme.color.intent.error};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
`;

const StyledWarningIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.border.radius.full};
  background: ${({ theme }) => theme.color.intent.errorZone};
  color: ${({ theme }) => theme.color.intent.error};
  flex-shrink: 0;
`;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface IDeleteGuardDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly entityName: string;
  readonly activeCitasCount: number;
  readonly message: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DeleteGuardDialog = ({
  open,
  onClose,
  entityName,
  activeCitasCount,
  message,
}: IDeleteGuardDialogProps) => {
  const okRef = useRef<HTMLButtonElement>(null);

  // Focus the "Entendido" button when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay for the modal animation to complete
      const t = setTimeout(() => {
        okRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(t);
      };
    }
    return undefined;
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      position="center"
      closeOnBackdropClick
      closeOnEscape
    >
      <Modal.Header
        title={`No se puede eliminar ${entityName}`}
        showCloseButton
        onClose={onClose}
      />
      <Modal.Body padding="md">
        <StyledBody>
          <StyledWarningIcon aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </StyledWarningIcon>
          <StyledMessage>
            {message}{' '}
            <StyledCount aria-label={`${String(activeCitasCount)} citas activas`}>
              {activeCitasCount}
            </StyledCount>
          </StyledMessage>
        </StyledBody>
      </Modal.Body>
      <Modal.Footer align="center">
        <Button ref={okRef} variant="solid" color="primary" type="button" onClick={onClose}>
          Entendido
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

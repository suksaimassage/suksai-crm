import { useTranslation } from 'react-i18next';
import { Modal } from '@infra/components/ui/common/Modal';
import { Button } from '@infra/components/ui/common/Button';
import { useToast } from '@infra/components/ui/common/Toast';
import { useDeactivateCliente } from '@infra/hooks/useDeactivateCliente';
import type { TClienteId } from '@domain/types';
import * as S from './DeactivateClienteDialog.styles';

export interface IDeactivateClienteDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly clienteId: TClienteId | null;
  readonly clienteName: string;
  readonly onSuccess: () => void;
}

const IcoWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DeactivateClienteDialog = ({
  open,
  onClose,
  clienteId,
  clienteName,
  onSuccess,
}: IDeactivateClienteDialogProps) => {
  const { t } = useTranslation('clientes');
  const { warning: toastWarning } = useToast();
  const {
    futureCitasCount,
    isCountLoading,
    isCountError,
    deactivate,
    isPending,
    isError,
    error,
    reset,
  } = useDeactivateCliente(open ? clienteId : null);

  const handleConfirm = async () => {
    await deactivate();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const hasWarning = (futureCitasCount ?? 0) > 0;

  return (
    <Modal open={open} onClose={handleClose} size="sm" position="center" closeOnEscape>
      <Modal.Header title={t('deactivate.title')} showCloseButton onClose={handleClose} />
      <Modal.Body padding="md">
        <S.StyledDialogLiveRegion aria-live="polite" aria-atomic="true">
          {isCountLoading && (
            <S.StyledDialogBody>
              <S.StyledSkeletonBlock $w="48px" $h="48px" $circle />
              <S.StyledSkeletonBlock $w="80%" $h="14px" />
              <S.StyledSkeletonBlock $w="60%" $h="14px" />
            </S.StyledDialogBody>
          )}
          {isCountError && !isCountLoading && (
            <S.StyledDialogBody>
              <S.StyledInlineErrorBanner role="alert">
                {t('deactivate.countError')}
              </S.StyledInlineErrorBanner>
            </S.StyledDialogBody>
          )}
          {!isCountLoading && !isCountError && futureCitasCount !== null && (
            <S.StyledDialogBody>
              <S.StyledDialogIconZone $state={hasWarning ? 'warning' : 'safe'}>
                <IcoWarning />
              </S.StyledDialogIconZone>
              {hasWarning ? (
                <S.StyledDialogBodyText>
                  {t('deactivate.confirmWarning', { name: clienteName })}{' '}
                  <S.StyledCountBold>
                    {t('deactivate.citasWarning', { count: futureCitasCount })}
                  </S.StyledCountBold>
                </S.StyledDialogBodyText>
              ) : (
                <S.StyledDialogBodyText>
                  {t('deactivate.confirmSafe', { name: clienteName })}
                </S.StyledDialogBodyText>
              )}
              {isError && error !== null && (
                <S.StyledInlineErrorBanner role="alert" aria-live="assertive">
                  {error.message}
                </S.StyledInlineErrorBanner>
              )}
            </S.StyledDialogBody>
          )}
        </S.StyledDialogLiveRegion>
      </Modal.Body>
      <Modal.Footer align="right">
        <Button
          variant="ghost"
          color="neutral"
          type="button"
          disabled={isPending}
          onClick={handleClose}
        >
          {t('modal.cancel')}
        </Button>
        {!isCountLoading && !isCountError && futureCitasCount !== null && (
          <Button
            variant="solid"
            color="error"
            type="button"
            loading={isPending}
            disabled={isPending}
            onClick={() => {
              void handleConfirm()
                .then(() => {
                  toastWarning(t('toast.deleted'));
                  onSuccess();
                  handleClose();
                })
                .catch(() => {
                  // error surfaced via isError banner in the body
                });
            }}
            aria-label={t(hasWarning ? 'deactivate.confirmBtnWarning' : 'deactivate.confirmBtn')}
          >
            {t(hasWarning ? 'deactivate.confirmBtnWarning' : 'deactivate.confirmBtn')}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

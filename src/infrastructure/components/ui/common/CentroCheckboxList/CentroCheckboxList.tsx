import { useId } from 'react';
import type { ICentro } from '@domain/models';
import type { TCentroId } from '@domain/types';
import { Checkbox } from '@infra/components/ui/common/Checkbox';
import { Radio } from '@infra/components/ui/common/Radio';
import * as S from './CentroCheckboxList.styles';

export interface ICentroCheckboxListProps {
  readonly centros: readonly ICentro[];
  readonly selected: readonly TCentroId[];
  readonly onChange: (ids: readonly TCentroId[]) => void;
  readonly isLoading?: boolean;
  readonly label: string;
  /**
   * Currently-selected principal centro. When provided together with
   * `onPrincipalChange`, each SELECTED centro shows a "Principal" radio.
   * Omit both to keep the plain checkbox-only behavior (existing call sites).
   */
  readonly principalId?: TCentroId | null;
  readonly onPrincipalChange?: (id: TCentroId) => void;
  /** Label for the "Principal" radio shown per selected centro. */
  readonly principalLabel?: string;
  /** Help text describing the single-principal selection. */
  readonly principalHelp?: string;
  /** i18n-built aria-label for each principal radio. Receives the centro name. */
  readonly principalRadioAriaLabel?: (centroName: string) => string;
}

export const CentroCheckboxList = ({
  centros,
  selected,
  onChange,
  isLoading = false,
  label,
  principalId,
  onPrincipalChange,
  principalLabel,
  principalHelp,
  principalRadioAriaLabel,
}: ICentroCheckboxListProps) => {
  const radioGroupName = useId();
  const helpId = useId();
  const showPrincipal = onPrincipalChange !== undefined;

  const handleToggle = (centroId: TCentroId, checked: boolean) => {
    if (checked) {
      onChange([...selected, centroId]);
    } else {
      onChange(selected.filter((id) => id !== centroId));
    }
  };

  return (
    <S.StyledCentroCheckboxList>
      <S.StyledListLabel>{label}</S.StyledListLabel>
      {showPrincipal && principalHelp !== undefined && (
        <S.StyledHelpText id={helpId}>{principalHelp}</S.StyledHelpText>
      )}
      <S.StyledScrollBox
        aria-label={label}
        role={showPrincipal ? undefined : 'group'}
        {...(showPrincipal
          ? {
              'aria-describedby': principalHelp !== undefined ? helpId : undefined,
            }
          : {})}
      >
        {isLoading ? (
          <S.StyledGrid aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <S.StyledSkeletonRow key={i} aria-hidden="true" />
            ))}
          </S.StyledGrid>
        ) : centros.length === 0 ? (
          <S.StyledEmptyText>No hay centros disponibles</S.StyledEmptyText>
        ) : showPrincipal ? (
          // No wrapping role="radiogroup": a radiogroup may only contain radios,
          // but each row pairs a Checkbox (membership) with a Radio (principal).
          // The principal radios share `name`, forming a native radio group, and
          // each carries its own aria-label — valid per WCAG 4.1.2 without the
          // invalid nesting.
          <S.StyledGrid>
            {centros.map((centro) => {
              const isChecked = selected.includes(centro.id);
              return (
                <S.StyledCentroRow key={centro.id}>
                  <Checkbox
                    label={centro.nombre}
                    checked={isChecked}
                    onChange={(checked) => {
                      handleToggle(centro.id, checked);
                    }}
                  />
                  <S.StyledPrincipalSlot $disabled={!isChecked}>
                    <Radio
                      name={radioGroupName}
                      value={String(centro.id)}
                      label={principalLabel}
                      checked={isChecked && principalId === centro.id}
                      disabled={!isChecked}
                      size="sm"
                      onChange={() => {
                        onPrincipalChange(centro.id);
                      }}
                      ariaLabel={
                        principalRadioAriaLabel !== undefined
                          ? principalRadioAriaLabel(centro.nombre)
                          : undefined
                      }
                    />
                  </S.StyledPrincipalSlot>
                </S.StyledCentroRow>
              );
            })}
          </S.StyledGrid>
        ) : (
          <S.StyledGrid>
            {centros.map((centro) => (
              <Checkbox
                key={centro.id}
                label={centro.nombre}
                checked={selected.includes(centro.id)}
                onChange={(checked) => {
                  handleToggle(centro.id, checked);
                }}
              />
            ))}
          </S.StyledGrid>
        )}
      </S.StyledScrollBox>
    </S.StyledCentroCheckboxList>
  );
};

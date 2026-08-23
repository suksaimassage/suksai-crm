import * as S from './TerapeutaCard.styles';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ITerapeutaAddCardProps {
  readonly onAddClick: () => void;
  readonly label: string;
  readonly description?: string;
}

// ── Plus icon (inline SVG — no external dependency) ──────────────────────────

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export const TerapeutaAddCard = ({ onAddClick, label, description }: ITerapeutaAddCardProps) => (
  <li>
    <S.StyledAddCard type="button" onClick={onAddClick} aria-label={label}>
      <S.StyledAddIcon>
        <PlusIcon />
      </S.StyledAddIcon>
      <S.StyledAddLabel>{label}</S.StyledAddLabel>
      {description !== undefined && <S.StyledAddDescription>{description}</S.StyledAddDescription>}
    </S.StyledAddCard>
  </li>
);

TerapeutaAddCard.displayName = 'TerapeutaAddCard';

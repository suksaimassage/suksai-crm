import { useTranslation } from 'react-i18next';
import { IcoSearch } from './centros.icons';
import { TABS, TAB_I18N_KEY } from './centros.types';
import type { TTab } from './centros.types';
import {
  StyledToolbar,
  StyledToolbarLeft,
  StyledToolbarRight,
  StyledPillTabStrip,
  StyledPillTab,
  StyledTabCountBadge,
  StyledToolbarSearchWrapper,
  StyledToolbarSearchInput,
} from './CentrosToolbar.styles';

interface ICentrosToolbarProps {
  readonly activeTab: TTab;
  readonly tabCounts: Readonly<Record<TTab, number>>;
  readonly isLoading: boolean;
  readonly searchQuery: string;
  readonly onTabChange: (tab: TTab) => void;
  readonly onSearchChange: (query: string) => void;
}

export const CentrosToolbar = ({
  activeTab,
  tabCounts,
  isLoading,
  searchQuery,
  onTabChange,
  onSearchChange,
}: ICentrosToolbarProps) => {
  const { t } = useTranslation(['dashboard']);

  return (
    <StyledToolbar>
      <StyledToolbarLeft>
        <StyledPillTabStrip role="group" aria-label={t('dashboard:centros.tabs.ariaLabel')}>
          {TABS.map((tab) => (
            <StyledPillTab
              key={tab}
              type="button"
              $active={activeTab === tab}
              onClick={() => {
                onTabChange(tab);
              }}
              aria-pressed={activeTab === tab}
            >
              {t(`dashboard:centros.tabs.${TAB_I18N_KEY[tab]}`)}
              <StyledTabCountBadge>{isLoading ? '–' : tabCounts[tab]}</StyledTabCountBadge>
            </StyledPillTab>
          ))}
        </StyledPillTabStrip>
      </StyledToolbarLeft>

      <StyledToolbarRight>
        <StyledToolbarSearchWrapper>
          <IcoSearch />
          <StyledToolbarSearchInput
            type="search"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
            }}
            placeholder={t('dashboard:centros.list.searchPlaceholder')}
            aria-label={t('dashboard:centros.list.searchPlaceholder')}
          />
        </StyledToolbarSearchWrapper>
      </StyledToolbarRight>
    </StyledToolbar>
  );
};

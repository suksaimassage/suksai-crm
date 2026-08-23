import { useTranslation } from 'react-i18next';
import { StyledSrOnly } from '../RitualesPage.styles';
import {
  StyledToolbar,
  StyledToolbarLeft,
  StyledTabStrip,
  StyledTab,
  StyledTabCount,
  StyledSearchWrapper,
  StyledSearchInput,
  StyledSearchIcon,
} from './RitualesToolbar.styles';
import { TABS } from './rituales.utils';
import type { TActiveTab } from './rituales.utils';

// ── Props ──────────────────────────────────────────────────────────────────────

export interface IRitualesToolbarProps {
  readonly activeTab: TActiveTab;
  readonly onTabChange: (tab: TActiveTab) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  /** Count for "activos" tab badge */
  readonly activosCount: number;
  /** Count for "todos" tab badge */
  readonly todosCount: number;
  /** Number of currently visible results (used for live-region announcement) */
  readonly filteredCount: number;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const RitualesToolbar = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  activosCount,
  todosCount,
  filteredCount,
}: IRitualesToolbarProps) => {
  const { t } = useTranslation(['rituales']);

  return (
    <StyledToolbar>
      <StyledToolbarLeft>
        <StyledTabStrip role="tablist" aria-label={t('rituales:tabs.ariaLabel')}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = tab === 'activos' ? activosCount : tab === 'todos' ? todosCount : 0;

            return (
              <StyledTab
                key={tab}
                role="tab"
                aria-selected={isActive}
                aria-controls="rituales-grid"
                $active={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  onTabChange(tab);
                }}
                onKeyDown={(e) => {
                  if (
                    e.key !== 'ArrowLeft' &&
                    e.key !== 'ArrowRight' &&
                    e.key !== 'Home' &&
                    e.key !== 'End'
                  )
                    return;
                  e.preventDefault();
                  const siblings = Array.from(
                    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                      '[role="tab"]',
                    ) ?? [],
                  );
                  const idx = siblings.indexOf(e.currentTarget);
                  const next =
                    e.key === 'ArrowRight'
                      ? (idx + 1) % siblings.length
                      : e.key === 'ArrowLeft'
                        ? (idx - 1 + siblings.length) % siblings.length
                        : e.key === 'Home'
                          ? 0
                          : siblings.length - 1; // 'End'
                  siblings[next]?.focus();
                  onTabChange(TABS[next]);
                }}
              >
                {t(`rituales:tabs.${tab}`)}
                {(tab === 'activos' || tab === 'todos') && (
                  <StyledTabCount aria-hidden="true">{count}</StyledTabCount>
                )}
              </StyledTab>
            );
          })}
        </StyledTabStrip>

        {/* Search */}
        <StyledSearchWrapper>
          <StyledSrOnly as="label" htmlFor="rituales-search">
            {t('rituales:search.ariaLabel')}
          </StyledSrOnly>
          <StyledSearchIcon className="ph-light ph-magnifying-glass" aria-hidden="true" />
          <StyledSearchInput
            id="rituales-search"
            type="search"
            placeholder={t('rituales:search.placeholder')}
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
            }}
            aria-label={t('rituales:search.ariaLabel')}
            aria-describedby="rituales-search-status"
          />
        </StyledSearchWrapper>

        {/* Visually-hidden live region for search results */}
        <StyledSrOnly id="rituales-search-status" aria-live="polite">
          {searchQuery.trim() !== ''
            ? t('rituales:search.resultsAnnouncement', { count: filteredCount })
            : ''}
        </StyledSrOnly>
      </StyledToolbarLeft>
    </StyledToolbar>
  );
};

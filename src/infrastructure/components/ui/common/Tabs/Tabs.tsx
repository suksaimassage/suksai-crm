/**
 * Tabs — Navegación por pestañas
 *
 * SOLID:
 * - SRP: Tabs (lógica de estado + render), TabPanel (contenido).
 * - OCP: nuevas variantes via prop, sin tocar el core.
 * - DIP: TabsProps como contrato público.
 *
 * @example
 * <Tabs
 *   variant="line"
 *   tabs={[
 *     { key: "a", label: "Perfil", icon: <UserIcon />, content: <Profile /> },
 *     { key: "b", label: "Seguridad", content: <Security /> },
 *   ]}
 * />
 */

import React, { useState, useCallback } from 'react';
import { Typography } from '@infra/components/ui/core/Typography';
import * as S from './Tabs.styles';
import type { TabsProps, TabsVariant } from './Tabs.types';

// Determina si el panel debe usar padding interno (variantes con borde)
const INSET_VARIANTS: TabsVariant[] = ['card', 'enclosed'];

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeKey: activeKeyProp,
  defaultKey,
  onChange,
  variant = 'line',
  size = 'md',
  align = 'start',
  destroyOnHide = false,
  className,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: tabs[0] may be undefined when the tabs array is empty (noUncheckedIndexedAccess is not enabled)
  const [internalKey, setInternalKey] = useState<string>(defaultKey ?? tabs[0]?.key ?? '');

  const activeKey = activeKeyProp ?? internalKey;

  const handleSelect = useCallback(
    (key: string) => {
      if (activeKeyProp === undefined) setInternalKey(key);
      onChange?.(key);
    },
    [activeKeyProp, onChange],
  );

  const Panel = INSET_VARIANTS.includes(variant) ? S.TabPanelInset : S.TabPanel;

  return (
    <S.TabsRoot className={className}>
      <S.TabList role="tablist" $variant={variant} $align={align}>
        {tabs.map((tab) => (
          <S.TabTrigger
            key={tab.key}
            role="tab"
            id={`tab-${tab.key}`}
            aria-controls={`panel-${tab.key}`}
            aria-selected={activeKey === tab.key}
            $variant={variant}
            $active={activeKey === tab.key}
            $size={size}
            $stretch={align === 'stretch'}
            $disabled={tab.disabled ?? false}
            disabled={tab.disabled}
            onClick={() => {
              if (!tab.disabled) handleSelect(tab.key);
            }}
            type="button"
          >
            {tab.icon && <S.TabIcon>{tab.icon}</S.TabIcon>}
            <Typography variant="caption1">{tab.label}</Typography>
            {tab.badge !== undefined && <S.TabBadge>{tab.badge}</S.TabBadge>}
          </S.TabTrigger>
        ))}
      </S.TabList>

      <S.TabPanels $variant={variant}>
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;
          if (destroyOnHide && !isActive) return null;
          return (
            <Panel
              key={tab.key}
              role="tabpanel"
              id={`panel-${tab.key}`}
              aria-labelledby={`tab-${tab.key}`}
              $active={isActive}
            >
              {/* Render panel content directly — it is arbitrary block content
                  (layouts, grids). Wrapping it in <Typography> (a <p>) produced
                  invalid block-in-<p> nesting + a React 19 hydration error. */}
              {tab.content}
            </Panel>
          );
        })}
      </S.TabPanels>
    </S.TabsRoot>
  );
};

Tabs.displayName = 'Tabs';

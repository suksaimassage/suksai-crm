import type { ReactNode } from 'react';

export type TabsVariant = 'line' | 'pill' | 'card' | 'enclosed';
export type TabsSize = 'sm' | 'md' | 'lg';
export type TabsAlign = 'start' | 'center' | 'end' | 'stretch';

export interface TabItem {
  readonly key: string;
  readonly label: string;
  readonly icon?: ReactNode;
  /** Badge numérico o string */
  readonly badge?: string | number;
  readonly disabled?: boolean;
  readonly content: ReactNode;
}

export interface TabsProps {
  readonly tabs: TabItem[];
  /** Tab activa controlada */
  readonly activeKey?: string;
  readonly defaultKey?: string;
  readonly onChange?: (key: string) => void;
  readonly variant?: TabsVariant;
  readonly size?: TabsSize;
  readonly align?: TabsAlign;
  /** Desmonta el contenido de tabs inactivas */
  readonly destroyOnHide?: boolean;
  readonly className?: string;
}

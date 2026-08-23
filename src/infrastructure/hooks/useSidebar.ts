/**
 * useSidebar — Hook de estado del Sidebar
 *
 * Responsabilidad única: gestionar el estado interno del Sidebar.
 *
 * Principios:
 * - SRP: solo estado, cero lógica visual.
 * - Controlled/Uncontrolled: si se pasan props externas, el hook las respeta.
 * - Persistencia: estado collapsed se guarda en localStorage.
 *
 * Controlled vs Uncontrolled:
 * - Si `collapsedProp` es undefined → uncontrolled (estado interno + localStorage)
 * - Si `collapsedProp` tiene valor → controlled (el padre gestiona el estado)
 * Lo mismo aplica para `mobileOpenProp`.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { IUseSidebarState } from '@infra/components/ui/common/Sidebar/Sidebar.types';

const STORAGE_KEY = 'rdsfs-sidebar-collapsed';
const MOBILE_BREAKPOINT = 768;

interface UseSidebarOptions {
  readonly collapsedProp?: boolean;
  readonly mobileOpenProp?: boolean;
  readonly onCollapseChange?: (collapsed: boolean) => void;
  readonly onMobileClose?: () => void;
}

export const useSidebar = ({
  collapsedProp,
  mobileOpenProp,
  onCollapseChange,
  onMobileClose,
}: UseSidebarOptions = {}): IUseSidebarState => {
  // ── Estado interno ──────────────────────────────────────────────────────

  const [collapsedInternal, setCollapsedInternal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const [mobileOpenInternal, setMobileOpenInternal] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(new Set());

  // ── Estado resuelto (controlled vs uncontrolled) ────────────────────────

  const collapsed = collapsedProp ?? collapsedInternal;
  const mobileOpen = mobileOpenProp ?? mobileOpenInternal;

  // ── Ref estable para callbacks (evita stale closures en listeners) ──────
  // Se actualiza en cada render pero no recrea los listeners.

  const callbacksRef = useRef({ onMobileClose, onCollapseChange });
  useEffect(() => {
    callbacksRef.current = {
      onMobileClose,
      onCollapseChange,
    };
  }, [onMobileClose, onCollapseChange]);

  // ── Persistir preferencia de colapso ───────────────────────────────────

  useEffect(() => {
    if (collapsedProp === undefined) {
      localStorage.setItem(STORAGE_KEY, String(collapsedInternal));
    }
  }, [collapsedInternal, collapsedProp]);

  // ── Body scroll lock en mobile drawer abierto ──────────────────────────

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // ── Cerrar drawer al pasar a desktop ───────────────────────────────────

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setMobileOpenInternal(false);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ── Cerrar drawer con Escape ────────────────────────────────────────────
  // Usa el ref para acceder siempre al callback más reciente sin necesitar
  // re-registrar el listener cuando `mobileOpen` cambia.

  const mobileOpenRef = useRef(mobileOpen);

  useEffect(() => {
    mobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpenRef.current) {
        setMobileOpenInternal(false);
        callbacksRef.current.onMobileClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // listener estable — usa refs internamente

  // ── Handlers ────────────────────────────────────────────────────────────

  const toggleCollapsed = useCallback(() => {
    // Usa setter funcional para leer el valor actual sin capturarlo en el closure.
    // Así `onCollapseChange` siempre recibe el valor correcto aunque la prop
    // controlada y el estado interno diverjan.
    setCollapsedInternal((prev) => {
      const next = collapsedProp !== undefined ? !collapsedProp : !prev;
      callbacksRef.current.onCollapseChange?.(next);
      return next;
    });
  }, [collapsedProp]);

  const toggleMobile = useCallback(() => {
    setMobileOpenInternal((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpenInternal(false);
    callbacksRef.current.onMobileClose?.();
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const openGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      if (prev.has(groupId)) return prev;
      const next = new Set(prev);
      next.add(groupId);
      return next;
    });
  }, []);

  const isGroupExpanded = useCallback(
    (groupId: string) => expandedGroups.has(groupId),
    [expandedGroups],
  );

  return {
    collapsed,
    mobileOpen,
    expandedGroups,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
    toggleGroup,
    openGroup,
    isGroupExpanded,
  };
};

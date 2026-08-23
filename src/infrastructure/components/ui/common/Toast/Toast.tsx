import React, {
  useRef,
  useState,
  useEffect,
  useContext,
  createContext,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type {
  IToastProps,
  IToastContextValue,
  IToastProviderProps,
  TToastPosition,
  TToastShortcutOptions,
  TToastType,
} from './Toast.types';
import * as S from './Toast.styles';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IcoSuccess = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M6.5 10l2.5 2.5 4.5-4.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoError = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M7.5 7.5l5 5M12.5 7.5l-5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const IcoWarning = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 2.5L1.5 17h17L10 2.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M10 8v4M10 13.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IcoInfo = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 9v5M10 6.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IcoBell = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 2a6 6 0 0 1 6 6v3.5l1.5 2.5H2.5L4 11.5V8a6 6 0 0 1 6-6z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M8.5 16.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const IcoClose = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const TYPE_ICON: Record<TToastType, ReactNode> = {
  success: <IcoSuccess />,
  error: <IcoError />,
  warning: <IcoWarning />,
  info: <IcoInfo />,
  default: <IcoBell />,
};

// ─── ToastItemView ────────────────────────────────────────────────────────────

export const ToastItemView: React.FC<{
  toast: IToastProps;
  position: TToastPosition;
  onDismiss: (id: string) => void;
}> = ({ toast, position, onDismiss }) => {
  const { t } = useTranslation('common');
  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const duration = toast.duration ?? 4000;
  const autoClose = duration > 0;

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 240);
  };

  useEffect(() => {
    if (!autoClose || paused) return;
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        onDismiss(toast.id);
      }, 240);
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoClose, duration, toast.id, onDismiss, paused]);

  return (
    <S.ToastItem
      $type={toast.type}
      $position={position}
      $exiting={exiting}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
    >
      <S.ToastIcon $type={toast.type}>{toast.icon ?? TYPE_ICON[toast.type]}</S.ToastIcon>

      <S.ToastContent>
        <S.ToastTitle>{toast.title}</S.ToastTitle>
        {toast.description && <S.ToastDescription>{toast.description}</S.ToastDescription>}
        {toast.action && (
          <S.ToastAction
            onClick={() => {
              toast.action?.onClick();
              dismiss();
            }}
            type="button"
          >
            {toast.action.label}
          </S.ToastAction>
        )}
      </S.ToastContent>

      <S.CloseBtn onClick={dismiss} aria-label={t('toast.closeAriaLabel')} type="button">
        <IcoClose />
      </S.CloseBtn>

      {autoClose && <S.ProgressBar $type={toast.type} $duration={duration} $paused={paused} />}
    </S.ToastItem>
  );
};

/**
 * SRP: agrupa toasts por posición y monta un portal independiente por grupo.
 * Así cada esquina/zona de la pantalla es completamente independiente.
 */
export const ToastRenderer: React.FC<{
  toasts: IToastProps[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  // Agrupa por posición — solo crea containers para posiciones con toasts activos
  const groups = new Map<TToastPosition, IToastProps[]>();
  for (const t of toasts) {
    // position is guaranteed set — the consumer or provider assigns a default
    const pos = t.position ?? 'top-right';
    if (!groups.has(pos)) groups.set(pos, []);
    const group = groups.get(pos);
    if (group) group.push(t);
  }

  if (groups.size === 0) return null;

  return createPortal(
    <>
      {[...groups.entries()].map(([position, group]) => (
        <S.ToastContainer
          key={position}
          $position={position}
          aria-label={`Notificaciones ${position}`}
        >
          {group.map((t) => (
            <ToastItemView key={t.id} toast={t} position={position} onDismiss={onDismiss} />
          ))}
        </S.ToastContainer>
      ))}
    </>,
    document.body,
  );
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<IToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider = ({
  children,
  defaultPosition = 'bottom-right',
  maxToasts = 5,
}: IToastProviderProps) => {
  const [toasts, setToasts] = useState<IToastProps[]>([]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
  };

  const toast = (options: Omit<IToastProps, 'id'>): string => {
    const id = crypto.randomUUID();
    const item: IToastProps = {
      ...options,
      id,
      position: options.position ?? defaultPosition,
    };
    setToasts((prev) => {
      const next = [...prev, item];
      return next.length > maxToasts ? next.slice(next.length - maxToasts) : next;
    });
    return id;
  };

  const makeShortcut =
    (type: TToastType) =>
    (title: string, options?: TToastShortcutOptions): string =>
      toast({ type, title, ...options });

  const value: IToastContextValue = {
    toast,
    success: makeShortcut('success'),
    error: makeShortcut('error'),
    warning: makeShortcut('warning'),
    info: makeShortcut('info'),
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRenderer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): IToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

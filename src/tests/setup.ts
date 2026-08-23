import '@testing-library/jest-dom';

// ── localStorage mock ──────────────────────────────────────────────────────
// jsdom's localStorage may be unavailable or non-functional depending on the
// environment (e.g. when --localstorage-file is passed without a valid path).
// Replace it with a reliable in-memory implementation so Zustand's persist
// middleware can call setItem/getItem/removeItem without throwing.
const localStorageStore: Record<string, string> = {};
const localStorageMock: Storage = {
  length: 0,
  key: (_index: number) => null,
  getItem: (k: string) => localStorageStore[k] ?? null,
  setItem: (k: string, v: string) => {
    localStorageStore[k] = v;
  },
  removeItem: (k: string) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- localStorage.removeItem requires dynamic key deletion by definition
    delete localStorageStore[k];
  },
  clear: () => {
    Object.keys(localStorageStore).forEach((k) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- localStorage.clear requires dynamic key deletion by definition
      delete localStorageStore[k];
    });
  },
};
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
});

// ── ResizeObserver mock ────────────────────────────────────────────────────
// jsdom does not implement ResizeObserver.
// useResponsiveGrid uses it to detect container-level breakpoints. Without
// this polyfill the component throws at effect time in any jsdom test that
// mounts CalendarVolume (or DashboardOverviewPage which embeds it).
if (typeof window.ResizeObserver === 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
  });
}

// ── matchMedia mock ────────────────────────────────────────────────────────
// jsdom does not implement window.matchMedia.
// The theme store calls it at module initialisation time (inside create()),
// so this mock must be in place before any test module is imported.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

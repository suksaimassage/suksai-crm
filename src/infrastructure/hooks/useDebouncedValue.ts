/**
 * useDebouncedValue — debounces a state value.
 *
 * Returns the value unchanged after `delay` ms of no changes.
 * Distinct from Form.utils.useDebounce (which debounces a callback).
 *
 * @example
 * const debouncedSearch = useDebouncedValue(searchQuery, 200);
 * // use debouncedSearch in React Query key — re-fetches only after user stops typing
 */

import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

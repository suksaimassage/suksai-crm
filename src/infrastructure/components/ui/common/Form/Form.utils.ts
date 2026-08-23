import { useCallback, useEffect, useRef, useState } from 'react';
import type { ValidateFn } from './Form.types';
import type { ISearchResult } from './Form.item.types';

// Fuera del componente o en un archivo de utilidades
export const noop = () => {
  /* do nothing */
};

export function useDebounce(fn: (v: string) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  // 1. Actualizamos la referencia de la función de forma segura
  // fuera de la fase de cálculo de renderizado de React.
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  // 2. Limpieza de seguridad: evitamos ejecutar la función si
  // el componente se desmonta antes de que acabe el tiempo.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return useCallback(
    (value: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fnRef.current(value);
      }, delay);
    },
    [delay],
  );
}

export function useValidation(validateFn?: ValidateFn, externalError?: string) {
  const [internalError, setInternalError] = useState('');

  const validate = useCallback(
    (value: string) => {
      if (!validateFn) return;
      setInternalError(validateFn(value) ?? '');
    },
    [validateFn],
  );

  const error = externalError ?? internalError;
  const hasError = Boolean(error);

  return { error, hasError, validate };
}

/** Simula una petición asíncrona con delay variable */
function mockSearch(
  query: string,
  dataset: ISearchResult[],
  delayMs = 600,
): Promise<ISearchResult[]> {
  return new Promise((resolve) =>
    setTimeout(() => {
      if (!query.trim()) {
        resolve([]);
        return;
      }
      const q = query.toLowerCase();
      resolve(
        dataset.filter(
          (r) =>
            r.label.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q),
        ),
      );
    }, delayMs),
  );
}

// ─── useSearchState ─────────────────────────────────────────────────────────
// Encapsula resultados + loading para un campo de búsqueda.
export function useSearchState(dataset: ISearchResult[], delayMs = 600) {
  const [results, setResults] = useState<ISearchResult[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<ISearchResult | null>(null);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults(undefined);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setResults(undefined);
      const found = await mockSearch(query, dataset, delayMs);
      setIsLoading(false);
      setResults(found);
    },
    [dataset, delayMs],
  );

  const handleSelect = useCallback((result: ISearchResult) => {
    setSelected(result);
  }, []);

  return { results, isLoading, selected, handleSearch, handleSelect };
}

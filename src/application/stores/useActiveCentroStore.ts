import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TCentroId } from '@domain/types';

interface IActiveCentroState {
  readonly centroId: TCentroId | null;
  readonly setCentroId: (centroId: TCentroId) => void;
  readonly clearCentroId: () => void;
}

export const useActiveCentroStore = create<IActiveCentroState>()(
  persist(
    (set) => ({
      centroId: null,
      setCentroId: (centroId) => set({ centroId }),
      clearCentroId: () => set({ centroId: null }),
    }),
    { name: 'stm-active-centro' },
  ),
);

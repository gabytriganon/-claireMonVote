import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface AppState {
  /** Candidats sélectionnés pour le comparateur (2 au maximum). */
  compare: string[]
  toggleCompare: (id: string) => void
  clearCompare: () => void
  theme: ThemeMode | null
  setTheme: (theme: ThemeMode) => void
  simpleReading: boolean
  toggleSimpleReading: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      compare: [],
      toggleCompare: (id) =>
        set(({ compare }) => {
          if (compare.includes(id)) return { compare: compare.filter((c) => c !== id) }
          // Au-delà de 2, le plus ancien choix est remplacé.
          return { compare: [...compare, id].slice(-2) }
        }),
      clearCompare: () => set({ compare: [] }),
      theme: null,
      setTheme: (theme) => set({ theme }),
      simpleReading: false,
      toggleSimpleReading: () => set(({ simpleReading }) => ({ simpleReading: !simpleReading })),
    }),
    {
      name: 'eclairemonvote-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

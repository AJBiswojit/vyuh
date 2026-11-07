import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * UI preferences that are not the theme (ThemeProvider owns that) and not
 * server data (TanStack Query owns that). Exam answers will get their own store
 * when the runner lands.
 *
 * @typedef {'comfortable'|'compact'} Density
 *
 * @typedef {Object} UiState
 * @property {Density} density
 * @property {boolean} railCollapsed
 * @property {boolean} mobileNavOpen
 * @property {(density: Density) => void} setDensity
 * @property {() => void} toggleRail
 * @property {(open: boolean) => void} setMobileNavOpen
 */

/** @type {import('zustand').UseBoundStore<import('zustand').StoreApi<UiState>>} */
export const useUiStore = create(
  persist(
    (set, get) => ({
      density: 'comfortable',
      railCollapsed: false,
      mobileNavOpen: false,

      setDensity: (density) => set({ density }),
      toggleRail: () => set({ railCollapsed: !get().railCollapsed }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
    }),
    {
      name: 'vyuh.ui',
      version: 2,
      partialize: (state) => ({ density: state.density, railCollapsed: state.railCollapsed }),
    },
  ),
)

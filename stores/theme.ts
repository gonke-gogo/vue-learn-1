import { defineStore } from 'pinia'
import { computed, ref, readonly, watch } from 'vue'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light' as 'light' | 'dark',
  }),
  getters: {
    isDark: (s) => s.theme === 'dark',
  },
  actions: {
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
    },
    setTheme(t: 'light' | 'dark') {
      this.theme = t
    },
  },
  persist: { key: 'theme-store', pick: ['theme'] },
})

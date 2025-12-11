import { defineStore } from 'pinia'
import { computed, ref, readonly, watch } from 'vue'

export const useThemeStore = defineStore(
  'theme',
  () => {
    // 初期値はlocalStorageから復元、なければ'light'
    const getInitialTheme = (): 'light' | 'dark' => {
      if (typeof window === 'undefined') return 'light'
      // persistプラグインが使用するキーから読み込む
      const saved = localStorage.getItem('theme-store')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return parsed.theme === 'dark' ? 'dark' : 'light'
        } catch {
          // JSONパースに失敗した場合は、直接'theme'キーを確認
          const directTheme = localStorage.getItem('theme')
          return directTheme === 'dark' || directTheme === 'light' ? directTheme : 'light'
        }
      }
      // フォールバック: 直接'theme'キーを確認
      const directTheme = localStorage.getItem('theme')
      return directTheme === 'dark' || directTheme === 'light' ? directTheme : 'light'
    }

    const theme = ref<'light' | 'dark'>(getInitialTheme())

    // HTML要素にdata-theme属性を設定
    const applyTheme = (newTheme: 'light' | 'dark') => {
      if (typeof window === 'undefined') return

      const html = document.documentElement
      html.setAttribute('data-theme', newTheme)
    }

    // テーマが変更されたときにHTMLに適用
    watch(
      theme,
      (newTheme) => {
        applyTheme(newTheme)
      },
      { immediate: true }
    )

    function toggleTheme() {
      const newTheme = theme.value === 'dark' ? 'light' : 'dark'
      theme.value = newTheme
      // 確実に適用するため、直接applyThemeを呼び出す
      applyTheme(newTheme)
    }

    function setTheme(newTheme: 'light' | 'dark') {
      theme.value = newTheme
      // 確実に適用するため、直接applyThemeを呼び出す
      applyTheme(newTheme)
    }

    const isDark = computed(() => theme.value === 'dark')

    return {
      theme: readonly(theme),
      isDark,
      toggleTheme,
      setTheme,
    }
  },
  {
    // テーマはlocalStorageに保存する（UI状態なので永続化OK）
    persist: {
      key: 'theme-store',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      pick: ['theme'],
    },
  }
)

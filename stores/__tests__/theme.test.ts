import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '../theme'

describe('useThemeStore', () => {
  beforeEach(() => {
    // Piniaインスタンスを作成してアクティブにする
    setActivePinia(createPinia())

    // localStorageをクリア
    localStorage.clear()

    // document.documentElementをリセット
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme')
    }
  })

  afterEach(() => {
    // テスト後にlocalStorageをクリア
    localStorage.clear()
  })

  describe('初期化', () => {
    it('デフォルトでlightテーマが設定される', () => {
      const store = useThemeStore()
      expect(store.theme).toBe('light')
      expect(store.isDark).toBe(false)
    })

    it('localStorageからdarkテーマを復元できる', () => {
      // localStorageにdarkテーマを設定
      localStorage.setItem('theme-store', JSON.stringify({ theme: 'dark' }))

      const store = useThemeStore()
      expect(store.theme).toBe('dark')
      expect(store.isDark).toBe(true)
    })

    it('localStorageからlightテーマを復元できる', () => {
      // localStorageにlightテーマを設定
      localStorage.setItem('theme-store', JSON.stringify({ theme: 'light' }))

      const store = useThemeStore()
      expect(store.theme).toBe('light')
      expect(store.isDark).toBe(false)
    })

    it('フォールバック: 直接themeキーから復元できる', () => {
      // theme-storeキーがない場合、themeキーを確認
      localStorage.setItem('theme', 'dark')

      const store = useThemeStore()
      expect(store.theme).toBe('dark')
      expect(store.isDark).toBe(true)
    })
  })

  describe('toggleTheme', () => {
    it('lightからdarkに切り替えられる', () => {
      const store = useThemeStore()
      expect(store.theme).toBe('light')

      store.toggleTheme()

      expect(store.theme).toBe('dark')
      expect(store.isDark).toBe(true)
    })

    it('darkからlightに切り替えられる', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      expect(store.theme).toBe('dark')

      store.toggleTheme()

      expect(store.theme).toBe('light')
      expect(store.isDark).toBe(false)
    })

    it('HTMLのdata-theme属性が更新される', () => {
      const store = useThemeStore()
      const setAttributeSpy = vi.spyOn(document.documentElement, 'setAttribute')

      store.toggleTheme()

      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark')
      setAttributeSpy.mockRestore()
    })
  })

  describe('setTheme', () => {
    it('darkテーマを設定できる', () => {
      const store = useThemeStore()

      store.setTheme('dark')

      expect(store.theme).toBe('dark')
      expect(store.isDark).toBe(true)
    })

    it('lightテーマを設定できる', () => {
      const store = useThemeStore()
      store.setTheme('dark') // 一度darkに設定

      store.setTheme('light')

      expect(store.theme).toBe('light')
      expect(store.isDark).toBe(false)
    })

    it('HTMLのdata-theme属性が更新される', () => {
      const store = useThemeStore()
      const setAttributeSpy = vi.spyOn(document.documentElement, 'setAttribute')

      store.setTheme('dark')

      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark')
      setAttributeSpy.mockRestore()
    })
  })

  describe('isDark computed', () => {
    it('lightテーマの場合はfalseを返す', () => {
      const store = useThemeStore()
      expect(store.isDark).toBe(false)
    })

    it('darkテーマの場合はtrueを返す', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      expect(store.isDark).toBe(true)
    })

    it('テーマ変更時にリアクティブに更新される', () => {
      const store = useThemeStore()
      expect(store.isDark).toBe(false)

      store.toggleTheme()
      expect(store.isDark).toBe(true)

      store.toggleTheme()
      expect(store.isDark).toBe(false)
    })
  })

  describe('エッジケース', () => {
    it('無効なlocalStorage値は無視してlightを返す', () => {
      // 無効なJSONを設定
      localStorage.setItem('theme-store', 'invalid-json')

      const store = useThemeStore()
      expect(store.theme).toBe('light')
    })

    it('無効なテーマ値は無視してlightを返す', () => {
      // 無効なテーマ値を設定
      localStorage.setItem('theme', 'invalid-theme')

      const store = useThemeStore()
      expect(store.theme).toBe('light')
    })

    it('空のlocalStorage値はlightを返す', () => {
      // localStorageは空
      const store = useThemeStore()
      expect(store.theme).toBe('light')
    })
  })
})

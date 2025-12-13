<template>
  <div class="layout">
    <header class="header">
      <div class="container">
        <nav class="nav">
          <NuxtLink to="/" class="logo">やる気の名言</NuxtLink>
          <div class="navLinks">
            <NuxtLink to="/">今日の名言</NuxtLink>
            <NuxtLink to="/quotes">名言一覧</NuxtLink>
          </div>
          <button class="themeToggle" aria-label="テーマ切替" @click="toggleTheme">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
        </nav>
      </div>
    </header>
    <main class="main">
      <div class="container">
        <slot />
      </div>
    </main>
    <footer class="footer">
      <div class="container">
        <p>&copy; やる気の名言アプリ</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'

// テーマストアをrefで管理（SSR対応）
const themeStore = ref<ReturnType<typeof useThemeStore> | null>(null)

// クライアントサイドでテーマを初期化
onMounted(() => {
  if (typeof window === 'undefined') return

  try {
    // まずlocalStorageからテーマを読み込んでHTMLに適用（persistプラグインが復元する前に適用）
    try {
      const savedThemeStore = localStorage.getItem('theme-store')
      let savedTheme: string | null = null

      if (savedThemeStore) {
        try {
          const parsed = JSON.parse(savedThemeStore)
          savedTheme = parsed.theme
        } catch {
          // JSONパースに失敗した場合は無視
        }
      }

      if (!savedTheme) {
        savedTheme = localStorage.getItem('theme')
      }

      if (savedTheme === 'dark' || savedTheme === 'light') {
        const html = document.documentElement
        html.setAttribute('data-theme', savedTheme)
      }
    } catch (err) {
      // エラーは無視して続行
    }

    // ストアを初期化（クライアントサイドでのみ）
    themeStore.value = useThemeStore()

    // ストアのwatchで自動的に適用されるが、念のため初期化
    try {
      const html = document.documentElement
      if (themeStore.value) {
        html.setAttribute('data-theme', themeStore.value.theme)
      }
    } catch (err) {
      // エラーは無視して続行
    }
  } catch (err) {
    // エラーは無視して続行
  }
})

// テーマ切り替え関数
function toggleTheme() {
  if (themeStore.value) {
    themeStore.value.toggleTheme()
  } else {
    // フォールバック: 直接HTMLに適用
    if (typeof window !== 'undefined') {
      const html = document.documentElement
      const currentTheme = html.getAttribute('data-theme')
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
      html.setAttribute('data-theme', newTheme)
      // localStorageにも保存
      localStorage.setItem('theme', newTheme)
    }
  }
}

// テーマの状態（computed）
const isDark = computed(() => {
  // SSR時は常にfalseを返す（クライアントサイドで更新される）
  if (typeof window === 'undefined') {
    return false
  }

  // store.isDarkはcomputedなので、リアクティブに更新される
  if (themeStore.value) {
    return themeStore.value.isDark
  }

  // Piniaが初期化されていない場合は、HTMLのdata-theme属性を確認
  try {
    const html = document.documentElement
    return html.getAttribute('data-theme') === 'dark'
  } catch {
    return false
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

.header {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 0;
}

.nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--color-primary);
}

.navLinks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.navLinks a {
  color: var(--color-text);
  font-weight: 500;
  transition: color 0.2s ease;
  padding: 0.5rem 0;
}

.navLinks a:hover,
.navLinks a.router-link-active {
  color: var(--color-primary);
}

.themeToggle {
  font-size: 1.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
  align-self: flex-end;
  margin-top: -3rem;
}

.themeToggle:hover {
  background-color: var(--color-border);
}

.main {
  flex: 1;
  padding: 1.5rem 0;
}

.footer {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 1rem 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .nav {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0;
  }

  .logo {
    font-size: 1.5rem;
  }

  .navLinks {
    flex-direction: row;
    gap: 1.5rem;
    width: auto;
  }

  .navLinks a {
    padding: 0;
  }

  .themeToggle {
    align-self: auto;
    margin-top: 0;
  }

  .main {
    padding: 2rem 0;
  }

  .footer {
    padding: 1.5rem 0;
  }
}
</style>

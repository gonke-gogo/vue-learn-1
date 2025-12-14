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
            {{ isDark ? '🌙' : '☀️' }}
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
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const isDark = computed(() => themeStore.isDark)

function toggleTheme() {
  themeStore.toggleTheme()
}
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

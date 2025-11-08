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
          <button class="themeToggle" @click="toggleTheme" aria-label="テーマ切替">
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
        <p>&copy; 2024 やる気の名言アプリ</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark({
  selector: 'html',
  attribute: 'data-theme',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleTheme = useToggle(isDark)
</script>

<style scoped>
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
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary);
}

.navLinks {
  display: flex;
  gap: 1.5rem;
}

.navLinks a {
  color: var(--color-text);
  font-weight: 500;
  transition: color 0.2s ease;
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
}

.themeToggle:hover {
  background-color: var(--color-border);
}

.main {
  flex: 1;
  padding: 2rem 0;
}

.footer {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 1.5rem 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
</style>


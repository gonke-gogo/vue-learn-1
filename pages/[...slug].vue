<template>
  <div class="page">
    <div class="errorContainer">
      <h1 class="errorTitle">404</h1>
      <h2 class="errorSubtitle">ページが見つかりません</h2>
      <p class="errorMessage">
        お探しのページは存在しないか、移動または削除された可能性があります。
      </p>
      <div v-if="attemptedPath && attemptedPath !== '/'" class="attemptedPath">
        <p class="pathLabel">アクセスしようとしたパス:</p>
        <code class="pathValue">{{ attemptedPath }}</code>
      </div>
      <div class="actions">
        <NuxtLink to="/" class="button">ホームに戻る</NuxtLink>
        <NuxtLink to="/quotes" class="button buttonSecondary">名言一覧</NuxtLink>
        <NuxtLink to="/authors" class="button buttonSecondary">著者一覧</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

// catch all routeのパラメータを取得
// slugは配列として取得される（例: ['path', 'to', 'page']）
const slug = route.params.slug
const attemptedPath = computed(() => {
  if (Array.isArray(slug)) {
    return '/' + slug.join('/')
  }
  return slug ? `/${slug}` : '/'
})
</script>

<style scoped>
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.errorContainer {
  text-align: center;
  width: 100%;
}

.errorTitle {
  font-size: 6rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1rem;
  line-height: 1;
}

.errorSubtitle {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--color-text);
}

.errorMessage {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
  line-height: 1.8;
}

.attemptedPath {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.pathLabel {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.pathValue {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--color-text);
  background-color: var(--color-bg);
  padding: 0.5rem;
  border-radius: 0.25rem;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.button:hover {
  background-color: var(--color-primary-hover);
}

.buttonSecondary {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.buttonSecondary:hover {
  background-color: var(--color-border);
}

@media (max-width: 768px) {
  .errorTitle {
    font-size: 4rem;
  }

  .errorSubtitle {
    font-size: 1.5rem;
  }

  .errorMessage {
    font-size: 1rem;
  }

  .actions {
    flex-direction: column;
  }

  .button {
    width: 100%;
  }
}
</style>

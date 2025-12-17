<template>
  <div class="page">
    <div class="header">
      <h1>著者一覧</h1>
      <NuxtLink to="/quotes" class="button">名言一覧に戻る</NuxtLink>
    </div>

    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error.message || 'エラーが発生しました' }}</div>
    <div v-else-if="authorsWithCount.length === 0" class="emptyState">
      <p>著者が登録されていません</p>
      <NuxtLink to="/quotes" class="button">名言を追加する</NuxtLink>
    </div>
    <div v-else class="authorsList">
      <div
        v-for="author in authorsWithCount"
        :key="author.id"
        class="authorItem"
        @click="navigateToAuthorQuotes(author.id)"
      >
        <div class="authorContent">
          <h2 class="authorName">{{ author.name }}</h2>
          <p class="authorCount">{{ author.quoteCount }}件の名言</p>
        </div>
        <div class="authorActions">
          <NuxtLink :to="`/authors/${author.id}/quotes`" class="buttonSmall" @click.stop>
            名言を見る →
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Quote } from '@/types/quote'
import type { Author } from '@/types/author'

const router = useRouter()

// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes, pending: isLoading, error } = await useFetch<Quote[]>('/api/quotes')
const { data: fetchedAuthors } = await useFetch<Author[]>('/api/authors')

// 著者ごとの名言数を計算
const authorsWithCount = computed(() => {
  if (!fetchedQuotes.value || !fetchedAuthors.value) {
    return []
  }

  const quoteCountMap = new Map<string, number>()

  fetchedQuotes.value.forEach((quote) => {
    if (quote.authorId) {
      const count = quoteCountMap.get(quote.authorId) || 0
      quoteCountMap.set(quote.authorId, count + 1)
    }
  })

  return fetchedAuthors.value
    .map((author) => ({
      ...author,
      quoteCount: quoteCountMap.get(author.id) || 0,
    }))
    .filter((author) => author.quoteCount > 0) // 名言がある著者のみ表示
    .sort((a, b) => b.quoteCount - a.quoteCount) // 名言数でソート
})

function navigateToAuthorQuotes(authorId: string) {
  router.push(`/authors/${authorId}/quotes`)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.5rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .page {
    padding: 2rem;
  }

  .header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0;
  }

  h1 {
    font-size: 2rem;
  }
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
  width: 100%;
  text-align: center;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .button {
    width: auto;
    text-align: left;
  }
}

.button:hover {
  background-color: var(--color-primary-hover);
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.error {
  color: var(--color-error);
}

.emptyState {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.emptyState p {
  margin-bottom: 1.5rem;
}

.authorsList {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .authorsList {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
}

.authorItem {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .authorItem {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.authorItem:hover {
  background-color: var(--color-border);
  transform: translateY(-2px);
}

.authorContent {
  flex: 1;
}

.authorName {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .authorName {
    font-size: 1.25rem;
  }
}

.authorCount {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.authorActions {
  display: flex;
  align-items: center;
  width: 100%;
}

.buttonSmall {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background-color 0.2s ease;
  width: 100%;
  text-align: center;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .authorActions {
    width: auto;
  }

  .buttonSmall {
    width: auto;
    text-align: left;
  }
}

.buttonSmall:hover {
  background-color: var(--color-primary-hover);
}
</style>

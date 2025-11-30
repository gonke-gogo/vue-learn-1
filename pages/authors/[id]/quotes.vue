<template>
  <div class="page">
    <div class="header">
      <NuxtLink to="/authors" class="backLink">← 著者一覧に戻る</NuxtLink>
      <h1>{{ authorName }} の名言一覧</h1>
      <p v-if="authorQuotes.length > 0" class="count">{{ authorQuotes.length }}件の名言</p>
    </div>

    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="authorQuotes.length === 0" class="emptyState">
      <p>この著者の名言は登録されていません</p>
      <NuxtLink to="/quotes" class="button">名言を追加する</NuxtLink>
    </div>
    <div v-else class="quotesList">
      <div
        v-for="quote in authorQuotes"
        :key="quote.id"
        class="quoteItem"
        @click="navigateToQuote(quote.id)"
      >
        <div class="quoteContent">
          <p class="quoteText">{{ quote.text }}</p>
          <div v-if="quote.tags && quote.tags.length > 0" class="tags">
            <span v-for="tag in quote.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <p class="quoteMeta">
            {{ new Date(quote.createdAt).toLocaleDateString('ja-JP') }}
          </p>
        </div>
        <div class="quoteActions">
          <NuxtLink :to="`/quotes/${quote.id}`" class="buttonSmall" @click.stop> 詳細 </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuotes } from '@/composables/useQuotes'
import { useAuthors } from '@/composables/useAuthors'
import { useQuotesStore } from '@/stores/quotes'
import { useAuthorsStore } from '@/stores/authors'
import type { Quote } from '@/types/quote'
import type { Author } from '@/types/author'

const route = useRoute()
const router = useRouter()

// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { data: fetchedAuthors } = await useFetch<Author[]>('/api/authors')

const { quotes, isLoading, error } = useQuotes()
const { authors, getAuthor } = useAuthors()
const quotesStore = useQuotesStore()
const authorsStore = useAuthorsStore()

// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  quotesStore.quotes = fetchedQuotes.value
}
if (fetchedAuthors.value) {
  authorsStore.authors = fetchedAuthors.value
}

// 動的ルートパラメータから著者IDを取得
const authorId = computed(() => route.params.id as string)
const author = computed(() => getAuthor(authorId.value))
const authorName = computed(() => author.value?.name || '不明な著者')

// 著者IDでフィルタリング
const authorQuotes = computed(() => {
  return quotes.value.filter((quote) => quote.authorId === authorId.value) as Quote[]
})

function navigateToQuote(id: string) {
  router.push(`/quotes/${id}`)
}

// サーバーサイドで既にデータを取得済みのため、onMountedは不要
</script>

<style scoped lang="scss">
@import '@/assets/styles/base';
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .page {
    padding: 2rem;
  }
}

.header {
  margin-bottom: 2rem;
}

.backLink {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.backLink:hover {
  color: var(--color-primary);
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  h1 {
    font-size: 2rem;
  }
}

.count {
  color: var(--color-text-secondary);
  font-size: 1rem;
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

.quotesList {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quoteItem {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .quoteItem {
    flex-direction: row;
    justify-content: space-between;
  }
}

.quoteItem:hover {
  background-color: var(--color-border);
}

.quoteContent {
  flex: 1;
}

.quoteText {
  font-size: 1rem;
  line-height: 1.8;
  margin-bottom: 0.5rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .quoteText {
    font-size: 1.125rem;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag {
  background-color: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

.quoteMeta {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.quoteActions {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}

.buttonSmall {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.5rem;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.2s ease;
  flex: 1;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .quoteActions {
    flex-direction: column;
  }

  .buttonSmall {
    flex: none;
  }
}

.buttonSmall:hover {
  background-color: var(--color-primary-hover);
}
</style>

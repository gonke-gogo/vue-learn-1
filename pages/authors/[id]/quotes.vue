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
import { getActivePinia } from 'pinia'
import type { ComputedRef } from 'vue'
import { nextTick } from 'vue'
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

// Piniaストアとcomposablesの参照（クライアントサイドでのみ初期化）
const quotesStore = ref<ReturnType<typeof useQuotesStore> | null>(null)
const authorsStore = ref<ReturnType<typeof useAuthorsStore> | null>(null)
const quotesComposable = ref<ReturnType<typeof useQuotes> | null>(null)
const authorsComposable = ref<ReturnType<typeof useAuthors> | null>(null)

// サーバーサイドで取得したデータを一時的に保持
const initialQuotes = ref<Quote[]>(fetchedQuotes.value || [])
const initialAuthors = ref<Author[]>(fetchedAuthors.value || [])

// quotes、authors、isLoading、errorなどをrefとして定義（onMounted内で設定）
const quotes = ref<Quote[]>(initialQuotes.value)
const authors = ref<Author[]>(initialAuthors.value)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 関数を定義（onMounted内で更新）
const getAuthor = (id: string): Author | undefined => {
  if (authorsComposable.value) {
    return authorsComposable.value.getAuthor(id)
  }
  // authorsComposableが初期化されていない場合、initialAuthorsから検索
  return initialAuthors.value.find((a) => a.id === id)
}

// fetchedQuotesが変更されたらquotesを更新
watch(
  fetchedQuotes,
  (newQuotes) => {
    if (newQuotes && newQuotes.length > 0) {
      quotes.value = [...newQuotes] as Quote[]
      initialQuotes.value = [...newQuotes] as Quote[]
    }
  },
  { immediate: true }
)

// fetchedAuthorsが変更されたらauthorsを更新
watch(
  fetchedAuthors,
  (newAuthors) => {
    if (newAuthors && newAuthors.length > 0) {
      authors.value = [...newAuthors] as Author[]
      initialAuthors.value = [...newAuthors] as Author[]
    }
  },
  { immediate: true }
)

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

onMounted(async () => {
  // Piniaが初期化されるまで待つ
  await nextTick()

  let pinia = getActivePinia()
  if (!pinia) {
    // Piniaが初期化されるまで少し待つ（最大20回、50ms間隔）
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      pinia = getActivePinia()
      if (pinia) break
    }
  }

  if (!pinia) {
    console.warn(
      '[pages/authors/[id]/quotes] Pinia is not initialized, using initialQuotes and initialAuthors'
    )
    // Piniaが初期化されていない場合でも、initialQuotesとinitialAuthorsを使用
    if (initialQuotes.value.length > 0) {
      quotes.value = initialQuotes.value
    }
    if (initialAuthors.value.length > 0) {
      authors.value = initialAuthors.value
    }
    return
  }

  try {
    // Piniaが初期化された後にストアとcomposablesを呼び出す
    quotesStore.value = useQuotesStore()
    authorsStore.value = useAuthorsStore()
    quotesComposable.value = useQuotes()
    authorsComposable.value = useAuthors()

    // quotes、authors、isLoading、errorをwatchで更新
    if (quotesComposable.value) {
      // quotesをwatch
      watch(
        () => {
          if (!quotesComposable.value) return []
          const quotesRef = quotesComposable.value.quotes as unknown as ComputedRef<
            readonly Quote[]
          >
          return quotesRef.value
        },
        (newQuotes) => {
          if (newQuotes && newQuotes.length > 0) {
            quotes.value = [...newQuotes] as Quote[]
          }
        },
        { immediate: true }
      )

      // isLoadingをwatch
      watch(
        () => {
          if (!quotesComposable.value) return false
          const isLoadingRef = quotesComposable.value.isLoading as unknown as ComputedRef<boolean>
          return isLoadingRef.value
        },
        (newIsLoading) => {
          isLoading.value = newIsLoading
        },
        { immediate: true }
      )

      // errorをwatch
      watch(
        () => {
          if (!quotesComposable.value) return null
          const errorRef = quotesComposable.value.error as unknown as ComputedRef<string | null>
          return errorRef.value
        },
        (newError) => {
          error.value = newError
        },
        { immediate: true }
      )
    }

    if (authorsComposable.value) {
      // authorsをwatch
      watch(
        () => {
          if (!authorsComposable.value) return []
          const authorsRef = authorsComposable.value.authors as unknown as ComputedRef<
            readonly Author[]
          >
          return authorsRef.value
        },
        (newAuthors) => {
          if (newAuthors && newAuthors.length > 0) {
            authors.value = [...newAuthors] as Author[]
          }
        },
        { immediate: true }
      )

      // isLoadingをwatch（authorsComposableのisLoadingも考慮）
      watch(
        () => {
          if (!authorsComposable.value) return false
          const isLoadingRef = authorsComposable.value.isLoading as unknown as ComputedRef<boolean>
          return isLoadingRef.value
        },
        (newIsLoading) => {
          if (newIsLoading) {
            isLoading.value = newIsLoading
          }
        },
        { immediate: true }
      )

      // errorをwatch（authorsComposableのerrorも考慮）
      watch(
        () => {
          if (!authorsComposable.value) return null
          const errorRef = authorsComposable.value.error as unknown as ComputedRef<string | null>
          return errorRef.value
        },
        (newError) => {
          if (newError) {
            error.value = newError
          }
        },
        { immediate: true }
      )
    }

    // サーバーサイドで取得したデータをquotesとauthorsに反映
    if (fetchedQuotes.value && fetchedQuotes.value.length > 0) {
      quotes.value = fetchedQuotes.value
    }
    if (fetchedAuthors.value && fetchedAuthors.value.length > 0) {
      authors.value = fetchedAuthors.value
    }

    // quotesが空の場合、ストアから読み込む
    if (quotesStore.value && quotes.value.length === 0) {
      await quotesStore.value.loadQuotes()
    }

    // authorsが空の場合、ストアから読み込む
    if (authorsStore.value && authors.value.length === 0) {
      await authorsStore.value.loadAuthors()
    }
  } catch (err) {
    console.error('[pages/authors/[id]/quotes] Error initializing stores:', err)
    // エラーが発生した場合でも、initialQuotesとinitialAuthorsを使用
    if (initialQuotes.value.length > 0) {
      quotes.value = initialQuotes.value
    }
    if (initialAuthors.value.length > 0) {
      authors.value = initialAuthors.value
    }
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
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

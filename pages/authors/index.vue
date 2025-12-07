<template>
  <div class="page">
    <div class="header">
      <h1>著者一覧</h1>
      <NuxtLink to="/quotes" class="button">名言一覧に戻る</NuxtLink>
    </div>

    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
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
import { getActivePinia } from 'pinia'
import type { ComputedRef } from 'vue'
import { computed, nextTick } from 'vue'
import { useQuotes } from '@/composables/useQuotes'
import { useAuthors } from '@/composables/useAuthors'
import { useQuotesStore } from '@/stores/quotes'
import { useAuthorsStore } from '@/stores/authors'
import type { Quote } from '@/types/quote'
import type { Author } from '@/types/author'

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
const updateQuote = async (
  id: string,
  updates: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>
) => {
  if (quotesComposable.value) {
    return await quotesComposable.value.updateQuote(id, updates)
  }
  throw new Error('quotesComposable is not initialized')
}

const getOrCreateAuthorByName = async (name: string): Promise<Author> => {
  if (authorsComposable.value) {
    return await authorsComposable.value.getOrCreateAuthorByName(name)
  }
  throw new Error('authorsComposable is not initialized')
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

// 著者ごとの名言数を計算
const authorsWithCount = computed(() => {
  const quoteCountMap = new Map<string, number>()

  quotes.value.forEach((quote) => {
    if (quote.authorId) {
      const count = quoteCountMap.get(quote.authorId) || 0
      quoteCountMap.set(quote.authorId, count + 1)
    }
  })

  return authors.value
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

// 名言から著者を自動生成する処理
async function migrateAuthorsFromQuotes() {
  // author文字列があるがauthorIdがない名言を探す
  const quotesToMigrate = quotes.value.filter((quote) => quote.author && !quote.authorId)

  if (quotesToMigrate.length === 0) {
    return // 移行不要
  }

  // 各名言のauthor文字列から著者を作成または取得し、authorIdを設定
  for (const quote of quotesToMigrate) {
    if (!quote.author) continue

    try {
      // 著者を取得または作成
      const author = await getOrCreateAuthorByName(quote.author)

      // 名言にauthorIdを設定
      await updateQuote(quote.id, {
        authorId: author.id,
      })
    } catch (err) {
      // エラーは無視して続行
    }
  }
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
      '[pages/authors/index] Pinia is not initialized, using initialQuotes and initialAuthors'
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
    if (quotesStore.value && quotesStore.value.quotes.length === 0 && quotes.value.length === 0) {
      await quotesStore.value.loadQuotes()
    }

    // authorsが空の場合、ストアから読み込む
    if (authorsStore.value && authors.value.length === 0) {
      await authorsStore.value.loadAuthors()
    }

    // クライアントサイドでのみ実行（サーバーサイドでは既にデータを取得済み）
    // 著者がいない場合、名言から著者を自動生成
    if (authors.value.length === 0 && quotes.value.length > 0) {
      await migrateAuthorsFromQuotes()
      // 著者データを再取得
      const { data: refreshedAuthors } = await useFetch<Author[]>('/api/authors')
      if (refreshedAuthors.value) {
        authors.value = refreshedAuthors.value
        initialAuthors.value = refreshedAuthors.value
      }
    }
  } catch (err) {
    console.error('[pages/authors/index] Error initializing stores:', err)
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

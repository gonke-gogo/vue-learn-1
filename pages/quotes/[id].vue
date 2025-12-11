<template>
  <div class="page">
    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="header">
        <NuxtLink to="/quotes" class="backLink">← 一覧に戻る</NuxtLink>
        <h1>名言の詳細</h1>
      </div>

      <!-- 編集モード -->
      <QuoteForm
        v-if="isEditing && (quote || form.text)"
        v-model="form"
        :is-edit-mode="true"
        :is-loading="isSaving"
        @submit="handleSubmit"
        @cancel="cancelEdit"
      />

      <!-- 表示モード -->
      <div v-else-if="quote" class="quoteDetail">
        <div class="quoteCard">
          <p class="quoteText">{{ quote.text }}</p>
          <p v-if="getAuthorName(quote)" class="quoteAuthor">— {{ getAuthorName(quote) }}</p>
          <div v-if="quote.tags && quote.tags.length > 0" class="tags">
            <span v-for="tag in quote.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="quoteMeta">
            <p>作成日: {{ new Date(quote.createdAt).toLocaleDateString('ja-JP') }}</p>
            <p v-if="quote.updatedAt !== quote.createdAt">
              更新日: {{ new Date(quote.updatedAt).toLocaleDateString('ja-JP') }}
            </p>
          </div>
        </div>

        <div class="actions">
          <button class="button" @click="startEdit">編集</button>
          <button class="button buttonDanger" @click="handleDelete">削除</button>
          <NuxtLink
            v-if="quote.authorId"
            :to="`/authors/${quote.authorId}/quotes`"
            class="button buttonSecondary"
          >
            この著者の名言一覧
          </NuxtLink>
        </div>
      </div>
      <div v-else class="error">名言が見つかりません</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getActivePinia } from 'pinia'
import type { ComputedRef } from 'vue'
import { nextTick } from 'vue'
import { useQuotes } from '@/composables/useQuotes'
import { useQuotesStore } from '@/stores/quotes'
import type { Quote } from '@/types/quote'

const route = useRoute()
const router = useRouter()

// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')

// PiniaストアとuseQuotes()の参照（クライアントサイドでのみ初期化）
const store = ref<ReturnType<typeof useQuotesStore> | null>(null)
const quotesComposable = ref<ReturnType<typeof useQuotes> | null>(null)

// サーバーサイドで取得したデータを一時的に保持
const initialQuotes = ref<Quote[]>(fetchedQuotes.value || [])

// quote、isLoading、errorなどをrefとして定義（onMounted内で設定）
const quote = ref<Quote | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 関数を定義（onMounted内で更新）
const getQuote = (id: string): Quote | undefined => {
  if (quotesComposable.value) {
    return quotesComposable.value.getQuote(id)
  }
  // quotesComposableが初期化されていない場合、initialQuotesから検索
  return initialQuotes.value.find((q) => q.id === id)
}

const updateQuote = async (
  id: string,
  updates: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>
) => {
  if (quotesComposable.value) {
    return await quotesComposable.value.updateQuote(id, updates)
  }
  if (store.value) {
    return await store.value.updateQuote(id, updates)
  }
  throw new Error('quotesComposable and store are not initialized')
}

const removeQuote = async (id: string) => {
  if (quotesComposable.value) {
    return await quotesComposable.value.removeQuote(id)
  }
  throw new Error('quotesComposable is not initialized')
}

const getAuthorName = (quote: Quote): string | undefined => {
  if (quotesComposable.value) {
    return quotesComposable.value.getAuthorName(quote)
  }
  return quote.author
}

const quoteId = computed(() => route.params.id as string)

// URLクエリパラメータで編集モードを有効化できるようにする
const isEditing = ref(route.query.edit === 'true')
const isSaving = ref(false)

// フォームの値（双方向バインディング用）
const form = ref({
  text: '',
  authorId: '',
  tags: [] as string[],
})

// fetchedQuotesが変更されたらquotesを更新
watch(
  fetchedQuotes,
  (newQuotes) => {
    if (newQuotes && newQuotes.length > 0) {
      initialQuotes.value = [...newQuotes] as Quote[]
      // quoteを更新
      const foundQuote = newQuotes.find((q) => q.id === quoteId.value)
      if (foundQuote) {
        quote.value = foundQuote as Quote
        // 編集モードが有効な場合、フォームを初期化
        if (isEditing.value && quote.value) {
          form.value = {
            text: quote.value.text,
            authorId: quote.value.authorId || '',
            tags: quote.value.tags ? [...quote.value.tags] : [],
          }
        }
      }
    }
  },
  { immediate: true }
)

// quoteが読み込まれた時に編集モードが有効な場合、フォームを初期化
watch(
  [quote, isEditing],
  ([newQuote, newIsEditing]) => {
    if (newQuote && newIsEditing && (!form.value.text || form.value.text === '')) {
      form.value = {
        text: newQuote.text,
        authorId: newQuote.authorId || '',
        tags: newQuote.tags ? [...newQuote.tags] : [],
      }
    }
  },
  { immediate: true }
)

function startEdit() {
  if (!quote.value) return
  isEditing.value = true
  form.value = {
    text: quote.value.text,
    authorId: quote.value.authorId || '',
    tags: quote.value.tags ? [...quote.value.tags] : [],
  }
  // URLにedit=trueを追加（ブラウザの戻るボタンで戻れるように）
  router.push({ query: { ...route.query, edit: 'true' } })
}

function cancelEdit() {
  isEditing.value = false
  form.value = { text: '', authorId: '', tags: [] }
  // URLからeditクエリパラメータを削除
  const newQuery = { ...route.query }
  delete newQuery.edit
  router.push({ query: newQuery })
}

async function handleSubmit(formValue: { text: string; authorId?: string; tags?: string[] }) {
  if (!quote.value) {
    return
  }

  // storeとquotesComposableが初期化されるまで待つ（最大10回、100ms間隔）
  let retryCount = 0
  while (!quotesComposable.value && !store.value && retryCount < 10) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    retryCount++
  }

  // それでも初期化されていない場合、APIを直接呼び出す
  if (!quotesComposable.value && !store.value) {
    isSaving.value = true
    try {
      // APIを直接呼び出して更新
      const { data: updatedQuote } = await useFetch<Quote>(`/api/quotes/${quote.value.id}`, {
        method: 'PUT',
        body: formValue,
      })

      if (updatedQuote.value) {
        quote.value = updatedQuote.value
        // initialQuotesも更新
        const index = initialQuotes.value.findIndex((q) => q.id === quote.value?.id)
        if (index !== -1) {
          initialQuotes.value[index] = updatedQuote.value
        }
      }

      isEditing.value = false
      const newQuery = { ...route.query }
      delete newQuery.edit
      router.push({ query: newQuery })
    } catch (err) {
      alert(`更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
    } finally {
      isSaving.value = false
    }
    return
  }

  isSaving.value = true
  try {
    // quotesComposableが利用可能な場合はそれを使用、そうでなければstoreを直接使用
    if (quotesComposable.value) {
      await quotesComposable.value.updateQuote(quote.value.id, formValue)
    } else if (store.value) {
      await store.value.updateQuote(quote.value.id, formValue)
      // storeを更新した後、quoteも更新
      const updatedQuote = store.value.getQuote(quote.value.id)
      if (updatedQuote) {
        quote.value = updatedQuote as Quote
      }
    }

    // 最新の状態を取得
    const { data: refreshedQuotes } = await useFetch<Quote[]>('/api/quotes')
    if (refreshedQuotes.value) {
      initialQuotes.value = refreshedQuotes.value
      const foundQuote = refreshedQuotes.value.find((q) => q.id === quoteId.value)
      if (foundQuote) {
        quote.value = foundQuote as Quote
      }
    }
    isEditing.value = false
    // URLからeditクエリパラメータを削除
    const newQuery = { ...route.query }
    delete newQuery.edit
    router.push({ query: newQuery })
  } catch (err) {
    alert(`更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete() {
  if (!quote.value) return
  if (confirm('この名言を削除しますか？')) {
    try {
      // quotesComposableが初期化されていない場合、APIを直接呼び出す
      if (!quotesComposable.value && !store.value) {
        await useFetch(`/api/quotes/${quote.value.id}`, {
          method: 'DELETE',
        })
        router.push('/quotes')
      } else {
        await removeQuote(quote.value.id)
        router.push('/quotes')
      }
    } catch (err) {
      alert(`削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
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
    // Piniaが初期化されていない場合でも、initialQuotesを使用してquoteを更新
    if (initialQuotes.value.length > 0) {
      const foundQuote = initialQuotes.value.find((q) => q.id === quoteId.value)
      if (foundQuote) {
        quote.value = foundQuote as Quote
      }
    }
    return
  }

  try {
    // Piniaが初期化された後にストアとuseQuotes()を呼び出す
    store.value = useQuotesStore()
    quotesComposable.value = useQuotes()

    // quote、isLoading、errorをwatchで更新
    if (quotesComposable.value) {
      // quoteをwatch
      watch(
        () => {
          if (!quotesComposable.value) return null
          const foundQuote = quotesComposable.value.getQuote(quoteId.value)
          return foundQuote || null
        },
        (newQuote) => {
          if (newQuote) {
            quote.value = newQuote as Quote
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

    // サーバーサイドで取得したデータをquotesに反映
    if (fetchedQuotes.value && fetchedQuotes.value.length > 0) {
      initialQuotes.value = fetchedQuotes.value
      const foundQuote = fetchedQuotes.value.find((q) => q.id === quoteId.value)
      if (foundQuote) {
        quote.value = foundQuote as Quote
        // 編集モードが有効な場合、フォームを初期化
        if (isEditing.value && quote.value) {
          form.value = {
            text: quote.value.text,
            authorId: quote.value.authorId || '',
            tags: quote.value.tags ? [...quote.value.tags] : [],
          }
        }
      }
    }

    // quoteが見つからない場合、ストアから読み込む
    if (store.value && !quote.value) {
      await store.value.loadQuotes()
      // loadQuotes後、quoteを再取得
      if (quotesComposable.value) {
        const foundQuote = quotesComposable.value.getQuote(quoteId.value)
        if (foundQuote) {
          quote.value = foundQuote as Quote
          // 編集モードが有効な場合、フォームを初期化
          if (isEditing.value && quote.value) {
            form.value = {
              text: quote.value.text,
              authorId: quote.value.authorId || '',
              tags: quote.value.tags ? [...quote.value.tags] : [],
            }
          }
        }
      }
    }
  } catch (err) {
    // エラーが発生した場合でも、initialQuotesを使用してquoteを更新
    if (initialQuotes.value.length > 0) {
      const foundQuote = initialQuotes.value.find((q) => q.id === quoteId.value)
      if (foundQuote) {
        quote.value = foundQuote as Quote
      }
    }
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
.page {
  max-width: 800px;
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
  margin-bottom: 1.5rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
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

.quoteDetail {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.quoteCard {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .quoteCard {
    padding: 2rem;
  }
}

.quoteText {
  font-size: 1.125rem;
  line-height: 1.8;
  margin-bottom: 1rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .quoteText {
    font-size: 1.25rem;
  }
}

.quoteAuthor {
  text-align: right;
  color: var(--color-text-secondary);
  font-style: italic;
  margin-bottom: 1rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background-color: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

.quoteMeta {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.quoteMeta p {
  margin: 0.5rem 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .actions {
    flex-direction: row;
    gap: 1rem;
    flex-wrap: wrap;
  }
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
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

.buttonSecondary {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.buttonSecondary:hover {
  background-color: var(--color-border);
}

.buttonDanger {
  background-color: var(--color-error);
}

.buttonDanger:hover {
  background-color: #dc2626;
}
</style>

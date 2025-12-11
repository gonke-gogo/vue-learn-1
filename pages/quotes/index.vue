<template>
  <div class="page">
    <div class="header">
      <h1>名言一覧</h1>
      <div class="headerActions">
        <NuxtLink to="/authors" class="button buttonSecondary">著者一覧</NuxtLink>
        <button class="button" @click="showAddForm = true">新規追加</button>
      </div>
    </div>

    <!-- 検索入力欄 -->
    <div class="searchSection">
      <div class="searchInputWrapper">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="名言、著者名、タグで検索..."
          class="searchInput"
          @keyup.enter="executeSearch"
        />
        <button class="button buttonSearch" @click="executeSearch">検索</button>
      </div>
      <div v-if="activeSearchQuery" class="searchInfo">
        <span>「{{ activeSearchQuery }}」の検索結果: {{ filteredQuotes.length }}件</span>
        <button class="buttonSmall" @click="clearSearch">クリア</button>
      </div>
    </div>

    <!-- 新規追加フォーム -->
    <QuoteForm
      v-if="showAddForm && !editingQuote"
      v-model="form"
      :is-edit-mode="false"
      :is-loading="isLoading"
      @submit="handleSubmit"
      @cancel="cancelForm"
    />

    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="displayedQuotes.length === 0" class="emptyState">
      <p v-if="activeSearchQuery">検索結果がありません</p>
      <p v-else>名言が登録されていません</p>
      <button v-if="!activeSearchQuery" class="button" @click="showAddForm = true">
        最初の名言を追加
      </button>
    </div>
    <div v-else class="quotesList">
      <div v-for="quote in displayedQuotes" :key="quote.id">
        <!-- 編集モードの場合、該当レコードの位置にフォームを表示 -->
        <QuoteForm
          v-if="editingQuote && editingQuote.id === quote.id"
          v-model="form"
          :is-edit-mode="true"
          :is-loading="isLoading"
          @submit="handleSubmit"
          @cancel="cancelForm"
        />
        <!-- 通常表示（編集対象でない場合） -->
        <div
          v-else
          class="quoteItem"
          :[dynamicAttr]="quote.id"
          @[dynamicEvent]="handleQuoteClick(quote as Quote)"
        >
          <div class="quoteContent">
            <p class="quoteText">{{ quote.text }}</p>
            <p v-if="getAuthorName(quote as Quote)" class="quoteAuthor">
              — {{ getAuthorName(quote as Quote) }}
            </p>
            <div v-if="quote.tags && quote.tags.length > 0" class="tags">
              <span v-for="tag in quote.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <p class="quoteMeta">
              {{ new Date(quote.createdAt).toLocaleDateString('ja-JP') }}
            </p>
          </div>
          <div class="quoteActions">
            <NuxtLink :to="`/quotes/${quote.id}`" class="buttonSmall" @click.stop> 詳細 </NuxtLink>
            <button class="buttonSmall" @click.stop="startEdit(quote as Quote)">編集</button>
            <button class="buttonSmall buttonDanger" @click.stop="handleDelete(quote.id)">
              削除
            </button>
          </div>
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
import { seedQuotes } from '@/data/seed-quotes'
import type { Quote } from '@/types/quote'
import { searchQuotes as searchQuotesUtil } from '@/utils/quote-utils'

const route = useRoute()

// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')

// PiniaストアとuseQuotes()の参照（クライアントサイドでのみ初期化）
const store = ref<ReturnType<typeof useQuotesStore> | null>(null)
const quotesComposable = ref<ReturnType<typeof useQuotes> | null>(null)
const authorsComposable = ref<ReturnType<typeof useAuthors> | null>(null)

// サーバーサイドで取得したデータを一時的に保持
const initialQuotes = ref<Quote[]>(fetchedQuotes.value || [])

// quotes、isLoading、errorなどをrefとして定義（onMounted内で設定）
const quotes = ref<Quote[]>(initialQuotes.value)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 検索機能
const searchQuery = ref('') // 入力用のクエリ
const activeSearchQuery = ref('') // 実際に検索に使用するクエリ

const filteredQuotes = computed(() => {
  if (!activeSearchQuery.value.trim()) {
    return quotes.value
  }

  // quotesComposableが初期化されている場合はそれを使用、そうでない場合は直接ユーティリティ関数を使用
  if (quotesComposable.value) {
    return quotesComposable.value.searchQuotes(activeSearchQuery.value)
  }

  // quotesComposableが初期化されていない場合でも検索できるように、直接ユーティリティ関数を使用
  return searchQuotesUtil(quotes.value, activeSearchQuery.value)
})

// 表示する名言（検索結果または全件）
const displayedQuotes = computed(() => {
  return filteredQuotes.value
})

// 検索を実行（Enterキーまたはボタンクリック時）
const executeSearch = () => {
  // 空文字の場合は全件表示（検索クエリをクリア）
  if (!searchQuery.value.trim()) {
    activeSearchQuery.value = ''
  } else {
    activeSearchQuery.value = searchQuery.value.trim()
  }
}

// 検索をクリア
const clearSearch = () => {
  searchQuery.value = ''
  activeSearchQuery.value = ''
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

// 関数を定義（onMounted内で更新）
const getAuthorName = (quote: Quote): string | undefined => {
  if (quotesComposable.value) {
    return quotesComposable.value.getAuthorName(quote)
  }
  return quote.author
}

const addQuote = async (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (quotesComposable.value) {
    return await quotesComposable.value.addQuote(quote)
  }
  throw new Error('quotesComposable is not initialized')
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

const getOrCreateAuthorByName = async (name: string) => {
  if (authorsComposable.value) {
    return await authorsComposable.value.getOrCreateAuthorByName(name)
  }
  throw new Error('authorsComposable is not initialized')
}

const showAddForm = ref(false)
const editingQuote = ref<Quote | null>(null)

// 動的引数の例
// 動的属性名: data-quote-id属性を動的に設定
const dynamicAttr = ref('data-quote-id')
// 動的イベント名: タッチデバイスかどうかでイベントを切り替え（実行時に動的に決定）
const dynamicEvent = computed(() => {
  // タッチデバイスの場合はタッチイベント、それ以外はダブルクリック
  return 'ontouchstart' in window ? 'touchstart' : 'dblclick'
})

// フォームの値（双方向バインディング用）
// refを使った例：v-modelがそのまま使える
const form = ref({
  text: '',
  authorId: '',
  tags: [] as string[],
})

function resetForm() {
  // refを使っている場合、.valueでオブジェクト全体を置き換え
  form.value = {
    text: '',
    authorId: '',
    tags: [],
  }
  editingQuote.value = null
  showAddForm.value = false
}

function startEdit(quote: Quote) {
  editingQuote.value = quote
  // refを使っている場合、.valueでオブジェクト全体を置き換え
  form.value = {
    text: quote.text,
    authorId: quote.authorId || '',
    tags: quote.tags ? [...quote.tags] : [],
  }
  // 編集モードの場合は新規追加フォームを非表示にする
  showAddForm.value = false
}

function cancelForm() {
  resetForm()
}

// 動的イベント用のハンドラ（ダブルクリックで編集を開始）
function handleQuoteClick(quote: Quote) {
  startEdit(quote)
}

// EventEmitterで受け取ったフォームの値のみを使用（valueのみを親に投げる要件を満たす）
async function handleSubmit(formValue: { text: string; authorId?: string; tags?: string[] }) {
  try {
    if (editingQuote.value) {
      // quotesComposableが初期化されていない場合、APIを直接呼び出す
      if (!quotesComposable.value && !store.value) {
        // authorIdが空文字列の場合はundefinedに変換
        const requestBody = {
          ...formValue,
          authorId:
            formValue.authorId && formValue.authorId.trim() !== '' ? formValue.authorId : undefined,
        }
        const { data: updatedQuote } = await useFetch<Quote>(
          `/api/quotes/${editingQuote.value.id}`,
          {
            method: 'PUT',
            body: requestBody,
          }
        )
        if (updatedQuote.value) {
          // quotesを更新
          const index = quotes.value.findIndex((q) => q.id === editingQuote.value?.id)
          if (index !== -1) {
            quotes.value[index] = updatedQuote.value
          }
          const initialIndex = initialQuotes.value.findIndex((q) => q.id === editingQuote.value?.id)
          if (initialIndex !== -1) {
            initialQuotes.value[initialIndex] = updatedQuote.value
          }
        }
      } else {
        // authorIdが空文字列の場合はundefinedに変換
        const requestBody = {
          ...formValue,
          authorId:
            formValue.authorId && formValue.authorId.trim() !== '' ? formValue.authorId : undefined,
        }
        await updateQuote(editingQuote.value.id, requestBody)
      }
    } else {
      // quotesComposableが初期化されていない場合、APIを直接呼び出す
      if (!quotesComposable.value && !store.value) {
        // authorIdが空文字列の場合はundefinedに変換
        const requestBody = {
          ...formValue,
          authorId:
            formValue.authorId && formValue.authorId.trim() !== '' ? formValue.authorId : undefined,
        }
        const { data: newQuote } = await useFetch<Quote>('/api/quotes', {
          method: 'POST',
          body: requestBody,
        })
        if (newQuote.value) {
          // quotesに追加
          quotes.value = [...quotes.value, newQuote.value]
          initialQuotes.value = [...initialQuotes.value, newQuote.value]
        }
      } else {
        // authorIdが空文字列の場合はundefinedに変換
        const requestBody = {
          ...formValue,
          authorId:
            formValue.authorId && formValue.authorId.trim() !== '' ? formValue.authorId : undefined,
        }
        await addQuote(requestBody)
      }
    }
    resetForm()
  } catch (err) {
    alert(`操作に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
  }
}

async function handleDelete(id: string) {
  if (confirm('この名言を削除しますか？')) {
    try {
      // quotesComposableが初期化されていない場合、APIを直接呼び出す
      if (!quotesComposable.value && !store.value) {
        await useFetch(`/api/quotes/${id}`, {
          method: 'DELETE',
        })
        // quotesから削除
        quotes.value = quotes.value.filter((q) => q.id !== id)
        initialQuotes.value = initialQuotes.value.filter((q) => q.id !== id)
      } else {
        await removeQuote(id)
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
    // Piniaが初期化されていない場合でも、initialQuotesを使用してquotesを更新
    if (initialQuotes.value.length > 0) {
      quotes.value = initialQuotes.value
    }
    return
  }

  try {
    // Piniaが初期化された後にストアとuseQuotes()、useAuthors()を呼び出す
    store.value = useQuotesStore()
    quotesComposable.value = useQuotes()
    authorsComposable.value = useAuthors()

    // quotes、isLoading、errorをwatchで更新
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

    // サーバーサイドで取得したデータをquotesに反映
    // SSRで取得したデータをそのまま使用（storeから再度取得しない）
    // storeは追加・更新・削除などの操作のみに使用する
    if (fetchedQuotes.value && fetchedQuotes.value.length > 0) {
      quotes.value = fetchedQuotes.value
    }
    // 注意: SSRで取得できない場合は、useFetchが自動的にクライアントサイドで再取得するため、
    // storeから明示的に取得する必要はない
  } catch (err) {
    // エラーが発生した場合でも、initialQuotesを使用してquotesを更新
    if (initialQuotes.value.length > 0) {
      quotes.value = initialQuotes.value
    }
    return
  }

  // クライアントサイドでのみ実行（サーバーサイドでは既にデータを取得済み）

  // 既存データでauthorはあるがauthorIdがnullのものを修正
  const quotesToMigrate = quotes.value.filter((quote) => quote.author && !quote.authorId)
  if (quotesToMigrate.length > 0) {
    for (const quote of quotesToMigrate) {
      if (!quote.author) continue
      try {
        // 著者を取得または作成
        const author = await getOrCreateAuthorByName(quote.author)
        // 名言にauthorIdを設定（サーバー側で自動的にauthorフィールドも更新される）
        await updateQuote(quote.id, {
          authorId: author.id,
        })
      } catch (err) {
        // エラーは無視して続行
      }
    }
    // データを再取得
    const { data: refreshedQuotes } = await useFetch<Quote[]>('/api/quotes')
    if (refreshedQuotes.value) {
      quotes.value = refreshedQuotes.value
    }
  }

  // 既存データでauthorIdはあるがauthorがnullのものを修正
  const quotesToFixAuthor = quotes.value.filter((quote) => quote.authorId && !quote.author)
  if (quotesToFixAuthor.length > 0) {
    for (const quote of quotesToFixAuthor) {
      if (!quote.authorId) continue
      try {
        // authorIdを再設定することで、サーバー側で自動的にauthorフィールドも更新される
        await updateQuote(quote.id, {
          authorId: quote.authorId,
        })
      } catch (err) {
        // エラーは無視して続行
      }
    }
    // データを再取得
    const { data: refreshedQuotes } = await useFetch<Quote[]>('/api/quotes')
    if (refreshedQuotes.value) {
      quotes.value = refreshedQuotes.value
    }
  }

  if (quotes.value.length === 0) {
    // 初期データを投入（クライアントサイドでのみ）
    for (const seed of seedQuotes) {
      try {
        // author文字列からauthorIdを取得または作成
        let authorId: string | undefined = undefined
        if (seed.author) {
          const author = await getOrCreateAuthorByName(seed.author)
          authorId = author.id
        }

        // authorIdを含めて名言を追加
        await addQuote({
          ...seed,
          authorId,
        })
      } catch (err) {
        // エラーは無視して続行
      }
    }
    // データを再取得
    const { data: refreshedQuotes } = await useFetch<Quote[]>('/api/quotes')
    if (refreshedQuotes.value) {
      quotes.value = refreshedQuotes.value
    }
  }

  // 編集モードのクエリパラメータをチェック
  const editId = route.query.edit as string | undefined
  if (editId) {
    const quote = quotes.value.find((q) => q.id === editId)
    if (quote) {
      startEdit(quote as Quote)
    }
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.headerActions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

h1 {
  font-size: 1.5rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0;
  }

  .headerActions {
    flex-direction: row;
    gap: 1rem;
    width: auto;
  }

  h1 {
    font-size: 2rem;
  }
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
  cursor: pointer;
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

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.buttonSecondary {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.buttonSecondary:hover {
  background-color: var(--color-border);
}

.buttonSmall {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  flex: 1;
  text-align: center;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .buttonSmall {
    flex: none;
    text-align: left;
  }
}

.buttonDanger {
  background-color: var(--color-error);
}

.buttonDanger:hover {
  background-color: #dc2626;
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
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .quoteItem {
    flex-direction: row;
    justify-content: space-between;
  }
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

.quoteAuthor {
  text-align: right;
  color: var(--color-text-secondary);
  font-style: italic;
  margin-bottom: 0.5rem;
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
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .quoteActions {
    flex-direction: column;
    flex-wrap: nowrap;
  }
}

.quoteActions a {
  text-decoration: none;
}

.searchSection {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.searchInputWrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.searchInput {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background-color: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s ease;
}

.searchInput:focus {
  outline: none;
  border-color: var(--color-primary);
}

.searchInput::placeholder {
  color: var(--color-text-secondary);
}

.buttonSearch {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.searchInfo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .searchSection {
    flex-direction: row;
    align-items: flex-start;
    gap: 1rem;
  }

  .searchInputWrapper {
    flex: 1;
    flex-direction: row;
    gap: 0.5rem;
  }

  .searchInput {
    flex: 1;
  }

  .buttonSearch {
    width: auto;
    flex-shrink: 0;
    min-width: 100px;
  }

  .searchInfo {
    flex-shrink: 0;
    gap: 1rem;
  }
}
</style>

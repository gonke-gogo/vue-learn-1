<template>
  <div class="page">
    <div class="header">
      <h1>名言一覧</h1>
      <div class="headerActions">
        <NuxtLink to="/authors" class="button buttonSecondary">著者一覧</NuxtLink>
        <button class="button" @click="showAddForm = true">新規追加</button>
      </div>
    </div>

    <!-- 新規追加フォーム（ページ上部に表示） -->
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
    <div v-else-if="quotes.length === 0" class="emptyState">
      <p>名言が登録されていません</p>
      <button class="button" @click="showAddForm = true">最初の名言を追加</button>
    </div>
    <div v-else class="quotesList">
      <div v-for="quote in quotes" :key="quote.id">
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
import { useQuotes } from '@/composables/useQuotes'
import { useAuthors } from '@/composables/useAuthors'
import { useQuotesStore } from '@/stores/quotes'
import { seedQuotes } from '@/data/seed-quotes'
import type { Quote } from '@/types/quote'

const route = useRoute()

// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { quotes, isLoading, error, addQuote, updateQuote, removeQuote, getAuthorName } = useQuotes()
const { getOrCreateAuthorByName } = useAuthors()
const store = useQuotesStore()

// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  store.quotes = fetchedQuotes.value
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
      await updateQuote(editingQuote.value.id, formValue)
    } else {
      await addQuote(formValue)
    }
    resetForm()
  } catch (err) {
    // エラーは既にstoreで処理されている
  }
}

async function handleDelete(id: string) {
  if (confirm('この名言を削除しますか？')) {
    try {
      await removeQuote(id)
    } catch (err) {
      // エラーは既にstoreで処理されている
    }
  }
}

onMounted(async () => {
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
      store.quotes = refreshedQuotes.value
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
      store.quotes = refreshedQuotes.value
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
      store.quotes = refreshedQuotes.value
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
</style>

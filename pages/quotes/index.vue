<template>
  <div class="page">
    <div class="header">
      <h1>名言一覧</h1>
      <div class="headerActions">
        <NuxtLink to="/authors" class="button buttonSecondary">著者一覧</NuxtLink>
        <button @click="showAddForm = true" class="button">新規追加</button>
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
      <button @click="showAddForm = true" class="button">最初の名言を追加</button>
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
            <p v-if="getAuthorName(quote as Quote)" class="quoteAuthor">— {{ getAuthorName(quote as Quote) }}</p>
            <div v-if="quote.tags && quote.tags.length > 0" class="tags">
              <span v-for="tag in quote.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <p class="quoteMeta">
              {{ new Date(quote.createdAt).toLocaleDateString('ja-JP') }}
            </p>
          </div>
          <div class="quoteActions">
            <NuxtLink
              :to="`/quotes/${quote.id}`"
              class="buttonSmall"
              @click.stop
            >
              詳細
            </NuxtLink>
            <button @click.stop="startEdit(quote as Quote)" class="buttonSmall">編集</button>
            <button @click.stop="handleDelete(quote.id)" class="buttonSmall buttonDanger">
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
import { seedQuotes } from '@/data/seed-quotes'
import type { Quote } from '@/types/quote'

const route = useRoute()
const { quotes, isLoading, error, loadQuotes, addQuote, updateQuote, removeQuote, getAuthorName } = useQuotes()

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
const form = ref({
  text: '',
  authorId: '',
  tags: [] as string[],
})

function resetForm() {
  form.value = { text: '', authorId: '', tags: [] }
  editingQuote.value = null
  showAddForm.value = false
}

function startEdit(quote: Quote) {
  editingQuote.value = quote
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
    console.error('Failed to save quote:', err)
  }
}

async function handleDelete(id: string) {
  if (confirm('この名言を削除しますか？')) {
    try {
      await removeQuote(id)
    } catch (err) {
      console.error('Failed to delete quote:', err)
    }
  }
}

onMounted(async () => {
  await loadQuotes()
  if (quotes.value.length === 0) {
    // 初期データを投入
    for (const seed of seedQuotes) {
      try {
        await addQuote(seed)
      } catch (err) {
        console.error('Failed to seed quote:', err)
      }
    }
    await loadQuotes()
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

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.headerActions {
  display: flex;
  gap: 1rem;
}

h1 {
  font-size: 2rem;
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
  justify-content: space-between;
  gap: 1rem;
}

.quoteContent {
  flex: 1;
}

.quoteText {
  font-size: 1.125rem;
  line-height: 1.8;
  margin-bottom: 0.5rem;
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
  flex-direction: column;
  gap: 0.5rem;
}

.quoteActions a {
  text-decoration: none;
}
</style>

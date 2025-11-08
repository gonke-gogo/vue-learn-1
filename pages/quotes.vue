<template>
  <div class="page">
    <div class="header">
      <h1>名言一覧</h1>
      <button @click="showAddForm = true" class="button">新規追加</button>
    </div>

    <div v-if="showAddForm || editingQuote" class="formCard">
      <h2>{{ editingQuote ? '編集' : '新規追加' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="formGroup">
          <label for="text">名言 *</label>
          <textarea
            id="text"
            v-model="form.text"
            required
            rows="3"
            class="input"
            placeholder="名言を入力してください"
          />
        </div>
        <div class="formGroup">
          <label for="author">著者</label>
          <input
            id="author"
            v-model="form.author"
            type="text"
            class="input"
            placeholder="著者名（任意）"
          />
        </div>
        <div class="formGroup">
          <label for="tags">タグ（カンマ区切り）</label>
          <input
            id="tags"
            v-model="tagsInput"
            type="text"
            class="input"
            placeholder="例: 成功, 挑戦, 努力"
          />
        </div>
        <div class="formActions">
          <button type="submit" class="button" :disabled="isLoading">
            {{ editingQuote ? '更新' : '追加' }}
          </button>
          <button type="button" @click="cancelForm" class="button buttonSecondary">キャンセル</button>
        </div>
      </form>
    </div>

    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="quotes.length === 0" class="emptyState">
      <p>名言が登録されていません</p>
      <button @click="showAddForm = true" class="button">最初の名言を追加</button>
    </div>
    <div v-else class="quotesList">
      <div v-for="quote in quotes" :key="quote.id" class="quoteItem">
        <div class="quoteContent">
          <p class="quoteText">{{ quote.text }}</p>
          <p v-if="quote.author" class="quoteAuthor">— {{ quote.author }}</p>
          <div v-if="quote.tags && quote.tags.length > 0" class="tags">
            <span v-for="tag in quote.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <p class="quoteMeta">
            {{ new Date(quote.createdAt).toLocaleDateString('ja-JP') }}
          </p>
        </div>
        <div class="quoteActions">
          <button @click="startEdit(quote)" class="buttonSmall">編集</button>
          <button @click="handleDelete(quote.id)" class="buttonSmall buttonDanger">削除</button>
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
const { quotes, isLoading, error, loadQuotes, addQuote, updateQuote, removeQuote } = useQuotes()

const showAddForm = ref(false)
const editingQuote = ref<Quote | null>(null)

const form = ref({
  text: '',
  author: '',
  tags: [] as string[],
})

const tagsInput = ref('')

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

function resetForm() {
  form.value = { text: '', author: '', tags: [] }
  tagsInput.value = ''
  editingQuote.value = null
  showAddForm.value = false
}

function startEdit(quote: Quote) {
  editingQuote.value = quote
  form.value = {
    text: quote.text,
    author: quote.author || '',
    tags: quote.tags || [],
  }
  tagsInput.value = (quote.tags || []).join(', ')
  showAddForm.value = true
}

function cancelForm() {
  resetForm()
}

async function handleSubmit() {
  try {
    form.value.tags = parseTags(tagsInput.value)
    if (editingQuote.value) {
      await updateQuote(editingQuote.value.id, form.value)
    } else {
      await addQuote(form.value)
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
      startEdit(quote)
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

.formCard {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.formGroup {
  margin-bottom: 1.5rem;
}

.formGroup label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 1rem;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.formActions {
  display: flex;
  gap: 1rem;
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
</style>


<template>
  <div class="page">
    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!quote" class="error">名言が見つかりません</div>
    <div v-else>
      <div class="header">
        <NuxtLink to="/quotes" class="backLink">← 一覧に戻る</NuxtLink>
        <h1>名言の詳細</h1>
      </div>

      <!-- 編集モード -->
      <QuoteForm
        v-if="isEditing"
        v-model="form"
        :is-edit-mode="true"
        :is-loading="isSaving"
        @submit="handleSubmit"
        @cancel="cancelEdit"
      />

      <!-- 表示モード -->
      <div v-else class="quoteDetail">
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
          <button @click="startEdit" class="button">編集</button>
          <button @click="handleDelete" class="button buttonDanger">削除</button>
          <NuxtLink
            v-if="quote.authorId"
            :to="`/authors/${quote.authorId}/quotes`"
            class="button buttonSecondary"
          >
            この著者の名言一覧
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuotes } from '@/composables/useQuotes'
import type { Quote } from '@/types/quote'

const route = useRoute()
const router = useRouter()
const { quotes, getQuote, updateQuote, removeQuote, loadQuotes, isLoading, error, getAuthorName } =
  useQuotes()

const quoteId = computed(() => route.params.id as string)
const quote = computed(() => {
  const id = quoteId.value
  if (!id) return undefined
  return getQuote(id)
})

const isEditing = ref(false)
const isSaving = ref(false)

// フォームの値（双方向バインディング用）
const form = ref({
  text: '',
  authorId: '',
  tags: [] as string[],
})

function startEdit() {
  if (!quote.value) return
  isEditing.value = true
  form.value = {
    text: quote.value.text,
    authorId: quote.value.authorId || '',
    tags: quote.value.tags ? [...quote.value.tags] : [],
  }
}

function cancelEdit() {
  isEditing.value = false
  form.value = { text: '', authorId: '', tags: [] }
}

async function handleSubmit(formValue: { text: string; authorId?: string; tags?: string[] }) {
  if (!quote.value) return
  isSaving.value = true
  try {
    await updateQuote(quote.value.id, formValue)
    await loadQuotes() // 最新の状態を取得
    isEditing.value = false
  } catch (err) {
    console.error('Failed to update quote:', err)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete() {
  if (!quote.value) return
  if (confirm('この名言を削除しますか？')) {
    try {
      await removeQuote(quote.value.id)
      router.push('/quotes')
    } catch (err) {
      console.error('Failed to delete quote:', err)
    }
  }
}

onMounted(async () => {
  await loadQuotes()
  // データ読み込み後もquoteが見つからない場合のデバッグ
  if (!quote.value) {
    console.warn('Quote not found:', quoteId.value)
    console.log(
      'Available quotes:',
      quotes.value.map((q) => q.id)
    )
  }
})
</script>

<style scoped>
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
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
  font-size: 2rem;
  margin-bottom: 2rem;
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
  padding: 2rem;
}

.quoteText {
  font-size: 1.25rem;
  line-height: 1.8;
  margin-bottom: 1rem;
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
  gap: 1rem;
  flex-wrap: wrap;
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

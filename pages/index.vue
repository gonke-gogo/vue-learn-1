<template>
  <div class="page">
    <h1>何が表示されるかな</h1>
    <div v-if="quotes.length === 0" class="emptyState">
      <p>名言が登録されていません</p>
      <NuxtLink to="/quotes" class="button">名言を追加する</NuxtLink>
    </div>

    <div v-else>
      <div v-if="selectedQuote" class="quoteCard" :[quoteIdAttr]="selectedQuote.id">
        <p class="quoteText">{{ selectedQuote.text }}</p>
        <p v-if="getAuthorName(selectedQuote)" class="quoteAuthor">
          — {{ getAuthorName(selectedQuote) }}
        </p>
        <div v-if="selectedQuote.tags && selectedQuote.tags.length > 0" class="tags">
          <span v-for="tag in selectedQuote.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <div class="actions">
        <button class="button" @click="pickNext">次の候補</button>
        <NuxtLink
          v-if="selectedQuote"
          :to="`/quotes/${selectedQuote.id}`"
          class="button buttonSecondary"
        >
          詳細を見る
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { nextTick } from 'vue'
import { useQuotes } from '@/composables/useQuotes'
import { useQuotesStore } from '@/stores/quotes'
import { useSeededRandom } from '@/composables/useSeededRandom'
import type { Quote } from '@/types/quote'

// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')

// PiniaストアとuseQuotes()をrefで管理（SSR対応）
const store = ref<ReturnType<typeof useQuotesStore> | null>(null)
const quotesComposable = ref<ReturnType<typeof useQuotes> | null>(null)

// サーバーサイドで取得したデータを一時的に保持
const initialQuotes = ref<Quote[]>(fetchedQuotes.value || [])

// quotesをrefとして定義（初期値はuseFetchで取得したデータ）
// SSRとクライアントサイドで一貫性を保つため、確実にデータを設定
const quotes = ref<Quote[]>(fetchedQuotes.value ? ([...fetchedQuotes.value] as Quote[]) : [])

// fetchedQuotesが変更されたらquotesを更新
// pickQuote()は後で定義されるため、ここでは呼び出さない
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

const getAuthorName = (quote: Quote) => {
  try {
    if (quotesComposable.value) {
      return quotesComposable.value.getAuthorName(quote)
    }
    return quote.author
  } catch (error) {
    return quote.author
  }
}

const selectedQuote = ref<Quote | null>(null)
// リロードするたびに違う名言が表示されるように、saltの初期値をランダムにする
const salt = ref(Math.floor(Math.random() * 10000))

// 動的引数の例
// 名言IDを動的属性として設定（テスト・デバッグ用）
const quoteIdAttr = ref('data-quote-id')

// 自動切り替え用タイマーID
const rotateTimerId = ref<number | null>(null)

function pickQuote() {
  if (quotes.value.length === 0) {
    selectedQuote.value = null
    return
  }
  // saltの値から直接インデックスを計算して名言を選ぶ
  const random = useSeededRandom(salt.value)
  const picked = random.pick(quotes.value)
  // readonly QuoteからQuoteに変換（型アサーション）
  selectedQuote.value = (picked ? { ...picked } : null) as Quote | null
}

function pickNext() {
  salt.value++
  pickQuote()
}

function startAutoRotate() {
  // 10秒ごとに候補を切り替え
  if (rotateTimerId.value !== null) return
  rotateTimerId.value = window.setInterval(() => {
    pickNext()
  }, 10000)
}

function stopAutoRotate() {
  if (rotateTimerId.value !== null) {
    clearInterval(rotateTimerId.value)
    rotateTimerId.value = null
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopAutoRotate()
  } else {
    startAutoRotate()
  }
}

onMounted(async () => {
  // nextTickでDOMが準備されるまで待つ
  await nextTick()

  try {
    // ストアとcomposableを初期化（クライアントサイドでのみ）
    store.value = useQuotesStore()
    quotesComposable.value = useQuotes()

    // useFetchで取得したデータがストアにない場合、ストアから読み込む
    // （persistedstateで既にデータが復元されている可能性があるため）
    if (store.value && store.value.quotes.length === 0) {
      // ストアにデータがない場合、loadQuotes()を呼び出す
      await store.value.loadQuotes()
    }

    // quotesをcomputedに設定
    const quotesComputed = computed(() => {
      let result: any[] = []

      try {
        if (quotesComposable.value) {
          const quotesRef = quotesComposable.value.quotes as unknown as ComputedRef<
            readonly Quote[]
          >
          result = quotesRef.value as any[]
        } else {
          result = initialQuotes.value as any[]
        }
      } catch (error) {
        result = initialQuotes.value as any[]
      }

      // 結果が空配列の場合、initialQuotesを使用
      if (result.length === 0 && initialQuotes.value.length > 0) {
        return initialQuotes.value as any[]
      }

      return result as any[]
    })

    // quotesComputedの値をwatchしてquotesを更新
    // immediate: falseにして、DOM操作エラーを防ぐ
    watch(
      quotesComputed,
      (newQuotes) => {
        if (newQuotes.length > 0) {
          // 新しい配列を作成して型を変換
          const newQuotesArray = newQuotes.map((q) => ({
            ...q,
            tags: q.tags ? [...q.tags] : undefined,
          })) as Quote[]
          quotes.value = newQuotesArray
        } else if (initialQuotes.value.length > 0 && quotes.value.length === 0) {
          // 空配列の場合はinitialQuotesを使用（quotesが空の場合のみ）
          quotes.value = initialQuotes.value.map((q) => ({
            ...q,
            tags: q.tags ? [...q.tags] : undefined,
          })) as Quote[]
        }
      },
      { immediate: false }
    )

    // 最初の更新をnextTickで実行（DOMが準備された後）
    await nextTick()
    if (initialQuotes.value.length > 0 && quotes.value.length === 0) {
      quotes.value = initialQuotes.value.map((q) => ({
        ...q,
        tags: q.tags ? [...q.tags] : undefined,
      })) as Quote[]
    }

    // watchをonMounted内で設定（Piniaが初期化された後）
    watch(
      quotes,
      () => {
        if (quotes.value.length > 0) {
          // quotesが変更されたときも、ランダムなsaltで選ぶ
          salt.value = Math.floor(Math.random() * 10000)
          pickQuote()
        }
      },
      { immediate: true }
    )

    // クライアントサイドでのみ実行（サーバーサイドでは既にデータを取得済み）
    // fetchedQuotesがある場合は、quotesを更新してからpickQuote()を呼び出す
    if (fetchedQuotes.value && fetchedQuotes.value.length > 0) {
      quotes.value = [...fetchedQuotes.value] as Quote[]
      initialQuotes.value = [...fetchedQuotes.value] as Quote[]
    } else if (initialQuotes.value.length > 0) {
      // quotesが空でもinitialQuotesがある場合は、quotesを更新
      quotes.value = initialQuotes.value
    }

    // quotesにデータがあることを確認してからpickQuote()を呼び出す
    // nextTickで待ってから実行（quotesの更新が反映された後）
    await nextTick()

    // quotesが更新されたことを確認してからpickQuote()を呼び出す
    if (quotes.value.length > 0) {
      pickQuote()
    } else {
      // quotesが空の場合、もう一度nextTickで待つ
      await nextTick()
      if (quotes.value.length > 0) {
        pickQuote()
      }
    }

    // 可視状態に応じて自動切替を開始/停止
    document.addEventListener('visibilitychange', handleVisibilityChange)
    if (!document.hidden) startAutoRotate()
  } catch (error) {
    // エラーが発生した場合でも、initialQuotesを使用してquotesを更新
    if (initialQuotes.value.length > 0) {
      quotes.value = initialQuotes.value as Quote[]
    }
    // quotesにデータがある場合はpickQuote()を呼び出す
    await nextTick()
    if (quotes.value.length > 0) {
      pickQuote()
    }
  }
})

onBeforeUnmount(() => {
  // タイマーとイベントリスナーのクリーンアップ
  stopAutoRotate()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
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

.quoteCard {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
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
  margin-top: 1rem;
}

.tag {
  background-color: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
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
  border-radius: 0.5rem;
  font-weight: 500;
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

.emptyState {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.emptyState p {
  margin-bottom: 1.5rem;
}
</style>

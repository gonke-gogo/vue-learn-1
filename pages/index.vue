<template>
  <div class="page">
    <h1>今日の名言（気分ぶちあげるぜ）</h1>

    <div v-if="quotes.length === 0" class="emptyState">
      <p>名言が登録されていません</p>
      <NuxtLink to="/quotes" class="button">名言を追加する</NuxtLink>
    </div>

    <div v-else>
      <div class="moodSelector">
        <label for="mood">今日の気分 (1〜5):</label>
        <select id="mood" v-model.number="mood" class="moodSelect">
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <div
        v-if="selectedQuote"
        class="quoteCard"
        :[moodAttr]="mood"
        :[quoteIdAttr]="selectedQuote.id"
      >
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
        <NuxtLink to="/quotes" class="button buttonSecondary">新規追加</NuxtLink>
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
import { useQuotes } from '@/composables/useQuotes'
import { useQuotesStore } from '@/stores/quotes'
import { useSeededRandom } from '@/composables/useSeededRandom'
import type { Quote } from '@/types/quote'

// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { quotes, getAuthorName } = useQuotes()
const store = useQuotesStore()

// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  store.quotes = fetchedQuotes.value
}

const mood = ref(3)
const selectedQuote = ref<Quote | null>(null)
const salt = ref(0)

// 動的引数の例
// 気分と名言IDを動的属性として設定（テスト・デバッグ用）
const moodAttr = ref('data-mood')
const quoteIdAttr = ref('data-quote-id')

// 自動切り替え用タイマーID
const rotateTimerId = ref<number | null>(null)

const today = computed(() => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
})

function pickQuote() {
  if (quotes.value.length === 0) {
    selectedQuote.value = null
    return
  }
  const random = useSeededRandom(today.value, mood.value, salt.value.toString())
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

watch([mood, quotes], () => {
  salt.value = 0
  pickQuote()
})

onMounted(() => {
  // クライアントサイドでのみ実行（サーバーサイドでは既にデータを取得済み）
  pickQuote()
  // 可視状態に応じて自動切替を開始/停止
  document.addEventListener('visibilitychange', handleVisibilityChange)
  if (!document.hidden) startAutoRotate()
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

.moodSelector {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .moodSelector {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}

.moodSelector label {
  font-weight: 500;
}

.moodSelect {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 1rem;
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

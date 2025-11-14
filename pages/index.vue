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
        <p v-if="selectedQuote.author" class="quoteAuthor">— {{ selectedQuote.author }}</p>
        <div v-if="selectedQuote.tags && selectedQuote.tags.length > 0" class="tags">
          <span v-for="tag in selectedQuote.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <div class="actions">
        <button @click="pickNext" class="button">次の候補</button>
        <NuxtLink to="/quotes" class="button buttonSecondary">新規追加</NuxtLink>
        <NuxtLink
          v-if="selectedQuote"
          :to="`/quotes?edit=${selectedQuote.id}`"
          class="button buttonSecondary"
        >
          編集へ
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuotes } from '@/composables/useQuotes'
import { useSeededRandom } from '@/composables/useSeededRandom'
import type { Quote } from '@/types/quote'

const { quotes, loadQuotes } = useQuotes()

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

onMounted(async () => {
  // データの獲得
  await loadQuotes()
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

<style scoped>
.page {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.moodSelector {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
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
  padding: 2rem;
  margin-bottom: 2rem;
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
  gap: 1rem;
  flex-wrap: wrap;
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
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

.emptyState {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.emptyState p {
  margin-bottom: 1.5rem;
}
</style>

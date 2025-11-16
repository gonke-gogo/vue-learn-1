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
          <NuxtLink
            :to="`/authors/${author.id}/quotes`"
            class="buttonSmall"
            @click.stop
          >
            名言を見る →
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuotes } from '@/composables/useQuotes'
import { useAuthors } from '@/composables/useAuthors'
import { computed } from 'vue'

const router = useRouter()
const { quotes, loadQuotes, updateQuote } = useQuotes()
const { authors, isLoading, error, loadAuthors, getOrCreateAuthorByName } = useAuthors()

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
  const quotesToMigrate = quotes.value.filter(
    (quote) => quote.author && !quote.authorId
  )

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
      console.error(`Failed to migrate quote ${quote.id}:`, err)
    }
  }
}

onMounted(async () => {
  await Promise.all([loadQuotes(), loadAuthors()])
  
  // 著者がいない場合、名言から著者を自動生成
  if (authors.value.length === 0 && quotes.value.length > 0) {
    await migrateAuthorsFromQuotes()
    await loadAuthors() // 著者データを再読み込み
  }
})
</script>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s ease;
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.authorItem {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.authorItem:hover {
  background-color: var(--color-border);
  transform: translateY(-2px);
}

.authorContent {
  flex: 1;
}

.authorName {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.authorCount {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.authorActions {
  display: flex;
  align-items: center;
}

.buttonSmall {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.buttonSmall:hover {
  background-color: var(--color-primary-hover);
}
</style>


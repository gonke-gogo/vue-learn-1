import { getActivePinia } from 'pinia'
import { useQuotesStore } from '@/stores/quotes'
import { useAuthorsStore } from '@/stores/authors'
import type { Quote } from '@/types/quote'

/**
 * 既存のauthor文字列からauthorIdへの移行処理
 * アプリ起動時に一度だけ実行される
 */
export default defineNuxtPlugin({
  name: 'migrate-authors',
  enforce: 'post', // Piniaが初期化された後に実行されるようにする
  async setup() {
    // Piniaが初期化されるまで待つ
    let pinia = getActivePinia()
    if (!pinia) {
      // Piniaが初期化されるまで少し待つ（最大10回、100ms間隔）
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        pinia = getActivePinia()
        if (pinia) break
      }
    }

    if (!pinia) {
      console.warn('[migrate-authors] Pinia is not initialized, skipping migration')
      return
    }

    const quotesStore = useQuotesStore()
    const authorsStore = useAuthorsStore()

    // 名言と著者を読み込む
    await Promise.all([quotesStore.loadQuotes(), authorsStore.loadAuthors()])

    // author文字列があるがauthorIdがない名言を探す
    const quotesToMigrate = quotesStore.quotes.filter(
      (quote: Quote) => quote.author && !quote.authorId
    )

    if (quotesToMigrate.length === 0) {
      return // 移行不要
    }

    // 各名言のauthor文字列から著者を作成または取得し、authorIdを設定
    for (const quote of quotesToMigrate) {
      if (!quote.author) continue

      try {
        // 著者を取得または作成
        const author = await authorsStore.getOrCreateAuthorByName(quote.author)

        // 名言にauthorIdを設定
        await quotesStore.updateQuote(quote.id, {
          authorId: author.id,
          // authorフィールドは後方互換性のため残す
        })
      } catch (error) {
        // エラーは無視して続行
      }
    }
  },
})

/**
 * 既存のauthor文字列からauthorIdへの移行処理
 * アプリ起動時に一度だけ実行される
 */
export default defineNuxtPlugin(async () => {
  const quotesStore = useQuotesStore()
  const authorsStore = useAuthorsStore()

  // 名言と著者を読み込む
  await Promise.all([quotesStore.loadQuotes(), authorsStore.loadAuthors()])

  // author文字列があるがauthorIdがない名言を探す
  const quotesToMigrate = quotesStore.quotes.filter(
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
      const author = await authorsStore.getOrCreateAuthorByName(quote.author)

      // 名言にauthorIdを設定
      await quotesStore.updateQuote(quote.id, {
        authorId: author.id,
        // authorフィールドは後方互換性のため残す
      })
    } catch (error) {
      console.error(`Failed to migrate quote ${quote.id}:`, error)
    }
  }
})

